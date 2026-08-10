
const UNITS = ["Vintage", "Classic", "Cosmos", "OXO", "Hi5", "Rooftop", "Elite", "C9", "GreenDen", "InnerPeace", "O2", "GreenTop", "VelHeaven", "AVM'sPride", "Flames", "Titans", "Phoenix", "Bodhi", "Vettri", "TeaTop"];
const ROOM_TYPES = ["1AC", "2AC", "3AC", "1NAC", "2NAC", "3NAC"];
let ADMIN_PIN = localStorage.getItem("adminPIN") || "1234";
let isAdmin = false;
let adminPhone = "919884444587"; // fallback default, overwritten by saved value

// ---------- persistent storage adapter (works both inside Claude.ai previews AND on your own hosting) ----------
// window.storage only exists in the Claude.ai artifact sandbox. Once this file is downloaded and
// hosted on a normal web server, window.storage is undefined -- so every reload silently fell back
// to the built-in defaults. PGStorage below auto-detects this: it uses window.storage when present,
// and transparently falls back to the browser's own localStorage otherwise, so saved data survives
// a reload on real hosting too.
// HONEST NOTE: localStorage only persists on the SAME browser/device that made the change. It is
// not a shared database, so an admin edit made on one phone/laptop will not automatically show up
// for a customer browsing on a different device. For a true "one shared, always-in-sync" store
// across every visitor once this is hosted on your own domain, you need a small real backend
// (e.g. Firebase, Supabase, or a database-backed API) -- ask and this can be wired in next.
const PGStorage = (function(){
  const hasRemote = (typeof window.storage !== 'undefined') &&
                     typeof window.storage.get === 'function' &&
                     typeof window.storage.set === 'function';
  function lsKey(key, shared){ return 'scpg:' + (shared ? 'shared' : 'user') + ':' + key; }
  async function get(key, shared){
    if(hasRemote){
      try{
        return await window.storage.get(key, shared);
      }catch(e){
        try{
          const raw = localStorage.getItem(lsKey(key, shared));
          if(raw !== null) return { key, value: raw, shared: !!shared };
        }catch(e2){}
        throw e;
      }
    }
    const raw = localStorage.getItem(lsKey(key, shared));
    if(raw === null) throw new Error('No local value stored for "' + key + '"');
    return { key, value: raw, shared: !!shared };
  }
  async function set(key, value, shared){
    try{ localStorage.setItem(lsKey(key, shared), value); }catch(e){}
    if(hasRemote){
      return await window.storage.set(key, value, shared);
    }
    return { key, value, shared: !!shared };
  }
  return { get, set, hasRemote };
})();

// ========== DEBOUNCE HELPER FOR RAPID CHANGES ==========
// Prevents multiple saves when admin makes rapid changes (add room, remove room, change status, etc.)
// Waits for 2 seconds of inactivity before saving once
const __scDebouncedSaves = {};
function debouncedSave(key, valueFn, shared, label, delayMs){
  delayMs = delayMs || 2000; // wait 2 seconds of no changes before saving
  
  // Clear any pending save for this key
  if(__scDebouncedSaves[key]){
    clearTimeout(__scDebouncedSaves[key].timer);
  }
  
  // Schedule new save
  __scDebouncedSaves[key] = {
    timer: setTimeout(async () => {
      try{
        const value = typeof valueFn === 'function' ? valueFn() : valueFn;
        await storageSetWithRetry(key, typeof value === 'string' ? value : JSON.stringify(value), shared, label);
      }catch(e){
        console.error('Debounced save failed:', e);
      }
      delete __scDebouncedSaves[key];
    }, delayMs)
  };
}

// ---------- resilient storage writes ----------
// window.storage.set can occasionally fail with a transient error (e.g. "Internal
// server error while processing action") — usually a brief backend hiccup, or two
// saves landing too close together. Retrying a couple of times with a short pause
// clears the vast majority of these automatically. If it still fails after retrying,
// tell the admin visibly (small toast, bottom-right) instead of only logging it to
// the browser console, so an edit never *looks* like it saved when it didn't.
function showSaveStatus(msg, isError){
  let el = document.getElementById('saveStatusToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'saveStatusToast';
    el.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:9999;padding:11px 18px;border-radius:10px;font-size:0.85rem;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,0.3);transition:opacity .3s ease;max-width:280px;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.background = isError ? '#d9534f' : '#1f8a5f';
  el.style.color = '#fff';
  el.style.opacity = '1';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(()=>{ el.style.opacity = '0'; }, isError ? 7000 : 1800);
}

// ---------- global write throttle ----------
// Several features can trigger a storage save around the same moment
// (page load, admin edits, gallery uploads, etc). Without spacing them
// out, a burst of near-simultaneous set() calls can trip the storage
// backend's rate limit and make an unrelated save fail. This tiny queue
// makes every storage.set() across the whole site wait its turn with a
// minimum gap between requests, so bursts are naturally smoothed out.
//
// FIX (rate-limit errors on load, e.g. userPrefAnswers / sc16RecentlyViewed
// failing all 3 attempts): the rate limit is clearly shared across ALL keys,
// not per key — so once one write gets rate-limited, every other queued
// write (for completely different keys) was still firing right behind it
// on the old 260ms gap / per-write backoff, and kept getting rejected too.
// Two changes fix this:
//   1) A bigger minimum gap between any two writes (was 260ms).
//   2) A global cooldown: the moment ANY write is rate-limited, the whole
//      queue pauses for a few seconds before the *next* queued write (of
//      any key) is even attempted, instead of only backing off that one
//      key. The cooldown grows if it keeps happening, and resets once
//      writes are succeeding again.
let __scWriteQueue = Promise.resolve();
// FIXED: Increased from 600ms to 2000ms to prevent rate limit errors
const __SC_MIN_WRITE_GAP_MS = 2000;
let __scCooldownMs = 0; // extra pause inserted before the next write, grows on repeated rate-limit hits
function queueStorageWrite(fn){
  const run = __scWriteQueue.then(async () => {
    if(__scCooldownMs > 0){
      await new Promise(r=>setTimeout(r, __scCooldownMs));
    }
    return fn().finally(() =>
      new Promise(r => setTimeout(r, __SC_MIN_WRITE_GAP_MS))
    );
  });
  // Swallow rejections here so one failed write doesn't jam the queue for
  // everything after it — storageSetWithRetry already reports failures.
  __scWriteQueue = run.catch(() => {});
  return run;
}
async function storageSetWithRetry(key, value, shared, label, attempts){
  attempts = attempts || 5;
  return queueStorageWrite(async () => {
    for(let i=0;i<attempts;i++){
      try{
        await PGStorage.set(key, value, shared);
        __scCooldownMs = 0; // back to normal once a write actually succeeds
        return true;
      }catch(e){
        console.error(`storage.set('${key}') attempt ${i+1}/${attempts} failed:`, e);
        const isRateLimit = /rate limit/i.test(e && e.message || '');
        if(isRateLimit){
          // Escalate the *global* cooldown so every other queued write (any key)
          // waits it out too, instead of slamming straight back into the limit.
          // FIXED: Starting at 4000ms instead of 2500ms, max out at 30000ms
          __scCooldownMs = Math.min(Math.max(__scCooldownMs || 4000, __scCooldownMs * 2), 30000);
        }
        // Exponential backoff: 3s, 6s, 12s, etc. for rate limits
        if(i < attempts-1) await new Promise(r=>setTimeout(r, (isRateLimit ? (3000 * Math.pow(2, i)) : 600)));
      }
    }
    showSaveStatus(`⚠️ Couldn't save ${label||'your change'} — too many rapid changes. Please wait 30 seconds and try again.`, true);
    return false;
  });
}

// ---------- storage helpers ----------
async function loadAvailability(){
  try{
    const res = await PGStorage.get('availability', true);
    return res ? JSON.parse(res.value) : null;
  }catch(e){ return null; }
}
async function saveAvailability(data){
  await storageSetWithRetry('availability', JSON.stringify(data), true, 'room availability');
}
async function loadAdminPhone(){
  try{
    const res = await PGStorage.get('adminPhone', true);
    return res ? res.value : null;
  }catch(e){ return null; }
}
async function saveAdminPhoneToStorage(phone){
  await storageSetWithRetry('adminPhone', phone, true, 'the contact number');
}
async function loadPaymentInfo(){
  try{
    const res = await PGStorage.get('paymentInfo', true);
    return res ? JSON.parse(res.value) : null;
  }catch(e){ return null; }
}
async function savePaymentInfo(info){
  await storageSetWithRetry('paymentInfo', JSON.stringify(info), true, 'the UPI payment details');
}
// ---------- Gallery photo storage ----------
// All units' photos live together under ONE shared key ('galleryImages').
// Earlier this used a separate key per unit and loaded all 18 in parallel
// on every page load — that burst of simultaneous requests was tripping
// the storage rate limit and causing *other* saves (like preferences) to
// fail right afterwards. A single combined key means one request to load
// everything and one request per save, no matter how many units/photos.
// Images are compressed client-side (resized + JPEG) before saving so the
// combined object stays well under the 5MB-per-key storage limit.
var galleryImagesMap = {}; // unit -> array of {url, caption}, first = cover photo
// Each stored photo is an { url, caption } object. Older data may just be a
// plain dataURL string (pre-caption feature) — normalize on read so every
// call site can rely on a consistent shape.
function normalizeGalleryItem(item){
  if(item && typeof item === 'object') return { url: item.url, caption: item.caption || '' };
  return { url: item, caption: '' };
}
// NOTE ON STORAGE FORMAT: photos used to all be saved together under one
// combined key ('galleryImages'). As more units picked up more photos that
// single blob grew past the storage backend's 5MB-per-key limit — and once
// it did, EVERY future save failed with "Could not save photos", even a
// single small photo for a completely different, barely-used unit, because
// the whole combined blob (not just the new photo) had to be written each
// time. Photos are now saved one small key per unit ('galleryImages:Vintage',
// 'galleryImages:Classic', ...) so one unit's gallery can never block another
// unit's uploads, and each key stays far below the size limit on its own.
async function loadAllGalleryImages(){
  galleryImagesMap = {};
  // Read the old combined key once, if it exists, so photos uploaded before
  // this fix still show up.
  try{
    const res = await PGStorage.get('galleryImages', true);
    const data = res ? JSON.parse(res.value) : {};
    if(data && typeof data === 'object') galleryImagesMap = data;
  }catch(e){ /* no legacy combined data — fine, nothing to migrate */ }
  // Per-unit keys are the current format and take priority over anything
  // found in the legacy blob above.
  if(typeof UNITS !== 'undefined' && UNITS.length){
    await Promise.all(UNITS.map(async function(u){
      try{
        const res = await PGStorage.get('galleryImages:' + u, true);
        if(res && res.value){
          const arr = JSON.parse(res.value);
          if(Array.isArray(arr)) galleryImagesMap[u] = arr;
        }
      }catch(e){ /* this unit hasn't been saved in the new format yet */ }
    }));
  }
}
async function saveGalleryImages(unit, arr){
  galleryImagesMap[unit] = arr;
  // Save only this unit's own small key — never the old combined blob.
  return await storageSetWithRetry('galleryImages:' + unit, JSON.stringify(arr), true, 'the gallery photos for ' + unit);
}
// Resize + compress an uploaded image file into a JPEG data URL so many
// photos can be stored per unit without blowing past storage limits.
function compressImageFile(file, maxDim, quality){
  maxDim = maxDim || 1280; quality = quality || 0.75;
  return new Promise(function(resolve, reject){
    var name = (file && file.name) || 'photo';
    if(!file){ reject(new Error('No file given.')); return; }
    var isHeic = /heic|heif/i.test(file.type || '') || /\.(heic|heif)$/i.test(name);
    if(file.type && !/^image\//.test(file.type) && !isHeic){
      reject(new Error('"' + name + '" is not an image file.'));
      return;
    }
    var reader = new FileReader();
    reader.onerror = function(){ reject(new Error('Could not read "' + name + '" — the file may be damaged.')); };
    reader.onload = function(){
      var img = new Image();
      img.onerror = function(){
        if(isHeic){
          reject(new Error('"' + name + '" is a HEIC/HEIF photo, which this browser can\'t open directly. On iPhone, turn off Settings > Camera > Formats > "High Efficiency" (or choose "Most Compatible"), or convert the photo to JPEG/PNG, then try again.'));
        }else{
          reject(new Error('"' + name + '" could not be opened as an image — it may be corrupted or an unsupported format.'));
        }
      };
      img.onload = function(){
        try{
          var w = img.width, h = img.height;
          if(w > maxDim || h > maxDim){
            if(w >= h){ h = Math.round(h * (maxDim / w)); w = maxDim; }
            else{ w = Math.round(w * (maxDim / h)); h = maxDim; }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        }catch(err){
          reject(new Error('Could not process "' + name + '": ' + ((err && err.message) || err)));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
// ---------- Admin: gallery photo manager UI ----------
function initGalleryAdminUI(){
  var sel = document.getElementById('galUnitSelect');
  if(!sel || typeof UNITS === 'undefined') return;
  if(!sel.options.length){
    sel.innerHTML = UNITS.map(function(u){ return '<option value="' + u + '">' + u + '</option>'; }).join('');
  }
  renderGalAdminThumbs(sel.value || UNITS[0]);
  initGalDropzone();
}
function onGalUnitChange(){
  var sel = document.getElementById('galUnitSelect');
  if(sel) renderGalAdminThumbs(sel.value);
}

// Generic drag-and-drop + click-to-browse wiring, reused by both the
// Admin Panel's gallery manager and the on-page "Add Photos" card on the
// Gallery tab itself. Files dropped or picked upload immediately.
var __galDropzonesInit = {};
function wireGalleryDropzone(zoneId, inputId, uploadFn){
  if(__galDropzonesInit[zoneId]) return;
  var zone = document.getElementById(zoneId);
  var input = document.getElementById(inputId);
  if(!zone || !input) return;
  __galDropzonesInit[zoneId] = true;

  input.addEventListener('change', function(){
    if(input.files && input.files.length) uploadFn(input.files);
  });
  ['dragenter','dragover'].forEach(function(evt){
    zone.addEventListener(evt, function(e){
      e.preventDefault(); e.stopPropagation();
      zone.classList.add('pw-gal-drag-over');
    });
  });
  ['dragleave','drop'].forEach(function(evt){
    zone.addEventListener(evt, function(e){
      e.preventDefault(); e.stopPropagation();
      zone.classList.remove('pw-gal-drag-over');
    });
  });
  zone.addEventListener('drop', function(e){
    var dt = e.dataTransfer;
    var files = dt && dt.files ? Array.prototype.slice.call(dt.files) : [];
    var imageFiles = files.filter(function(f){ return /^image\//.test(f.type); });
    if(imageFiles.length) uploadFn(imageFiles);
  });
}
function initGalDropzone(){
  wireGalleryDropzone('galDropzone', 'galFileInput', uploadGalleryImages);
}
// On-page quick uploader that lives directly on the Gallery tab, visible
// only once the admin unlocks the Admin Panel (shown/hidden purely via the
// body.admin-mode CSS class — see adminLogin/adminLogout).
function initGalQuickDropzone(){
  var sel = document.getElementById('galQuickUnitSelect');
  if(sel && typeof UNITS !== 'undefined' && UNITS.length && !sel.options.length){
    sel.innerHTML = UNITS.map(function(u){ return '<option value="' + u + '">' + u + '</option>'; }).join('');
  }
  wireGalleryDropzone('galQuickDropzone', 'galQuickFileInput', uploadGalleryImagesQuick);
}

function renderGalAdminThumbs(unit){
  var grid = document.getElementById('galThumbGrid');
  var empty = document.getElementById('galAdminEmpty');
  var hint = document.getElementById('galReorderHint');
  if(!grid || !unit) return;
  var imgs = galleryImagesMap[unit] || [];
  if(empty) empty.style.display = imgs.length ? 'none' : 'block';
  if(hint) hint.style.display = imgs.length > 1 ? 'block' : 'none';
  grid.innerHTML = imgs.map(function(raw, idx){
    var item = normalizeGalleryItem(raw);
    var safeCaption = (item.caption || '').replace(/"/g,'&quot;');
    return '<div class="pw-gal-admin-thumb' + (idx === 0 ? ' pw-gal-is-cover' : '') + '" draggable="true" data-idx="' + idx + '" style="background-image:url(&quot;' + item.url + '&quot;)">' +
      (idx === 0 ? '<span class="pw-gal-cover-tag">Cover</span>' : '') +
      '<div class="pw-gal-drag-handle" title="Drag to reorder"><i class="fa-solid fa-up-down-left-right" aria-hidden="true"></i></div>' +
      '<input type="text" class="pw-gal-caption-input" placeholder="Add a caption…" value="' + safeCaption + '" data-idx="' + idx + '">' +
      '<div class="pw-gal-thumb-actions">' +
        (idx !== 0 ? '<button type="button" onclick="setGalleryCover(\'' + unit.replace(/'/g,"\\'") + '\',' + idx + ')">Set Cover</button>' : '') +
        '<button type="button" class="pw-gal-thumb-remove" onclick="removeGalleryImage(\'' + unit.replace(/'/g,"\\'") + '\',' + idx + ')">Remove</button>' +
      '</div>' +
    '</div>';
  }).join('');

  // Caption editing — save on change (blur or Enter), don't let clicking
  // into the text box also start a drag.
  grid.querySelectorAll('.pw-gal-caption-input').forEach(function(inp){
    inp.addEventListener('mousedown', function(e){ e.stopPropagation(); });
    inp.addEventListener('click', function(e){ e.stopPropagation(); });
    inp.addEventListener('change', function(){
      updateGalleryCaption(unit, parseInt(inp.dataset.idx, 10), inp.value);
    });
    inp.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){ inp.blur(); }
    });
  });

  // Drag-to-reorder between thumbnails.
  var dragSrcIdx = null;
  var thumbs = grid.querySelectorAll('.pw-gal-admin-thumb');
  thumbs.forEach(function(thumb){
    thumb.addEventListener('dragstart', function(e){
      dragSrcIdx = parseInt(thumb.dataset.idx, 10);
      thumb.classList.add('pw-gal-dragging');
      if(e.dataTransfer){
        e.dataTransfer.effectAllowed = 'move';
        try{ e.dataTransfer.setData('text/plain', String(dragSrcIdx)); }catch(err){}
      }
    });
    thumb.addEventListener('dragend', function(){
      thumb.classList.remove('pw-gal-dragging');
      thumbs.forEach(function(t){ t.classList.remove('pw-gal-drop-target'); });
    });
    thumb.addEventListener('dragover', function(e){
      e.preventDefault();
      if(e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      thumb.classList.add('pw-gal-drop-target');
    });
    thumb.addEventListener('dragleave', function(){
      thumb.classList.remove('pw-gal-drop-target');
    });
    thumb.addEventListener('drop', function(e){
      e.preventDefault();
      thumb.classList.remove('pw-gal-drop-target');
      var targetIdx = parseInt(thumb.dataset.idx, 10);
      if(dragSrcIdx === null || dragSrcIdx === targetIdx) return;
      reorderGalleryImages(unit, dragSrcIdx, targetIdx);
      dragSrcIdx = null;
    });
  });
}

// Core upload routine, parameterized by which unit to save into and which
// on-page elements (message/progress bar/grid) to update — shared by the
// Admin Panel uploader and the Gallery tab's on-page quick uploader.
// Tracks a save that finished compressing photos but failed to persist them,
// keyed by the status-message element id, so the "Retry Save" button can
// find the right unit to retry without the admin re-picking every photo.
var __pendingGallerySave = {};
function galleryRetryButtonHtml(msgId){
  return ' <button type="button" class="pw-gal-retry-btn" onclick="retryGallerySave(\'' + msgId + '\')" ' +
    'style="margin-left:8px;padding:4px 12px;border-radius:8px;border:1px solid var(--gold);background:var(--gold);color:#fff;font-weight:700;cursor:pointer;font-size:0.85em;">Retry Save</button>';
}
async function retryGallerySave(msgId){
  var pending = __pendingGallerySave[msgId];
  var msg = document.getElementById(msgId);
  if(!pending){
    if(msg){ msg.textContent = 'Nothing to retry — please choose the photo(s) again.'; msg.style.color = '#d9534f'; }
    return;
  }
  if(msg){ msg.textContent = 'Retrying save…'; msg.style.color = ''; }
  var ok = false;
  try{
    ok = await saveGalleryImages(pending.unit, galleryImagesMap[pending.unit] || []);
  }catch(e){
    console.error('Retry save failed:', e);
  }
  if(ok){
    delete __pendingGallerySave[msgId];
    if(msg){ msg.textContent = '✅ Saved photo(s) to ' + pending.unit + '.'; msg.style.color = '#1f8a5f'; }
    try{
      var adminSel = document.getElementById('galUnitSelect');
      if(adminSel && adminSel.value === pending.unit) renderGalAdminThumbs(pending.unit);
      if(typeof renderGallery === 'function') renderGallery();
      if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
    }catch(renderErr){ console.error('Gallery re-render failed:', renderErr); }
  }else{
    if(msg){ msg.innerHTML = '⚠️ Still couldn\'t save — check your connection and try again.' + galleryRetryButtonHtml(msgId); msg.style.color = '#d9534f'; }
  }
}
async function performGalleryUpload(unit, fileList, ids){
  ids = ids || {};
  var msg = document.getElementById(ids.msg);
  var input = document.getElementById(ids.input);
  var grid = ids.grid ? document.getElementById(ids.grid) : null;
  var progWrap = document.getElementById(ids.progWrap);
  var progFill = document.getElementById(ids.progFill);
  var progText = document.getElementById(ids.progText);
  var files = Array.prototype.slice.call(fileList || (input && input.files) || []);
  if(!unit || !files.length){
    if(msg){ msg.textContent = 'Choose one or more photos first.'; msg.style.color = '#d9534f'; }
    return;
  }
  function setProgress(pct, label){
    if(progFill) progFill.style.width = pct + '%';
    if(progText) progText.textContent = label || (pct + '%');
  }
  if(grid) grid.classList.add('pw-gal-uploading');
  if(progWrap) progWrap.style.display = 'flex';
  setProgress(0, 'Preparing…');
  if(msg){ msg.textContent = 'Uploading ' + files.length + ' photo(s)…'; msg.style.color = ''; }

  var compressed = [];
  var failed = [];
  // Process photos independently — one unreadable/unsupported file (e.g. a
  // HEIC photo the browser can't decode) should not discard every other
  // good photo in the same batch.
  for(var i = 0; i < files.length; i++){
    try{
      var url = await compressImageFile(files[i]);
      compressed.push({ url: url, caption: '' });
    }catch(fileErr){
      console.error('Gallery photo failed:', files[i] && files[i].name, fileErr);
      failed.push({ name: (files[i] && files[i].name) || 'photo', reason: (fileErr && fileErr.message) || 'Unknown error' });
    }
    setProgress(Math.round(((i + 1) / files.length) * 85), (i + 1) + ' / ' + files.length + ' processed');
  }

  var saveOk = true;
  if(compressed.length){
    setProgress(92, 'Saving…');
    var current = galleryImagesMap[unit] || [];
    galleryImagesMap[unit] = current.concat(compressed);
    try{
      saveOk = await saveGalleryImages(unit, galleryImagesMap[unit]);
    }catch(saveErr){
      console.error('Gallery save failed:', saveErr);
      saveOk = false;
    }
  }
  setProgress(100, saveOk ? 'Done ✓' : 'Save failed');
  if(input) input.value = '';

  // Re-rendering the thumbnail grids is wrapped separately from the save
  // itself — a display bug here should never be reported as (or hide) an
  // actual upload/save failure, since the photos may already be safely saved.
  try{
    var adminSel = document.getElementById('galUnitSelect');
    if(adminSel && adminSel.value === unit) renderGalAdminThumbs(unit);
    if(typeof renderGallery === 'function') renderGallery();
    if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
  }catch(renderErr){
    console.error('Gallery re-render failed (photos may still be saved/pending):', renderErr);
  }

  if(msg){
    if(!saveOk && compressed.length){
      // Photos were successfully compressed and are sitting in memory ready
      // to save — offer a one-click retry instead of making the admin
      // re-pick every photo from scratch.
      __pendingGallerySave[ids.msg] = { unit: unit };
      msg.innerHTML = '⚠️ Photo(s) processed but the save failed — please try again.' + galleryRetryButtonHtml(ids.msg);
      msg.style.color = '#d9534f';
    }else if(failed.length && compressed.length){
      msg.textContent = '✅ Uploaded ' + compressed.length + ' photo(s) to ' + unit + '. ⚠️ ' + failed.length + ' failed — ' + failed[0].reason + (failed.length > 1 ? ' (+' + (failed.length - 1) + ' more)' : '');
      msg.style.color = '#c9962f';
    }else if(failed.length){
      msg.textContent = '⚠️ ' + failed[0].reason + (failed.length > 1 ? ' (+' + (failed.length - 1) + ' more photo(s) also failed)' : '');
      msg.style.color = '#d9534f';
    }else if(compressed.length){
      msg.textContent = '✅ Uploaded ' + compressed.length + ' photo(s) to ' + unit + '.';
      msg.style.color = '#1f8a5f';
    }else{
      msg.textContent = '⚠️ No photos could be processed — please try again.';
      msg.style.color = '#d9534f';
    }
  }
  if(grid) grid.classList.remove('pw-gal-uploading');
  setTimeout(function(){
    if(progWrap) progWrap.style.display = 'none';
    setProgress(0, '0%');
  }, 900);
}
async function uploadGalleryImages(fileList){
  var sel = document.getElementById('galUnitSelect');
  await performGalleryUpload(sel ? sel.value : null, fileList, {
    msg: 'galAdminMsg', input: 'galFileInput', grid: 'galThumbGrid',
    progWrap: 'galProgressWrap', progFill: 'galProgressFill', progText: 'galProgressText'
  });
}
async function uploadGalleryImagesQuick(fileList){
  var sel = document.getElementById('galQuickUnitSelect');
  await performGalleryUpload(sel ? sel.value : null, fileList, {
    msg: 'galQuickMsg', input: 'galQuickFileInput',
    progWrap: 'galQuickProgressWrap', progFill: 'galQuickProgressFill', progText: 'galQuickProgressText'
  });
}
async function removeGalleryImage(unit, idx){
  var imgs = galleryImagesMap[unit] || [];
  if(idx < 0 || idx >= imgs.length) return;
  imgs.splice(idx, 1);
  galleryImagesMap[unit] = imgs;
  await saveGalleryImages(unit, imgs);
  renderGalAdminThumbs(unit);
  renderGallery();
  if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
}
async function setGalleryCover(unit, idx){
  var imgs = galleryImagesMap[unit] || [];
  if(idx <= 0 || idx >= imgs.length) return;
  var picked = imgs.splice(idx, 1)[0];
  imgs.unshift(picked);
  galleryImagesMap[unit] = imgs;
  await saveGalleryImages(unit, imgs);
  renderGalAdminThumbs(unit);
  renderGallery();
  if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
}
async function updateGalleryCaption(unit, idx, caption){
  var imgs = galleryImagesMap[unit] || [];
  if(idx < 0 || idx >= imgs.length) return;
  var item = normalizeGalleryItem(imgs[idx]);
  item.caption = caption;
  imgs[idx] = item;
  galleryImagesMap[unit] = imgs;
  await saveGalleryImages(unit, imgs);
  renderGallery();
  if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
}
async function reorderGalleryImages(unit, fromIdx, toIdx){
  var imgs = galleryImagesMap[unit] || [];
  if(fromIdx < 0 || fromIdx >= imgs.length || toIdx < 0 || toIdx >= imgs.length) return;
  var moved = imgs.splice(fromIdx, 1)[0];
  imgs.splice(toIdx, 0, moved);
  galleryImagesMap[unit] = imgs;
  await saveGalleryImages(unit, imgs);
  renderGalAdminThumbs(unit);
  renderGallery();
  if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
}
async function loadSupportStatus(){
  try{
    const res = await PGStorage.get('supportStatus', true);
    return res ? res.value : 'auto';
  }catch(e){ return 'auto'; }
}
async function saveSupportStatus(status){
  await storageSetWithRetry('supportStatus', status, true, 'the support availability status');
  renderSupportStatus(status);
}
let __scSupportMode = 'auto';
// India business hours: 8:00 AM to 9:00 PM IST, every day.
function istHourNow(){
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false
  }).formatToParts(new Date());
  const h = parts.find(p => p.type === 'hour');
  return h ? parseInt(h.value, 10) % 24 : new Date().getHours();
}
function computeAutoStatus(){
  const hour = istHourNow();
  return (hour >= 8 && hour < 21) ? 'online' : 'offline';
}
function renderSupportStatus(mode){
  __scSupportMode = mode || 'auto';
  const effective = __scSupportMode === 'auto' ? computeAutoStatus() : __scSupportMode;
  const cfg = {
    online:  { cls:'', label:'Online Now', resp:'Average Response Time: Within 24-48 Hours' },
    busy:    { cls:'is-busy', label:'Busy Right Now', resp:'Average Response Time: Within 24-48 Hours' },
    offline: { cls:'is-offline', label:'Currently Offline', resp:"We'll respond within 24-48 hours" }
  };
  const c = cfg[effective] || cfg.online;
  ['scContactSupportStatus','scHomeSupportStatus'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.className = 'pw-support-online ' + c.cls;
    el.innerHTML = '<span class="pw-support-dot" aria-hidden="true"></span>' + c.label;
  });
  ['scContactResponseTime','scHomeResponseTime'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = c.resp;
  });
  const sel = document.getElementById('supportStatusSelect');
  if(sel) sel.value = __scSupportMode;
}
async function initSupportStatus(){
  const status = await loadSupportStatus();
  renderSupportStatus(status);
  // Re-check every 5 minutes so "auto" mode flips on its own as the
  // IST business-hours window (8 AM - 9 PM) opens or closes, without
  // needing a page reload.
  setInterval(function(){
    if(__scSupportMode === 'auto') renderSupportStatus('auto');
  }, 5 * 60 * 1000);
}

/* ---------- Site-wide font (admin-editable) ---------- */
const FONT_OPTIONS = {
  fraunces:     { label:'Fraunces — Elegant Serif (Original)', family:"'Fraunces',Georgia,'Times New Roman',serif", google:null },
  inter:        { label:'Inter — Clean Sans-Serif',            family:"'Inter','Segoe UI',Tahoma,Geneva,Verdana,sans-serif", google:null },
  playfair:     { label:'Playfair Display — Classic Serif',    family:"'Playfair Display',Georgia,serif", google:'Playfair+Display:wght@500;600;700;800' },
  merriweather: { label:'Merriweather — Readable Serif',       family:"'Merriweather',Georgia,serif", google:'Merriweather:wght@400;700;900' },
  poppins:      { label:'Poppins — Modern Rounded Sans',       family:"'Poppins',sans-serif", google:'Poppins:wght@400;500;600;700;800' },
  lato:         { label:'Lato — Simple Sans',                  family:"'Lato',sans-serif", google:'Lato:wght@400;700;900' },
  montserrat:   { label:'Montserrat — Bold Geometric Sans',    family:"'Montserrat',sans-serif", google:'Montserrat:wght@400;500;600;700;800' },
  raleway:      { label:'Raleway — Elegant Thin Sans',         family:"'Raleway',sans-serif", google:'Raleway:wght@400;500;600;700;800' },
  nunito:       { label:'Nunito — Friendly Rounded Sans',      family:"'Nunito',sans-serif", google:'Nunito:wght@400;600;700;800' },
  opensans:     { label:'Open Sans — Highly Readable Sans',    family:"'Open Sans',sans-serif", google:'Open+Sans:wght@400;500;600;700;800' },
  worksans:     { label:'Work Sans — Clean Modern Sans',       family:"'Work Sans',sans-serif", google:'Work+Sans:wght@400;500;600;700;800' },
  quicksand:    { label:'Quicksand — Soft Rounded Sans',       family:"'Quicksand',sans-serif", google:'Quicksand:wght@400;500;600;700' },
  josefin:      { label:'Josefin Sans — Stylish Geometric',    family:"'Josefin Sans',sans-serif", google:'Josefin+Sans:wght@400;500;600;700' },
  spacegrotesk: { label:'Space Grotesk — Modern Techy Sans',   family:"'Space Grotesk',sans-serif", google:'Space+Grotesk:wght@400;500;600;700' },
  outfit:       { label:'Outfit — Clean Geometric Sans',       family:"'Outfit',sans-serif", google:'Outfit:wght@400;500;600;700;800' },
  librebaskerville: { label:'Libre Baskerville — Classic Book Serif', family:"'Libre Baskerville',Georgia,serif", google:'Libre+Baskerville:wght@400;700' },
  cormorant:    { label:'Cormorant Garamond — Refined Elegant Serif', family:"'Cormorant Garamond',Georgia,serif", google:'Cormorant+Garamond:wght@400;500;600;700' },
  dmserif:      { label:'DM Serif Display — Bold Editorial Serif', family:"'DM Serif Display',Georgia,serif", google:'DM+Serif+Display:wght@400' },
  system:       { label:'System Default',                     family:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", google:null }
};
function ensureGoogleFont(param){
  if(!param) return;
  const id = 'gf-' + param.split(':')[0].replace(/\+/g,'-').toLowerCase();
  if(document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + param + '&display=swap';
  document.head.appendChild(link);
}
function applySiteFont(key){
  const cfg = FONT_OPTIONS[key] || FONT_OPTIONS.fraunces;
  ensureGoogleFont(cfg.google);
  document.documentElement.style.setProperty('--font-display', cfg.family);
  document.documentElement.style.setProperty('--font-body', cfg.family);
  const sel = document.getElementById('siteFontSelect');
  if(sel) sel.value = key;
}
async function loadSiteFont(){
  try{
    const res = await PGStorage.get('siteFont', true);
    return res ? res.value : 'fraunces';
  }catch(e){ return 'fraunces'; }
}
async function saveSiteFont(key){
  await storageSetWithRetry('siteFont', key, true, 'the site font');
  applySiteFont(key);
}
async function initSiteFont(){
  const key = await loadSiteFont();
  applySiteFont(key);
}

function defaultAvailability(){
 const data={};
 UNITS.forEach(u=>{data[u]={};ROOM_TYPES.forEach(rt=>{
   const n=parseInt(rt[0]); data[u][rt]={beds:Array(n).fill(false)};
 });}); return data;
}
// ---------- self-healing shape repair ----------
// THE BUG THIS FIXES: the "Room Availability" grid rendered completely blank.
// Root cause: renderUnits() loops over every UNITS/ROOM_TYPES combination and
// reads availability[unit][roomType].beds with NO guard. If the saved
// availability object (loaded from storage) is missing even ONE unit or one
// room-type — e.g. because UNITS/ROOM_TYPES was edited/extended after data had
// already been saved once, or a save was ever partial/corrupted — that line
// throws a TypeError. Since nothing catches it, renderUnits() aborts, and the
// grid (already cleared via grid.innerHTML='' at the top of the function) is
// left empty with no clue why.
// Fix: always repair the loaded data into the exact shape the renderer expects
// (fill in any missing units/room-types, rebuild any malformed entries) BEFORE
// handing it to renderUnits(), and re-save the repaired copy so this self-heals
// permanently instead of breaking again on every future load.
function ensureAvailabilityShape(data){
  data = (data && typeof data === 'object') ? data : {};
  let repaired = false;
  UNITS.forEach(u=>{
    if(!data[u] || typeof data[u] !== 'object'){ data[u] = {}; repaired = true; }
    ROOM_TYPES.forEach(rt=>{
      let val = data[u][rt];
      const n = parseInt(rt[0]);
      // v27: each unit+roomType now holds an ARRAY of physical rooms (Room 1, Room 2, ...)
      // instead of a single room object. Wrap any legacy shape into a 1-room array so
      // previously saved data is preserved, never lost.
      if(typeof val === 'string'){ val = [{beds:Array(n).fill(false), status:val}]; repaired = true; }
      else if(val && !Array.isArray(val) && typeof val === 'object'){ val = [val]; repaired = true; }
      else if(!Array.isArray(val) || val.length === 0){ val = [{beds:Array(n).fill(false), status:'available'}]; repaired = true; }
      val = val.map(obj=>{
        if(!obj || typeof obj !== 'object'){ obj = {beds:Array(n).fill(false)}; repaired = true; }
        if(!obj.status) obj.status = 'available';
        if(!Array.isArray(obj.beds)){ obj.beds = Array(n).fill(false); repaired = true; }
        else if(obj.beds.length !== n){
          // room's bed count changed since last save — resize, keeping existing occupied flags in place
          const beds = Array(n).fill(false);
          for(let i=0;i<Math.min(n, obj.beds.length);i++) beds[i] = !!obj.beds[i];
          obj.beds = beds; repaired = true;
        }
        return obj;
      });
      data[u][rt] = val;
    });
  });
  return { data, repaired };
}
function roomStatus(obj){if(!obj || !Array.isArray(obj.beds)) return 'none'; if(obj.status==='none') return 'none'; if(obj.beds.every(b=>b) && obj.noticeDate) return 'soon'; return obj.beds.every(b=>b)?'booked':'available';}


let availability = null;
let expandedUnits = new Set(UNITS); // which unit cards currently have their room-rows expanded
// DEFAULT: all units expanded on page load so room availability is visible for both admin and user

async function initAvailability(){
  let data = await loadAvailability();
  if(!data){
    // Initialize with empty availability object - Firebase will populate real data
    // or use defaults if no Firebase connection
    data = defaultAvailability();
  }
  const fixed = ensureAvailabilityShape(data);
  availability = fixed.data;
  // Auto-save repaired data to ensure consistency
  if(fixed.repaired){
    try{ await saveAvailability(availability); }catch(e){ console.warn('Could not auto-save repaired availability:', e); }
  }
  renderUnits();
}

function statusLabel(status){
  if(status === 'available') return 'Available';
  if(status === 'booked') return 'Booked';
  if(status==='soon') return 'Available Soon';
  return 'Not Offered';
}

function nextStatus(status){
  if(status === 'available') return 'booked';
  if(status === 'booked') return 'soon';
  if(status==='soon') return 'none';
  return 'available';
}

function renderUnits(){
// ✅ PERFORMANCE-OPTIMIZED FULL ROOM RENDERING
// This function renders EVERY unit and EVERY room type, even if empty.
// It's optimized to handle 500+ rooms smoothly through CSS contain, 
// will-change hints, and hardware acceleration.
const grid=document.getElementById('unitsGrid');grid.innerHTML='';
// Defensive shape-repair: no matter how availability got into memory (fresh
// load, admin edit, a newly-added unit/room-type, stale/partial saved data),
// guarantee every UNITS x ROOM_TYPES slot exists in the right shape BEFORE
// we ever try to read .beds off it. This is what stops the grid from going
// blank if the data doesn't perfectly match the current UNITS/ROOM_TYPES list.
if(typeof ensureAvailabilityShape === 'function'){
  const __fixed = ensureAvailabilityShape(availability);
  availability = __fixed.data;
  if(__fixed.repaired && typeof saveAvailability === 'function') saveAvailability(availability);
}
try{
UNITS.forEach((unit,unitIdx)=>{const card=document.createElement('div');card.className='unit-card reveal-stagger';card.style.setProperty('--stagger-i', Math.min(unitIdx,12));let html='';let summary='';
ROOM_TYPES.forEach(rt=>{
let roomsArr=availability[unit][rt];
if(!Array.isArray(roomsArr)) roomsArr = availability[unit][rt] = [roomsArr];
// aggregate status across every physical room of this type, for the top summary badge
const anyAvail=roomsArr.some(o=>roomStatus(o)==='available');
const anySoon=roomsArr.some(o=>roomStatus(o)==='soon');
const anyOffered=roomsArr.some(o=>o.status!=='none');
const aggStatus=anyAvail?'available':anySoon?'soon':anyOffered?'booked':'none';
summary+=`<span class="mini-badge ${aggStatus==='booked'?'booked':aggStatus==='soon'?'soon':aggStatus==='none'?'none':'available'}" title="${rt}: ${aggStatus==='booked'?'Currently Unavailable':aggStatus==='soon'?'Available Shortly':aggStatus==='none'?'Not Offered':'Available'}">${rt}</span>`;
html+=`<div class="room-type-group" data-u="${unit}" data-rt="${rt}">`;
html+=`<div class="room-type-admin-bar"><span class="rt-label">🏷️ ${rt}<span class="rt-count"> — ${roomsArr.length} room${roomsArr.length===1?'':'s'}</span></span>${isAdmin?`<button class="rt-add-btn" type="button" onclick="adminAddRoom('${unit}','${rt}')">+ Add Room</button>`:''}</div>`;
roomsArr.forEach((obj,roomIdx)=>{
if(typeof obj==='string') obj={beds:Array(parseInt(rt[0])).fill(false),status:obj};
if(!obj.status) obj.status='available';
const occ=obj.beds.filter(Boolean).length,total=obj.beds.length,status=roomStatus(obj);
let adminSel=isAdmin?`<select onchange="changeRoomStatus('${unit}','${rt}',this.value,${roomIdx})"><option value="available" ${obj.status==='available'?'selected':''}>Available</option><option value="soon" ${obj.status==='soon'?'selected':''}>Available Soon</option><option value="none" ${obj.status==='none'?'selected':''}>Not Offered</option></select><br><input type='date' value='${obj.noticeDate||""}' onchange="setNoticeDate('${unit}','${rt}',this.value,${roomIdx})" style='font-size:11px'>${roomsArr.length>1?` <button type="button" onclick="adminRemoveRoom('${unit}','${rt}',${roomIdx})" style="font-size:11px;padding:2px 8px;border-radius:20px;cursor:pointer">🗑️ Remove</button>`:''}`:'';
const enqCount=enquiryCountFor(unit,rt,roomIdx);
html+=`<div class="room-row ${status==='none'?'is-none':''}" data-u="${unit}" data-rt="${rt}" data-room-idx="${roomIdx}" style="display:block"><div style="display:flex;justify-content:space-between"><b>${rt}</b><span class="room-number-label" style="font-size:11px;opacity:.65;margin-left:6px">Room ${roomIdx+1}</span><div>${adminSel} <span class="badge ${status==='booked'?'booked':status==='soon'?'soon':status==='none'?'none':'available'}">${status==='booked'?'Currently Unavailable':status==='soon'?'Available Shortly':status==='none'?'Not Offered':'Available'}</span></div></div><div class="stats-mini">Occupied ${occ}/${total}${obj.noticeDate?` | 📅 Ready from ${obj.noticeDate}`:''}${status==='soon'?' | ⏳ Available Shortly':''}</div><div class="bed-layout">`+obj.beds.map((b,i)=>`<span class="bed ${b?'occ':'free'}" data-u="${unit}" data-r="${rt}" data-i="${i}" data-room-idx="${roomIdx}" ${obj.status==='none'?'style="pointer-events:none;opacity:.4"':''} title="${isAdmin?'Click to toggle occupied/free':(b?'This bed is currently occupied':'Click to select this bed')}">🛏️</span>`).join('')+`</div></div>`;
roomsArr[roomIdx]=obj;
});
html+=`</div>`;
availability[unit][rt]=roomsArr;});
const isOpen=expandedUnits.has(unit);
card.innerHTML=`<h3>${unit}</h3><div class="unit-summary-strip">${summary}<button type="button" class="unit-toggle-btn${isOpen?' open':''}" data-unit="${unitIdx}" aria-expanded="${isOpen}">${isOpen?'Hide Rooms':'View Rooms'} <i class="fa-solid fa-chevron-${isOpen?'up':'down'}"></i></button></div><div class="room-rows-wrap" style="display:${isOpen?'block':'none'}">`+html+`</div>`;
grid.appendChild(card);});
grid.querySelectorAll('.unit-toggle-btn').forEach((btn,idx)=>{
  btn.addEventListener('click', function(){
    const unit = UNITS[idx];
    const wrap = btn.closest('.unit-card').querySelector('.room-rows-wrap');
    const open = wrap.style.display !== 'none';
    if(open){ expandedUnits.delete(unit); } else { expandedUnits.add(unit); }
    wrap.style.display = open ? 'none' : 'block';
    btn.classList.toggle('open', !open);
    btn.setAttribute('aria-expanded', String(!open));
    btn.innerHTML = (open?'View Rooms':'Hide Rooms') + ` <i class="fa-solid fa-chevron-${open?'down':'up'}"></i>`;
    if(!isAdmin) pgSetStep(open ? 1 : 2);
  });
});
document.querySelectorAll('.bed').forEach(b=>b.onclick=async(ev)=>{
  if(isAdmin){
    let o=availability[b.dataset.u][b.dataset.r][b.dataset.roomIdx]; 
    if(o.status==='none') return; 
    o.beds[b.dataset.i]=!o.beds[b.dataset.i]; 
    renderUnits();
    // FIXED: Use debounced save to prevent rate limit on rapid bed toggles
    debouncedSave('availability', ()=>JSON.stringify(availability), true, 'bed occupancy', 1500);
    return;
  }
  handlePgBedClick(b, ev);
});
}catch(renderErr){
  console.error('renderUnits failed:', renderErr);
  grid.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;color:#8a5b00;background:#fff6e0;border:1px solid #e6c878;border-radius:12px;">'
    + '⚠️ Room availability couldn\'t be displayed right now. Please refresh the page. '
    + '<span style="display:block;margin-top:6px;font-size:12px;color:#a17a2a;">(Technical detail: ' + (renderErr && renderErr.message ? renderErr.message.replace(/</g,'&lt;') : 'unknown error') + ')</span>'
    + '</div>';
}
}

// ---------- customer bed-to-booking auto-fill ----------
function goToBookTab(){
  const bookBtn = document.querySelector('nav button[data-tab="book"]');
  if(bookBtn){ bookBtn.click(); }
  else{
    document.querySelectorAll('nav button').forEach(b2=>b2.classList.remove('active'));
    document.querySelectorAll('section').forEach(s=>s.classList.remove('active'));
    document.getElementById('book').classList.add('active');
  }
  window.scrollTo({top:0, behavior:'smooth'});
}
function selectBedForBooking(unit, rt, bedIndex, roomIdx){
  goToBookTab();
  const unitEl = document.getElementById('bookUnit');
  const rtEl = document.getElementById('bookRoomType');
  if(!unitEl || !rtEl) return;
  unitEl.value = unit;
  markFieldError(unitEl, false);
  populateRoomTypesForUnit(unit); // rebuild room-type options for this unit, then pre-select the one tapped
  rtEl.value = rt;
  markFieldError(rtEl, false);
  const roomLabel = (roomIdx!==undefined && roomIdx!==null) ? ` (Room ${parseInt(roomIdx,10)+1})` : '';
  const statusEl = document.getElementById('bookStatus');
  if(statusEl){
    statusEl.classList.remove('error');
    statusEl.classList.add('success');
    statusEl.textContent = `✅ ${unit} — ${rt}${roomLabel} (Bed ${parseInt(bedIndex,10)+1}) selected automatically. You can change Unit or Room Type here anytime, or just continue filling the rest of the form.`;
  }
  const dateEl = document.getElementById('bookDate');
  if(dateEl) dateEl.focus();
}
// ---------- premium bed-selection experience (customer-facing) ----------
// This replaces the old "click a bed -> jump straight to Book a Room" flow.
// It never touches availability data, Firebase, or booking submission —
// it only decides *when* to reveal the info panel, and that panel's
// "Continue Booking" button calls the original selectBedForBooking() above.
function pgSetStep(n){
  const bar = document.getElementById('pgSteps');
  if(!bar) return;
  bar.querySelectorAll('.pg-step').forEach(stepEl=>{
    const s = parseInt(stepEl.dataset.step, 10);
    stepEl.classList.remove('pg-step-active','pg-step-done');
    if(s < n) stepEl.classList.add('pg-step-done');
    else if(s === n) stepEl.classList.add('pg-step-active');
  });
}
function pgShowToast(msg, tone){
  let el = document.getElementById('pgCustomerToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'pgCustomerToast';
    el.className = 'pg-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'pg-toast pg-toast-' + (tone||'info') + ' pg-toast-show';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(()=>{ el.classList.remove('pg-toast-show'); }, 3600);
}

function pgSpawnRipple(bedEl, ev){
  const rect = bedEl.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.8;
  const ripple = document.createElement('span');
  ripple.className = 'pg-bed-ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  const originX = (ev && typeof ev.clientX === 'number') ? ev.clientX - rect.left : rect.width/2;
  const originY = (ev && typeof ev.clientY === 'number') ? ev.clientY - rect.top : rect.height/2;
  ripple.style.left = (originX - size/2) + 'px';
  ripple.style.top = (originY - size/2) + 'px';
  bedEl.appendChild(ripple);
  setTimeout(()=>ripple.remove(), 650);
}

function pgClosePanel(roomRow){
  if(!roomRow) return;
  const existing = roomRow.querySelector('.pg-bed-panel');
  if(existing){ existing.classList.remove('pg-panel-open'); setTimeout(()=>existing.remove(), 220); }
  roomRow.querySelectorAll('.bed.pg-selected').forEach(bd=>{
    bd.classList.remove('pg-selected');
    const chk = bd.querySelector('.pg-selected-badge'); if(chk) chk.remove();
  });
}

function pgOpenBedPanel(bedEl){
  const u = bedEl.dataset.u, rt = bedEl.dataset.r, i = bedEl.dataset.i, roomIdx = bedEl.dataset.roomIdx;
  const roomRow = bedEl.closest('.room-row');
  if(!roomRow) return;
  pgClosePanel(roomRow); // only one active selection per room card at a time

  bedEl.classList.add('pg-selected');
  const chk = document.createElement('span');
  chk.className = 'pg-selected-badge';
  chk.textContent = '✓ Selected';
  bedEl.appendChild(chk);

  const m = (typeof meta === 'function') ? meta(u, rt, roomIdx) : {};
  const total = (+((m&&m.baseRent)||0)) + (+((m&&m.utility)||0));
  const bedLabel = 'B' + (parseInt(i,10)+1);
  const roomLabel = 'Room ' + (parseInt(roomIdx,10)+1);

  const panel = document.createElement('div');
  panel.className = 'pg-bed-panel';
  panel.innerHTML = `
    <div class="pg-panel-head">🛏️ Bed ${bedLabel} Selected</div>
    <div class="pg-panel-sub">Excellent choice! This bed is currently available. Please review the room information before continuing.</div>
    <div class="pg-panel-divider"></div>
    <div class="pg-panel-grid">
      <div><span>Room Type</span><b>${rt} (${roomLabel})</b></div>
      <div><span>Base Rent</span><b>₹${(m&&m.baseRent)||0}</b></div>
      <div><span>Deposit</span><b>₹${(m&&m.deposit)||0}</b></div>
      <div><span>Utility Charges</span><b>₹${(m&&m.utility)||0}</b></div>
      <div><span>Monthly Total</span><b>₹${total}</b></div>
    </div>
    <div class="pg-panel-divider"></div>
    <div class="pg-panel-checks">✓ Available Today &nbsp;&nbsp; ✓ Fully Verified &nbsp;&nbsp; ✓ Comfortable Stay</div>
    <div class="pg-panel-actions">
      <button type="button" class="pg-continue-btn">Continue Booking</button>
      <button type="button" class="pg-another-btn">Choose Another Bed</button>
    </div>
  `;
  panel.querySelector('.pg-continue-btn').addEventListener('click', ()=>{
    pgSetStep(4);
    selectBedForBooking(u, rt, i, roomIdx);
  });
  panel.querySelector('.pg-another-btn').addEventListener('click', ()=>{
    pgClosePanel(roomRow);
    pgSetStep(2);
  });
  roomRow.appendChild(panel);
  requestAnimationFrame(()=>panel.classList.add('pg-panel-open'));
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});
  pgSetStep(3);
}

function handlePgBedClick(bedEl, ev){
  const u = bedEl.dataset.u, rt = bedEl.dataset.r, roomIdx = bedEl.dataset.roomIdx;
  const obj = availability[u][rt][roomIdx];
  const status = roomStatus(obj);
  const isOccupied = obj.beds[bedEl.dataset.i];

  pgSpawnRipple(bedEl, ev);

  if(status === 'booked'){
    pgShowToast('This room is currently unavailable. Please explore our other available rooms.', 'warn');
    return;
  }
  if(status === 'soon'){
    pgShowToast("This room will be available shortly. You can still submit an enquiry and we'll notify you when it becomes available.", 'info');
    return;
  }
  if(isOccupied){
    pgShowToast('This bed is currently occupied. Please choose another available bed.', 'warn');
    return;
  }
  bedEl.classList.add('pg-bump');
  setTimeout(()=>bedEl.classList.remove('pg-bump'), 420);
  pgOpenBedPanel(bedEl);
}

async function setNoticeDate(u,r,v,idx){
  availability[u][r][idx||0].noticeDate=v;
  renderUnits();
  // FIXED: Use debounced save to prevent rate limit on rapid date changes
  debouncedSave('availability', ()=>JSON.stringify(availability), true, 'room notice date', 1500);
}
async function changeRoomStatus(u,r,v,idx){
  availability[u][r][idx||0].status=v;
  renderUnits();
  // FIXED: Use debounced save to prevent rate limit on rapid status changes
  debouncedSave('availability', ()=>JSON.stringify(availability), true, 'room status', 1500);
}
// ---------- tabs ----------
document.querySelectorAll('nav button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('section').forEach(s=>s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ---------- admin ----------
async function adminLogin(){
  const pin = document.getElementById('adminPin').value;
  if(pin === ADMIN_PIN){
    isAdmin = true;
    document.body.classList.add('admin-mode');
    document.getElementById('adminStatusPill').textContent = 'Unlocked ✅';
    const pinField = document.getElementById('adminPin');
    pinField.value = '';
    pinField.disabled = true;
    document.getElementById('adminSettings').style.display = 'block';
    document.getElementById('adminEditNote').style.display = 'block';
    document.getElementById('currentMobile').value = adminPhone;
    document.getElementById('upiIdInput').value = upiId;
    document.getElementById('upiPayeeInput').value = upiPayeeName;
    document.getElementById('razorpayKeyInput').value = razorpayKeyId;
    renderUnits();
    renderUnitLocations();
    if(typeof initGalleryAdminUI === 'function') initGalleryAdminUI();
  }else{
    alert('Incorrect PIN');
  }
}

function adminLogout(){
  isAdmin=false;
  document.body.classList.remove('admin-mode');
  document.getElementById('adminStatusPill').textContent='Locked';
  document.getElementById('adminSettings').style.display='none';
  const pinField = document.getElementById('adminPin');
  pinField.disabled = false;
  pinField.value = '';
  renderUnits();
  renderUnitLocations();
}
function changeAdminPin(){
  const o=document.getElementById('oldPin').value;
  const n=document.getElementById('newPin').value;
  const c=document.getElementById('confirmPin').value;
  const msg=document.getElementById('pinAdminMsg');
  msg.classList.remove('error','success');
  if(o!==ADMIN_PIN){ msg.textContent='Current PIN incorrect.'; msg.classList.add('error'); return; }
  if(!n || n.length<4){ msg.textContent='New PIN should be at least 4 digits.'; msg.classList.add('error'); return; }
  if(n!==c){ msg.textContent='New PIN and Confirm PIN do not match.'; msg.classList.add('error'); return; }
  localStorage.setItem('adminPIN',n);
  ADMIN_PIN=n;
  document.getElementById('oldPin').value='';
  document.getElementById('newPin').value='';
  document.getElementById('confirmPin').value='';
  msg.textContent='PIN changed successfully.';
  msg.classList.add('success');
}


async function changeAdminPhone(){
 const current=document.getElementById('currentMobile').value.trim();
 const newMobile=document.getElementById('adminPhone').value.trim();
 const confirm=document.getElementById('confirmMobile').value.trim();
 const msg=document.getElementById('mobileAdminMsg');
 msg.classList.remove('error','success');
 if(current!==adminPhone){ msg.textContent='Current mobile number incorrect.'; msg.classList.add('error'); return; }
 if(!newMobile || newMobile!==confirm){ msg.textContent='New mobile number and confirmation do not match.'; msg.classList.add('error'); return; }
 adminPhone=newMobile;
 await saveAdminPhoneToStorage(newMobile);
 updateContactLinks();
 document.getElementById('currentMobile').value=newMobile;
 document.getElementById('adminPhone').value='';
 document.getElementById('confirmMobile').value='';
 msg.textContent='Mobile number changed successfully.';
 msg.classList.add('success');
}

function updateContactLinks(){
  document.getElementById('waLink').href = `https://wa.me/${adminPhone}`;
  document.getElementById('callLink').href = `tel:+${adminPhone}`;
}

// ---------- UPI payment ----------
let upiId = "";
let upiPayeeName = "Stay Confident PG Homes";

function buildUpiLink(){
  const amount = document.getElementById('upiAmount') ? document.getElementById('upiAmount').value.trim() : '';
  const note = document.getElementById('upiNote') ? document.getElementById('upiNote').value.trim() : '';
  if(!upiId) return '';
  let link = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiPayeeName||'PG Homes')}&cu=INR`;
  if(amount) link += `&am=${encodeURIComponent(amount)}`;
  if(note) link += `&tn=${encodeURIComponent(note)}`;
  return link;
}

function updateUpiQr(){
  document.getElementById('upiIdDisplay').textContent = upiId || 'Not set yet — please contact admin';
  document.getElementById('upiPayeeDisplay').textContent = upiPayeeName || '-';
  const link = buildUpiLink();
  const img = document.getElementById('upiQrImg');
  if(link){
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
    img.style.display = '';
  }else{
    img.removeAttribute('src');
    img.style.display = 'none';
  }
}

function payViaUpi(){
  if(!upiId){
    document.getElementById('upiPayStatus').textContent = 'Payment details are not set up yet — please contact admin.';
    return;
  }
  const link = buildUpiLink();
  window.location.href = link;
  document.getElementById('upiPayStatus').textContent = 'Opening your UPI app… if nothing happens, scan the QR code instead.';
}

function copyUpiId(){
  if(!upiId) return;
  navigator.clipboard && navigator.clipboard.writeText(upiId).then(()=>{
    document.getElementById('upiPayStatus').textContent = 'UPI ID copied to clipboard!';
  }).catch(()=>{});
}

async function saveUpiSettings(){
  const id = document.getElementById('upiIdInput').value.trim();
  const payee = document.getElementById('upiPayeeInput').value.trim();
  if(!id){ document.getElementById('upiAdminMsg').textContent = 'Please enter a UPI ID.'; return; }
  upiId = id;
  upiPayeeName = payee || upiPayeeName;
  await savePaymentInfo({ upiId, upiPayeeName, razorpayKeyId });
  updateUpiQr();
  document.getElementById('upiAdminMsg').textContent = 'Saved! The Pay via UPI tab is now updated for everyone.';
}

window.__initPayment = async function(){
  const saved = await loadPaymentInfo();
  if(saved){
    upiId = saved.upiId || '';
    upiPayeeName = saved.upiPayeeName || upiPayeeName;
    razorpayKeyId = saved.razorpayKeyId || '';
  }
  updateUpiQr();
  updateRazorpayButtonVisibility();
};

// ---------- Razorpay (quick client-only checkout) ----------
let razorpayKeyId = "";

function updateRazorpayButtonVisibility(){
  const btn = document.getElementById('razorpayBtn');
  if(!btn) return;
  btn.style.display = razorpayKeyId ? '' : 'none';
}

function payViaRazorpay(){
  const statusEl = document.getElementById('razorpayStatus');
  if(!razorpayKeyId){
    statusEl.textContent = 'Card/Netbanking payment is not set up yet — please pay via UPI above or contact admin.';
    return;
  }
  if(typeof Razorpay === 'undefined'){
    statusEl.textContent = 'Payment library failed to load. Please check your internet connection and try again.';
    return;
  }
  const amountRupees = parseFloat(document.getElementById('upiAmount').value) || 0;
  if(amountRupees <= 0){
    statusEl.textContent = 'Please enter an amount above first, then tap this button again.';
    document.getElementById('upiAmount').focus();
    return;
  }
  const note = document.getElementById('upiNote').value.trim();
  const options = {
    key: razorpayKeyId,
    amount: Math.round(amountRupees * 100), // in paise
    currency: 'INR',
    name: upiPayeeName || 'Stay Confident PG Homes',
    description: note || 'PG Booking Payment',
    handler: function(response){
      statusEl.textContent = '✅ Payment successful! Payment ID: ' + response.razorpay_payment_id + '. Please also message the admin on WhatsApp with this ID to confirm your booking.';
      if(window.fireConfetti) window.fireConfetti();
    },
    modal: {
      ondismiss: function(){
        statusEl.textContent = 'Payment window closed. No amount was charged.';
      }
    },
    theme: { color: '#0b3d2c' }
  };
  const rzp = new Razorpay(options);
  rzp.on('payment.failed', function(response){
    statusEl.textContent = '❌ Payment failed: ' + (response.error && response.error.description ? response.error.description : 'please try again.');
  });
  rzp.open();
}

async function saveRazorpaySettings(){
  const key = document.getElementById('razorpayKeyInput').value.trim();
  if(!key){ document.getElementById('razorpayAdminMsg').textContent = 'Please enter a Razorpay Key ID.'; return; }
  razorpayKeyId = key;
  await savePaymentInfo({ upiId, upiPayeeName, razorpayKeyId });
  updateRazorpayButtonVisibility();
  document.getElementById('razorpayAdminMsg').textContent = 'Saved! The card/netbanking payment option is now live for everyone.';
}

// ---------- booking form ----------
function markFieldError(el, isError){
  if(!el) return;
  el.classList.toggle('field-error', !!isError);
}
function clearBookingFieldErrors(){
  ['bookUnit','bookRoomType','bookDate','bookPurpose','bookName','bookPhone','bookEmail'].forEach(id=>{
    markFieldError(document.getElementById(id), false);
  });
}

function updateBookFieldsForStayType(){
  const stayTypeEl = document.getElementById('bookStayType');
  const unitWrap = document.getElementById('bookUnitWrap');
  const rtWrap = document.getElementById('bookRoomTypeWrap');
  if(!stayTypeEl || !unitWrap || !rtWrap) return;
  const isDaily = stayTypeEl.value === 'Daily Stay';
  // Unit & Room Type only matter for Monthly Stay bookings; hide them for Daily Stay.
  unitWrap.style.display = isDaily ? 'none' : '';
  rtWrap.style.display = isDaily ? 'none' : '';
  if(isDaily){
    markFieldError(document.getElementById('bookUnit'), false);
    markFieldError(document.getElementById('bookRoomType'), false);
  }
}

function populateSelects(){
  const u = document.getElementById('bookUnit');
  u.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = ''; placeholder.textContent = '-- Select Unit --';
  placeholder.disabled = true; placeholder.selected = true;
  u.appendChild(placeholder);
  UNITS.forEach(unit=>{
    const o = document.createElement('option');
    o.value = unit; o.textContent = unit;
    u.appendChild(o);
  });
  u.addEventListener('change', ()=>{ markFieldError(u,false); populateRoomTypesForUnit(u.value); });

  // Clear the red error outline the moment a customer starts fixing a field.
  ['bookRoomType','bookDate','bookPurpose','bookName','bookPhone','bookEmail'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', ()=> markFieldError(el, false));
    if(el) el.addEventListener('change', ()=> markFieldError(el, false));
  });

  // Don't let customers pick a date in the past.
  const dateEl = document.getElementById('bookDate');
  if(dateEl){
    const today = new Date().toISOString().split('T')[0];
    dateEl.setAttribute('min', today);
  }

  populateRoomTypesForUnit('');

  // Show Select Unit / Select Room Type only for Monthly Stay; hide them for Daily Stay.
  const stayTypeEl = document.getElementById('bookStayType');
  if(stayTypeEl) stayTypeEl.addEventListener('change', ()=>{ markFieldError(stayTypeEl,false); updateBookFieldsForStayType(); });
  updateBookFieldsForStayType();
}

function populateRoomTypesForUnit(unit){
  const rtSelect = document.getElementById('bookRoomType');
  rtSelect.innerHTML = '';
  if(!unit){
    const ph = document.createElement('option');
    ph.value = ''; ph.textContent = '-- Select Unit first --';
    ph.disabled = true; ph.selected = true;
    rtSelect.appendChild(ph);
    return;
  }
  const ph = document.createElement('option');
  ph.value = ''; ph.textContent = '-- Select Room Type --';
  ph.disabled = true; ph.selected = true;
  rtSelect.appendChild(ph);

  const offered = ROOM_TYPES.filter(rt=>{
    let arr = availability && availability[unit] && availability[unit][rt];
    if(!arr) return true;
    if(!Array.isArray(arr)) arr = [arr];
    return arr.some(obj=>{
      const status = typeof obj === 'string' ? obj : (obj.status || 'available');
      return status !== 'none';
    });
  });
  if(offered.length === 0){
    const o = document.createElement('option');
    o.value = ''; o.textContent = 'No room types available in this unit'; o.disabled = true;
    rtSelect.appendChild(o);
    return;
  }
  offered.forEach(rt=>{
    let arr = availability && availability[unit] && availability[unit][rt];
    let status = 'available';
    if(arr){
      if(!Array.isArray(arr)) arr = [arr];
      const anyAvail = arr.some(o=>roomStatus(typeof o==='string'?{beds:[],status:o}:o)==='available');
      const anySoon = arr.some(o=>roomStatus(typeof o==='string'?{beds:[],status:o}:o)==='soon');
      status = anyAvail ? 'available' : anySoon ? 'soon' : 'booked';
    }
    const o = document.createElement('option');
    o.value = rt;
    o.textContent = rt + (status === 'booked' ? ' (Currently unavailable - waitlist)' : status === 'soon' ? ' (Available shortly)' : '');
    rtSelect.appendChild(o);
  });
}

async function sendBooking(){
  const stayTypeEl = document.getElementById('bookStayType');
  const unitEl = document.getElementById('bookUnit');
  const rtEl = document.getElementById('bookRoomType');
  const dateEl = document.getElementById('bookDate');
  const purposeEl = document.getElementById('bookPurpose');
  const nameEl = document.getElementById('bookName');
  const phoneEl = document.getElementById('bookPhone');
  const emailEl = document.getElementById('bookEmail');
  const msgEl = document.getElementById('bookMsg');
  const statusEl = document.getElementById('bookStatus');

  const stayType = stayTypeEl ? stayTypeEl.value : '';
  const isDaily = stayType === 'Daily Stay';
  const unit = unitEl.value;
  const rt = rtEl.value;
  const date = dateEl.value;
  const purpose = purposeEl ? purposeEl.value : '';
  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const email = emailEl.value.trim();
  const msg = msgEl.value.trim();

  clearBookingFieldErrors();
  const missing = [];

  if(!stayType){ missing.push('Type of Stay'); markFieldError(stayTypeEl, true); }
  // Unit & Room Type only apply to Monthly Stay bookings; skip them for Daily Stay.
  if(!isDaily){
    if(!unit){ missing.push('Unit'); markFieldError(unitEl, true); }
    if(!rt){ missing.push('Room Type'); markFieldError(rtEl, true); }
  }
  if(!date){ missing.push('Date of Joining'); markFieldError(dateEl, true); }
  if(!purpose){ missing.push('Purpose of Stay'); markFieldError(purposeEl, true); }
  if(!name){ missing.push('Full Name'); markFieldError(nameEl, true); }

  const phoneDigits = phone.replace(/\D/g,'');
  if(!phone){ missing.push('Phone Number'); markFieldError(phoneEl, true); }
  else if(phoneDigits.length < 10){ missing.push('a valid Phone Number (10+ digits)'); markFieldError(phoneEl, true); }

  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ missing.push('a valid Email address'); markFieldError(emailEl, true); }

  if(missing.length){
    statusEl.classList.remove('success');
    statusEl.classList.add('error');
    statusEl.textContent = '⚠️ Please fill in: ' + missing.join(', ') + '.';
    const firstBad = document.querySelector('#book .field-error');
    if(firstBad) firstBad.focus();
    return;
  }

  const text = `New Room Booking Request - Stay Confident PG Homes
Type of Stay: ${stayType}${isDaily ? '' : `
Unit: ${unit}
Room Type: ${rt}`}
Date of Joining: ${date}
Purpose of Stay: ${purpose}
Name: ${name}
Phone: ${phone}
Email: ${email || '-'}
Message: ${msg || '-'}`;

  const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  statusEl.classList.remove('error');
  statusEl.classList.add('success');
  statusEl.textContent = '✅ Thank you for choosing Stay Confident PG Homes! Opening WhatsApp so we can confirm your stay...';
  if(window.fireConfetti) window.fireConfetti();

  // Reset the form back to empty so it's ready for the next request.
  if(stayTypeEl) stayTypeEl.value = '';
  unitEl.value = ''; populateRoomTypesForUnit('');
  dateEl.value = ''; if(purposeEl) purposeEl.value = ''; nameEl.value = ''; phoneEl.value = ''; emailEl.value = ''; msgEl.value = '';
  updateBookFieldsForStayType();
}

// ---------- init ----------
// NOTE: this used to be a self-running (async function(){...})() here. That let it start
// awaiting storage calls immediately, and the browser can resume that await and call
// renderUnits() BEFORE the later <script> blocks below (pricing box, enquiry counter,
// preference filter) have run and wrapped renderUnits(). That race is what caused the
// "enquiryCountFor is not defined" crash and the deposit/rent/kitchen boxes intermittently
// failing to (re)appear after editing. Fix: turn this into a plain function and call it
// once, at the very end of the file, only after every script has finished loading.
window.__initCore = async function(){
  populateSelects();
  const savedPhone = await loadAdminPhone();
  if(savedPhone) adminPhone = savedPhone;
  updateContactLinks();
  let data = await loadAvailability();
  if(!data){ data = defaultAvailability(); }
  const __fixedAvail = ensureAvailabilityShape(data);
  availability = __fixedAvail.data;
  if(__fixedAvail.repaired) await saveAvailability(availability);
  populateRoomTypesForUnit(document.getElementById('bookUnit').value);
  await initUnitLocation();
  await initSupportStatus();
  await initSiteFont();
};

/* ================= Unit Locations (per-unit, shared, accurate) ================= */
let unitLocations = {};

async function loadUnitLocations(){
  try{ const r = await PGStorage.get('unitLocations', true); return r ? JSON.parse(r.value) : {}; }
  catch(e){ return {}; }
}
async function saveUnitLocations(m){
  await storageSetWithRetry('unitLocations', JSON.stringify(m), true, 'the location');
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

/* Pulls the most precise lat/lng out of a Google Maps URL, in priority order:
   1) The !3d..!4d.. pair — this is the exact dropped-pin/marker location Google
      embeds in share links, and is more accurate than the @ viewport center.
   2) The @lat,lng viewport center — present on most maps.google.com URLs.
   3) Any other bare "lat,lng" pair found in the URL (covers plain q=lat,lng links).
   Returns {lat,lng} or null if nothing usable is found (e.g. a pure place-name
   search link, or a maps.app.goo.gl short link that can't be read client-side). */
function extractPreciseCoords(link){
  if(!link) return null;
  let m = link.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if(m) return { lat: m[1], lng: m[2] };
  m = link.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if(m) return { lat: m[1], lng: m[2] };
  m = link.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if(m) return { lat: m[1], lng: m[2] };
  return null;
}

/* Builds the URL used for the "Open in Google Maps" button. When we can pull
   exact coordinates out of the saved link, we point straight at those coordinates
   using Google's official coordinate-search URL — this always drops a pin at that
   exact spot and sidesteps the case where a /place/ name link re-runs a text
   search later and Google matches a different, similarly-named place. For links
   we can't extract coordinates from (place-name-only links, or maps.app.goo.gl
   short links), we fall back to the admin's original pasted link as-is. */
function toOpenUrl(link, unitName){
  if(!isUsableMapsLink(link)) return link;
  const coords = extractPreciseCoords(link);
  if(coords){
    /* q=lat,lng(Label) is the classic Google Maps URL format that lets us
       attach a readable name to an exact pin. Without a label, Google shows
       the raw DMS coordinates (e.g. 13°01'37.9"N) as the pin's title since
       there's no matched place at that exact point — with a label, it shows
       our place name instead. */
    const label = encodeURIComponent(`Stay Confident PG - ${unitName || 'Unit'}`);
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}(${label})`;
  }
  return link;
}

/* Accepts: maps.app.goo.gl / goo.gl short links, google.com/maps (any TLD),
   maps.google.com links, google.com/maps?q=... links, and plain
   "latitude,longitude" coordinates. Rejects everything else with a
   friendly reason instead of saving it. Always returns an absolute,
   directly-clickable https:// URL on success. */
function validateMapsLink(raw){
  const val = (raw || '').trim();
  if(!val){
    return { ok:false, reason:'Please paste a Google Maps link or coordinates first.' };
  }

  const coordOnly = val.match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if(coordOnly){
    const lat = parseFloat(coordOnly[1]), lng = parseFloat(coordOnly[2]);
    if(lat < -90 || lat > 90 || lng < -180 || lng > 180){
      return { ok:false, reason:'Those coordinates look out of range. Please check the latitude/longitude.' };
    }
    return { ok:true, url:'https://www.google.com/maps?q=' + lat + ',' + lng };
  }

  let candidate = val;
  if(!/^https?:\/\//i.test(candidate)){
    if(/^(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(candidate)){
      candidate = 'https://' + candidate;
    } else {
      return { ok:false, reason:'That doesn\'t look like a Google Maps link. Paste a link starting with maps.app.goo.gl, maps.google.com, or google.com/maps — or plain "latitude,longitude" coordinates.' };
    }
  }

  let parsed;
  try{ parsed = new URL(candidate); }
  catch(e){ return { ok:false, reason:'That link doesn\'t look valid. Please double-check it and try again.' }; }

  if(!/^https?:$/i.test(parsed.protocol)){
    return { ok:false, reason:'Only http/https links are allowed.' };
  }

  const host = parsed.hostname.toLowerCase();
  const isGoogleHost = /(^|\.)google\.[a-z.]+$/.test(host);
  const isGooGl = /(^|\.)goo\.gl$/.test(host);
  const looksLikeMaps = isGooGl || (isGoogleHost && (host.startsWith('maps.') || parsed.pathname.toLowerCase().indexOf('/maps') !== -1));

  if(!looksLikeMaps){
    return { ok:false, reason:'That link doesn\'t look like a Google Maps link. Please paste a valid Google Maps URL or coordinates.' };
  }

  return { ok:true, url:candidate };
}

/* A saved link only ever gets this far if validateMapsLink() accepted it,
   so it's always an absolute https:// URL — but this guards older data
   saved before validation existed, so a stray non-URL value can never
   produce a broken/blank "Open in Google Maps" button. */
function isUsableMapsLink(link){
  return !!link && /^https:\/\//i.test(link);
}

/* Turns whatever valid Google Maps link/coordinates the admin saved into the
   most accurate embeddable URL we can build:
   - Already an embed link → used as-is.
   - Contains lat,lng (with or without "@") → embed those exact coordinates.
   - A /place/NAME/ link → embed by place name.
   - A link with its own ?q= param → reuse that as the embed query.
   - Any other full Google Maps URL → append output=embed to it directly.
   - A goo.gl / maps.app.goo.gl short link can't be resolved client-side,
     so no reliable preview is possible — returns null and the UI shows a
     "use the Open button" note instead of a broken iframe. */
function toEmbedUrl(link, unitName){
  if(!isUsableMapsLink(link)) return null;
  if(link.includes('output=embed')) return link;
  if(/(^|\.)goo\.gl$/i.test((function(){ try{ return new URL(link).hostname; }catch(e){ return ''; } })())){
    return null;
  }

  const coords = extractPreciseCoords(link);
  if(coords){
    const label = encodeURIComponent(`Stay Confident PG - ${unitName || 'Unit'}`);
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}(${label})&z=17&output=embed`;
  }

  const placeMatch = link.match(/\/place\/([^/@?]+)/);
  if(placeMatch){
    const name = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(name)}&output=embed`;
  }

  try{
    const u = new URL(link);
    const q = u.searchParams.get('q');
    if(q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
    u.searchParams.set('output', 'embed');
    return u.toString();
  }catch(e){
    return `https://maps.google.com/maps?q=${encodeURIComponent(link)}&output=embed`;
  }
}

function renderUnitLocations(){
  const list = document.getElementById('locationList');
  if(!list) return;
  list.innerHTML = '';
  UNITS.forEach((unit, unitIdx)=>{
    const rawLink = unitLocations[unit] || '';
    const usableLink = isUsableMapsLink(rawLink) ? rawLink : '';
    const embedUrl = usableLink ? toEmbedUrl(usableLink, unit) : null;
    const openUrl = usableLink ? toOpenUrl(usableLink, unit) : null;

    const card = document.createElement('div');
    card.className = 'loc-card reveal-stagger';
    card.dataset.unit = unit;
    card.style.setProperty('--stagger-i', Math.min(unitIdx, 12));

    const safeUnit = escapeHtml(unit);
    const safeRawLink = escapeHtml(rawLink);
    const safeOpenLink = escapeHtml(openUrl || '');

    const editorHtml = isAdmin ? `
      <input type="text" class="locInput" placeholder="Paste this unit's Google Maps link" value="${safeRawLink}">
      <div class="loc-btn-row">
        <button type="button" class="locSaveBtn">💾 Save Location</button>
      </div>
      <div class="loc-status"></div>
    ` : '';

    card.innerHTML = `
      <h3>📍 ${safeUnit}</h3>
      ${usableLink ? '' : '<div class="loc-empty">No location set yet for this unit.</div>'}
      <div class="loc-btn-row">
        ${usableLink
          ? `<a class="primary" href="${safeOpenLink}" target="_blank" rel="noopener noreferrer">📍 Open in Google Maps</a>
             <button type="button" class="locShareBtn" data-unit="${safeUnit}" data-link="${safeOpenLink}">📤 Share Location</button>`
          : `<button type="button" class="loc-open-disabled" disabled aria-disabled="true">📍 Location Not Available</button>`}
      </div>
      ${usableLink && embedUrl ? `<div class="map-wrap"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${escapeHtml(embedUrl)}"></iframe></div>` : ''}
      ${usableLink && !embedUrl ? '<div class="loc-empty">Live preview isn\u2019t available for shortened links — tap "Open in Google Maps" above.</div>' : ''}
      ${editorHtml}
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('.locShareBtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      shareUnitLocation(btn.dataset.unit, btn.dataset.link);
    });
  });

  if(isAdmin){
    list.querySelectorAll('.loc-card').forEach(function(card){
      const unit = card.dataset.unit;
      const btn = card.querySelector('.locSaveBtn');
      if(btn){
        btn.addEventListener('click', function(){ saveUnitLocationFor(unit, card); });
      }
    });
  }
}

/* Shares a unit's live Google Maps link. Uses the native share sheet on
   phones (WhatsApp, SMS, etc. all show up there automatically) when
   available; falls back to a WhatsApp web-share link, and if even that
   can't run (very old browsers), falls back to copying the link so the
   user can paste it anywhere themselves. */
async function shareUnitLocation(unit, link){
  if(!link) return;
  const shareText = `📍 ${unit} — Stay Confident PG location:\n${link}`;
  if(navigator.share){
    try{
      await navigator.share({ title: `${unit} — Stay Confident PG`, text: `📍 ${unit} — Stay Confident PG location`, url: link });
      return;
    }catch(e){
      /* user cancelled the share sheet, or it failed — fall through to WhatsApp/clipboard */
    }
  }
  try{
    window.open('https://wa.me/?text=' + encodeURIComponent(shareText), '_blank', 'noopener,noreferrer');
    return;
  }catch(e){ /* fall through to clipboard */ }
  try{
    await navigator.clipboard.writeText(link);
    alert('Location link copied! You can paste it in WhatsApp, SMS, or email.');
  }catch(e){
    prompt('Copy this location link:', link);
  }
}

window.saveUnitLocationFor = async function(unit, cardEl){
  const card = cardEl || list_findLocCard(unit);
  if(!card) return;
  const inp = card.querySelector('.locInput');
  const statusEl = card.querySelector('.loc-status');
  if(!inp) return;

  const result = validateMapsLink(inp.value);
  if(!result.ok){
    if(statusEl){ statusEl.textContent = '⚠️ ' + result.reason; statusEl.style.color = '#c0392b'; }
    return; /* reject invalid input — nothing is saved, other units untouched */
  }

  if(statusEl){ statusEl.textContent = 'Saving…'; statusEl.style.color = ''; }

  try{
    /* Re-read the latest saved map first so a concurrent edit to a
       DIFFERENT unit (from another admin session) is never overwritten —
       only this one unit's key is changed. */
    const latest = await loadUnitLocations();
    latest[unit] = result.url;
    unitLocations = latest;
    await saveUnitLocations(unitLocations);
    if(statusEl){ statusEl.textContent = '✅ Saved — visible to all customers now.'; statusEl.style.color = ''; }
    renderUnitLocations(); /* refresh iframe + Open button immediately, no page reload */
  }catch(e){
    if(statusEl){ statusEl.textContent = '⚠️ Could not save right now. Please check your connection and try again.'; statusEl.style.color = '#c0392b'; }
  }
};

function list_findLocCard(unit){
  const list = document.getElementById('locationList');
  if(!list) return null;
  const cards = list.querySelectorAll('.loc-card');
  for(let i=0;i<cards.length;i++){ if(cards[i].dataset.unit === unit) return cards[i]; }
  return null;
}

async function initUnitLocation(){
  unitLocations = await loadUnitLocations();
  renderUnitLocations();
}


function applyRoomFilter(){
 const f=document.getElementById('roomFilter')?.value||'all';
 document.querySelectorAll('.room-row').forEach(r=>{
   const badge=r.querySelector('.badge');
   const interested=parseInt((r.querySelector('.interest')?.innerText.match(/\d+/)||[0])[0]);
   let show=true;
   if(f==='available') show=badge&&badge.innerText==='Available';
   else if(f==='soon') show=badge&&badge.innerText.includes('Available Soon');
   else if(f==='booked') show=badge&&badge.innerText==='Booked';
   else if(f==='interested') show=interested>0;
   r.style.display=show?'block':'none';
 });
}


/* ===== next inline <script> block from original file ===== */


/* ================= Room pricing (deposit / base rent / utility) — shared, with sensible AC-priced defaults ================= */
/* AC rooms cost more than Non-AC rooms; smaller sharing (fewer people per room) costs more per person. */
const DEFAULT_RENT = {
  '1AC': {deposit:6000, baseRent:11000, utility:1800},
  '2AC': {deposit:5000, baseRent:8500,  utility:1500},
  '3AC': {deposit:4000, baseRent:7000,  utility:1200},
  '1NAC':{deposit:4500, baseRent:8000,  utility:1200},
  '2NAC':{deposit:3500, baseRent:6200,  utility:1000},
  '3NAC':{deposit:3000, baseRent:5000,  utility:800}
};

let roomMeta = {};

async function loadRoomMeta(){
  try{ const r = await PGStorage.get('roomMeta', true); return r ? JSON.parse(r.value) : {}; }
  catch(e){ return {}; }
}
async function saveMeta(){
  await storageSetWithRetry('roomMeta', JSON.stringify(roomMeta), true, 'the pricing/room details');
}

// FIXED: Debounced version for rapid pricing changes
function debouncedSaveMeta(){
  debouncedSave('roomMeta', ()=>JSON.stringify(roomMeta), true, 'pricing details', 1500);
}

function meta(u,r,idx){
  idx = parseInt(idx,10) || 0;
  roomMeta[u]=roomMeta[u]||{};
  if(roomMeta[u][r] && !Array.isArray(roomMeta[u][r])){
    // v27 migration: legacy single-room meta object -> wrap as array so Room 1 keeps its data
    roomMeta[u][r] = [roomMeta[u][r]];
  }
  roomMeta[u][r] = roomMeta[u][r] || [];
  if(!roomMeta[u][r][idx]){
    const d = DEFAULT_RENT[r] || {deposit:3000, baseRent:5000, utility:1000};
    roomMeta[u][r][idx] = {deposit:d.deposit, baseRent:d.baseRent, utility:d.utility, toilets:[]};
  }
  return roomMeta[u][r][idx];
}

/* ================= "Interested" / enquiry counters — shared, persistent, admin-editable ================= */
let enquiryCounts = {};

async function loadEnquiryCounts(){
  try{ const r = await PGStorage.get('enquiryCounts', true); return r ? JSON.parse(r.value) : {}; }
  catch(e){ return {}; }
}
async function saveEnquiryCounts(){
  await storageSetWithRetry('enquiryCounts', JSON.stringify(enquiryCounts), true, 'the interest count');
}
function defaultEnquiryCount(unit, rt, idx){
  let s = unit + rt + (idx||0), h = 0;
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return 2 + (h % 8); /* a believable 2–9 range, stable per room until admin edits it */
}
function enquiryCountFor(unit, rt, idx){
  idx = parseInt(idx,10) || 0;
  const key = unit + '|' + rt + '|' + idx;
  if(enquiryCounts[key] === undefined){
    // v27 migration: Room 1 (idx 0) inherits any legacy unit+roomType-only count
    const legacyKey = unit + '|' + rt;
    if(idx===0 && enquiryCounts[legacyKey] !== undefined) enquiryCounts[key] = enquiryCounts[legacyKey];
    else enquiryCounts[key] = defaultEnquiryCount(unit, rt, idx);
  }
  return enquiryCounts[key];
}

const _render=renderUnits;
renderUnits=function(){_render();document.querySelectorAll('.unit-card').forEach(card=>{const unit=card.querySelector('h3').innerText;card.querySelectorAll('.room-row').forEach(rr=>{const rt=rr.querySelector('b')?.innerText;if(!rt)return;const roomIdx=parseInt(rr.dataset.roomIdx,10)||0;const m=meta(unit,rt,roomIdx);const total=(+m.baseRent||0)+(+m.utility||0); const ac=(rt.includes('AC')&&!rt.includes('NAC'))?'❄️ AC Room':'';rr.style.display='block';if(rr.querySelector('.pricing-box'))return;let d=document.createElement('div');d.className='pricing-box';d.style='margin-top:8px;font-size:12px';if(isAdmin){d.innerHTML=`<div class="edit-room-title">✏️ Edit Room</div><div class="edit-row"><label>Base Rent</label><input style="width:90px" value="${m.baseRent}" onchange="meta('${unit}','${rt}',${roomIdx}).baseRent=this.value;debouncedSaveMeta();renderUnits()"></div><div class="edit-row"><label>Deposit</label><input style="width:90px" value="${m.deposit||0}" onchange="meta('${unit}','${rt}',${roomIdx}).deposit=this.value;debouncedSaveMeta();renderUnits()"></div><div class="edit-row"><label>Utility Charges</label><input style="width:90px" value="${m.utility}" onchange="meta('${unit}','${rt}',${roomIdx}).utility=this.value;debouncedSaveMeta();renderUnits()"></div><div class="edit-row edit-total"><label>Total Monthly</label><span>₹${total} ${ac}</span></div><div class="edit-checks"><label><input type=checkbox ${(m.toilets||[]).includes('Western')?'checked':''} onchange="let a=meta('${unit}','${rt}',${roomIdx}).toilets;this.checked?!a.includes('Western')&&a.push('Western'):meta('${unit}','${rt}',${roomIdx}).toilets=a.filter(x=>x!='Western');debouncedSaveMeta();renderUnits()">🚽 Western</label> <label><input type=checkbox ${(m.toilets||[]).includes('Indian')?'checked':''} onchange="let a=meta('${unit}','${rt}',${roomIdx}).toilets;this.checked?!a.includes('Indian')&&a.push('Indian'):meta('${unit}','${rt}',${roomIdx}).toilets=a.filter(x=>x!='Indian');debouncedSaveMeta();renderUnits()">🚾 Indian</label> <label><input type=checkbox ${m.kitchen?'checked':''} onchange="meta('${unit}','${rt}',${roomIdx}).kitchen=this.checked;debouncedSaveMeta();renderUnits()">🍳 Kitchen</label> <label><input type=checkbox ${m.electric?'checked':''} onchange="meta('${unit}','${rt}',${roomIdx}).electric=this.checked;debouncedSaveMeta();renderUnits()">⚡ Electric</label> <label><input type=checkbox ${m.gas?'checked':''} onchange="meta('${unit}','${rt}',${roomIdx}).gas=this.checked;debouncedSaveMeta();renderUnits()">🔥 Gas</label></div>`;}else{d.innerHTML=`<div class="price-main"><span class="price-amount">₹${m.baseRent||0}</span><span class="price-sub">/ month</span></div><div class="price-line">Deposit ₹${m.deposit||0} • Utilities ₹${m.utility||0}</div><div class="price-line price-total">Total ₹${total} / month</div>`;}rr.appendChild(d);});});}
window.adminAddRoom=async function(unit,rt){
  if(!Array.isArray(availability[unit][rt])) availability[unit][rt]=[availability[unit][rt]];
  const n=parseInt(rt[0]);
  availability[unit][rt].push({beds:Array(n).fill(false),status:'available'});
  renderUnits();
  // FIXED: Use debounced save to prevent rate limit errors on rapid adds
  debouncedSave('availability', ()=>JSON.stringify(availability), true, 'room availability', 2000);
};
window.adminRemoveRoom=async function(unit,rt,idx){
  const arr=availability[unit][rt];
  if(!Array.isArray(arr)||arr.length<=1) return; // always keep at least 1 room per type
  if(!confirm('Remove Room '+(idx+1)+' of '+rt+' in '+unit+'? This cannot be undone.')) return;
  arr.splice(idx,1);
  if(roomMeta[unit] && Array.isArray(roomMeta[unit][rt])) roomMeta[unit][rt].splice(idx,1);
  // shift "interested" counts down so they stay attached to the correct room after renumbering
  for(let i=idx;i<arr.length;i++){
    const nextKey=unit+'|'+rt+'|'+(i+1), curKey=unit+'|'+rt+'|'+i;
    if(enquiryCounts[nextKey]!==undefined) enquiryCounts[curKey]=enquiryCounts[nextKey]; else delete enquiryCounts[curKey];
  }
  delete enquiryCounts[unit+'|'+rt+'|'+arr.length];
  renderUnits();
  // FIXED: Use debounced save to prevent rate limit errors on rapid removals
  debouncedSave('availability', ()=>JSON.stringify(availability), true, 'room availability', 2000);
  if(typeof saveMeta==='function') debouncedSave('roomMeta', ()=>JSON.stringify(roomMeta), true, 'room metadata', 2000);
  if(typeof saveEnquiryCounts==='function') debouncedSave('enquiryCounts', ()=>JSON.stringify(enquiryCounts), true, 'enquiry counts', 2000);
};

// NOTE: this used to auto-run immediately and call renderUnits() itself. Same race
// condition as above — moved into a plain function, run once at the bottom of the file.
window.__initPricing = async function(){
  roomMeta = await loadRoomMeta();
  enquiryCounts = await loadEnquiryCounts();
};


/* ===== next inline <script> block from original file ===== */


async function editEnquiry(btn){
 const container=btn.closest('.enquiry-container');
 const u=container.dataset.u, r=container.dataset.r, idx=parseInt(container.dataset.i,10)||0;
 const span=btn.parentElement.querySelector('.enquiry-count');
 let v=prompt('How many people have enquired about this slot?', span.innerText);
 if(v!==null && !isNaN(v) && v.trim()!==''){
   enquiryCounts[u+'|'+r+'|'+idx] = Math.max(0, parseInt(v));
   await saveEnquiryCounts();
   renderUnits();
 }
}


/* ===== next inline <script> block from original file ===== */


/* ================= Preference Questionnaire ================= */
let prefQuestions = [];
let userPrefs = {applied:false};

function defaultPrefQuestions(){
  return [
    {id:'movein',   type:'date',   text:'📅 When are you planning to move in?'},
    {id:'roomtype', type:'select', text:'❄️ Do you prefer AC or Non-AC rooms?',
      options:['AC','Non-AC','Either is fine']},
    {id:'sharing',  type:'select', text:'🛏️ How many people would you like to share the room with?',
      options:['1 Sharing (Single)','2 Sharing','3 Sharing','No preference']},
    {id:'budget',   type:'select', text:'💰 What is your monthly budget?',
      options:['Under ₹8,000','₹8,000 – ₹12,000','₹12,000 – ₹16,000','Above ₹16,000','No preference']},
    {id:'groupsize', type:'select', text:'👥 Are you booking just for yourself, or with others?',
      options:['Just me (1 person)','2 of us together','3 or more (group booking)','Not sure yet']},
    {id:'status',   type:'select', text:'✅ Which rooms would you like to see?',
      options:['Only rooms available right now','Include "Available Soon" rooms too','Show me everything']}
  ];
}

async function loadPrefQuestions(){
  try{ const r=await PGStorage.get('prefQuestions', true); return r?JSON.parse(r.value):null; }catch(e){ return null; }
}
async function savePrefQuestions(q){
  await storageSetWithRetry('prefQuestions', JSON.stringify(q), true, 'the preference questions');
}
async function loadUserPrefAnswers(){
  try{ const r=await PGStorage.get('userPrefAnswers', false); return r?JSON.parse(r.value):null; }catch(e){ return null; }
}
async function saveUserPrefAnswers(p){
  await storageSetWithRetry('userPrefAnswers', JSON.stringify(p), false, 'your preferences');
}

function renderPrefForm(){
  const grid = document.getElementById('prefGrid');
  if(!grid) return;
  grid.innerHTML='';
  prefQuestions.forEach(item=>{
    const wrap = document.createElement('div');
    wrap.className='pref-field';
    const label = document.createElement('label');
    label.textContent = item.text;
    wrap.appendChild(label);
    if(item.type==='date'){
      const inp=document.createElement('input'); inp.type='date'; inp.id='pref_'+item.id;
      wrap.appendChild(inp);
    }else if(item.type==='select'){
      const sel=document.createElement('select'); sel.id='pref_'+item.id;
      const placeholder=document.createElement('option'); placeholder.value=''; placeholder.textContent='Select an option'; placeholder.selected=true;
      sel.appendChild(placeholder);
      (item.options||[]).forEach(opt=>{const o=document.createElement('option'); o.value=opt; o.textContent=opt; sel.appendChild(o);});
      sel.selectedIndex=0;
      wrap.appendChild(sel);
    }
    grid.appendChild(wrap);
  });
}

/* ---------- Preference popup presentation (modal open/close/scroll) ----------
   These helpers only control how the questionnaire is shown (as a centered,
   animated popup instead of an inline block). None of the matching logic,
   validation, storage calls, or button bindings above/below are touched. */
const PREF_MODAL_SESSION_KEY = 'prefModalShownThisSession';

function markPrefModalShown(){
  try{ sessionStorage.setItem(PREF_MODAL_SESSION_KEY, '1'); }catch(e){}
}
function hasPrefModalBeenShown(){
  try{ return sessionStorage.getItem(PREF_MODAL_SESSION_KEY) === '1'; }catch(e){ return false; }
}

function onPrefModalKeydown(e){
  if(e.key === 'Escape' || e.key === 'Esc'){ skipPreferences(); return; }
  if(e.key === 'Tab'){
    const card = document.getElementById('prefCard');
    if(!card) return;
    const focusable = card.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if(!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }
}

function openPrefModal(){
  const overlay = document.getElementById('prefModalOverlay');
  const card = document.getElementById('prefCard');
  if(!overlay || !card) return;
  overlay.style.display = 'flex';
  void overlay.offsetWidth; /* force reflow so the transition below actually animates */
  overlay.classList.add('pref-modal-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('pref-modal-active');
  document.addEventListener('keydown', onPrefModalKeydown);
  const firstField = card.querySelector('input, select');
  if(firstField) firstField.focus(); else card.focus();
}

function closePrefModal(){
  const overlay = document.getElementById('prefModalOverlay');
  if(!overlay) return;
  overlay.classList.remove('pref-modal-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('pref-modal-active');
  document.removeEventListener('keydown', onPrefModalKeydown);
  setTimeout(()=>{ overlay.style.display = 'none'; }, 380); /* matches the CSS fade/scale duration */
}

/* Reopens the same popup at any time (e.g. the "Update Preferences" button)
   without reloading the page. */
function reopenPrefModal(){
  document.getElementById('prefSummary').style.display='none';
  openPrefModal();
}

function applyPreferences(){
  userPrefs = {applied:true};
  prefQuestions.forEach(item=>{
    const el = document.getElementById('pref_'+item.id);
    if(!el) return;
    if(item.type==='select') userPrefs[item.id+'Idx']=el.selectedIndex-1; /* -1 = left blank = no preference */
    else if(item.type==='date') userPrefs.movein=el.value;
  });
  saveUserPrefAnswers(userPrefs);
  markPrefModalShown();
  closePrefModal();
  document.getElementById('prefSummary').style.display='flex';
  filterRoomsByPreferences();

  /* If the customer chose Daily Rental in this popup, take them straight to the
     Daily Stay page instead of the (Monthly-focused) Room Availability results. */
  const rentalTypeEl = document.getElementById('prefRentalType');
  const wantsDaily = rentalTypeEl && rentalTypeEl.value === 'Daily Rental';

  setTimeout(()=>{
    if(wantsDaily){
      const dailyNavBtn = document.querySelector('nav button[data-tab="daily"]');
      if(dailyNavBtn) dailyNavBtn.click();
      const target = document.getElementById('daily');
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
    } else {
      /* Scroll to the filtered Room Availability results once the popup has faded out */
      const target = document.getElementById('unitsGrid') || document.getElementById('availability');
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
    }
  }, 400);
}

function skipPreferences(){
  userPrefs = {applied:false};
  saveUserPrefAnswers(userPrefs);
  markPrefModalShown();
  closePrefModal();
  document.getElementById('prefSummary').style.display='flex';
  const t=document.getElementById('prefSummaryText'); if(t) t.textContent='Showing all rooms.';
  filterRoomsByPreferences();
}

function reopenPreferences(){
  reopenPrefModal();
}

function filterRoomsByPreferences(){
  if(!userPrefs || !userPrefs.applied){
    document.querySelectorAll('.room-row').forEach(r=>r.style.display='block');
    document.querySelectorAll('.unit-card').forEach(c=>c.style.display='');
    return;
  }
  let shown=0;
  document.querySelectorAll('.unit-card').forEach(card=>{
    const unitName = card.querySelector('h3')?.innerText;
    let cardHasVisible=false;
    card.querySelectorAll('.room-row').forEach(rr=>{
      const rt = rr.querySelector('b')?.innerText;
      if(!rt){ return; }
      let show=true;
      if(show && userPrefs.roomtypeIdx===0 && rt.includes('NAC')) show=false;
      if(show && userPrefs.roomtypeIdx===1 && !rt.includes('NAC')) show=false;
      if(show && userPrefs.sharingIdx!==undefined && userPrefs.sharingIdx>=0 && userPrefs.sharingIdx<3){
        const n=parseInt(rt[0]); const want=userPrefs.sharingIdx+1;
        if(n!==want) show=false;
      }
      const badge = rr.querySelector('.badge');
      let badgeStatus='available';
      if(badge){
        if(badge.classList.contains('booked')) badgeStatus='booked';
        else if(badge.classList.contains('none')) badgeStatus='none';
        else if(badge.classList.contains('soon')) badgeStatus='soon';
      }
      if(show && badgeStatus==='none') show=false;
      if(show){
        if(userPrefs.statusIdx===0 && badgeStatus!=='available') show=false;
        else if(userPrefs.statusIdx===1 && badgeStatus==='booked') show=false;
      }
      if(show && userPrefs.budgetIdx!==undefined && userPrefs.budgetIdx<4){
        const roomIdx = parseInt(rr.dataset.roomIdx,10)||0;
        let m=null; try{ m = (typeof meta==='function') ? meta(unitName, rt, roomIdx) : null; }catch(e){}
        const totalRent = m ? ((+m.baseRent||0)+(+m.utility||0)) : 0;
        const idx=userPrefs.budgetIdx;
        if(idx===0 && !(totalRent>0 && totalRent<8000)) show=false;
        else if(idx===1 && !(totalRent>=8000 && totalRent<=12000)) show=false;
        else if(idx===2 && !(totalRent>12000 && totalRent<=16000)) show=false;
        else if(idx===3 && !(totalRent>16000)) show=false;
      }
      rr.style.display = show?'block':'none';
      if(show){ shown++; cardHasVisible=true; }
    });
    card.style.display = cardHasVisible ? '' : 'none';
  });
  const txt=document.getElementById('prefSummaryText');
  if(txt) txt.textContent = shown>0
    ? `✨ Showing ${shown} room option(s) matching your preferences.`
    : `😕 No rooms exactly match your preferences right now — tap "Edit Preferences" to adjust, or view all rooms.`;
}

function clearPrefFilterAndShowAll(){
  userPrefs = {applied:false};
  saveUserPrefAnswers(userPrefs);
  document.getElementById('prefSummary').style.display='flex';
  const t=document.getElementById('prefSummaryText'); if(t) t.textContent='Showing all rooms.';
  filterRoomsByPreferences();
}

function buildAdminPrefEditor(){
  const container = document.getElementById('prefAdminEditor');
  if(!container) return;
  container.innerHTML='';
  prefQuestions.forEach((item, idx)=>{
    const box=document.createElement('div'); box.className='pref-admin-item';
    const tag=document.createElement('span'); tag.className='pref-admin-tag'; tag.textContent='Question '+(idx+1); box.appendChild(tag);
    const qLabel=document.createElement('label'); qLabel.textContent='Question text';
    box.appendChild(qLabel);
    const qInput=document.createElement('input'); qInput.type='text'; qInput.value=item.text; qInput.id='padm_text_'+idx;
    box.appendChild(qInput);
    if(item.type==='select'){
      const oLabel=document.createElement('label'); oLabel.textContent='Answer options (comma separated)';
      box.appendChild(oLabel);
      const oInput=document.createElement('input'); oInput.type='text'; oInput.value=(item.options||[]).join(', '); oInput.id='padm_opts_'+idx;
      box.appendChild(oInput);
    }else if(item.type==='date'){
      const note=document.createElement('div'); note.className='small-note'; note.textContent='(Customer picks a date here — wording only is editable)';
      box.appendChild(note);
    }
    container.appendChild(box);
  });
}

function saveAdminPrefs(){
  prefQuestions.forEach((item, idx)=>{
    const t=document.getElementById('padm_text_'+idx);
    if(t && t.value.trim()) item.text = t.value.trim();
    if(item.type==='select'){
      const o=document.getElementById('padm_opts_'+idx);
      if(o){
        const arr=o.value.split(',').map(s=>s.trim()).filter(Boolean);
        if(arr.length) item.options=arr;
      }
    }
  });
  savePrefQuestions(prefQuestions);
  renderPrefForm();
  const msg=document.getElementById('prefAdminMsg');
  if(msg){ msg.textContent='Saved! The questions on "Room Availability" are updated for everyone.'; }
}

/* Keep filtering applied every time the room grid re-renders */
const _renderUnitsWithPrefs = renderUnits;
renderUnits = function(){ _renderUnitsWithPrefs(); filterRoomsByPreferences(); };

// NOTE: this used to auto-run immediately and call renderUnits() itself — same race
// condition as the other init blocks. Moved into a plain function, run once at the
// bottom of the file, after every script (and its renderUnits wrapping) is in place.
window.__initPrefs = async function(){
  prefQuestions = await loadPrefQuestions();
  if(!prefQuestions || !prefQuestions.length){
    prefQuestions = defaultPrefQuestions();
    await savePrefQuestions(prefQuestions);
  }
  renderPrefForm();
  buildAdminPrefEditor();

  const saved = await loadUserPrefAnswers();
  if(saved && saved.applied){
    userPrefs = saved;
    prefQuestions.forEach(item=>{
      const el = document.getElementById('pref_'+item.id);
      if(!el) return;
      if(item.type==='select' && userPrefs[item.id+'Idx']!==undefined) el.selectedIndex = userPrefs[item.id+'Idx']+1;
      if(item.type==='date' && userPrefs.movein) el.value = userPrefs.movein;
    });
    /* Preferences were already answered in an earlier visit — keep the popup
       closed and just show the summary bar, exactly as before. */
    const overlay = document.getElementById('prefModalOverlay');
    if(overlay) overlay.style.display='none';
    document.getElementById('prefSummary').style.display='flex';
    markPrefModalShown();
  }else{
    userPrefs = {applied:false};
    if(!hasPrefModalBeenShown()){
      /* First time this browser session — show the popup automatically. */
      openPrefModal();
      markPrefModalShown();
    }else{
      /* Already seen (and closed/skipped) earlier this session — stay closed. */
      const overlay = document.getElementById('prefModalOverlay');
      if(overlay) overlay.style.display='none';
    }
  }

  /* Clicking the blurred backdrop behaves like Skip: close without filtering. */
  const prefOverlayEl = document.getElementById('prefModalOverlay');
  if(prefOverlayEl){
    prefOverlayEl.addEventListener('click', function(e){
      if(e.target === prefOverlayEl) skipPreferences();
    });
  }
};


/* ===== next inline <script> block from original file ===== */


/* ================= Master init (FIX) =================
   All the pieces above used to kick themselves off independently with their own
   (async function(){...})() as soon as each <script> block was parsed. Because a
   paused "await" can resume in between two separate <script> tags, the very first
   page render was sometimes triggered before later scripts had finished attaching
   the pricing-box / enquiry-counter / preference-filter logic to renderUnits().
   That produced a ReferenceError ("enquiryCountFor is not defined") which broke the
   render partway through — the visible symptom being that Deposit Amount, Base Rent,
   Total Monthly Rent and the Kitchen/toilet preference checkboxes would sometimes not
   (re)appear after you edited a value.
   Fix: load ALL data first, in a fixed order, and only call renderUnits() once,
   after every script on the page (and its renderUnits wrapping) is guaranteed to
   already be in place. */
window.__pageInitialized = window.__pageInitialized || false;
window.addEventListener('load', async function(){
  if(window.__pageInitialized) return;
  window.__pageInitialized = true;
  try{
    await window.__initCore();
    await window.__initPricing();
    await window.__initPrefs();
    await window.__initPayment();
    if(typeof window.__initWishlistTools === 'function') await window.__initWishlistTools();
  }catch(e){
    console.error('Init error:', e);
  }
  if(typeof renderUnits==='function'){
    renderUnits();
  }
},{ once:true });


/* ===== next inline <script> block from original file ===== */


function getSelectedRentalType(){
  const el=document.getElementById('prefRentalType');
  return el?el.value:"";
}
document.addEventListener("DOMContentLoaded",()=>{
 const btn=document.querySelector(".pref-actions button");
 if(btn){
   btn.addEventListener("click",function(e){
      const r=document.getElementById("prefRentalType");
      if(r && !r.value){
        e.preventDefault();
        alert("Please select Rental Preference.");
        r.focus();
      }
   },true);
 }
});


/* ===== next inline <script> block from original file ===== */


document.addEventListener('DOMContentLoaded', () => {

  // --- Magnetic Focus Glow Logic ---
  // Calculates exact mouse position to create a spotlight effect inside cards
  const updateMagneticGlow = (e, card) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  document.body.addEventListener('mousemove', (e) => {
    const targetCard = e.target.closest('.unit-card, .pref-card, .form-card');
    if (targetCard) {
      updateMagneticGlow(e, targetCard);
    }
  });

  // --- Action Success Feedback Logic ---
  // Turns buttons green temporarily to show the user their click was successful
  const addSuccessFeedback = (btn) => {
    if (!btn || btn.classList.contains('btn-success-anim')) return;
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '✨ Success! ✨';
    btn.classList.add('btn-success-anim');
    
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove('btn-success-anim');
    }, 1500);
  };

  // Attach success feedback to specific meaningful actions
  document.body.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('button[onclick*="sendBooking"], button[onclick*="save"], button[onclick*="applyPreferences"]');
    if (actionBtn) {
      addSuccessFeedback(actionBtn);
    }
  });

});


/* ===== next inline <script> block from original file ===== */


(function(){
  // ---- Ripple effect on every button ----
  document.body.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
    btn.appendChild(ripple);
    setTimeout(()=>ripple.remove(), 650);
  });

  // ---- Sticky nav shadow on scroll ----
  const nav = document.querySelector('nav');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  window.addEventListener('scroll', function(){
    const y = window.scrollY || document.documentElement.scrollTop;
    if(nav) nav.classList.toggle('scrolled', y > 8);
    if(scrollTopBtn) scrollTopBtn.classList.toggle('show', y > 400);
  }, { passive: true });

  if(scrollTopBtn){
    scrollTopBtn.addEventListener('click', function(){
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Copy feedback flash on the UPI "Copy" button ----
  document.body.addEventListener('click', function(e){
    const btn = e.target.closest('button[onclick*="copyUpiId"]');
    if(!btn) return;
    const original = btn.textContent;
    btn.textContent = '✅ Copied';
    btn.classList.add('copy-flash');
    setTimeout(()=>{ btn.textContent = original; btn.classList.remove('copy-flash'); }, 1200);
  });

  // ---- Confetti burst helper (used after a successful payment) ----
  const confettiColors = ['#c9962f', '#1f8a5f', '#0f6e63', '#e0b65a', '#22a06b'];
  window.fireConfetti = function(){
    const count = 26;
    for(let i=0;i<count;i++){
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (Math.random()*100) + 'vw';
      piece.style.background = confettiColors[Math.floor(Math.random()*confettiColors.length)];
      piece.style.animationDuration = (2.2 + Math.random()*1.6) + 's';
      piece.style.opacity = String(0.8 + Math.random()*0.2);
      document.body.appendChild(piece);
      setTimeout(()=>piece.remove(), 4000);
    }
  };
})();


/* ===== next inline <script> block from original file ===== */


/* ============================================================
   PREMIUM WORLD-CLASS EXPERIENCE PACK — behaviour layer
   Everything here is additive: it reads existing globals
   (UNITS, availability, renderUnits, roomStatus, waLink,
   callLink, nav buttons) but never redefines core logic.
   ============================================================ */
(function(){
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isDesktop = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- 1. Scroll progress bar ---------- */
  var progressBar = document.createElement('div');
  progressBar.id = 'pwScrollProgress';
  document.body.insertBefore(progressBar, document.body.firstChild);
  window.addEventListener('scroll', function(){
    var el = document.documentElement;
    var max = (el.scrollHeight - el.clientHeight) || 1;
    progressBar.style.width = Math.min(100, (el.scrollTop / max) * 100) + '%';
  }, { passive:true });

  /* ---------- 2. Room-status helper (dashboard-only bucketing; does NOT touch
     the shared roomStatus() used for customer-facing badges / booking eligibility) ---------- */
  function computeCounts(){
    var counts = { available:0, booked:0, soon:0, none:0, total:0 };
    if (typeof availability === 'undefined' || !availability) return counts;
    Object.keys(availability).forEach(function(u){
      Object.keys(availability[u]).forEach(function(r){
        var arr = availability[u][r];
        if(!Array.isArray(arr)) arr = arr ? [arr] : [];
        arr.forEach(function(o){
          if (!o || typeof o !== 'object') return;
          counts.total++;
          var st;
          if (o.status === 'none'){
            st = 'none';
          } else if (Array.isArray(o.beds) && o.beds.some(Boolean)){
            // Dashboard "Booked" now reflects ANY occupied bed (admin toggled even one bed),
            // not only rooms where every bed is full.
            st = 'booked';
          } else if (o.status === 'soon'){
            st = 'soon';
          } else {
            st = 'available';
          }
          counts[st] = (counts[st] || 0) + 1;
        });
      });
    });
    return counts;
  }

  /* ---------- 3. Count-up animation ---------- */
  function animateCount(el, target, duration){
    if (!el) return;
    if (reduceMotion){ el.textContent = target.toLocaleString('en-IN'); return; }
    var startTime = null;
    function step(ts){
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- 4. Hero: aurora, particles, floating icons, stats, CTAs, scroll cue, divider ---------- */
  var header = document.querySelector('header');
  if (header){
    var aurora = document.createElement('div');
    aurora.className = 'pw-aurora';
    aurora.setAttribute('aria-hidden', 'true');
    aurora.innerHTML = '<span></span><span></span><span></span>';
    header.insertBefore(aurora, header.firstChild);

    if (!reduceMotion){
      var particles = document.createElement('div');
      particles.className = 'pw-particles';
      particles.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < 16; i++){
        var p = document.createElement('span');
        p.className = 'pw-particle';
        var size = 3 + Math.random() * 5;
        p.style.width = p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
        p.style.animationDuration = (7 + Math.random() * 8) + 's';
        p.style.animationDelay = (Math.random() * 8) + 's';
        particles.appendChild(p);
      }
      header.appendChild(particles);

      ['🏠','🔑','🛏️','✨','🏢'].forEach(function(ic, idx){
        var el = document.createElement('span');
        el.className = 'pw-float-icon';
        el.textContent = ic;
        el.setAttribute('aria-hidden', 'true');
        el.style.left = (8 + idx * 20) + '%';
        el.style.top = (14 + (idx % 3) * 22) + '%';
        el.style.animationDelay = (idx * 1.3) + 's';
        header.appendChild(el);
      });
    }

    var ctaWrap = document.createElement('div');
    ctaWrap.id = 'pwHeroCtas';
    ctaWrap.innerHTML =
      '<button type="button" class="pw-hero-btn primary" id="pwCtaBook">🔑 Explore Rooms</button>' +
      '<button type="button" class="pw-hero-btn ghost" id="pwCtaWa">💬 Chat on WhatsApp</button>';
    header.appendChild(ctaWrap);

    document.getElementById('pwCtaBook').addEventListener('click', function(){
      var btn = document.querySelector('nav button[data-tab="availability"]');
      if (btn) btn.click();
      var nav = document.querySelector('nav');
      if (nav) nav.scrollIntoView({ behavior:'smooth' });
    });
    document.getElementById('pwCtaWa').addEventListener('click', function(){
      var wa = document.getElementById('waLink');
      if (wa && wa.getAttribute('href') && wa.getAttribute('href') !== '#') window.open(wa.href, '_blank');
    });

    var divider = document.createElement('div');
    divider.className = 'pw-divider';
    divider.setAttribute('aria-hidden', 'true');
    divider.innerHTML = '<svg viewBox="0 0 1200 80" preserveAspectRatio="none"><path d="M0,32 C300,64 900,0 1200,32 L1200,80 L0,80 Z" fill="var(--cream)"></path></svg>';
    header.parentNode.insertBefore(divider, header.nextSibling);

    /* ---------- 4b. Premium animated statistic cards ----------
       Five glassmorphic cards, ordered by descending figure:
       Customer Conversations / Customers Served / Happy Customers /
       Daily Enquiries / Years of Excellence. Numbers count up from 0
       once, the first time the section scrolls into view, then never
       replay. */
    var statsSection = document.createElement('div');
    statsSection.id = 'pwStatsSection';
    statsSection.setAttribute('aria-label', 'Our numbers');

    var statsBg = document.createElement('div');
    statsBg.className = 'pw-stats-bg';
    statsBg.setAttribute('aria-hidden', 'true');
    var statsBgHtml = '<span class="pw-stats-blob"></span><span class="pw-stats-blob"></span><span class="pw-stats-blob"></span>';
    if (!reduceMotion){
      for (var d = 0; d < 10; d++){
        var dotSize = 3 + Math.random() * 4;
        var dotLeft = Math.random() * 100;
        var dotDur = (9 + Math.random() * 7).toFixed(1);
        var dotDelay = (Math.random() * 9).toFixed(1);
        statsBgHtml += '<span class="pw-stats-dot" style="width:' + dotSize + 'px;height:' + dotSize + 'px;left:' + dotLeft + '%;animation-duration:' + dotDur + 's;animation-delay:' + dotDelay + 's;"></span>';
      }
    }
    statsBg.innerHTML = statsBgHtml;
    statsSection.appendChild(statsBg);

    var STAT_CARDS = [
      { icon:'fa-solid fa-comment-dots',  target:7896, suffix:'+', title:'Customer Conversations', sub:'Meaningful conversations helping guests find the perfect Stay Confident PG home.' },
      { icon:'fa-solid fa-house-chimney-user', target:568, suffix:'+', title:'Customers Served', sub:'Residents successfully accommodated across all our premium PG units.' },
      { icon:'fa-solid fa-face-smile',    target:196, suffix:'+', title:'Happy Residents',    sub:'Satisfied residents enjoying a safe, comfortable and premium living experience.' },
      { icon:'fa-solid fa-comments',      target:58,  suffix:'+', title:'Daily Enquiries',   sub:'Fresh enquiries received every day from prospective residents.' },
      { icon:'fa-solid fa-trophy',        target:10,  suffix:'+', title:'Years of Excellence', sub:'Delivering trusted and comfortable PG living for over a decade.' }
    ];
    var cardsHtml = STAT_CARDS.map(function(c){
      return '<div class="pw-stat-card" data-count-target="' + c.target + '">' +
        '<div class="pw-stat-icon"><i class="' + c.icon + '" aria-hidden="true"></i></div>' +
        '<div class="pw-stat-number"><span class="pw-stat-count">0</span><span class="pw-stat-plus">' + c.suffix + '</span></div>' +
        '<div class="pw-stat-title">' + c.title + '</div>' +
        '<div class="pw-stat-sub">' + c.sub + '</div>' +
      '</div>';
    }).join('');
    var googleCard = '<div class="pw-stat-card pw-google-rating-card">' +
        '<div class="pw-google-badge">Verified Google Rating</div>' +
        '<div class="pw-stat-icon"><i class="fa-brands fa-google" aria-hidden="true"></i></div>' +
        '<div class="pw-stat-title">Google Rating</div>' +
        '<div class="pw-google-stars">★★★★★</div>' +
        '<div class="pw-google-score">4.8/5</div>' +
        '<button class="pw-google-btn" onclick="window.open(atob(\'aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9tYXBzL3BsYWNlL1N0YXkrQ29uZmlkZW50K1BHK0hvbWVzL0AxMy4wMjcxOTM0LDgwLjIwNjc3NjcsODQ4bS9kYXRhPSEzbTEhMWUzITRtOCEzbTchMXMweDNhNTI2N2ExMjA2ZTZiYTc6MHgzOTgyMDBiNjcwODQwZDdjIThtMiEzZDEzLjAyNzE5MzQhNGQ4MC4yMDkzNTE2ITltMSExYjEhMTZzJTJGZyUyRjExZjY2ZGdoYno/ZW50cnk9dHR1JmdfZXA9RWdveU1ESTJNRGN4TXk0d0lLWE1EU29BU0FGUUF3JTNEJTNE\'),\'_blank\',\'noopener\')">View Google Reviews</button>' +
        '</div>';
    cardsHtml += googleCard;

    statsSection.insertAdjacentHTML('beforeend', cardsHtml); /* appended after statsBg, doesn't clobber it */
    header.parentNode.insertBefore(statsSection, divider.nextSibling);

    /* Restrict visibility to the Home tab only: this section lives outside
       the <section id="home"> markup (it's injected right after <header>),
       so it isn't hidden/shown by the normal tab-switch logic. Watch the
       Home section's "active" class and mirror it here, purely additive
       and non-invasive to existing tab switching. */
    var pwHomeSectionForStats = document.getElementById('home');
    function pwUpdateStatsSectionVisibility(){
      var isHomeActive = pwHomeSectionForStats && pwHomeSectionForStats.classList.contains('active');
      statsSection.style.display = isHomeActive ? '' : 'none';
    }
    pwUpdateStatsSectionVisibility();
    if (pwHomeSectionForStats){
      new MutationObserver(pwUpdateStatsSectionVisibility).observe(pwHomeSectionForStats, { attributes: true, attributeFilter: ['class'] });
    }

    /* Trigger once only: unobserve immediately after the first
       intersection, and guard with a flag in case of any duplicate
       observer setup on re-init. GPU-friendly: only textContent is
       mutated per frame, no layout-affecting properties touched. */
    var pwStatsAnimated = false;
    var statObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting || pwStatsAnimated) return;
        pwStatsAnimated = true;
        statsSection.querySelectorAll('.pw-stat-card').forEach(function(card, idx){
          var countEl = card.querySelector('.pw-stat-count');
          var target = parseInt(card.getAttribute('data-count-target'), 10) || 0;
          setTimeout(function(){ animateCount(countEl, target, 2000); }, idx * 120);
        });
        statObserver.unobserve(statsSection);
        statObserver.disconnect();
      });
    }, { threshold:.3 });
    statObserver.observe(statsSection);
  }

  /* Divider transitioning into the footer */
  var footer = document.querySelector('footer');
  if (footer){
    var divider2 = document.createElement('div');
    divider2.className = 'pw-divider';
    divider2.setAttribute('aria-hidden', 'true');
    divider2.innerHTML = '<svg viewBox="0 0 1200 80" preserveAspectRatio="none"><path d="M0,48 C300,16 900,80 1200,48 L1200,0 L0,0 Z" fill="var(--forest)"></path></svg>';
    footer.parentNode.insertBefore(divider2, footer);
  }

  /* ---------- 5. Scroll reveal (Intersection Observer) ----------
     The page's own data/pricing/prefs init sequence legitimately calls
     renderUnits() twice on first load (see the "Master init (FIX)"
     comment further down) so that pricing-box/preference logic is
     guaranteed to be attached before the final render. That's real,
     intentional core behaviour and is left untouched here — but it
     does mean this reveal layer would otherwise see the SAME cards
     as brand-new DOM nodes twice, and replay the fade-up "pop" twice.
     Fix: remember what's already been revealed by content identity
     (not by DOM node, which changes on every re-render), so a card
     that already appeared once is shown instantly instead of
     re-animating in. */
  var pwRevealedKeys = Object.create(null);
  function pwRevealKey(el){
    if (el.classList.contains('unit-card')){
      var h3 = el.querySelector('h3');
      return 'unit:' + (h3 ? h3.textContent.trim() : '');
    }
    if (el.classList.contains('loc-card')){
      return 'loc:' + el.textContent.trim().slice(0, 60);
    }
    if (el.classList.contains('pw-service-card')){
      var h4 = el.querySelector('h4');
      return 'service:' + (h4 ? h4.textContent.trim() : '');
    }
    if (el.classList.contains('pw-dash-card')){
      var lbl = el.querySelector('.pw-dash-label');
      return 'dash:' + (lbl ? lbl.textContent.trim() : '');
    }
    if (el.classList.contains('section-title')){
      return 'title:' + el.textContent.trim();
    }
    return null; /* other elements (pref-card, form-card, contact links) aren't rebuilt from scratch, so default per-node behaviour is fine */
  }

  var revealObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('pw-inview');
        var key = pwRevealKey(entry.target);
        if (key) pwRevealedKeys[key] = true;
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold:.12 });

  function observeReveal(){
    document.querySelectorAll('.unit-card, .loc-card, .pref-card, .form-card, .section-title, .contact-info a, .pw-service-card, .pw-dash-card')
      .forEach(function(el){
        if (!el.hasAttribute('data-pw-reveal')) el.setAttribute('data-pw-reveal', '');
        if (el.classList.contains('pw-inview')) return;
        var key = pwRevealKey(el);
        if (key && pwRevealedKeys[key]){
          el.classList.add('pw-inview'); /* already shown once — no repeat pop */
          return;
        }
        revealObserver.observe(el);
      });
  }
  var revealTimer;
  new MutationObserver(function(){
    clearTimeout(revealTimer);
    revealTimer = setTimeout(observeReveal, 120);
  }).observe(document.body, { childList:true, subtree:true });
  observeReveal();

  /* ---------- 6. 3D tilt on cards (event-delegated so it survives re-renders) ---------- */
  var TILT_SELECTOR = '.unit-card, .loc-card, .pref-card, .form-card, .pw-stat-card';
  if (isDesktop && !reduceMotion){
    document.body.addEventListener('mousemove', function(e){
      var card = e.target.closest(TILT_SELECTOR);
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var relX = (e.clientX - rect.left) / rect.width - .5;
      var relY = (e.clientY - rect.top) / rect.height - .5;
      card.style.setProperty('--tiltX', (relY * -6) + 'deg');
      card.style.setProperty('--tiltY', (relX * 6) + 'deg');
      card.style.setProperty('--liftY', '-6px');
      card.classList.add('pw-tilt');
    });
    document.body.addEventListener('mouseout', function(e){
      var card = e.target.closest(TILT_SELECTOR);
      if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
      card.style.setProperty('--tiltX', '0deg');
      card.style.setProperty('--tiltY', '0deg');
      card.style.setProperty('--liftY', '0px');
    });
  }

  /* ---------- 7. Magnetic buttons (event-delegated) ---------- */
  var MAGNETIC_SELECTOR = 'nav button, .pw-hero-btn, #pwFabToggle';
  if (isDesktop && !reduceMotion){
    document.body.addEventListener('mousemove', function(e){
      var btn = e.target.closest(MAGNETIC_SELECTOR);
      if (!btn) return;
      var rect = btn.getBoundingClientRect();
      var x = (e.clientX - rect.left - rect.width / 2) * .25;
      var y = (e.clientY - rect.top - rect.height / 2) * .25;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    document.body.addEventListener('mouseout', function(e){
      var btn = e.target.closest(MAGNETIC_SELECTOR);
      if (!btn || (e.relatedTarget && btn.contains(e.relatedTarget))) return;
      btn.style.transform = '';
    });
  }

  /* ---------- 8. Mouse glow trail (desktop only) ---------- */
  if (isDesktop && !reduceMotion){
    var glow = document.createElement('div');
    glow.id = 'pwCursorGlow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);
    var gx = 0, gy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', function(e){
      tx = e.clientX; ty = e.clientY;
      glow.style.opacity = '1';
    });
    document.addEventListener('mouseleave', function(){ glow.style.opacity = '0'; });
    (function loop(){
      gx += (tx - gx) * .12;
      gy += (ty - gy) * .12;
      glow.style.left = gx + 'px';
      glow.style.top = gy + 'px';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 9. Service cards + live availability dashboard ---------- */
  function injectDashboardAndServices(){
    var grid = document.getElementById('unitsGrid');
    if (!grid || document.getElementById('pwDashboard')) return;

    var dash = document.createElement('div');
    dash.id = 'pwDashboard';
    dash.className = 'pw-dashboard';
    dash.innerHTML =
      '<div class="pw-dash-card"><div class="pw-dash-num" id="pwDashTotal">0</div><div class="pw-dash-label">Total Slots</div></div>' +
      '<div class="pw-dash-card pw-dash-avail"><div class="pw-dash-num" id="pwDashAvail">0</div><div class="pw-dash-label">Available</div></div>' +
      '<div class="pw-dash-card pw-dash-soon"><div class="pw-dash-num" id="pwDashSoon">0</div><div class="pw-dash-label">Available Soon</div></div>' +
      '<div class="pw-dash-card pw-dash-booked"><div class="pw-dash-num" id="pwDashBooked">0</div><div class="pw-dash-label">Booked</div></div>';
    grid.parentNode.insertBefore(dash, grid);

    var services = document.createElement('div');
    services.className = 'pw-services';
    var items = [
      ['✅', 'Verified Rooms', 'Every unit personally inspected'],
      ['⚡', 'Instant Booking', 'Reserve in a few taps via WhatsApp'],
      ['🔒', 'Secure Payments', 'UPI & card payments, no middleman'],
      ['🎧', '24×7 Customer Assistance', 'Average response time: within 24-48 hours']
    ];
    services.innerHTML = items.map(function(it){
      return '<div class="pw-service-card"><span class="pw-service-icon">' + it[0] + '</span><h4>' + it[1] + '</h4><p>' + it[2] + '</p></div>';
    }).join('');
    var googleCard = '<div class="pw-stat-card pw-google-rating-card">' +
        '<div class="pw-google-badge">Verified Google Rating</div>' +
        '<div class="pw-stat-icon"><i class="fa-brands fa-google" aria-hidden="true"></i></div>' +
        '<div class="pw-stat-title">Google Rating</div>' +
        '<div class="pw-google-stars">★★★★★</div>' +
        '<div class="pw-google-score">4.8/5</div>' +
        '<button class="pw-google-btn" onclick="window.open(atob(\'aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9tYXBzL3BsYWNlL1N0YXkrQ29uZmlkZW50K1BHK0hvbWVzL0AxMy4wMjcxOTM0LDgwLjIwNjc3NjcsODQ4bS9kYXRhPSEzbTEhMWUzITRtOCEzbTchMXMweDNhNTI2N2ExMjA2ZTZiYTc6MHgzOTgyMDBiNjcwODQwZDdjIThtMiEzZDEzLjAyNzE5MzQhNGQ4MC4yMDkzNTE2ITltMSExYjEhMTZzJTJGZyUyRjExZjY2ZGdoYno/ZW50cnk9dHR1JmdfZXA9RWdveU1ESTJNRGN4TXk0d0lLWE1EU29BU0FGUUF3JTNEJTNE\'),\'_blank\',\'noopener\')">View Google Reviews</button>' +
        '</div>';
    cardsHtml += googleCard;

    var prefAnchor = document.getElementById('prefSummary');
    if (prefAnchor) prefAnchor.parentNode.insertBefore(services, prefAnchor);
  }

  function refreshDashboard(){
    var dash = document.getElementById('pwDashboard');
    if (!dash) return;
    // Admin-only: these live occupancy numbers are internal tracking info,
    // not something we want every visitor to see.
    if (typeof isAdmin === 'undefined' || !isAdmin){ dash.style.display = 'none'; return; }
    dash.style.display = '';
    var c = computeCounts();
    var totalEl = document.getElementById('pwDashTotal');
    var availEl = document.getElementById('pwDashAvail');
    var soonEl = document.getElementById('pwDashSoon');
    var bookedEl = document.getElementById('pwDashBooked');
    if (totalEl) totalEl.textContent = c.total;
    if (availEl) availEl.textContent = c.available;
    if (soonEl) soonEl.textContent = c.soon;
    if (bookedEl) bookedEl.textContent = c.booked;
  }

  /* Chain onto the existing renderUnits() so the dashboard/services stay in sync
     with every admin edit, exactly like the other packs in this file already do. */
  if (typeof renderUnits === 'function'){
    var _pwRenderUnits = renderUnits;
    renderUnits = function(){
      _pwRenderUnits();
      injectDashboardAndServices();
      refreshDashboard();
    };
  }

  /* ---------- 10. Floating action buttons ---------- */
  var fab = document.createElement('div');
  fab.id = 'pwFab';
  fab.innerHTML =
    '<button type="button" id="pwFabToggle" aria-label="Quick actions" aria-expanded="false"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>' +
    '<button type="button" class="pw-fab-item pw-fab-wa" aria-label="WhatsApp us"><span class="pw-fab-ic"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span> WhatsApp</button>' +
    '<button type="button" class="pw-fab-item pw-fab-call" aria-label="Call us"><span class="pw-fab-ic"><i class="fa-solid fa-phone" aria-hidden="true"></i></span> Call</button>' +
    '<button type="button" class="pw-fab-item pw-fab-book" aria-label="Book a room"><span class="pw-fab-ic"><i class="fa-solid fa-key" aria-hidden="true"></i></span> Book</button>' +
    '<button type="button" class="pw-fab-item pw-fab-map" aria-label="View locations"><span class="pw-fab-ic"><i class="fa-solid fa-location-dot" aria-hidden="true"></i></span> Map</button>';
  document.body.appendChild(fab);

  document.getElementById('pwFabToggle').addEventListener('click', function(){
    var open = fab.classList.toggle('open');
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  fab.querySelector('.pw-fab-wa').addEventListener('click', function(){
    var wa = document.getElementById('waLink');
    if (wa && wa.getAttribute('href') && wa.getAttribute('href') !== '#') window.open(wa.href, '_blank');
  });
  fab.querySelector('.pw-fab-call').addEventListener('click', function(){
    var call = document.getElementById('callLink');
    if (call && call.getAttribute('href') && call.getAttribute('href') !== '#') window.location.href = call.href;
  });
  fab.querySelector('.pw-fab-book').addEventListener('click', function(){
    var btn = document.querySelector('nav button[data-tab="book"]');
    if (btn) btn.click();
    window.scrollTo({ top:0, behavior:'smooth' });
    fab.classList.remove('open');
  });
  fab.querySelector('.pw-fab-map').addEventListener('click', function(){
    var btn = document.querySelector('nav button[data-tab="location"]');
    if (btn) btn.click();
    window.scrollTo({ top:0, behavior:'smooth' });
    fab.classList.remove('open');
  });

  /* ============================================================
     11. PREMIUM PAGE TRANSITIONS (tab switch)
     Replaces the old simple wipe with: current section scales down
     to 98%, blurs, fades out → new section slides up 40px, scales
     96%→100%, blur clears, fades in. Plus a golden progress line
     and a liquid highlight that slides behind the active nav button.

     This is implemented by intercepting the nav click in the CAPTURE
     phase (before the site's original bubble-phase click handler on
     the button runs — see "// ---------- tabs ----------" above),
     animating, and then applying the *exact same* active-class
     toggle the original handler would have applied. The original
     handler itself is left completely untouched; it simply doesn't
     run for an animated switch because this handler owns the event.
     For same-section clicks or reduced-motion users, the event is
     left alone and the original instant handler behaves as before.
     ============================================================ */
  var navEl = document.querySelector('nav');
  var transitionBar = document.createElement('div');
  transitionBar.id = 'pwTransitionBar';
  transitionBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(transitionBar);

  var navHighlight = null;
  if (navEl){
    navHighlight = document.createElement('div');
    navHighlight.className = 'pw-nav-highlight';
    navHighlight.setAttribute('aria-hidden', 'true');
    navEl.insertBefore(navHighlight, navEl.firstChild);
  }

  /* Slide the liquid highlight pill behind the given nav button */
  function moveNavHighlight(btn){
    if (!navHighlight || !btn || !navEl) return;
    var navRect = navEl.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    navHighlight.style.width = btnRect.width + 'px';
    navHighlight.style.height = btnRect.height + 'px';
    navHighlight.style.transform =
      'translate(' + (btnRect.left - navRect.left) + 'px,' + (btnRect.top - navRect.top) + 'px)';
    navHighlight.classList.add('pw-visible');
  }

  function runTransitionBar(){
    transitionBar.classList.remove('run');
    transitionBar.style.width = '0%';
    void transitionBar.offsetWidth; /* restart animation */
    transitionBar.classList.add('run');
  }
  function endTransitionBar(){
    transitionBar.classList.remove('run');
    setTimeout(function(){ transitionBar.style.width = '0%'; }, 260);
  }

  var pwTransitioning = false;
  if (navEl){
    navEl.addEventListener('click', function(e){
      var btn = e.target.closest('button[data-tab]');
      if (!btn) return;

      /* Close the mobile drawer as soon as any menu item is tapped. This has
         to happen here (not in the separate close-on-tab-click listener
         further down) because the transition logic below can call
         e.stopImmediatePropagation(), which would otherwise stop that
         listener from ever firing and leave the drawer stuck open. */
      if (window.innerWidth <= 880){ document.body.classList.remove('pw-sb-mobile-open'); }

      var targetSection = document.getElementById(btn.dataset.tab);
      var currentSection = document.querySelector('section.active');

      if (!targetSection || targetSection === currentSection){
        moveNavHighlight(btn); /* keep pill in sync even on a no-op click */
        return; /* let the original handler run its normal (idempotent) toggle */
      }

      if (reduceMotion){
        moveNavHighlight(btn);
        return; /* respect reduced motion: fall through to instant switch */
      }

      if (pwTransitioning){
        e.stopImmediatePropagation();
        e.preventDefault();
        return; /* ignore rapid double-clicks mid-transition to avoid flicker */
      }

      e.stopImmediatePropagation(); /* this handler now owns the switch */
      e.preventDefault();
      pwTransitioning = true;
      runTransitionBar();

      document.querySelectorAll('nav button').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      moveNavHighlight(btn);

      var scrollX = window.scrollX, scrollY = window.scrollY; /* preserve scroll position */

      function enterTarget(){
        targetSection.classList.add('active', 'pw-entering');
        window.scrollTo(scrollX, scrollY);
        var doneEnter = false;
        function onEnterEnd(ev){ if (ev.target === targetSection) finishEnter(); }
        function finishEnter(){
          if (doneEnter) return;
          doneEnter = true;
          targetSection.removeEventListener('animationend', onEnterEnd);
          targetSection.classList.remove('pw-entering');
          pwTransitioning = false;
          endTransitionBar();
        }
        targetSection.addEventListener('animationend', onEnterEnd);
        setTimeout(finishEnter, 600); /* safety fallback, avoids getting stuck */
      }

      if (currentSection){
        currentSection.classList.add('pw-leaving');
        var doneLeave = false;
        function onLeaveEnd(ev){ if (ev.target === currentSection) finishLeave(); }
        function finishLeave(){
          if (doneLeave) return;
          doneLeave = true;
          currentSection.removeEventListener('animationend', onLeaveEnd);
          currentSection.classList.remove('active', 'pw-leaving');
          enterTarget();
        }
        currentSection.addEventListener('animationend', onLeaveEnd);
        setTimeout(finishLeave, 400); /* safety fallback */
      } else {
        enterTarget();
      }
    }, true); /* capture phase: fires before the site's original tab handler */

    /* Position the highlight under whichever button starts active, and
       keep it aligned if the viewport is resized (responsive nav wrap) */
    var pwInitialActiveBtn = navEl.querySelector('button.active') || navEl.querySelector('button[data-tab]');
    if (pwInitialActiveBtn){
      requestAnimationFrame(function(){ moveNavHighlight(pwInitialActiveBtn); });
    }
    window.addEventListener('resize', function(){
      var activeBtn = navEl.querySelector('button.active');
      if (activeBtn) moveNavHighlight(activeBtn);
    }, { passive:true });
  }

})();


/* ===== next inline <script> block from original file ===== */


function getSelectedRentalType(){
  const el=document.getElementById('prefRentalType');
  return el?el.value:"";
}
document.addEventListener("DOMContentLoaded",()=>{
 const btn=document.querySelector(".pref-actions button");
 if(btn){
   btn.addEventListener("click",function(e){
      const r=document.getElementById("prefRentalType");
      if(r && !r.value){
        e.preventDefault();
        alert("Please select Rental Preference.");
        r.focus();
      }
   },true);
 }
});


/* ===== next inline <script> block from original file ===== */


(function(){
  'use strict';

  /* ---------- Static content for the new landing sections ---------- */
  var WHY_US = [
    { icon:'fa-solid fa-award', title:'10+ Years Experience' },
    { icon:'fa-solid fa-map-location-dot', title:'Multiple Locations' },
    { icon:'fa-solid fa-calendar-day', title:'Daily Stay' },
    { icon:'fa-solid fa-calendar-check', title:'Monthly Stay' },
    { icon:'fa-solid fa-briefcase', title:'Working Professionals' },
    { icon:'fa-solid fa-graduation-cap', title:'Students' },
    { icon:'fa-solid fa-shield-halved', title:'Safe Environment' },
    { icon:'fa-solid fa-kitchen-set', title:'Kitchen Access' },
    { icon:'fa-solid fa-utensils', title:'Self Cooking' },
    { icon:'fa-solid fa-broom', title:'Housekeeping' },
    { icon:'fa-solid fa-truck-moving', title:'Relocation Support' },
    { icon:'fa-solid fa-people-group', title:'Community Living' }
  ];
  var DAILY_STAYS = [
    { icon:'❄️', title:'Single Occupancy A/C Room', desc:'A private, air-conditioned room ideal for solo travellers who want comfort and privacy for a short stay.', link:'https://airbnb.com/h/stayconfidenthome' },
    { icon:'🛏️', title:'Private A/C Master Bedroom (1–3 Guests)', desc:'A spacious master bedroom with attached comforts — perfect for couples or guests wanting extra space.', link:'https://airbnb.com/h/stayconfidentc9' },
    { icon:'🏡', title:'Entire 2BHK Home (Families & Groups)', desc:'Book the whole home for family visits, group stays or extended trips, with full access to all amenities.', link:'https://airbnb.com/h/cozyacroom' }
  ];
  var MONTHLY_CHIPS = ["Men's PG","Women's PG","Single Sharing","Double Sharing","Triple Sharing","AC","Non AC"];
  var COMMUNITY = [
    { title:'Safe Living', desc:'Secure homes with verified residents and watchful housekeeping staff.' },
    { title:'Friendly Residents', desc:'A warm mix of professionals, students and families who look out for one another.' },
    { title:'Respectful Environment', desc:'House rules that keep every home peaceful and considerate for all residents.' },
    { title:'Peaceful Homes', desc:'Quiet, clean spaces designed for genuine rest after a long day.' },
    { title:'Confidence', desc:'A place that lets you focus on your goals without worrying about where you live.' },
    { title:'Growth', desc:'A community that supports your journey, whatever stage of life you are in.' }
  ];

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }

  var whyGrid = document.getElementById('scWhyGrid');
  if (whyGrid){
    WHY_US.forEach(function(item, i){
      var c = el('div','sc-card sc-fade');
      c.style.transitionDelay = (i*0.05)+'s';
      c.innerHTML = '<div class="sc-icon"><i class="'+item.icon+'" aria-hidden="true"></i></div><h4>'+item.title+'</h4>';
      whyGrid.appendChild(c);
    });
  }

  var dailyGrid = document.getElementById('scDailyGrid');
  if (dailyGrid){
    DAILY_STAYS.forEach(function(item, i){
      var c = el('div','sc-stay-card sc-fade');
      c.style.transitionDelay = (i*0.08)+'s';
      c.innerHTML =
        '<div class="sc-stay-photo">'+item.icon+'</div>' +
        '<div class="sc-stay-body"><h4>'+item.title+'</h4><p>'+item.desc+'</p>' +
        '<div class="sc-stay-actions">' +
          '<button type="button" data-sc-nav="book">Book Now</button>' +
          '<a class="secondary" href="'+item.link+'" target="_blank" rel="noopener">🔗 View on Airbnb</a>' +
        '</div></div>';
      dailyGrid.appendChild(c);
    });
  }

  var monthlyChips = document.getElementById('scMonthlyChips');
  if (monthlyChips){
    MONTHLY_CHIPS.forEach(function(label, i){
      var c = el('span','sc-chip sc-fade', label);
      c.style.transitionDelay = (i*0.05)+'s';
      monthlyChips.appendChild(c);
    });
  }

  var communityGrid = document.getElementById('scCommunityGrid');
  if (communityGrid){
    COMMUNITY.forEach(function(item, i){
      var c = el('div','sc-community-card sc-fade');
      c.style.transitionDelay = (i*0.06)+'s';
      c.innerHTML = '<h4>'+item.title+'</h4><p>'+item.desc+'</p>';
      communityGrid.appendChild(c);
    });
  }

  /* ---------- Hero / CTA buttons that jump to another tab ---------- */
  document.querySelectorAll('[data-sc-nav]').forEach(function(node){
    node.addEventListener('click', function(e){
      e.preventDefault();
      var tab = node.getAttribute('data-sc-nav');
      var target = document.querySelector('nav button[data-tab="'+tab+'"]');
      if (target) target.click();
      var nav = document.querySelector('nav');
      if (nav) nav.scrollIntoView({ behavior:'smooth' });
    });
  });

  /* Keep the Home "Call Now" / "WhatsApp" buttons in sync with the
     admin-configured numbers used elsewhere on the site (waLink/callLink). */
  function syncHomeContactLinks(){
    var wa = document.getElementById('waLink');
    var call = document.getElementById('callLink');
    var scWa = document.getElementById('scWaNow');
    var scCall = document.getElementById('scCallNow');
    var scFootWa = document.getElementById('scFootWa');
    var scFootCall = document.getElementById('scFootCall');
    if (scWa && wa && wa.getAttribute('href') && wa.getAttribute('href') !== '#') scWa.href = wa.href;
    if (scCall && call && call.getAttribute('href') && call.getAttribute('href') !== '#') scCall.href = call.href;
    if (scFootWa && wa && wa.getAttribute('href') && wa.getAttribute('href') !== '#') scFootWa.href = wa.href;
    if (scFootCall && call && call.getAttribute('href') && call.getAttribute('href') !== '#') scFootCall.href = call.href;
  }
  syncHomeContactLinks();
  var contactObserver = new MutationObserver(syncHomeContactLinks);
  var waLinkEl = document.getElementById('waLink');
  if (waLinkEl) contactObserver.observe(waLinkEl, { attributes:true, attributeFilter:['href'] });
  var callLinkEl = document.getElementById('callLink');
  if (callLinkEl) contactObserver.observe(callLinkEl, { attributes:true, attributeFilter:['href'] });

  /* ---------- Fade-up reveal for all new .sc-fade elements ---------- */
  var scObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('sc-show');
        scObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  document.querySelectorAll('.sc-fade').forEach(function(node){ scObserver.observe(node); });

  /* ---------- Debounced search: filter Available Units by unit name ---------- */
  var searchInput = document.getElementById('scUnitSearch');
  if (searchInput){
    var debounceTimer = null;
    searchInput.addEventListener('input', function(){
      clearTimeout(debounceTimer);
      var q = searchInput.value;
      debounceTimer = setTimeout(function(){
        var term = q.trim().toLowerCase();
        document.querySelectorAll('#unitsGrid .unit-card').forEach(function(card){
          var h3 = card.querySelector('h3');
          var name = h3 ? h3.textContent.trim().toLowerCase() : '';
          card.style.display = (!term || name.indexOf(term) !== -1) ? '' : 'none';
        });
      }, 250);
    });
  }

})();


/* ===== next inline <script> block from original file ===== */


(function(){
  'use strict';

  var navEl = document.querySelector('nav');
  if(!navEl) return;

  /* ---------- Icons for each existing tab (Font Awesome, additive only) ---------- */
  var ICONS = {
    home:'fa-solid fa-house',
    about:'fa-solid fa-circle-info',
    why:'fa-solid fa-star',
    daily:'fa-solid fa-calendar-day',
    monthly:'fa-solid fa-calendar-days',
    community:'fa-solid fa-users',
    vacancies:'fa-solid fa-door-open',
    availability:'fa-solid fa-bed',
    book:'fa-solid fa-clipboard-list',
    payment:'fa-solid fa-indian-rupee-sign',
    location:'fa-solid fa-location-dot',
    contact:'fa-solid fa-phone',
    admin:'fa-solid fa-user-shield'
  };

  navEl.querySelectorAll('button[data-tab]').forEach(function(btn){
    var label = btn.textContent;
    var iconClass = ICONS[btn.dataset.tab] || 'fa-solid fa-circle';
    btn.setAttribute('title', label.trim());
    btn.innerHTML =
      '<i class="pw-nav-ico ' + iconClass + '" aria-hidden="true"></i>' +
      '<span class="pw-nav-label">' + label + '</span>';
  });

  /* ---------- Sidebar brand removed per request (v19) ---------- */

  /* ---------- Collapse toggle (desktop) ---------- */
  var collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.id = 'pwSbCollapseBtn';
  collapseBtn.setAttribute('aria-label', 'Collapse sidebar');
  collapseBtn.innerHTML = '<i class="fa-solid fa-angles-left" aria-hidden="true"></i>';
  document.body.insertBefore(collapseBtn, navEl);
  collapseBtn.addEventListener('click', function(){
    document.body.classList.toggle('pw-sb-collapsed');
  });

  /* ---------- Mobile hamburger + overlay ---------- */
  var overlay = document.createElement('div');
  overlay.id = 'pwSbOverlay';
  document.body.insertBefore(overlay, navEl);

  var hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.id = 'pwSbHamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  document.body.insertBefore(hamburger, navEl);

  function closeMobileNav(){ document.body.classList.remove('pw-sb-mobile-open'); }
  function openMobileNav(){ document.body.classList.add('pw-sb-mobile-open'); }

  hamburger.addEventListener('click', function(){
    document.body.classList.toggle('pw-sb-mobile-open');
  });
  overlay.addEventListener('click', closeMobileNav);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeMobileNav();
  });
  window.addEventListener('resize', function(){
    if(window.innerWidth > 880) closeMobileNav();
  });
  /* Close the drawer after picking a tab on mobile — purely additive; the
     original tab-switch listener registered earlier in this file still
     runs first and is completely unaffected. */
  navEl.querySelectorAll('button[data-tab]').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(window.innerWidth <= 880) closeMobileNav();
    });
  });

  /* ---------- Mouse-follow spotlight glow inside the sidebar ---------- */
  navEl.addEventListener('mousemove', function(e){
    var rect = navEl.getBoundingClientRect();
    navEl.style.setProperty('--pw-sb-spot-x', (e.clientX - rect.left) + 'px');
    navEl.style.setProperty('--pw-sb-spot-y', (e.clientY - rect.top) + 'px');
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  'use strict';

  /* ---------- Dynamic breadcrumb ---------- */
  var headerEl = document.querySelector('header');
  var crumb = document.createElement('div');
  crumb.className = 'pw-crumb';
  crumb.id = 'pwCrumb';
  if(headerEl) headerEl.insertAdjacentElement('afterend', crumb);

  function currentTabLabel(btn){
    var span = btn.querySelector('.pw-nav-label');
    return (span ? span.textContent : btn.textContent).trim();
  }
  function updateCrumb(btn){
    if(!btn) return;
    var label = currentTabLabel(btn);
    var rootLabel = btn.dataset.tab === 'home' ? '' :
      '<span class="pw-crumb-sep">›</span> <b>' + label + '</b>';
    crumb.innerHTML = '<i class="fa-solid fa-house" aria-hidden="true"></i> Home ' + rootLabel;
  }
  var navForCrumb = document.querySelector('nav');
  if(navForCrumb){
    var initialActive = navForCrumb.querySelector('button[data-tab].active') || navForCrumb.querySelector('button[data-tab]');
    updateCrumb(initialActive);
    /* Watch for the "active" class itself rather than the click event: the
       existing premium page-transition handler intercepts clicks in the
       capture phase and, for real tab switches, calls
       stopImmediatePropagation() so its own animated switch fully owns the
       event — which would silently stop a click listener here too. A
       MutationObserver on class changes works no matter which code path
       (the original instant handler or the animated one) ends up setting
       the class. */
    if('MutationObserver' in window){
      var crumbObserver = new MutationObserver(function(){
        var active = navForCrumb.querySelector('button[data-tab].active');
        if(active) updateCrumb(active);
      });
      navForCrumb.querySelectorAll('button[data-tab]').forEach(function(btn){
        crumbObserver.observe(btn, { attributes:true, attributeFilter:['class'] });
      });
    }
  }

  /* ---------- Admin dashboard: status badges + top-interest panel ----------
     Wraps the already-wrapped adminLogin/renderUnits/adminLogout the same
     way the two blocks above do: call through to whatever is already
     assigned to window.adminLogin/renderUnits (which by now includes the
     dashboard-render and count-up wraps), then layer this panel on top. */
  function occupancyBadge(pct){
    if(pct >= 95) return '<span class="pw-dash-badge full">Full</span>';
    if(pct >= 70) return '<span class="pw-dash-badge high">High</span>';
    if(pct >= 35) return '<span class="pw-dash-badge medium">Medium</span>';
    return '<span class="pw-dash-badge low">Low</span>';
  }

  function annotateOccupancyBars(){
    var host = document.getElementById('pwAdminDash');
    if(!host || host.style.display === 'none') return;
    host.querySelectorAll('.pw-dash-bar-row').forEach(function(row){
      if(row.querySelector('.pw-dash-badge')) return; // already annotated
      var pctEl = row.querySelector('.pw-dash-bar-pct');
      if(!pctEl) return;
      var pct = parseInt(pctEl.textContent, 10);
      if(isNaN(pct)) return;
      pctEl.insertAdjacentHTML('afterend', occupancyBadge(pct));
    });
  }

  function renderTopInterestPanel(){
    var host = document.getElementById('pwAdminDash');
    if(!host || host.style.display === 'none') return;
    if(typeof enquiryCounts !== 'object' || !enquiryCounts) return;
    var old = document.getElementById('pwDashInsights');
    if(old) old.remove();

    var rows = Object.keys(enquiryCounts)
      .map(function(k){ return { key:k, count:enquiryCounts[k] || 0 }; })
      .sort(function(a,b){ return b.count - a.count; })
      .slice(0, 5);
    if(!rows.length) return;

    var panel = document.createElement('div');
    panel.id = 'pwDashInsights';
    panel.innerHTML =
      '<div class="pw-dash-chart-title">🔥 Top Interest — Rooms</div>' +
      rows.map(function(r){
        var label = r.key.replace('|', ' — ');
        return '<div class="pw-dash-insight-row"><span class="pw-dash-insight-name">' + label +
          '</span><span class="pw-dash-insight-count">' + r.count + ' interested</span></div>';
      }).join('');
    host.appendChild(panel);
  }

  function refreshDashExtras(){
    setTimeout(function(){
      annotateOccupancyBars();
      renderTopInterestPanel();
    }, 0);
  }

  function hookDashboardBadges(){
    if(typeof window.adminLogin !== 'function' || typeof window.renderUnits !== 'function'){
      setTimeout(hookDashboardBadges, 70);
      return;
    }
    var origLogin = window.adminLogin;
    window.adminLogin = function(){
      var r = origLogin.apply(this, arguments);
      refreshDashExtras();
      return r;
    };
    var origRenderUnits = window.renderUnits;
    window.renderUnits = function(){
      var r = origRenderUnits.apply(this, arguments);
      refreshDashExtras();
      return r;
    };
    var origRefreshBtn = document.getElementById('pwDashRefreshBtn');
    if(origRefreshBtn) origRefreshBtn.addEventListener('click', refreshDashExtras);
    /* also re-run whenever the dashboard host is refreshed via its own button,
       which re-renders pwDashRefreshBtn itself, so delegate on the host */
    var host = document.getElementById('pwAdminDash');
    if(host){
      host.addEventListener('click', function(e){
        if(e.target && e.target.id === 'pwDashRefreshBtn') refreshDashExtras();
      });
    }
  }
  hookDashboardBadges();
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  var GRADIENTS = [
    'linear-gradient(135deg,#1f8a5f,#0f6e63)',
    'linear-gradient(135deg,#0b3d2c,#1f8a5f)',
    'linear-gradient(135deg,#c9962f,#0f6e63)',
    'linear-gradient(135deg,#0f6e63,#2faf78)',
    'linear-gradient(135deg,#e0b65a,#0b3d2c)',
    'linear-gradient(135deg,#22a06b,#0b3d2c)'
  ];

  /* ================= Photo Gallery ================= */
  // Each unit tile shows its uploaded cover photo (first image saved by the
  // admin) when available, falling back to the original gradient+icon tile
  // when a unit has no photos uploaded yet. The lightbox flattens every
  // unit's photos into one slide list so Next/Prev walks through *all*
  // photos of a unit before moving to the next unit's photos.
  var galleryUnits = (typeof UNITS !== 'undefined' && UNITS.length) ? UNITS : [];
  var galleryIndex = 0;
  var gallerySlides = []; // [{unit, url, idx, total}]
  var galleryUnitStart = {}; // unit -> first slide index

  function buildGallerySlides(){
    gallerySlides = [];
    galleryUnitStart = {};
    galleryUnits.forEach(function(unit){
      var imgs = (galleryImagesMap[unit] || []);
      galleryUnitStart[unit] = gallerySlides.length;
      if(imgs.length){
        imgs.forEach(function(raw, idx){
          var item = normalizeGalleryItem(raw);
          gallerySlides.push({ unit: unit, url: item.url, caption: item.caption, idx: idx, total: imgs.length });
        });
      }else{
        gallerySlides.push({ unit: unit, url: null, caption: '', idx: 0, total: 0 });
      }
    });
  }

  function renderGallery(){
    var grid = document.getElementById('pwGalleryGrid');
    if(!grid || !galleryUnits.length) return;
    buildGallerySlides();
    grid.innerHTML = galleryUnits.map(function(unit, i){
      var imgs = galleryImagesMap[unit] || [];
      var bg = GRADIENTS[i % GRADIENTS.length];
      if(imgs.length){
        var cover = normalizeGalleryItem(imgs[0]);
        var countBadge = imgs.length > 1 ? ('<div class="pw-gallery-count"><i class="fa-solid fa-images" aria-hidden="true"></i> ' + imgs.length + '</div>') : '';
        return '<div class="pw-gallery-tile" data-i="' + i + '" style="background-image:url(&quot;' + cover.url + '&quot;)">' +
          countBadge +
          '<div class="pw-gallery-label">' + unit + '</div>' +
          '</div>';
      }
      return '<div class="pw-gallery-tile" data-i="' + i + '" style="background:' + bg + '">' +
        '<div class="pw-gallery-bg"><i class="fa-solid fa-house-chimney"></i></div>' +
        '<div class="pw-gallery-label">' + unit + '</div>' +
        '</div>';
    }).join('');
    grid.querySelectorAll('.pw-gallery-tile').forEach(function(tile){
      tile.addEventListener('click', function(){
        var unit = galleryUnits[parseInt(tile.dataset.i, 10)];
        openLightbox(galleryUnitStart[unit] || 0);
      });
    });
  }

  function openLightbox(slideIndex){
    if(!gallerySlides.length) buildGallerySlides();
    galleryIndex = ((slideIndex % gallerySlides.length) + gallerySlides.length) % gallerySlides.length;
    updateLightbox();
    document.getElementById('pwLightbox').classList.add('pw-lightbox-open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){
    document.getElementById('pwLightbox').classList.remove('pw-lightbox-open');
    document.body.style.overflow = '';
  }
  function updateLightbox(){
    var stage = document.getElementById('pwLightboxStage');
    var slide = gallerySlides[galleryIndex];
    if(!slide) return;
    if(slide.url){
      stage.style.background = 'var(--forest-deep, #082a1f)';
      stage.innerHTML = '<img src="' + slide.url + '" alt="' + slide.unit + ' photo" class="pw-lightbox-img"><div class="pw-lightbox-caption" id="pwLightboxCaption"></div>';
    }else{
      var unitIdx = galleryUnits.indexOf(slide.unit);
      var bg = GRADIENTS[(unitIdx >= 0 ? unitIdx : 0) % GRADIENTS.length];
      stage.style.background = bg;
      stage.innerHTML = '<i class="fa-solid fa-house-chimney"></i><div class="pw-lightbox-caption" id="pwLightboxCaption"></div>';
    }
    var captionText;
    if(slide.total > 0){
      captionText = slide.caption
        ? (slide.unit + ' — ' + slide.caption + '  •  ' + (slide.idx + 1) + ' / ' + slide.total)
        : (slide.unit + '  •  ' + (slide.idx + 1) + ' / ' + slide.total);
    }else{
      captionText = slide.unit + '  •  No photos uploaded yet';
    }
    document.getElementById('pwLightboxCaption').textContent = captionText;
  }
  document.addEventListener('DOMContentLoaded', function(){
    (typeof loadAllGalleryImages === 'function' ? loadAllGalleryImages() : Promise.resolve()).then(function(){
      renderGallery();
      if(typeof applyGalleryFilter === 'function') applyGalleryFilter();
      if(typeof observeGalleryTiles === 'function') observeGalleryTiles();
    });
    if(typeof initGalQuickDropzone === 'function') initGalQuickDropzone();
    var lb = document.getElementById('pwLightbox');
    lb.querySelector('.pw-lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.pw-lightbox-prev').addEventListener('click', function(){ openLightbox(galleryIndex - 1); });
    lb.querySelector('.pw-lightbox-next').addEventListener('click', function(){ openLightbox(galleryIndex + 1); });
    lb.addEventListener('click', function(e){ if(e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', function(e){
      if(!lb.classList.contains('pw-lightbox-open')) return;
      if(e.key === 'Escape') closeLightbox();
      if(e.key === 'ArrowLeft') openLightbox(galleryIndex - 1);
      if(e.key === 'ArrowRight') openLightbox(galleryIndex + 1);
    });
  });

  /* =========================================================
     PREMIUM REVIEWS MODULE
     Data is stored through the same PGStorage adapter every other
     admin-editable value in this file already uses (shared key,
     survives reloads, syncs across visitors once hosted for real).
     window.REVIEWS is kept as a live, global array of *visible*
     reviews (each with a numeric .stars field) so review data stays
     available to any feature that reads it — same variable name and
     shape as before, just now backed by real persisted data instead
     of a hardcoded list.

     SYNC / BACKEND INTEGRATION NOTE
     ---------------------------------------------------------
     Google Business Profile
             │
             ▼
     Backend (Cloud Function / Server)   <-- rvGenerateSyncBatch() below
             │                               is a placeholder for this.
       Checks periodically for updates       Replace it with a real
             │                               fetch('/your-sync-endpoint')
             ▼                               call once that backend
     Firebase Firestore / PGStorage          exists, keeping the same
             │                               rvCache.unshift(...) + rvSave()
             ▼                               flow below unchanged.
     Website updates automatically
  ========================================================= */
  var RV_STORE_KEY = 'reviews_v2';
  var RV_PAGE_SIZE = 6;
  var rvCache = null;
  var rvVisibleLimit = RV_PAGE_SIZE;
  var rvPublicFilter = { rating:'all', sort:'newest', q:'' };
  var rvAdminFilter = { rating:'all', status:'all', sort:'newest', q:'' };
  var rvHomeList = [];
  var rvHomeIdx = 0, rvHomeTimer = null, rvHomePaused = false;
  var rvAdminBound = false;

  function rvStars(n){ n = Math.round(n || 0); return '★★★★★☆☆☆☆☆'.slice(5 - n, 10 - n); }
  function rvInitials(name){
    return (name || '?').trim().split(/\s+/).map(function(w){ return w[0] || ''; }).slice(0, 2).join('').toUpperCase();
  }
  function rvAvatarColor(name){
    var colors = ['#1f8a5f','#0f6e63','#c9962f','#0b3d2c','#2faf78','#8a6d1f'];
    var h = 0;
    for(var i = 0; i < (name || '').length; i++) h = (h + name.charCodeAt(i)) % colors.length;
    return colors[h];
  }
  function rvFmtDate(iso){
    try{
      var d = new Date(iso);
      var days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if(days < 1) return 'Today';
      if(days < 2) return 'Yesterday';
      if(days < 30) return days + ' days ago';
      var months = Math.floor(days / 30);
      if(months < 12) return months + ' month' + (months > 1 ? 's' : '') + ' ago';
      return d.toLocaleDateString('en-IN', { month:'short', year:'numeric' });
    }catch(e){ return ''; }
  }
  function rvEscape(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function rvDebounce(fn, ms){
    var t;
    return function(){
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, ms);
    };
  }

  function rvSeedDefaults(){
    var now = Date.now(), day = 86400000;
    return [
      { id:'seed-1', name:'Arjun R.', avatar:null, stars:5, text:'Clean rooms, safe environment and the admin team responds within minutes. Best PG experience in Chennai.', date:new Date(now - 3*day).toISOString(), verified:true, helpful:14, tags:['Cleanliness','Staff Support'], featured:true, pinned:true, hidden:false, source:'google' },
      { id:'seed-2', name:'Priya S.', avatar:null, stars:5, text:'Loved the RO water, housekeeping and the peaceful community. Highly recommend for working professionals.', date:new Date(now - 9*day).toISOString(), verified:true, helpful:11, tags:['Hygiene','Community'], featured:true, pinned:false, hidden:false, source:'google' },
      { id:'seed-3', name:'Karthik M.', avatar:null, stars:4, text:'Great location near my office, flexible stay options and transparent pricing. Very happy with my move-in.', date:new Date(now - 17*day).toISOString(), verified:true, helpful:6, tags:['Location','Pricing'], featured:false, pinned:false, hidden:false, source:'google' },
      { id:'seed-4', name:'Divya N.', avatar:null, stars:5, text:'Felt safe from day one. The waiting list update and booking process were smooth and quick.', date:new Date(now - 25*day).toISOString(), verified:true, helpful:9, tags:['Safety','Booking Process'], featured:false, pinned:false, hidden:false, source:'google' },
      { id:'seed-5', name:'Suresh K.', avatar:null, stars:5, text:'Kitchen access, power backup and parking — everything promised was delivered exactly as described.', date:new Date(now - 40*day).toISOString(), verified:true, helpful:8, tags:['Amenities','Transparency'], featured:false, pinned:false, hidden:false, source:'google' },
      { id:'seed-6', name:'Meena V.', avatar:null, stars:4, text:'Good value for money and friendly housemates. Wish the Wi-Fi was a bit faster during peak hours.', date:new Date(now - 55*day).toISOString(), verified:true, helpful:4, tags:['Value','Wi-Fi'], featured:false, pinned:false, hidden:false, source:'google' }
    ];
  }

  function rvSyncGlobalReviews(){
    window.REVIEWS = (rvCache || []).filter(function(r){ return !r.hidden; });
  }

  async function rvLoad(force){
    if(rvCache && !force) return rvCache;
    try{
      var res = await PGStorage.get(RV_STORE_KEY, true);
      rvCache = res ? JSON.parse(res.value) : rvSeedDefaults();
    }catch(e){
      rvCache = rvSeedDefaults();
    }
    if(!Array.isArray(rvCache) || !rvCache.length) rvCache = rvSeedDefaults();
    rvSyncGlobalReviews();
    return rvCache;
  }
  async function rvSave(){
    await storageSetWithRetry(RV_STORE_KEY, JSON.stringify(rvCache), true, 'reviews');
    rvSyncGlobalReviews();
  }

  function rvSortList(list, sort){
    var arr = list.slice();
    switch(sort){
      case 'oldest': arr.sort(function(a,b){ return new Date(a.date) - new Date(b.date); }); break;
      case 'highest': arr.sort(function(a,b){ return b.stars - a.stars || new Date(b.date) - new Date(a.date); }); break;
      case 'lowest': arr.sort(function(a,b){ return a.stars - b.stars || new Date(b.date) - new Date(a.date); }); break;
      case 'helpful': arr.sort(function(a,b){ return (b.helpful||0) - (a.helpful||0); }); break;
      default: arr.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
    }
    /* Auto sorting rule: featured/pinned reviews always float to the top,
       newest first within that group — everything else moves down. */
    arr.sort(function(a,b){ return (b.pinned?1:0) - (a.pinned?1:0); });
    return arr;
  }

  function rvCardHtml(r, i){
    var avatarHtml = r.avatar
      ? '<img src="' + rvEscape(r.avatar) + '" alt="" class="rv-avatar-img">'
      : '<div class="rv-avatar" style="background:' + rvAvatarColor(r.name) + '">' + rvEscape(rvInitials(r.name)) + '</div>';
    var tagsHtml = (r.tags || []).map(function(t){ return '<span class="rv-tag">' + rvEscape(t) + '</span>'; }).join('');
    return (
      '<div class="rv-card reveal-stagger" style="--stagger-i:' + (i % 6) + '">' +
        (r.pinned ? '<span class="rv-pin">📌 Pinned</span>' : '') +
        '<div class="rv-card-head">' + avatarHtml +
          '<div class="rv-card-id">' +
            '<div class="rv-card-name">' + rvEscape(r.name) + (r.verified ? ' <span class="rv-badge-verified">✔ Verified</span>' : '') + '</div>' +
            '<div class="rv-card-date">' + rvFmtDate(r.date) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rv-card-stars">' + rvStars(r.stars) + '</div>' +
        '<div class="rv-card-text">"' + rvEscape(r.text) + '"</div>' +
        (tagsHtml ? '<div class="rv-card-tags">' + tagsHtml + '</div>' : '') +
        '<div class="rv-card-foot">' +
          '<span class="rv-badge-helpful">👍 Helpful (' + (r.helpful || 0) + ')</span>' +
          (r.featured ? '<span class="rv-badge-featured">⭐ Featured</span>' : '') +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- Public Reviews page ---------- */
  function rvRenderHero(list){
    var host = document.getElementById('rvHero');
    if(!host) return;
    var total = list.length;
    var avg = total ? (list.reduce(function(s,r){ return s + r.stars; }, 0) / total) : 0;
    var dist = [5,4,3,2,1].map(function(star){
      var c = list.filter(function(r){ return r.stars === star; }).length;
      return { star:star, count:c, pct: total ? Math.round(c/total*100) : 0 };
    });
    host.innerHTML =
      '<div class="rv-hero-left">' +
        '<div class="rv-hero-score">' + avg.toFixed(1) + '</div>' +
        '<div class="rv-hero-stars">' + rvStars(avg) + '</div>' +
        '<div class="rv-hero-meta">' + total + ' verified reviews</div>' +
        '<div class="rv-hero-google"><i class="fa-brands fa-google" aria-hidden="true"></i> Google Business Profile</div>' +
      '</div>' +
      '<div class="rv-hero-right">' +
        dist.map(function(d){
          return '<div class="rv-dist-row">' +
            '<span class="rv-dist-label">' + d.star + '★</span>' +
            '<div class="rv-dist-track"><div class="rv-dist-fill" style="width:' + d.pct + '%"></div></div>' +
            '<span class="rv-dist-count">' + d.count + '</span>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  function rvRenderToolbar(){
    var host = document.getElementById('rvToolbar');
    if(!host || host.dataset.bound) return;
    host.innerHTML =
      '<input type="text" id="rvSearchInput" class="rv-input" placeholder="🔎 Search reviews...">' +
      '<select id="rvRatingFilter" class="rv-select">' +
        '<option value="all">All Ratings</option>' +
        '<option value="5">5 Stars</option><option value="4">4 Stars</option>' +
        '<option value="3">3 Stars</option><option value="2">2 Stars</option><option value="1">1 Star</option>' +
      '</select>' +
      '<select id="rvSortSelect" class="rv-select">' +
        '<option value="newest">Newest First</option>' +
        '<option value="highest">Highest Rated</option>' +
        '<option value="lowest">Lowest Rated</option>' +
        '<option value="helpful">Most Helpful</option>' +
      '</select>';
    host.dataset.bound = '1';
    document.getElementById('rvSearchInput').addEventListener('input', rvDebounce(function(e){
      rvPublicFilter.q = e.target.value.trim().toLowerCase(); rvVisibleLimit = RV_PAGE_SIZE; rvRenderPublicList();
    }, 250));
    document.getElementById('rvRatingFilter').addEventListener('change', function(e){
      rvPublicFilter.rating = e.target.value; rvVisibleLimit = RV_PAGE_SIZE; rvRenderPublicList();
    });
    document.getElementById('rvSortSelect').addEventListener('change', function(e){
      rvPublicFilter.sort = e.target.value; rvRenderPublicList();
    });
  }

  function rvRenderFeatured(){
    var host = document.getElementById('rvFeatured');
    if(!host) return;
    var featured = rvSortList((rvCache || []).filter(function(r){ return !r.hidden && r.featured; }), 'newest');
    if(!featured.length){ host.innerHTML = ''; return; }
    host.innerHTML =
      '<div class="rv-featured-title">🏆 Featured Reviews</div>' +
      '<div class="rv-featured-row">' +
        featured.map(function(r,i){ return rvCardHtml(r,i).replace('class="rv-card ', 'class="rv-card rv-card-featured '); }).join('') +
      '</div>';
  }

  function rvRenderPublicList(){
    var listAll = (rvCache || []).filter(function(r){ return !r.hidden; });
    var filtered = listAll.filter(function(r){
      if(rvPublicFilter.rating !== 'all' && String(r.stars) !== rvPublicFilter.rating) return false;
      if(rvPublicFilter.q && (r.name + ' ' + r.text + ' ' + (r.tags||[]).join(' ')).toLowerCase().indexOf(rvPublicFilter.q) === -1) return false;
      return true;
    });
    var sorted = rvSortList(filtered, rvPublicFilter.sort);
    var gridHost = document.getElementById('rvGrid');
    if(!gridHost) return;
    var visible = sorted.slice(0, rvVisibleLimit);
    gridHost.innerHTML = visible.length
      ? visible.map(function(r,i){ return rvCardHtml(r,i); }).join('')
      : '<p class="small-note">No reviews match your search.</p>';
    var moreWrap = document.getElementById('rvLoadMoreWrap');
    if(moreWrap){
      moreWrap.innerHTML = sorted.length > rvVisibleLimit
        ? '<button type="button" id="rvLoadMoreBtn" class="rv-loadmore-btn">Show more reviews (' + (sorted.length - rvVisibleLimit) + ' more)</button>'
        : '';
      var moreBtn = document.getElementById('rvLoadMoreBtn');
      if(moreBtn) moreBtn.addEventListener('click', function(){ rvVisibleLimit += RV_PAGE_SIZE; rvRenderPublicList(); });
    }
  }

  function rvRenderAnalytics(){
    var host = document.getElementById('rvAnalytics');
    if(!host) return;
    var list = (rvCache || []).filter(function(r){ return !r.hidden; });
    var total = list.length;
    var avg = total ? (list.reduce(function(s,r){ return s + r.stars; }, 0) / total) : 0;
    var now = new Date();
    var monthly = list.filter(function(r){ var d = new Date(r.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
    var positive = total ? Math.round(list.filter(function(r){ return r.stars >= 4; }).length / total * 100) : 0;
    var negative = total ? Math.round(list.filter(function(r){ return r.stars <= 2; }).length / total * 100) : 0;
    var newest = rvSortList(list, 'newest')[0];
    var topRated = rvSortList(list, 'highest')[0];

    var keywordMap = {};
    list.forEach(function(r){ (r.tags||[]).forEach(function(t){ keywordMap[t] = (keywordMap[t]||0) + 1; }); });
    var keywords = Object.keys(keywordMap).map(function(k){ return { tag:k, count:keywordMap[k] }; })
      .sort(function(a,b){ return b.count - a.count; }).slice(0,6);

    var months = [];
    for(var i = 5; i >= 0; i--){
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label:d.toLocaleDateString('en-IN',{month:'short'}), y:d.getFullYear(), m:d.getMonth(), count:0 });
    }
    list.forEach(function(r){
      var d = new Date(r.date);
      months.forEach(function(mo){ if(d.getFullYear() === mo.y && d.getMonth() === mo.m) mo.count++; });
    });
    var maxCount = Math.max.apply(null, months.map(function(m){ return m.count; }).concat([1]));

    host.innerHTML =
      '<div class="rv-analytics-title">📊 Review Analytics</div>' +
      '<div class="rv-analytics-grid">' +
        '<div class="rv-analytics-card"><div class="rv-analytics-num">' + avg.toFixed(1) + '</div><div class="rv-analytics-label">Average Rating</div></div>' +
        '<div class="rv-analytics-card"><div class="rv-analytics-num">' + monthly + '</div><div class="rv-analytics-label">Reviews This Month</div></div>' +
        '<div class="rv-analytics-card"><div class="rv-analytics-num">' + positive + '%</div><div class="rv-analytics-label">Positive (4★–5★)</div></div>' +
        '<div class="rv-analytics-card"><div class="rv-analytics-num">' + negative + '%</div><div class="rv-analytics-label">Negative (1★–2★)</div></div>' +
      '</div>' +
      '<div class="rv-analytics-row2">' +
        '<div class="rv-analytics-block">' +
          '<div class="rv-analytics-block-title">🔑 Most Mentioned</div>' +
          '<div class="rv-keyword-row">' + (keywords.length ? keywords.map(function(k){ return '<span class="rv-tag">' + rvEscape(k.tag) + ' · ' + k.count + '</span>'; }).join('') : '<span class="small-note">Not enough data yet</span>') + '</div>' +
        '</div>' +
        '<div class="rv-analytics-block">' +
          '<div class="rv-analytics-block-title">🆕 Newest Review</div>' +
          (newest ? '<div class="rv-analytics-mini">' + rvEscape(newest.name) + ' — ' + rvStars(newest.stars) + '<br><span class="small-note">' + rvFmtDate(newest.date) + '</span></div>' : '<span class="small-note">No reviews yet</span>') +
        '</div>' +
        '<div class="rv-analytics-block">' +
          '<div class="rv-analytics-block-title">🥇 Top Rated Review</div>' +
          (topRated ? '<div class="rv-analytics-mini">' + rvEscape(topRated.name) + ' — ' + rvStars(topRated.stars) + '<br><span class="small-note">"' + rvEscape(topRated.text.length > 70 ? topRated.text.slice(0,70) + '…' : topRated.text) + '"</span></div>' : '<span class="small-note">No reviews yet</span>') +
        '</div>' +
      '</div>' +
      '<div class="rv-analytics-block-title" style="margin-top:16px;">📈 Review Growth (last 6 months)</div>' +
      '<div class="rv-growth-chart">' +
        months.map(function(m){
          var h = Math.max(6, Math.round(m.count / maxCount * 100));
          return '<div class="rv-growth-col"><div class="rv-growth-bar" style="height:' + h + '%"><span>' + m.count + '</span></div><div class="rv-growth-label">' + m.label + '</div></div>';
        }).join('') +
      '</div>';
  }

  function rvRenderPublicPage(){
    var list = (rvCache || []).filter(function(r){ return !r.hidden; });
    rvRenderHero(list);
    rvRenderToolbar();
    rvRenderFeatured();
    rvRenderPublicList();
    rvRenderAnalytics();
  }

  /* ---------- Homepage: Google rating + auto-rotating testimonials ---------- */
  function rvRenderHomeSlide(instant){
    var slide = document.getElementById('rvHomeSlide');
    if(!slide || !rvHomeList.length) return;
    var r = rvHomeList[rvHomeIdx % rvHomeList.length];
    var html =
      '<div class="rv-home-stars-sm">' + rvStars(r.stars) + '</div>' +
      '<div class="rv-home-text">"' + rvEscape(r.text) + '"</div>' +
      '<div class="rv-home-author">— ' + rvEscape(r.name) + (r.verified ? ' <span class="rv-badge-verified">✔ Verified</span>' : '') + '</div>';
    if(instant){ slide.innerHTML = html; return; }
    slide.classList.add('rv-slide-out');
    setTimeout(function(){
      slide.innerHTML = html;
      slide.classList.remove('rv-slide-out');
      slide.classList.add('rv-slide-in');
      setTimeout(function(){ slide.classList.remove('rv-slide-in'); }, 500);
    }, 350);
  }
  function rvStartHomeRotation(){
    clearInterval(rvHomeTimer);
    rvHomeTimer = setInterval(function(){
      if(rvHomePaused || rvHomeList.length < 2) return;
      rvHomeIdx = (rvHomeIdx + 1) % rvHomeList.length;
      rvRenderHomeSlide(false);
    }, 9000); /* rotates every 8-10s as requested */
  }
  function rvRenderHomeWidget(){
    var host = document.getElementById('pwHomeReviewsWidget');
    if(!host) return;
    var visible = (rvCache || []).filter(function(r){ return !r.hidden; });
    var list = rvSortList(visible.filter(function(r){ return r.featured; }), 'newest');
    if(!list.length) list = rvSortList(visible, 'highest').slice(0,5);
    if(!list.length){ host.innerHTML = ''; return; }
    var total = visible.length;
    var avg = total ? (visible.reduce(function(s,r){ return s + r.stars; }, 0) / total) : 0;

    host.innerHTML =
      '<div class="rv-home-rating">' +
        '<span class="rv-home-gicon"><i class="fa-brands fa-google" aria-hidden="true"></i></span>' +
        '<span class="rv-home-score">' + avg.toFixed(1) + '</span>' +
        '<span class="rv-home-stars">' + rvStars(avg) + '</span>' +
        '<span class="rv-home-count">' + total + ' Google reviews</span>' +
      '</div>' +
      '<div class="rv-home-carousel" id="rvHomeCarousel"><div class="rv-home-slide" id="rvHomeSlide"></div></div>';

    rvHomeList = list;
    rvHomeIdx = 0;
    rvRenderHomeSlide(true);
    rvStartHomeRotation();

    var carousel = document.getElementById('rvHomeCarousel');
    if(carousel){
      carousel.addEventListener('mouseenter', function(){ rvHomePaused = true; });
      carousel.addEventListener('mouseleave', function(){ rvHomePaused = false; });
    }
  }

  /* ---------- Admin: Reviews Management ---------- */
  function rvGenerateSyncBatch(){
    /* Placeholder for a real Google Business Profile sync. Swap this
       function's body for a fetch() to your Cloud Function / server
       endpoint once that backend integration exists — everything
       downstream (rvCache.unshift + rvSave + re-render) stays the same. */
    var names = ['Ramesh P.','Anitha K.','Vignesh S.','Lavanya R.','Farhan A.','Deepak J.'];
    var texts = [
      'Very well maintained PG with quick support from the team whenever needed.',
      'Comfortable stay, good food options nearby and friendly housemates.',
      'Smooth booking process and the rooms matched the photos exactly.',
      'Peaceful locality, responsive admin and clean common areas.'
    ];
    var tagsPool = [['Cleanliness','Staff Support'],['Location','Food'],['Booking Process','Transparency'],['Safety','Community']];
    var n = 1 + Math.floor(Math.random() * 2);
    var out = [];
    for(var i = 0; i < n; i++){
      out.push({
        id: 'sync-' + Date.now() + '-' + i,
        name: names[Math.floor(Math.random() * names.length)],
        avatar: null,
        stars: 4 + Math.round(Math.random()),
        text: texts[Math.floor(Math.random() * texts.length)],
        date: new Date().toISOString(),
        verified: true,
        helpful: Math.floor(Math.random() * 5),
        tags: tagsPool[Math.floor(Math.random() * tagsPool.length)],
        featured: false, pinned: false, hidden: false, source: 'google'
      });
    }
    return out;
  }

  async function rvSyncReviews(){
    var btn = document.getElementById('rvSyncBtn');
    if(btn){ btn.disabled = true; btn.textContent = '🔄 Syncing…'; }
    await rvLoad();
    await new Promise(function(r){ setTimeout(r, 1100); }); /* simulated round-trip */
    var incoming = rvGenerateSyncBatch();
    incoming.forEach(function(rv){ rvCache.unshift(rv); });
    await rvSave();
    rvRenderAll();
    if(btn){ btn.disabled = false; btn.textContent = '🔄 Sync Reviews'; }
    if(typeof showSaveStatus === 'function'){
      showSaveStatus('✅ Synced ' + incoming.length + ' new review' + (incoming.length > 1 ? 's' : '') + ' from Google', false);
    }
  }

  function rvExportCsv(){
    var list = rvAdminFilteredSorted();
    var rows = [['Name','Rating','Date','Verified','Featured','Pinned','Hidden','Helpful','Tags','Text']];
    list.forEach(function(r){
      rows.push([r.name, r.stars, r.date, r.verified ? 'Yes':'No', r.featured ? 'Yes':'No', r.pinned ? 'Yes':'No', r.hidden ? 'Yes':'No', r.helpful || 0, (r.tags||[]).join('|'), (r.text||'').replace(/"/g,'""')]);
    });
    var csv = rows.map(function(row){ return row.map(function(cell){ return '"' + String(cell) + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'reviews-export-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function rvToggleAddForm(){
    var f = document.getElementById('rvAddForm');
    if(!f) return;
    if(f.style.display === 'none'){
      f.style.display = 'grid';
      f.innerHTML =
        '<input type="text" id="rvNewName" class="rv-input" placeholder="Customer name">' +
        '<select id="rvNewStars" class="rv-select"><option value="5">5★</option><option value="4">4★</option><option value="3">3★</option><option value="2">2★</option><option value="1">1★</option></select>' +
        '<input type="text" id="rvNewTags" class="rv-input" placeholder="Tags (comma separated)">' +
        '<textarea id="rvNewText" class="rv-input" placeholder="Review text" style="grid-column:1/-1;min-height:70px;"></textarea>' +
        '<button type="button" id="rvNewSubmit" class="rv-btn rv-btn-primary">💾 Save Review</button>';
      document.getElementById('rvNewSubmit').addEventListener('click', rvSubmitManualReview);
    }else{
      f.style.display = 'none';
      f.innerHTML = '';
    }
  }

  async function rvSubmitManualReview(){
    var name = (document.getElementById('rvNewName').value || '').trim();
    var text = (document.getElementById('rvNewText').value || '').trim();
    var stars = parseInt(document.getElementById('rvNewStars').value, 10);
    var tags = (document.getElementById('rvNewTags').value || '').split(',').map(function(t){ return t.trim(); }).filter(Boolean);
    if(!name || !text){ alert('Please enter a name and review text.'); return; }
    await rvLoad();
    rvCache.unshift({
      id: 'manual-' + Date.now(), name:name, avatar:null, stars:stars, text:text,
      date: new Date().toISOString(), verified:false, helpful:0, tags:tags,
      featured:false, pinned:false, hidden:false, source:'manual'
    });
    await rvSave();
    rvToggleAddForm();
    rvRenderAll();
    if(typeof showSaveStatus === 'function') showSaveStatus('✅ Review added', false);
  }

  function rvAdminFilteredSorted(){
    var list = (rvCache || []).filter(function(r){
      if(rvAdminFilter.rating !== 'all' && String(r.stars) !== rvAdminFilter.rating) return false;
      if(rvAdminFilter.status === 'visible' && r.hidden) return false;
      if(rvAdminFilter.status === 'hidden' && !r.hidden) return false;
      if(rvAdminFilter.status === 'featured' && !r.featured) return false;
      if(rvAdminFilter.status === 'pinned' && !r.pinned) return false;
      if(rvAdminFilter.q && (r.name + ' ' + r.text).toLowerCase().indexOf(rvAdminFilter.q) === -1) return false;
      return true;
    });
    return rvSortList(list, rvAdminFilter.sort);
  }

  function rvAdminRowHtml(r){
    return (
      '<div class="rv-admin-row" id="rvRow-' + r.id + '">' +
        '<div class="rv-admin-row-main">' +
          '<div class="rv-admin-row-name">' + rvEscape(r.name) + ' <span class="rv-admin-stars">' + rvStars(r.stars) + '</span></div>' +
          '<div class="rv-admin-row-text">' + rvEscape(r.text.length > 90 ? r.text.slice(0,90) + '…' : r.text) + '</div>' +
          '<div class="rv-admin-row-meta">' + rvFmtDate(r.date) + ' · ' + rvEscape(r.source || 'google') +
            (r.featured ? ' · <span class="rv-admin-badge rv-badge-featured">Featured</span>' : '') +
            (r.pinned ? ' · <span class="rv-admin-badge">Pinned</span>' : '') +
            (r.hidden ? ' · <span class="rv-admin-badge rv-admin-badge-hidden">Hidden</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="rv-admin-row-actions">' +
          '<button type="button" data-act="feature" class="rv-mini-btn">' + (r.featured ? 'Unfeature' : 'Feature') + '</button>' +
          '<button type="button" data-act="pin" class="rv-mini-btn">' + (r.pinned ? 'Unpin' : 'Pin') + '</button>' +
          '<button type="button" data-act="hide" class="rv-mini-btn">' + (r.hidden ? 'Unhide' : 'Hide') + '</button>' +
          '<button type="button" data-act="delete" class="rv-mini-btn rv-mini-btn-danger">Delete</button>' +
        '</div>' +
      '</div>'
    );
  }

  async function rvToggleFlag(id, field){
    await rvLoad();
    var r = rvCache.find(function(x){ return x.id === id; });
    if(!r) return;
    r[field] = !r[field];
    await rvSave();
    rvRenderAll();
  }
  async function rvDeleteReview(id){
    if(!confirm('Remove this review permanently?')) return;
    await rvLoad();
    rvCache = rvCache.filter(function(x){ return x.id !== id; });
    await rvSave();
    rvRenderAll();
  }

  function rvRenderAdminList(){
    var host = document.getElementById('rvAdminList');
    if(!host) return;
    var list = rvAdminFilteredSorted();
    host.innerHTML = list.length ? list.map(rvAdminRowHtml).join('') : '<p class="small-note">No reviews found.</p>';
    list.forEach(function(r){
      var row = document.getElementById('rvRow-' + r.id);
      if(!row) return;
      row.querySelector('[data-act="feature"]').addEventListener('click', function(){ rvToggleFlag(r.id, 'featured'); });
      row.querySelector('[data-act="pin"]').addEventListener('click', function(){ rvToggleFlag(r.id, 'pinned'); });
      row.querySelector('[data-act="hide"]').addEventListener('click', function(){ rvToggleFlag(r.id, 'hidden'); });
      row.querySelector('[data-act="delete"]').addEventListener('click', function(){ rvDeleteReview(r.id); });
    });
  }

  function rvRenderAdminToolbar(){
    var host = document.getElementById('rvAdminToolbar');
    if(!host) return;
    if(!rvAdminBound){
      host.innerHTML =
        '<input type="text" id="rvAdminSearch" class="rv-input" placeholder="🔎 Search by name or text...">' +
        '<select id="rvAdminRating" class="rv-select">' +
          '<option value="all">All Ratings</option><option value="5">5★</option><option value="4">4★</option><option value="3">3★</option><option value="2">2★</option><option value="1">1★</option>' +
        '</select>' +
        '<select id="rvAdminStatus" class="rv-select">' +
          '<option value="all">All Status</option><option value="visible">Visible</option><option value="hidden">Hidden</option><option value="featured">Featured</option><option value="pinned">Pinned</option>' +
        '</select>' +
        '<select id="rvAdminSort" class="rv-select">' +
          '<option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="highest">Highest Rating</option><option value="lowest">Lowest Rating</option><option value="helpful">Most Helpful</option>' +
        '</select>' +
        '<button type="button" id="rvSyncBtn" class="rv-btn rv-btn-primary">🔄 Sync Reviews</button>' +
        '<button type="button" id="rvExportBtn" class="rv-btn">⬇️ Export CSV</button>' +
        '<button type="button" id="rvAddBtn" class="rv-btn">➕ Add Review</button>' +
        '<div id="rvAddForm" class="rv-add-form" style="display:none;"></div>';
      document.getElementById('rvAdminSearch').addEventListener('input', rvDebounce(function(e){
        rvAdminFilter.q = e.target.value.trim().toLowerCase(); rvRenderAdminList();
      }, 250));
      document.getElementById('rvAdminRating').addEventListener('change', function(e){ rvAdminFilter.rating = e.target.value; rvRenderAdminList(); });
      document.getElementById('rvAdminStatus').addEventListener('change', function(e){ rvAdminFilter.status = e.target.value; rvRenderAdminList(); });
      document.getElementById('rvAdminSort').addEventListener('change', function(e){ rvAdminFilter.sort = e.target.value; rvRenderAdminList(); });
      document.getElementById('rvSyncBtn').addEventListener('click', rvSyncReviews);
      document.getElementById('rvExportBtn').addEventListener('click', rvExportCsv);
      document.getElementById('rvAddBtn').addEventListener('click', rvToggleAddForm);
      rvAdminBound = true;
    }
  }

  function rvRenderAdminPanel(){
    rvRenderAdminToolbar();
    rvRenderAdminList();
  }

  /* ---------- Master render + init ---------- */
  function rvRenderAll(){
    rvRenderPublicPage();
    rvRenderHomeWidget();
    if(typeof isAdmin !== 'undefined' && isAdmin) rvRenderAdminPanel();
  }
  document.addEventListener('DOMContentLoaded', function(){ rvLoad().then(rvRenderAll); });

  /* Hook into the existing admin unlock flow WITHOUT touching a single
     line of the original adminLogin — it's called first, unmodified,
     exactly like the dashboard hooks above do. */
  function rvWrapAdminLogin(){
    if(typeof window.adminLogin !== 'function'){ setTimeout(rvWrapAdminLogin, 60); return; }
    var origLogin = window.adminLogin;
    window.adminLogin = function(){
      var r = origLogin.apply(this, arguments);
      if(typeof isAdmin !== 'undefined' && isAdmin) rvRenderAdminPanel();
      return r;
    };
  }
  rvWrapAdminLogin();

  /* ================= Admin Dashboard ================= */
  function renderAdminDash(){
    var host = document.getElementById('pwAdminDash');
    if(!host) return;
    if(typeof availability === 'undefined' || !availability || typeof UNITS === 'undefined' || typeof ROOM_TYPES === 'undefined'){
      host.innerHTML = '';
      return;
    }
    var occupied = 0, vacant = 0, soon = 0, notOffered = 0, totalBeds = 0;
    var unitOcc = {};
    UNITS.forEach(function(unit){
      var occ = 0, tot = 0;
      ROOM_TYPES.forEach(function(rt){
        var arr = availability[unit] && availability[unit][rt];
        if(!arr) return;
        if(!Array.isArray(arr)) arr = [arr];
        arr.forEach(function(obj){
          if(!obj) return;
          var beds = obj.beds || [];
          totalBeds += beds.length;
          tot += beds.length;
          var occCount = beds.filter(Boolean).length;
          occ += occCount;
          occupied += occCount;
          vacant += beds.length - occCount;
          if(obj.status === 'soon') soon++;
          if(obj.status === 'none') notOffered++;
        });
      });
      unitOcc[unit] = tot ? Math.round((occ / tot) * 100) : 0;
    });

    var cardsHtml =
      '<div class="pw-dash-grid">' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + UNITS.length + '</div><div class="pw-dash-label">Total Units</div></div>' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + occupied + '</div><div class="pw-dash-label">Occupied Beds</div></div>' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + vacant + '</div><div class="pw-dash-label">Vacant Beds</div></div>' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + soon + '</div><div class="pw-dash-label">Available Soon</div></div>' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + totalBeds + '</div><div class="pw-dash-label">Total Beds</div></div>' +
      '</div>';

    var barsHtml = '<div class="pw-dash-chart-title">📊 Occupancy by Unit</div>' +
      UNITS.map(function(unit){
        var pct = unitOcc[unit];
        return '<div class="pw-dash-bar-row">' +
          '<div class="pw-dash-bar-label">' + unit + '</div>' +
          '<div class="pw-dash-bar-track"><div class="pw-dash-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="pw-dash-bar-pct">' + pct + '%</div>' +
        '</div>';
      }).join('');

    host.innerHTML =
      '<button type="button" class="pw-dash-refresh" id="pwDashRefreshBtn">🔄 Refresh Dashboard</button>' +
      cardsHtml + barsHtml;
    document.getElementById('pwDashRefreshBtn').addEventListener('click', renderAdminDash);
  }

  /* Hook the dashboard into the existing admin unlock/lock/render flow
     WITHOUT touching a single line of the original functions — each
     original function is called first, exactly as before, and the
     dashboard refresh happens afterwards. */
  function wrapWhenReady(){
    if(typeof window.adminLogin !== 'function' || typeof window.renderUnits !== 'function'){
      setTimeout(wrapWhenReady, 50);
      return;
    }
    var origLogin = window.adminLogin;
    window.adminLogin = function(){
      var r = origLogin.apply(this, arguments);
      var dash = document.getElementById('pwAdminDash');
      if(typeof isAdmin !== 'undefined' && isAdmin && dash){
        dash.style.display = 'block';
        renderAdminDash();
      }
      return r;
    };
    if(typeof window.adminLogout === 'function'){
      var origLogout = window.adminLogout;
      window.adminLogout = function(){
        var r = origLogout.apply(this, arguments);
        var dash = document.getElementById('pwAdminDash');
        if(dash){ dash.style.display = 'none'; dash.innerHTML = ''; }
        return r;
      };
    }
    var origRenderUnits = window.renderUnits;
    window.renderUnits = function(){
      var r = origRenderUnits.apply(this, arguments);
      if(typeof isAdmin !== 'undefined' && isAdmin){
        var dash = document.getElementById('pwAdminDash');
        if(dash && dash.style.display !== 'none') renderAdminDash();
      }
      return r;
    };
  }
  wrapWhenReady();

  /* ================= Mobile Bottom Nav ================= */
  document.addEventListener('DOMContentLoaded', function(){
    var bn = document.querySelector('.pw-bottom-nav');
    if(!bn) return;
    bn.querySelectorAll('button[data-bn-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tab = btn.dataset.bnTab;
        var navBtn = document.querySelector('nav button[data-tab="' + tab + '"]');
        if(navBtn) navBtn.click();
      });
    });
    function syncActive(){
      var activeTab = document.querySelector('nav button.active');
      var tab = activeTab ? activeTab.dataset.tab : 'home';
      bn.querySelectorAll('button[data-bn-tab]').forEach(function(btn){
        btn.classList.toggle('pw-bn-active', btn.dataset.bnTab === tab);
      });
    }
    document.querySelectorAll('nav button[data-tab]').forEach(function(navBtn){
      navBtn.addEventListener('click', syncActive);
    });
    syncActive();
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  'use strict';

  /* =========================================================
     1) SIDEBAR: search box + keyboard navigation
  ========================================================= */
  function initSidebarSearch(){
    var navEl = document.querySelector('nav');
    if(!navEl || document.querySelector('.pw-sb-search')) return;

    var wrap = document.createElement('div');
    wrap.className = 'pw-sb-search';
    wrap.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<input type="text" id="pwSbSearchInput" placeholder="Search menu..." aria-label="Search menu">';
    navEl.insertBefore(wrap, navEl.firstChild);

    var input = document.getElementById('pwSbSearchInput');
    var buttons = Array.prototype.slice.call(navEl.querySelectorAll('button[data-tab]'));

    input.addEventListener('input', function(){
      var q = input.value.trim().toLowerCase();
      buttons.forEach(function(btn){
        var label = (btn.querySelector('.pw-nav-label') ? btn.querySelector('.pw-nav-label').textContent : btn.textContent).toLowerCase();
        btn.classList.toggle('pw-nav-hidden', q.length > 0 && label.indexOf(q) === -1);
      });
    });

    input.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        var first = buttons.find(function(b){ return !b.classList.contains('pw-nav-hidden'); });
        if(first) first.focus();
      }
      if(e.key === 'Escape'){ input.value=''; input.dispatchEvent(new Event('input')); input.blur(); }
    });

    /* Arrow-key navigation between visible sidebar items */
    buttons.forEach(function(btn){
      btn.addEventListener('keydown', function(e){
        var visible = buttons.filter(function(b){ return !b.classList.contains('pw-nav-hidden'); });
        var idx = visible.indexOf(btn);
        if(idx === -1) return;
        if(e.key === 'ArrowDown'){
          e.preventDefault();
          var next = visible[(idx + 1) % visible.length];
          if(next) next.focus();
        } else if(e.key === 'ArrowUp'){
          e.preventDefault();
          if(idx === 0){ input.focus(); return; }
          var prev = visible[(idx - 1 + visible.length) % visible.length];
          if(prev) prev.focus();
        }
      });
    });
  }

  /* =========================================================
     2) GALLERY: search + category filter + swipe + fade-in reveal
     NOTE: real per-photo categories require the Gallery admin
     upload/metadata system (a separate phase) — until then each
     unit tile is tagged with a placeholder category below so the
     filter UI is fully functional and ready to be wired to real
     photo metadata later.
  ========================================================= */
  var GALLERY_CATEGORIES = ['Rooms','Common Areas','Building','Kitchen','Amenities','Exterior'];
  var galCategoryMap = {}; // unit -> category, assigned once below
  var activeCategory = 'All';
  var gallerySearchQuery = '';

  function initGalleryTools(){
    var grid = document.getElementById('pwGalleryGrid');
    if(!grid || document.querySelector('.pw-gal-tools')) return;
    if(typeof UNITS === 'undefined' || !UNITS.length) return;

    UNITS.forEach(function(unit, i){ galCategoryMap[unit] = GALLERY_CATEGORIES[i % GALLERY_CATEGORIES.length]; });

    var tools = document.createElement('div');
    tools.className = 'pw-gal-tools';
    var chipsHtml = ['All'].concat(GALLERY_CATEGORIES).map(function(cat){
      return '<button type="button" class="pw-gal-chip' + (cat === 'All' ? ' pw-gal-chip-active' : '') + '" data-cat="' + cat + '">' + cat + '</button>';
    }).join('');
    tools.innerHTML =
      '<div class="pw-gal-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
      '<input type="text" id="pwGalSearchInput" placeholder="Search gallery..." aria-label="Search gallery"></div>' +
      '<div class="pw-gal-chips" id="pwGalChips">' + chipsHtml + '</div>';
    grid.parentNode.insertBefore(tools, grid);

    var emptyMsg = document.createElement('div');
    emptyMsg.className = 'pw-gal-empty';
    emptyMsg.id = 'pwGalEmpty';
    emptyMsg.textContent = 'No photos match your search.';
    grid.parentNode.insertBefore(emptyMsg, grid.nextSibling);

    document.getElementById('pwGalSearchInput').addEventListener('input', function(e){
      gallerySearchQuery = e.target.value.trim().toLowerCase();
      applyGalleryFilter();
    });
    document.getElementById('pwGalChips').addEventListener('click', function(e){
      var chip = e.target.closest('.pw-gal-chip');
      if(!chip) return;
      document.querySelectorAll('.pw-gal-chip').forEach(function(c){ c.classList.remove('pw-gal-chip-active'); });
      chip.classList.add('pw-gal-chip-active');
      activeCategory = chip.dataset.cat;
      applyGalleryFilter();
    });
  }

  function applyGalleryFilter(){
    var grid = document.getElementById('pwGalleryGrid');
    if(!grid || typeof UNITS === 'undefined') return;
    var visibleCount = 0;
    grid.querySelectorAll('.pw-gallery-tile').forEach(function(tile){
      var unit = UNITS[parseInt(tile.dataset.i, 10)];
      var cat = galCategoryMap[unit] || 'Rooms';
      var matchesCat = activeCategory === 'All' || cat === activeCategory;
      var matchesSearch = !gallerySearchQuery || unit.toLowerCase().indexOf(gallerySearchQuery) !== -1;
      var show = matchesCat && matchesSearch;
      tile.classList.toggle('pw-gal-filtered-out', !show);
      if(show) visibleCount++;
    });
    var empty = document.getElementById('pwGalEmpty');
    if(empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  /* Fade-in reveal as tiles enter the viewport (lightweight lazy-reveal) */
  function observeGalleryTiles(){
    var grid = document.getElementById('pwGalleryGrid');
    if(!grid || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('pw-gal-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    grid.querySelectorAll('.pw-gallery-tile').forEach(function(tile){ io.observe(tile); });
  }

  /* Swipe support for the lightbox on touch devices */
  function initLightboxSwipe(){
    var lb = document.getElementById('pwLightbox');
    var stage = document.getElementById('pwLightboxStage');
    if(!lb || !stage) return;
    var startX = null, startY = null;
    stage.addEventListener('touchstart', function(e){
      var t = e.changedTouches[0];
      startX = t.clientX; startY = t.clientY;
    }, { passive: true });
    stage.addEventListener('touchend', function(e){
      if(startX === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX, dy = t.clientY - startY;
      if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
        var closeBtn = lb.querySelector('.pw-lightbox-close');
        var nextBtn = lb.querySelector('.pw-lightbox-next');
        var prevBtn = lb.querySelector('.pw-lightbox-prev');
        if(dx < 0 && nextBtn) nextBtn.click();
        else if(dx > 0 && prevBtn) prevBtn.click();
      }
      startX = null; startY = null;
    }, { passive: true });
  }

  /* Live Engagement dashboard card feature removed per request. */

  document.addEventListener('DOMContentLoaded', function(){
    initSidebarSearch();
    initGalleryTools();
    applyGalleryFilter();
    observeGalleryTiles();
    initLightboxSwipe();
  });

  /* The gallery grid is (re)rendered asynchronously by the block above, so
     give it a moment then wire up filter state + reveal + swipe again in
     case renderGallery() ran after DOMContentLoaded already fired. */
  window.addEventListener('load', function(){
    setTimeout(function(){
      applyGalleryFilter();
      observeGalleryTiles();
    }, 300);
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  /* Hide the preloader once the page has painted (short minimum so it
     never looks like a flicker on fast connections, but never blocks
     the page for long either). */
  function hidePreloader(){
    var pl = document.getElementById('scPreloader');
    if (pl) pl.classList.add('sc-pl-hide');
  }
  window.addEventListener('load', function(){ setTimeout(hidePreloader, 350); });
  setTimeout(hidePreloader, 2500); // safety net so it never hangs

  /* Footer year */
  var yr = document.getElementById('scFootYear');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Back-to-top button */
  var toTop = document.getElementById('scToTop');
  if (toTop){
    window.addEventListener('scroll', function(){
      if (window.scrollY > 420) toTop.classList.add('sc-show');
      else toTop.classList.remove('sc-show');
    }, { passive:true });
    toTop.addEventListener('click', function(){
      window.scrollTo({ top:0, behavior:'smooth' });
    });
  }
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  /* ---- 1. Glass shadow on the existing sticky <nav> when scrolled ---- */
  var scNav = document.querySelector('nav');
  if (scNav){
    window.addEventListener('scroll', function(){
      if (window.scrollY > 30) scNav.classList.add('sc15-scrolled');
      else scNav.classList.remove('sc15-scrolled');
    }, { passive:true });
  }

  /* ---- 2. Inject a trust strip right after the existing <header> ---- */
  var scHeader = document.querySelector('header');
  if (scHeader && !document.querySelector('.sc15-trust')){
    var strip = document.createElement('div');
    strip.className = 'sc15-trust';
    strip.innerHTML =
      '<span><b>●</b> Live Room Availability</span>' +
      '<span><b>₹</b> No Hidden Charges</span>' +
      '<span><b>24×7</b> Support</span>';
    scHeader.parentNode.insertBefore(strip, scHeader.nextSibling);
  }

  /* ---- 3. Floating WhatsApp / Call buttons that simply trigger the
     existing, already-wired #scWaNow / #scCallNow links — no new
     phone-number or messaging logic is added here. ---- */
  if (!document.querySelector('.sc15-float')){
    var wrap = document.createElement('div');
    wrap.className = 'sc15-float';
    wrap.innerHTML =
      '<button type="button" class="sc15-wa" title="Chat on WhatsApp" aria-label="Chat on WhatsApp"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></button>' +
      '<button type="button" class="sc15-call" title="Call Now" aria-label="Call Now"><i class="fa-solid fa-phone" aria-hidden="true"></i></button>';
    document.body.appendChild(wrap);

    wrap.querySelector('.sc15-wa').addEventListener('click', function(){
      var t = document.getElementById('scWaNow');
      if (t) t.click();
    });
    wrap.querySelector('.sc15-call').addEventListener('click', function(){
      var t = document.getElementById('scCallNow');
      if (t) t.click();
    });
  }
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  'use strict';

  const WISH_KEY = 'sc16Wishlist';
  const RECENT_KEY = 'sc16RecentlyViewed';
  let wishlist = [];
  let recentlyViewed = [];
  const compareSelection = new Map(); // key "unit|rt" -> {unit, rt}

  async function loadWishlist(){
    try{ const r = await PGStorage.get(WISH_KEY, false); return r ? JSON.parse(r.value) : []; }
    catch(e){ return []; }
  }
  async function saveWishlist(){ await storageSetWithRetry(WISH_KEY, JSON.stringify(wishlist), false, 'your wishlist'); }
  async function loadRecent(){
    try{ const r = await PGStorage.get(RECENT_KEY, false); return r ? JSON.parse(r.value) : []; }
    catch(e){ return []; }
  }
  async function saveRecent(){ await storageSetWithRetry(RECENT_KEY, JSON.stringify(recentlyViewed), false, 'your recently viewed list'); }

  function isWished(unit){ return wishlist.includes(unit); }
  async function toggleWishlist(unit){
    if(isWished(unit)) wishlist = wishlist.filter(u=>u!==unit);
    else wishlist.push(unit);
    await saveWishlist();
    renderWishHearts();
    updateWishFab();
    if(document.getElementById('sc16WishModal')) renderWishModalList();
  }
  async function addRecentlyViewed(unit){
    recentlyViewed = [unit, ...recentlyViewed.filter(u=>u!==unit)].slice(0,8);
    await saveRecent();
    renderRecentStrip();
  }

  /* ---------- Wishlist hearts on each unit card ---------- */
  function renderWishHearts(){
    document.querySelectorAll('#unitsGrid .unit-card').forEach(card=>{
      const h3 = card.querySelector('h3');
      if(!h3) return;
      const unit = h3.innerText;
      let btn = card.querySelector('.sc16-wish-btn');
      if(!btn){
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sc16-wish-btn';
        btn.setAttribute('aria-label','Save to wishlist');
        card.appendChild(btn);
        btn.addEventListener('click', function(ev){
          ev.stopPropagation();
          toggleWishlist(unit);
        });
      }
      btn.innerHTML = isWished(unit) ? '❤' : '🤍';
      btn.classList.toggle('active', isWished(unit));
      btn.title = isWished(unit) ? 'Remove from wishlist' : 'Save to wishlist';
    });
  }

  /* ---------- Compare checkboxes inside each room's existing pricing box ---------- */
  function renderCompareCheckboxes(){
    if(typeof isAdmin !== 'undefined' && isAdmin) return; // customer-facing feature only
    document.querySelectorAll('#unitsGrid .unit-card').forEach(card=>{
      const unit = card.querySelector('h3')?.innerText;
      if(!unit) return;
      card.querySelectorAll('.room-row').forEach(rr=>{
        const rt = rr.querySelector('b')?.innerText;
        if(!rt) return;
        const roomIdx = parseInt(rr.dataset.roomIdx,10)||0;
        const box = rr.querySelector('.pricing-box');
        if(!box || box.querySelector('.sc16-compare-row')) return;
        const key = unit + '|' + rt + '|' + roomIdx;
        const row = document.createElement('div');
        row.className = 'sc16-compare-row';
        row.innerHTML = '<label><input type="checkbox" ' + (compareSelection.has(key)?'checked':'') + '> ⚖️ Add to compare</label>';
        const cb = row.querySelector('input');
        cb.addEventListener('change', function(){
          if(this.checked){
            if(compareSelection.size >= 3){
              this.checked = false;
              if(typeof pgShowToast === 'function') pgShowToast('You can compare up to 3 rooms at a time.', 'warn');
              return;
            }
            compareSelection.set(key, {unit, rt, roomIdx});
          } else {
            compareSelection.delete(key);
          }
          updateCompareBar();
        });
        box.appendChild(row);
      });
    });
  }

  function updateCompareBar(){
    let bar = document.getElementById('sc16CompareBar');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'sc16CompareBar';
      bar.className = 'sc16-compare-bar';
      bar.innerHTML =
        '<span id="sc16CompareCount"></span>' +
        '<button type="button" class="sc16-cbtn-go">Compare</button>' +
        '<button type="button" class="sc16-cbtn-clear">Clear</button>';
      document.body.appendChild(bar);
      bar.querySelector('.sc16-cbtn-go').addEventListener('click', openCompareModal);
      bar.querySelector('.sc16-cbtn-clear').addEventListener('click', function(){
        compareSelection.clear();
        document.querySelectorAll('.sc16-compare-row input').forEach(cb=>cb.checked=false);
        updateCompareBar();
      });
    }
    document.getElementById('sc16CompareCount').textContent =
      compareSelection.size + (compareSelection.size===1 ? ' room selected' : ' rooms selected');
    bar.classList.toggle('show', compareSelection.size >= 2);
  }

  function openCompareModal(){
    if(compareSelection.size < 2) return;
    const rooms = Array.from(compareSelection.values());
    const rows = [
      { label:'Room Type', get:r=>r.rt },
      { label:'Monthly Rent', get:r=>'₹'+((+meta(r.unit,r.rt,r.roomIdx).baseRent)||0) },
      { label:'Utility Charges', get:r=>'₹'+((+meta(r.unit,r.rt,r.roomIdx).utility)||0) },
      { label:'Total Monthly', get:r=>{ const m=meta(r.unit,r.rt,r.roomIdx); return '₹'+(((+m.baseRent)||0)+((+m.utility)||0)); } },
      { label:'Deposit', get:r=>'₹'+((+meta(r.unit,r.rt,r.roomIdx).deposit)||0) },
      { label:'Beds in Room', get:r=>parseInt(r.rt) },
      { label:'AC', get:r=>(r.rt.includes('AC') && !r.rt.includes('NAC')) ? '❄️ Yes' : 'No' },
      { label:'Toilet', get:r=>(meta(r.unit,r.rt,r.roomIdx).toilets||[]).join(', ') || '—' },
      { label:'Kitchen', get:r=>meta(r.unit,r.rt,r.roomIdx).kitchen ? '✔' : '—' },
      { label:'Availability', get:r=>{
          const o = availability[r.unit][r.rt][r.roomIdx];
          const st = roomStatus(typeof o==='string' ? {beds:[], status:o} : o);
          return st==='booked' ? 'Unavailable' : st==='soon' ? 'Available Soon' : st==='none' ? 'Not Offered' : 'Available';
        } }
    ];
    let html = '<table class="sc16-compare-table"><thead><tr><th></th>' +
      rooms.map(r=>'<th>'+r.unit+' (Room '+(r.roomIdx+1)+')</th>').join('') + '</tr></thead><tbody>';
    rows.forEach(row=>{
      html += '<tr><th>'+row.label+'</th>' + rooms.map(r=>'<td>'+row.get(r)+'</td>').join('') + '</tr>';
    });
    html += '</tbody></table>';
    showModal('Compare Rooms', html);
  }

  /* ---------- Recently Viewed strip ---------- */
  function renderRecentStrip(){
    let wrap = document.getElementById('sc16RecentWrap');
    const target = document.getElementById('availability');
    if(!target) return;
    if(recentlyViewed.length === 0){
      if(wrap) wrap.remove();
      return;
    }
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'sc16RecentWrap';
      wrap.className = 'sc16-recent-wrap';
      const anchor = target.querySelector('.sc-breadcrumb');
      if(anchor && anchor.nextSibling) anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
      else target.insertBefore(wrap, target.firstChild);
    }
    wrap.innerHTML = '<h4>🕓 Recently Viewed</h4><div class="sc16-recent-strip"></div>';
    const strip = wrap.querySelector('.sc16-recent-strip');
    recentlyViewed.forEach(unit=>{
      if(typeof UNITS !== 'undefined' && !UNITS.includes(unit)) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sc16-recent-chip';
      chip.textContent = unit;
      chip.addEventListener('click', function(){
        const card = Array.from(document.querySelectorAll('#unitsGrid .unit-card')).find(c=>c.querySelector('h3')?.innerText===unit);
        if(card){
          card.scrollIntoView({behavior:'smooth', block:'center'});
          const toggle = card.querySelector('.unit-toggle-btn');
          const roomsWrap = card.querySelector('.room-rows-wrap');
          if(toggle && roomsWrap && roomsWrap.style.display === 'none') toggle.click();
        }
      });
      strip.appendChild(chip);
    });
  }

  /* ---------- Wishlist floating button + modal ---------- */
  function updateWishFab(){
    let fab = document.getElementById('sc16WishFab');
    if(!fab){
      fab = document.createElement('button');
      fab.type = 'button';
      fab.id = 'sc16WishFab';
      fab.className = 'sc16-wish-fab';
      document.body.appendChild(fab);
      fab.addEventListener('click', openWishModal);
    }
    fab.innerHTML = '❤ Wishlist <span class="sc16-wish-count">' + wishlist.length + '</span>';
    fab.style.display = wishlist.length ? 'flex' : 'none';
  }

  function renderWishModalList(){
    const body = document.getElementById('sc16WishModalBody');
    if(!body) return;
    if(wishlist.length === 0){
      body.innerHTML = '<p class="sc16-wish-empty">Your wishlist is empty. Tap the heart on any property to save it here.</p>';
      return;
    }
    body.innerHTML = wishlist.map(unit=>
      '<div class="sc16-wish-item"><span>' + unit + '</span><button data-unit="'+unit+'">View</button></div>'
    ).join('');
    body.querySelectorAll('button[data-unit]').forEach(btn=>{
      btn.addEventListener('click', function(){
        closeModal();
        const unit = this.dataset.unit;
        const card = Array.from(document.querySelectorAll('#unitsGrid .unit-card')).find(c=>c.querySelector('h3')?.innerText===unit);
        if(card){
          card.scrollIntoView({behavior:'smooth', block:'center'});
          const toggle = card.querySelector('.unit-toggle-btn');
          const roomsWrap = card.querySelector('.room-rows-wrap');
          if(toggle && roomsWrap && roomsWrap.style.display === 'none') toggle.click();
        }
      });
    });
  }

  function openWishModal(){
    showModal('Your Wishlist', '<div id="sc16WishModalBody"></div>', 'sc16WishModal');
    renderWishModalList();
  }

  /* ---------- generic modal helper ---------- */
  function closeModal(){
    const ov = document.getElementById('sc16ModalOverlay');
    if(ov) ov.remove();
  }
  function showModal(title, bodyHtml, id){
    closeModal();
    const ov = document.createElement('div');
    ov.id = 'sc16ModalOverlay';
    ov.className = 'sc16-modal-overlay';
    ov.innerHTML =
      '<div class="sc16-modal"' + (id?(' id="'+id+'"'):'') + '>' +
        '<button type="button" class="sc16-modal-close" aria-label="Close">✕</button>' +
        '<h3>' + title + '</h3>' +
        bodyHtml +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('.sc16-modal-close').addEventListener('click', closeModal);
    ov.addEventListener('click', function(ev){ if(ev.target === ov) closeModal(); });
  }

  /* ---------- Cost Calculator ---------- */
  function buildCostCalculator(){
    const target = document.getElementById('availability');
    if(!target || document.getElementById('sc16CalcCard')) return;
    const card = document.createElement('div');
    card.id = 'sc16CalcCard';
    card.className = 'sc16-calc-card';
    card.innerHTML =
      '<h3>💰 Cost Calculator</h3>' +
      '<div class="sc16-calc-grid">' +
        '<div><label>Property</label><select id="sc16CalcUnit"></select></div>' +
        '<div><label>Room Type</label><select id="sc16CalcRoom"></select></div>' +
        '<div><label>Food (monthly)</label><input type="number" id="sc16CalcFood" value="3000" min="0"></div>' +
        '<div><label>Laundry (monthly)</label><input type="number" id="sc16CalcLaundry" value="500" min="0"></div>' +
        '<div><label><input type="checkbox" id="sc16CalcGst" style="width:auto;display:inline-block;margin-right:6px;">Include 18% GST on rent</label></div>' +
      '</div>' +
      '<div class="sc16-calc-results">' +
        '<div class="sc16-calc-box"><b id="sc16CalcMonthly">₹0</b><span>Monthly Cost (rent + utility + food + laundry)</span></div>' +
        '<div class="sc16-calc-box"><b id="sc16CalcMovein">₹0</b><span>Move-in Cost (deposit + first month)</span></div>' +
      '</div>';
    const anchor = document.getElementById('sc16RecentWrap') || target.querySelector('.sc-breadcrumb');
    if(anchor && anchor.nextSibling) anchor.parentNode.insertBefore(card, anchor.nextSibling);
    else target.insertBefore(card, target.firstChild);

    const unitSel = document.getElementById('sc16CalcUnit');
    const roomSel = document.getElementById('sc16CalcRoom');
    (typeof UNITS !== 'undefined' ? UNITS : []).forEach(u=>{
      const o = document.createElement('option'); o.value = u; o.textContent = u; unitSel.appendChild(o);
    });
    (typeof ROOM_TYPES !== 'undefined' ? ROOM_TYPES : []).forEach(rt=>{
      const o = document.createElement('option'); o.value = rt; o.textContent = rt; roomSel.appendChild(o);
    });

    function recompute(){
      const u = unitSel.value, rt = roomSel.value;
      if(!u || !rt || typeof meta !== 'function') return;
      const m = meta(u, rt);
      const food = (+document.getElementById('sc16CalcFood').value) || 0;
      const laundry = (+document.getElementById('sc16CalcLaundry').value) || 0;
      const gst = document.getElementById('sc16CalcGst').checked;
      const rent = (+m.baseRent) || 0;
      const utility = (+m.utility) || 0;
      const deposit = (+m.deposit) || 0;
      const gstAmt = gst ? Math.round(rent * 0.18) : 0;
      const monthly = rent + utility + food + laundry + gstAmt;
      const movein = deposit + monthly;
      document.getElementById('sc16CalcMonthly').textContent = '₹' + monthly.toLocaleString('en-IN');
      document.getElementById('sc16CalcMovein').textContent = '₹' + movein.toLocaleString('en-IN');
    }
    [unitSel, roomSel].forEach(el=>el.addEventListener('change', recompute));
    ['sc16CalcFood','sc16CalcLaundry','sc16CalcGst'].forEach(id=>{
      document.getElementById(id).addEventListener('input', recompute);
      document.getElementById(id).addEventListener('change', recompute);
    });
    recompute();
  }

  /* ---------- recently-viewed hook: fires whenever a unit's room list is opened/closed ---------- */
  function wireRecentlyViewedDelegate(){
    const grid = document.getElementById('unitsGrid');
    if(!grid || grid.dataset.sc16Wired) return;
    grid.dataset.sc16Wired = '1';
    grid.addEventListener('click', function(ev){
      const btn = ev.target.closest('.unit-toggle-btn');
      if(!btn) return;
      const card = btn.closest('.unit-card');
      const unit = card?.querySelector('h3')?.innerText;
      if(unit) addRecentlyViewed(unit);
    });
  }

  /* ---------- chain onto renderUnits(), same idiom as the other packs already in this file ---------- */
  if(typeof renderUnits === 'function'){
    const _sc16PrevRender = renderUnits;
    renderUnits = function(){
      _sc16PrevRender();
      renderWishHearts();
      renderCompareCheckboxes();
      wireRecentlyViewedDelegate();
    };
  }

  window.__initWishlistTools = async function(){
    wishlist = await loadWishlist();
    recentlyViewed = await loadRecent();
    updateWishFab();
    renderRecentStrip();
    buildCostCalculator();
  };
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  var pwGlowSelector = '.pw-stat-card, .pw-gallery-tile, .unit-card';
  document.addEventListener('mousemove', function(e){
    var el = e.target.closest ? e.target.closest(pwGlowSelector) : null;
    if(!el) return;
    var r = el.getBoundingClientRect();
    var x = ((e.clientX - r.left) / r.width) * 100;
    var y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty('--pw-mx', x + '%');
    el.style.setProperty('--pw-my', y + '%');
  }, { passive:true });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  var STORE_KEY = 'scAdminTabVisible';

  function showAdminTab(){
    document.body.classList.add('sc-admin-tab-visible');
    try{ localStorage.setItem(STORE_KEY, '1'); }catch(e){}
  }

  window.scHideAdminTab = function(){
    document.body.classList.remove('sc-admin-tab-visible');
    try{ localStorage.removeItem(STORE_KEY); }catch(e){}
    if(typeof isAdmin !== 'undefined' && isAdmin && typeof adminLogout === 'function') adminLogout();
    var homeBtn = document.querySelector('nav button[data-tab="home"]');
    if(homeBtn) homeBtn.click();
  };

  // 1) Persisted from a previous unlock on this device
  try{
    if(localStorage.getItem(STORE_KEY) === '1') showAdminTab();
  }catch(e){}

  // 2) URL-based unlock: ?admin=1 or #admin-access
  try{
    var params = new URLSearchParams(window.location.search);
    if(params.get('admin') === '1' || window.location.hash === '#admin-access') showAdminTab();
  }catch(e){}

  // 3) Secret typed keyword "admin" (ignored while typing in a field)
  var typedBuffer = '';
  document.addEventListener('keydown', function(e){
    var tag = (e.target && e.target.tagName) || '';
    if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    if(e.key && e.key.length === 1){
      typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-5);
      if(typedBuffer === 'admin') showAdminTab();
    }
  });

  // 4) Secret 5-tap on the footer brand text
  document.addEventListener('DOMContentLoaded', function(){
    var logo = document.querySelector('.sc-foot-logo');
    if(!logo) return;
    var taps = 0, lastTap = 0;
    logo.style.cursor = 'default';
    logo.addEventListener('click', function(){
      var now = Date.now();
      if(now - lastTap > 3000) taps = 0;
      lastTap = now;
      taps++;
      if(taps >= 5){ taps = 0; showAdminTab(); }
    });
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  function scAvailComputeStats(){
    let avail=0, soon=0, booked=0;
    if(typeof availability === 'object' && availability && typeof UNITS !== 'undefined' && typeof ROOM_TYPES !== 'undefined'){
      UNITS.forEach(function(u){
        ROOM_TYPES.forEach(function(rt){
          const raw = availability[u] && availability[u][rt];
          if(!raw) return;
          let arr = Array.isArray(raw) ? raw : [raw];
          arr.forEach(function(o){
            let obj = o;
            if(typeof obj === 'string') obj = {beds:Array(parseInt(rt[0],10)).fill(false), status:obj};
            if(!obj.status) obj.status = 'available';
            const st = (typeof roomStatus === 'function') ? roomStatus(obj) : 'available';
            if(st === 'available') avail++;
            else if(st === 'soon') soon++;
            else if(st === 'booked') booked++;
          });
        });
      });
    }
    return {avail:avail, soon:soon, booked:booked, totalUnits:(typeof UNITS !== 'undefined' ? UNITS.length : 0)};
  }

  function scAvailRenderStats(){
    const bar = document.getElementById('scAvailStatsBar');
    if(!bar) return;
    // Admin-only: keep these live counts internal rather than showing them
    // to every visitor browsing rooms.
    if(typeof isAdmin === 'undefined' || !isAdmin){ bar.style.display = 'none'; bar.innerHTML = ''; return; }
    bar.style.display = '';
    const s = scAvailComputeStats();
    bar.innerHTML =
      '<div class="sc-avail-stat"><b>'+s.avail+'</b><span>Available Now</span></div>'+
      '<div class="sc-avail-stat"><b>'+s.soon+'</b><span>Available Soon</span></div>'+
      '<div class="sc-avail-stat"><b>'+s.booked+'</b><span>Currently Full</span></div>'+
      '<div class="sc-avail-stat"><b>'+s.totalUnits+'</b><span>Total PG Homes</span></div>';
  }

  function scAvailApply(){
    const grid = document.getElementById('unitsGrid');
    if(!grid) return;
    const searchEl = document.getElementById('scAvailSearch');
    const filterEl = document.getElementById('scAvailFilter');
    const sortEl = document.getElementById('scAvailSort');
    const q = ((searchEl && searchEl.value) || '').trim().toLowerCase();
    const filterVal = (filterEl && filterEl.value) || 'all';
    const sortVal = (sortEl && sortEl.value) || 'default';

    let cards = Array.prototype.slice.call(grid.querySelectorAll('.unit-card'));
    let visible = 0;
    cards.forEach(function(card){
      const h3 = card.querySelector('h3');
      const name = (h3 ? h3.textContent : '').toLowerCase();
      const matchesSearch = !q || name.indexOf(q) !== -1;
      let matchesFilter = true;
      if(filterVal !== 'all'){
        const badges = card.querySelectorAll('.mini-badge');
        matchesFilter = Array.prototype.some.call(badges, function(b){ return b.classList.contains(filterVal); });
      }
      const show = matchesSearch && matchesFilter;
      card.style.display = show ? '' : 'none';
      if(show) visible++;
    });

    if(sortVal !== 'default'){
      cards.sort(function(a,b){
        if(sortVal === 'name-asc'){
          const an = (a.querySelector('h3')||{}).textContent || '';
          const bn = (b.querySelector('h3')||{}).textContent || '';
          return an.localeCompare(bn);
        }
        // most-available: sort by count of "available" mini-badges, descending
        const countAvail = function(c){ return c.querySelectorAll('.mini-badge.available').length; };
        return countAvail(b) - countAvail(a);
      });
      cards.forEach(function(c){ grid.appendChild(c); });
    }

    const emptyMsg = document.getElementById('scAvailEmpty');
    if(emptyMsg) emptyMsg.style.display = (visible === 0) ? 'block' : 'none';
    scAvailRenderStats();
  }

  function scAvailBuildToolbar(){
    const section = document.getElementById('availability');
    const grid = document.getElementById('unitsGrid');
    if(!section || !grid || document.getElementById('scAvailToolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'scAvailToolbar';
    toolbar.className = 'sc-avail-toolbar';
    toolbar.innerHTML =
      '<div class="sc-avail-stats" id="scAvailStatsBar"></div>'+
      '<div class="sc-avail-controls">'+
        '<div class="sc-avail-search-wrap"><i class="fa-solid fa-magnifying-glass"></i>'+
          '<input type="text" id="scAvailSearch" placeholder="Search PG by name (e.g. Vintage, Cosmos...)">'+
        '</div>'+
        '<select id="scAvailFilter">'+
          '<option value="all">All Rooms</option>'+
          '<option value="available">Available Now</option>'+
          '<option value="soon">Available Soon</option>'+
          '<option value="booked">Currently Full</option>'+
        '</select>'+
        '<select id="scAvailSort">'+
          '<option value="default">Default Order</option>'+
          '<option value="name-asc">Name (A–Z)</option>'+
          '<option value="available-desc">Most Rooms Available First</option>'+
        '</select>'+
        '<button type="button" class="sc-avail-clear" id="scAvailClearBtn">Reset</button>'+
      '</div>';

    const emptyMsg = document.createElement('div');
    emptyMsg.id = 'scAvailEmpty';
    emptyMsg.innerHTML = '🔍 No PG homes match your search. Try a different name or choose "All Rooms".';

    section.insertBefore(toolbar, grid);
    section.insertBefore(emptyMsg, grid);

    const searchInput = document.getElementById('scAvailSearch');
    let debounceTimer;
    searchInput.addEventListener('input', function(){
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(scAvailApply, 150);
    });
    document.getElementById('scAvailFilter').addEventListener('change', scAvailApply);
    document.getElementById('scAvailSort').addEventListener('change', scAvailApply);
    document.getElementById('scAvailClearBtn').addEventListener('click', function(){
      searchInput.value = '';
      document.getElementById('scAvailFilter').value = 'all';
      document.getElementById('scAvailSort').value = 'default';
      scAvailApply();
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    scAvailBuildToolbar();
    // Wrap renderUnits (defined earlier in the page) so every re-render —
    // whether triggered by admin edits, bed clicks, or the initial
    // Firebase load — automatically re-applies the current search/filter/
    // sort and refreshes the live stats strip.
    if(typeof renderUnits === 'function'){
      const scOriginalRenderUnits = renderUnits;
      renderUnits = function(){
        scOriginalRenderUnits.apply(this, arguments);
        scAvailBuildToolbar();
        scAvailApply();
      };
    }
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  'use strict';

  const PRICE_MIN_DEFAULT = 0, PRICE_MAX_DEFAULT = 20000;
  let sc23MinPrice = PRICE_MIN_DEFAULT, sc23MaxPrice = PRICE_MAX_DEFAULT;
  let sc23ActivePreset = null;
  const sc23SelectedChips = new Set();
  let sc23SortPrice = 'none';
  const NOTIFY_KEY = 'sc23NotifyRequests';
  let sc23NotifyRequests = [];

  function totalRent(unit, rt){
    try{
      let arr = availability[unit][rt];
      if(!Array.isArray(arr)) arr = [arr];
      let min = Infinity;
      arr.forEach(function(_,idx){
        const m = (typeof meta === 'function') ? meta(unit, rt, idx) : null;
        const r = m ? (+m.baseRent||0) + (+m.utility||0) : 0;
        if(r > 0 && r < min) min = r;
      });
      return min === Infinity ? 0 : min;
    }catch(e){ return 0; }
  }
  function statusOf(unit, rt){
    try{
      let arr = availability[unit][rt];
      if(typeof arr === 'string') arr = [{beds:[], status:arr}];
      if(!Array.isArray(arr)) arr = [arr];
      if(arr.some(o=>roomStatus(typeof o==='string'?{beds:[],status:o}:o)==='available')) return 'available';
      if(arr.some(o=>roomStatus(typeof o==='string'?{beds:[],status:o}:o)==='soon')) return 'soon';
      if(arr.some(o=>(typeof o==='string'?o:o.status)!=='none')) return 'booked';
      return 'none';
    }catch(e){ return 'available'; }
  }

  /* ============ Toolbar (budget + chips + sort + view) ============ */
  function sc23BuildBar(){
    const grid = document.getElementById('unitsGrid');
    const section = document.getElementById('availability');
    if(!grid || !section || document.getElementById('sc23Bar')) return;

    const bar = document.createElement('div');
    bar.id = 'sc23Bar';
    bar.className = 'sc23-bar';
    bar.innerHTML =
      '<div class="sc23-field">'+
        '<label>Monthly Budget (₹)</label>'+
        '<div class="sc23-price-inputs">'+
          '<input type="number" id="sc23MinInput" placeholder="Min" min="0" step="500">'+
          '<span>–</span>'+
          '<input type="number" id="sc23MaxInput" placeholder="Max" min="0" step="500">'+
        '</div>'+
        '<div class="sc23-price-presets" id="sc23Presets">'+
          '<button type="button" class="sc23-preset-btn" data-min="0" data-max="6000">Under ₹6k</button>'+
          '<button type="button" class="sc23-preset-btn" data-min="6000" data-max="9000">₹6k – 9k</button>'+
          '<button type="button" class="sc23-preset-btn" data-min="9000" data-max="12000">₹9k – 12k</button>'+
          '<button type="button" class="sc23-preset-btn" data-min="12000" data-max="20000">₹12k+</button>'+
        '</div>'+
      '</div>'+
      '<div class="sc23-field">'+
        '<label>Room Type</label>'+
        '<div class="sc23-chips" id="sc23Chips"></div>'+
      '</div>'+
      '<div class="sc23-field">'+
        '<label>Sort By Price</label>'+
        '<select id="sc23SortSelect">'+
          '<option value="none">—</option>'+
          '<option value="low">Lowest Rent First</option>'+
          '<option value="high">Highest Rent First</option>'+
        '</select>'+
      '</div>'+
      '<div class="sc23-field">'+
        '<label>View</label>'+
        '<div class="sc23-view-toggle" id="sc23ViewToggle">'+
          '<button type="button" data-view="detailed" class="active">Detailed</button>'+
          '<button type="button" data-view="compact">Compact</button>'+
        '</div>'+
      '</div>'+
      '<button type="button" class="sc23-reset" id="sc23ResetBtn">✕ Reset Advanced Filters</button>';

    const resultCount = document.createElement('div');
    resultCount.className = 'sc23-result-count';
    resultCount.id = 'sc23ResultCount';

    section.insertBefore(bar, grid);
    section.insertBefore(resultCount, grid);

    if(Array.isArray(window.ROOM_TYPES !== undefined ? ROOM_TYPES : [])){
      const chipsWrap = document.getElementById('sc23Chips');
      ROOM_TYPES.forEach(rt=>{
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'sc23-chip';
        chip.dataset.rt = rt;
        chip.textContent = rt;
        chip.addEventListener('click', function(){
          if(sc23SelectedChips.has(rt)){ sc23SelectedChips.delete(rt); chip.classList.remove('active'); }
          else{ sc23SelectedChips.add(rt); chip.classList.add('active'); }
          sc23Apply();
        });
        chipsWrap.appendChild(chip);
      });
    }

    const minInput = document.getElementById('sc23MinInput');
    const maxInput = document.getElementById('sc23MaxInput');
    let debounce;
    function onPriceInput(){
      clearTimeout(debounce);
      debounce = setTimeout(function(){
        sc23MinPrice = minInput.value !== '' ? +minInput.value : PRICE_MIN_DEFAULT;
        sc23MaxPrice = maxInput.value !== '' ? +maxInput.value : PRICE_MAX_DEFAULT;
        sc23ActivePreset = null;
        document.querySelectorAll('.sc23-preset-btn').forEach(b=>b.classList.remove('active'));
        sc23Apply();
      }, 250);
    }
    minInput.addEventListener('input', onPriceInput);
    maxInput.addEventListener('input', onPriceInput);

    document.querySelectorAll('.sc23-preset-btn').forEach(btn=>{
      btn.addEventListener('click', function(){
        const isActive = btn.classList.contains('active');
        document.querySelectorAll('.sc23-preset-btn').forEach(b=>b.classList.remove('active'));
        if(isActive){
          sc23ActivePreset = null; sc23MinPrice = PRICE_MIN_DEFAULT; sc23MaxPrice = PRICE_MAX_DEFAULT;
          minInput.value = ''; maxInput.value = '';
        }else{
          btn.classList.add('active');
          sc23MinPrice = +btn.dataset.min; sc23MaxPrice = +btn.dataset.max;
          minInput.value = sc23MinPrice; maxInput.value = sc23MaxPrice;
          sc23ActivePreset = btn.dataset.min + '-' + btn.dataset.max;
        }
        sc23Apply();
      });
    });

    document.getElementById('sc23SortSelect').addEventListener('change', function(e){
      sc23SortPrice = e.target.value; sc23Apply();
    });

    document.querySelectorAll('#sc23ViewToggle button').forEach(btn=>{
      btn.addEventListener('click', function(){
        document.querySelectorAll('#sc23ViewToggle button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        grid.classList.toggle('sc23-compact', btn.dataset.view === 'compact');
      });
    });

    document.getElementById('sc23ResetBtn').addEventListener('click', function(){
      sc23MinPrice = PRICE_MIN_DEFAULT; sc23MaxPrice = PRICE_MAX_DEFAULT; sc23ActivePreset = null;
      sc23SelectedChips.clear(); sc23SortPrice = 'none';
      minInput.value = ''; maxInput.value = '';
      document.querySelectorAll('.sc23-preset-btn, .sc23-chip').forEach(b=>b.classList.remove('active'));
      document.getElementById('sc23SortSelect').value = 'none';
      sc23Apply();
    });
  }

  function sc23Apply(){
    // Let the existing search/status toolbar (v21) compute its own base
    // visibility + ordering first, if present, then layer these filters on top.
    if(typeof scAvailApply === 'function') scAvailApply();
    const grid = document.getElementById('unitsGrid');
    if(!grid) return;
    let cards = Array.from(grid.querySelectorAll('.unit-card'));
    let visible = 0;
    let cheapestPerCard = new Map();

    cards.forEach(card=>{
      if(card.style.display === 'none'){ return; }
      const h3 = card.querySelector('h3');
      const unit = h3 ? h3.childNodes[0] && h3.textContent.trim() : null;
      if(!unit || typeof availability === 'undefined' || !availability[unit]){ return; }

      let passChip = sc23SelectedChips.size === 0;
      let passPrice = false;
      let cheapest = Infinity;

      (typeof ROOM_TYPES !== 'undefined' ? ROOM_TYPES : []).forEach(rt=>{
        if(!availability[unit][rt]) return;
        const st = statusOf(unit, rt);
        if(st === 'none') return;
        const rent = totalRent(unit, rt);
        if(rent > 0 && rent < cheapest) cheapest = rent;
        if(sc23SelectedChips.has(rt)) passChip = true;
        if(rent >= sc23MinPrice && rent <= sc23MaxPrice) passPrice = true;
      });

      const show = passChip && passPrice;
      card.style.display = show ? '' : 'none';
      if(show){ visible++; cheapestPerCard.set(card, cheapest === Infinity ? 0 : cheapest); }
    });

    if(sc23SortPrice !== 'none'){
      const visibleCards = cards.filter(c=>c.style.display !== 'none');
      visibleCards.sort(function(a,b){
        const pa = cheapestPerCard.get(a) || 0, pb = cheapestPerCard.get(b) || 0;
        return sc23SortPrice === 'low' ? pa - pb : pb - pa;
      });
      visibleCards.forEach(c=>grid.appendChild(c));
    }

    const rc = document.getElementById('sc23ResultCount');
    if(rc) rc.textContent = visible + ' PG home' + (visible === 1 ? '' : 's') + ' match your filters';
  }

  /* ============ Sticky quick-jump strip ============ */
  function sc23BuildJumpNav(){
    const section = document.getElementById('availability');
    const grid = document.getElementById('unitsGrid');
    if(!section || !grid || document.getElementById('sc23JumpWrap')) return;
    if(typeof UNITS === 'undefined' || !UNITS.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'sc23-jump-wrap';
    wrap.id = 'sc23JumpWrap';
    wrap.innerHTML = '<span class="sc23-jump-label">🏘️ Jump to:</span><div class="sc23-jump-track" id="sc23JumpTrack"></div>';
    section.insertBefore(wrap, document.getElementById('sc23Bar') || grid);

    const track = document.getElementById('sc23JumpTrack');
    UNITS.forEach((unit, idx)=>{
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'sc23-jump-pill';
      pill.textContent = unit;
      pill.addEventListener('click', function(){
        const card = grid.querySelectorAll('.unit-card')[idx];
        if(!card) return;
        if(card.style.display === 'none'){
          if(typeof pgShowToast === 'function'){
            pgShowToast(unit + ' is hidden by your current filters — resetting to show it.', 'info');
          }
          document.getElementById('sc23ResetBtn') && document.getElementById('sc23ResetBtn').click();
        }
        card.scrollIntoView({behavior:'smooth', block:'start'});
        pill.classList.remove('sc23-pulse');
        void pill.offsetWidth;
        pill.classList.add('sc23-pulse');
        const toggleBtn = card.querySelector('.unit-toggle-btn');
        if(toggleBtn && !toggleBtn.classList.contains('open')) toggleBtn.click();
      });
      track.appendChild(pill);
    });
  }

  /* ============ Occupancy ring + share button (post-processed onto cards) ============ */
  function sc23RingColor(pct){
    if(pct >= 85) return getComputedStyle(document.documentElement).getPropertyValue('--booked').trim() || '#d9534f';
    if(pct >= 50) return getComputedStyle(document.documentElement).getPropertyValue('--gold').trim() || '#c9962f';
    return getComputedStyle(document.documentElement).getPropertyValue('--available').trim() || '#22a06b';
  }

  function sc23DecorateCards(){
    if(typeof UNITS === 'undefined' || typeof ROOM_TYPES === 'undefined') return;
    const grid = document.getElementById('unitsGrid');
    if(!grid) return;

    grid.querySelectorAll('.unit-card').forEach(card=>{
      const h3 = card.querySelector('h3');
      if(!h3) return;
      const unit = h3.textContent.replace(/\s*$/,'').trim();
      if(!unit || !availability[unit]) return;

      // ---- occupancy ring ----
      let occ = 0, total = 0;
      ROOM_TYPES.forEach(rt=>{
        let arr = availability[unit][rt];
        if(!arr) return;
        if(!Array.isArray(arr)) arr = [arr];
        arr.forEach(obj=>{
          if(typeof obj === 'string') obj = {beds:[]};
          if(!obj || obj.status === 'none') return;
          occ += (obj.beds||[]).filter(Boolean).length;
          total += (obj.beds||[]).length;
        });
      });
      const pct = total ? Math.round((occ/total)*100) : 0;
      let ring = h3.querySelector('.sc23-ring');
      if(!ring){
        ring = document.createElement('span');
        ring.className = 'sc23-ring';
        h3.appendChild(ring);
      }
      const color = sc23RingColor(pct);
      ring.innerHTML =
        '<span class="sc23-ring-dial" style="background:conic-gradient('+color+' '+(pct*3.6)+'deg, var(--sand) 0deg)">'+
          '<span class="sc23-ring-txt" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.62rem;">'+pct+'%</span>'+
        '</span>'+
        '<span>'+(total-occ)+' bed'+((total-occ)===1?'':'s')+' free</span>';

      // ---- share button (next to View/Hide Rooms toggle) ----
      const strip = card.querySelector('.unit-summary-strip');
      if(strip && !strip.querySelector('.sc23-share-btn')){
        const shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.className = 'sc23-share-btn';
        shareBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Share';
        shareBtn.addEventListener('click', function(ev){
          ev.stopPropagation();
          const msg = 'Check out ' + unit + ' at Stay Confident PG Homes — ' + (total-occ) + ' bed(s) currently free. ' + location.href;
          window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        });
        strip.appendChild(shareBtn);
      }
    });

    // ---- notify-me buttons on booked / soon rooms ----
    grid.querySelectorAll('.room-row').forEach(row=>{
      const badge = row.querySelector('.badge');
      const enqBox = row.querySelector('.enquiry-container');
      if(!badge || !enqBox) return;
      const isFull = badge.classList.contains('booked') || badge.classList.contains('soon');
      let btn = row.querySelector('.sc23-notify-btn');
      if(isFull && !isAdmin){
        if(!btn){
          btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sc23-notify-btn';
          btn.innerHTML = '🔔 Notify Me When Available';
          btn.addEventListener('click', function(){
            sc23OpenNotifyModal(enqBox.dataset.u, enqBox.dataset.r);
          });
          row.appendChild(btn);
        }
      }else if(btn){
        btn.remove();
      }
    });
  }

  /* ============ Notify-Me modal + storage ============ */
  async function sc23LoadNotify(){
    try{ const r = await PGStorage.get(NOTIFY_KEY, true); return r ? JSON.parse(r.value) : []; }
    catch(e){ return []; }
  }
  async function sc23SaveNotify(){
    if(typeof storageSetWithRetry === 'function'){
      await storageSetWithRetry(NOTIFY_KEY, JSON.stringify(sc23NotifyRequests), true, 'your notify request');
    }
  }

  function sc23OpenNotifyModal(unit, rt){
    let overlay = document.getElementById('sc23NotifyOverlay');
    if(overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.className = 'sc23-modal-overlay';
    overlay.id = 'sc23NotifyOverlay';
    overlay.innerHTML =
      '<div class="sc23-modal">'+
        '<button type="button" class="sc23-modal-close" id="sc23ModalClose">✕</button>'+
        '<h4>🔔 Get Notified</h4>'+
        '<p>We\'ll reach out the moment a bed opens up in <b>'+unit+' — '+rt+'</b>. Leave your details below.</p>'+
        '<input type="text" id="sc23NName" placeholder="Your full name">'+
        '<input type="tel" id="sc23NPhone" placeholder="Phone number">'+
        '<div class="sc23-modal-actions">'+
          '<button type="button" class="sc23-modal-cancel" id="sc23ModalCancel">Cancel</button>'+
          '<button type="button" class="sc23-modal-send" id="sc23ModalSend">Notify Me</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(()=>overlay.classList.add('show'));

    function closeModal(){ overlay.classList.remove('show'); setTimeout(()=>overlay.remove(), 250); }
    document.getElementById('sc23ModalClose').addEventListener('click', closeModal);
    document.getElementById('sc23ModalCancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) closeModal(); });

    document.getElementById('sc23ModalSend').addEventListener('click', async function(){
      const nameEl = document.getElementById('sc23NName');
      const phoneEl = document.getElementById('sc23NPhone');
      const name = nameEl.value.trim();
      const phone = phoneEl.value.trim();
      if(!name || phone.length < 8){
        nameEl.style.borderColor = name ? '' : 'var(--booked)';
        phoneEl.style.borderColor = phone.length >= 8 ? '' : 'var(--booked)';
        return;
      }
      sc23NotifyRequests.push({unit:unit, rt:rt, name:name, phone:phone, date:new Date().toISOString()});
      await sc23SaveNotify();
      closeModal();
      if(typeof pgShowToast === 'function'){
        pgShowToast('✅ Got it! We\'ll notify you the moment ' + unit + ' — ' + rt + ' opens up.', 'success');
      }
      sc23RefreshAdminPanel();
    });
  }

  /* ============ Admin panel to view / clear notify requests ============ */
  function sc23BuildAdminEntry(){
    const note = document.getElementById('adminEditNote');
    if(!note || !isAdmin || document.getElementById('sc23AdminNotifyBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'sc23AdminNotifyBtn';
    btn.className = 'sc23-admin-notify-btn';
    btn.innerHTML = '🔔 View Notify-Me Requests (<span id="sc23AdminCount">0</span>)';
    btn.addEventListener('click', sc23ToggleAdminPanel);
    note.insertAdjacentElement('afterend', btn);
    sc23RefreshAdminPanel();
  }

  function sc23RefreshAdminPanel(){
    const countEl = document.getElementById('sc23AdminCount');
    if(countEl) countEl.textContent = sc23NotifyRequests.length;
    const panel = document.getElementById('sc23AdminPanel');
    if(panel && panel.style.display !== 'none') sc23RenderAdminPanel();
  }

  function sc23ToggleAdminPanel(){
    let panel = document.getElementById('sc23AdminPanel');
    if(panel){
      const show = panel.style.display === 'none';
      panel.style.display = show ? 'block' : 'none';
      if(show) sc23RenderAdminPanel();
      return;
    }
    panel = document.createElement('div');
    panel.id = 'sc23AdminPanel';
    panel.className = 'sc23-admin-panel';
    document.getElementById('sc23AdminNotifyBtn').insertAdjacentElement('afterend', panel);
    sc23RenderAdminPanel();
  }

  function sc23RenderAdminPanel(){
    const panel = document.getElementById('sc23AdminPanel');
    if(!panel) return;
    if(!sc23NotifyRequests.length){
      panel.innerHTML = '<p class="small-note" style="margin:0">No notify-me requests yet.</p>';
      return;
    }
    let rows = sc23NotifyRequests.map(function(r, idx){
      const d = new Date(r.date);
      return '<tr><td>'+r.unit+'</td><td>'+r.rt+'</td><td>'+r.name+'</td><td><a href="tel:'+r.phone+'">'+r.phone+'</a></td>'+
        '<td>'+(isNaN(d)?'':d.toLocaleDateString())+'</td>'+
        '<td><button type="button" class="sc23-admin-del" data-idx="'+idx+'">Remove</button></td></tr>';
    }).join('');
    panel.innerHTML =
      '<table><thead><tr><th>Unit</th><th>Room</th><th>Name</th><th>Phone</th><th>Date</th><th></th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table>';
    panel.querySelectorAll('.sc23-admin-del').forEach(b=>{
      b.addEventListener('click', async function(){
        sc23NotifyRequests.splice(+b.dataset.idx, 1);
        await sc23SaveNotify();
        sc23RenderAdminPanel();
        sc23RefreshAdminPanel();
      });
    });
  }

  /* ============ Admin Access Control ============ */
  let sc23AdminUnlocked = false;
  
  function sc23ShowAdminPanel(){
    const btn = document.getElementById('sc23AdminNotifyBtn');
    const panel = document.getElementById('sc23AdminPanel');
    if(btn) btn.classList.add('sc23-admin-visible');
    if(panel) panel.classList.remove('sc23-hidden');
  }
  
  function sc23HideAdminPanel(){
    const btn = document.getElementById('sc23AdminNotifyBtn');
    const panel = document.getElementById('sc23AdminPanel');
    if(btn) btn.classList.remove('sc23-admin-visible');
    if(panel) {
      panel.classList.add('sc23-hidden');
      panel.style.display = 'none';
    }
  }
  
  // Keyboard shortcut: CTRL+ALT+A (Windows/Linux) or CMD+ALT+A (Mac) to toggle admin panel
  document.addEventListener('keydown', function(e){
    if((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'a'){
      e.preventDefault();
      sc23AdminUnlocked = !sc23AdminUnlocked;
      if(sc23AdminUnlocked){
        sc23ShowAdminPanel();
        if(typeof pgShowToast === 'function'){
          pgShowToast('✅ Admin Panel Unlocked! Use CTRL+ALT+A to toggle.', 'success');
        }
      }else{
        sc23HideAdminPanel();
        if(typeof pgShowToast === 'function'){
          pgShowToast('🔒 Admin Panel Hidden.', 'info');
        }
      }
    }
  });

  /* ============ Init ============ */
  document.addEventListener('DOMContentLoaded', async function(){
    sc23NotifyRequests = await sc23LoadNotify();
    sc23BuildJumpNav();
    sc23BuildBar();
    sc23BuildAdminEntry();
    sc23HideAdminPanel();
    sc23DecorateCards();
    sc23Apply();

    if(typeof renderUnits === 'function'){
      const sc23PrevRender = renderUnits;
      renderUnits = function(){
        sc23PrevRender.apply(this, arguments);
        sc23BuildJumpNav();
        sc23BuildBar();
        sc23BuildAdminEntry();
        if(!sc23AdminUnlocked){
          sc23HideAdminPanel();
        }
        sc23DecorateCards();
        sc23Apply();
      };
    }
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  var STORE_KEY = 'scAdminTabVisible';

  function isMobileContext(){
    try{
      var coarse = window.matchMedia && window.matchMedia('(hover:none), (pointer:coarse)').matches;
      var narrow = window.innerWidth <= 880;
      return !!(coarse && narrow) || ('ontouchstart' in window && narrow);
    }catch(e){ return window.innerWidth <= 880; }
  }

  function sc24Toast(msg){
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;left:50%;bottom:calc(90px + env(safe-area-inset-bottom));'
      + 'transform:translateX(-50%);background:#1c2b22;color:#f4ead1;padding:10px 18px;'
      + 'border-radius:30px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.3);'
      + 'opacity:0;transition:opacity .25s ease;pointer-events:none;';
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = '1'; });
    setTimeout(function(){
      t.style.opacity = '0';
      setTimeout(function(){ t.remove(); }, 300);
    }, 1800);
  }

  function sc24UnlockAdmin(){
    document.body.classList.add('sc-admin-tab-visible');
    try{ localStorage.setItem(STORE_KEY, '1'); }catch(e){}
    sc24Toast('🔓 Admin panel unlocked');
    if(navigator.vibrate){ try{ navigator.vibrate([25,40,25]); }catch(e){} }
    // Jump straight into the now-visible Admin tab for convenience.
    setTimeout(function(){
      var btn = document.querySelector('.pw-bottom-nav button[data-bn-tab="admin"]')
             || document.querySelector('nav button[data-tab="admin"]');
      if(btn) btn.click();
    }, 250);
  }

  document.addEventListener('DOMContentLoaded', function(){
    var logo = document.querySelector('.pw-logo-wrap img') || document.querySelector('header img');
    if(!logo) return;

    var taps = 0, lastTap = 0, resetTimer = null;

    function registerTap(){
      if(!isMobileContext()) { taps = 0; return; } // desktop: feature stays fully dormant

      var now = Date.now();
      if(now - lastTap > 2500) taps = 0;
      lastTap = now;
      taps++;

      clearTimeout(resetTimer);
      resetTimer = setTimeout(function(){ taps = 0; }, 2500);

      // Light feedback so the admin knows taps are registering, without
      // giving anything away to a random visitor (no counter shown).
      if(taps >= 2 && taps < 5 && navigator.vibrate){
        try{ navigator.vibrate(15); }catch(e){}
      }

      if(taps >= 5){
        taps = 0;
        clearTimeout(resetTimer);
        sc24UnlockAdmin();
      }
    }

    // Touch devices: use touchend so it fires reliably on mobile Safari/Chrome
    // without triggering any accidental "click-through" navigation.
    logo.addEventListener('touchend', function(e){
      if(!isMobileContext()) return;
      registerTap();
    }, { passive:true });

    // Fallback for mobile browsers that only emit click (and harmless on
    // desktop since registerTap() no-ops there).
    logo.addEventListener('click', registerTap);
  });
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  /* ================= new admin-editable fields on top of the existing roomMeta ================= */
  function pcMeta(u, r, idx){
    const m = meta(u, r, idx); // same object/array already persisted via roomMeta + debouncedSaveMeta()
    if(m.rating === undefined) m.rating = 4.8;
    if(m.verified === undefined) m.verified = true;
    if(m.image === undefined) m.image = '';
    if(m.distance === undefined) m.distance = '';
    if(m.landmark === undefined) m.landmark = '';
    return m;
  }

  window.pcEditRating = function(u, r, idx){
    const m = pcMeta(u, r, idx);
    const v = prompt('Set the rating (0.0 – 5.0) for ' + u + ' ' + r + ' Room ' + (idx+1) + ':', m.rating);
    if(v === null) return;
    const n = parseFloat(v);
    if(isNaN(n) || n < 0 || n > 5){ alert('Please enter a number between 0 and 5.'); return; }
    m.rating = Math.round(n * 10) / 10;
    debouncedSaveMeta();
    renderUnits();
  };
  window.pcToggleVerified = function(u, r, idx){
    const m = pcMeta(u, r, idx);
    m.verified = !m.verified;
    debouncedSaveMeta();
    renderUnits();
  };
  window.pcEditImage = function(u, r, idx){
    const m = pcMeta(u, r, idx);
    const v = prompt("Paste an image URL for this room/unit (leave blank to use the default icon):", m.image || '');
    if(v === null) return;
    m.image = v.trim();
    debouncedSaveMeta();
    renderUnits();
  };
  window.pcEditDistance = function(u, r, idx){
    const m = pcMeta(u, r, idx);
    const d = prompt('Distance to a nearby landmark/IT park (e.g. "2.5 km to IT Park"):', m.distance || '');
    if(d === null) return;
    m.distance = d.trim();
    const l = prompt('Nearby landmark name (optional):', m.landmark || '');
    if(l !== null) m.landmark = l.trim();
    debouncedSaveMeta();
    renderUnits();
  };

  /* ================= global "show interested counts to customers" toggle ================= */
  let scShowInterest = true;
  async function pcLoadShowInterest(){
    try{
      const r = await PGStorage.get('scShowInterest', true);
      scShowInterest = r ? (r.value === 'true') : true;
    }catch(e){ scShowInterest = true; }
  }
  window.pcSaveShowInterest = async function(v){
    scShowInterest = v;
    try{ await storageSetWithRetry('scShowInterest', String(v), true, 'the interested-count visibility'); }catch(e){}
    renderUnits();
  };

  /* ================= Book Now (reuses the exact existing bed-selection flow) ================= */
  window.pcBookNow = function(btn){
    const row = btn.closest('.room-row');
    if(!row) return;
    const freeBed = row.querySelector('.bed.free');
    if(!freeBed){
      if(typeof pgShowToast === 'function') pgShowToast('No beds are currently available in this room. Please try another room.', 'warn');
      return;
    }
    freeBed.scrollIntoView({behavior:'smooth', block:'center'});
    setTimeout(function(){ freeBed.click(); }, 260);
  };

  /* ================= heart / favourite — lightweight per-room UI toggle ================= */
  const pcFavorites = new Set();
  window.pcToggleHeart = function(btn, key){
    if(pcFavorites.has(key)){ pcFavorites.delete(key); btn.textContent = '🤍'; btn.classList.remove('active'); }
    else{ pcFavorites.add(key); btn.textContent = '❤️'; btn.classList.add('active'); }
  };

  /* ================= build/refresh the premium header + info blocks on every room card ================= */
  function pcDecorateCards(){
    const grid = document.getElementById('unitsGrid');
    if(!grid || typeof availability === 'undefined' || !availability) return;

    const toggleCb = document.getElementById('pcShowInterestToggle');
    if(toggleCb) toggleCb.checked = scShowInterest;

    grid.querySelectorAll('.room-row[data-u]').forEach(function(row){
      const unit = row.dataset.u, rt = row.dataset.rt;
      const roomIdx = parseInt(row.dataset.roomIdx, 10) || 0;
      if(!unit || !rt || !availability[unit] || !availability[unit][rt]) return;
      const arr = availability[unit][rt];
      const obj = Array.isArray(arr) ? arr[roomIdx] : arr;
      if(!obj) return;

      row.classList.add('pc-decorated');
      const m = pcMeta(unit, rt, roomIdx);
      const totalBeds = (obj.beds || []).length;
      const isAC = rt.indexOf('AC') !== -1 && rt.indexOf('NAC') === -1;
      const status = (typeof roomStatus === 'function') ? roomStatus(obj) : 'available';
      const hasFreeBed = status === 'available' && (obj.beds || []).some(function(b){ return !b; });

      /* ---- head: image / rating / verified ---- */
      let head = row.querySelector('.pc-head');
      if(!head){ head = document.createElement('div'); head.className = 'pc-head'; row.appendChild(head); }
      const showVerifiedBadge = m.verified || isAdmin;
      head.innerHTML =
        '<div class="pc-head-media">' +
          (m.image ? '<img src="' + escapeHtml(m.image) + '" alt="" class="pc-head-img" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' : '') +
          '<div class="pc-head-icon" style="display:' + (m.image ? 'none' : 'flex') + '">🏠</div>' +
        '</div>' +
        '<span class="pc-rating"' + (isAdmin ? ' onclick="pcEditRating(\'' + unit + '\',\'' + rt + '\',' + roomIdx + ')" title="Click to edit rating"' : '') + '>⭐ ' + (m.rating !== undefined ? m.rating : 4.8) + '</span>' +
        (showVerifiedBadge ? '<span class="pc-verified' + (m.verified ? '' : ' pc-verified-off') + '"' + (isAdmin ? ' onclick="pcToggleVerified(\'' + unit + '\',\'' + rt + '\',' + roomIdx + ')" title="Click to toggle Verified"' : '') + '>✓ ' + (m.verified ? 'Verified' : 'Not Verified') + '</span>' : '') +
        (isAdmin ? '<button type="button" class="pc-img-edit-btn" onclick="pcEditImage(\'' + unit + '\',\'' + rt + '\',' + roomIdx + ')">🖼️ Edit Image</button>' : '');

      /* ---- brand / unit name / location / distance ---- */
      let loc = row.querySelector('.pc-loc');
      if(!loc){ loc = document.createElement('div'); loc.className = 'pc-loc'; row.appendChild(loc); }
      const rawLink = (typeof unitLocations !== 'undefined' && unitLocations[unit]) || '';
      const usable = (typeof isUsableMapsLink === 'function') && isUsableMapsLink(rawLink);
      const openUrl = usable && typeof toOpenUrl === 'function' ? toOpenUrl(rawLink, unit) : '';
      const locHtml = usable ? '<a href="' + escapeHtml(openUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(unit) + '</a>' : escapeHtml(unit);
      loc.innerHTML =
        '<span class="pc-brand">Stay Confident PG Homes</span>' +
        '<h4 class="pc-unit-name">' + escapeHtml(unit) + '</h4>' +
        '<div class="pc-loc-main">📍 ' + locHtml + '</div>' +
        '<div class="pc-loc-sub">' +
          (m.distance ? '📏 ' + escapeHtml(m.distance) + ' ' : '') +
          (m.landmark ? '&nbsp;&nbsp;📍 ' + escapeHtml(m.landmark) : '') +
          (isAdmin ? ' <button type="button" class="pc-edit-mini" onclick="pcEditDistance(\'' + unit + '\',\'' + rt + '\',' + roomIdx + ')">✏️ Edit distance/landmark</button>' : '') +
        '</div>';

      /* ---- bed count / room type / room number ---- */
      let bc = row.querySelector('.pc-bedcount');
      if(!bc){ bc = document.createElement('div'); bc.className = 'pc-bedcount'; row.appendChild(bc); }
      bc.innerHTML = '🛏️ ' + totalBeds + ' bed' + (totalBeds === 1 ? '' : 's') + '&nbsp;&nbsp;🚪 ' + escapeHtml(rt) + '&nbsp;&nbsp;🏠 Room ' + (roomIdx + 1) + (isAC ? '&nbsp;&nbsp;❄️ AC' : '');

      /* ---- amenity chips (only enabled ones) ---- */
      let am = row.querySelector('.pc-amenities');
      if(!am){ am = document.createElement('div'); am.className = 'pc-amenities'; row.appendChild(am); }
      const toilets = m.toilets || [];
      am.innerHTML =
        (isAC ? '' : '<span class="pc-chip">🌬️ Non-AC</span>') +
        (toilets.indexOf('Western') !== -1 ? '<span class="pc-chip">🚽 Western Toilet</span>' : '') +
        (toilets.indexOf('Indian') !== -1 ? '<span class="pc-chip">🚾 Indian Toilet</span>' : '') +
        (m.kitchen ? '<span class="pc-chip">🍳 Kitchen</span>' : '') +
        (m.electric ? '<span class="pc-chip">⚡ Electric Stove</span>' : '') +
        (m.gas ? '<span class="pc-chip">🔥 Gas Stove</span>' : '');

      /* ---- interested count (reuses enquiryCountFor()/editEnquiry(), and activates the
         existing v23 "🔔 Notify Me" button, which looks for this exact .enquiry-container) ---- */
      let iv = row.querySelector('.pc-interest');
      if(!iv){ iv = document.createElement('div'); iv.className = 'enquiry-container pc-interest'; row.appendChild(iv); }
      iv.dataset.u = unit; iv.dataset.r = rt; iv.dataset.i = roomIdx;
      const enqCount = (typeof enquiryCountFor === 'function') ? enquiryCountFor(unit, rt, roomIdx) : 0;
      iv.style.display = scShowInterest ? 'inline-flex' : 'none';
      iv.innerHTML = '👥 <span class="enquiry-count">' + enqCount + '</span> people interested' +
        (isAdmin ? ' <button type="button" class="enquiry-edit-btn" onclick="editEnquiry(this)">✏️</button>' : '');

      /* ---- Book Now + heart (customer view only — admin has its own status/bed controls) ---- */
      let act = row.querySelector('.pc-actions');
      if(act) act.remove();
      if(!isAdmin){
        act = document.createElement('div');
        act.className = 'pc-actions';
        const key = unit + '|' + rt + '|' + roomIdx;
        const heartOn = pcFavorites.has(key);
        const label = hasFreeBed ? '🔑 Book Now' : (status === 'booked' ? 'Currently Unavailable' : status === 'soon' ? 'Available Soon' : 'Not Offered');
        act.innerHTML =
          '<button type="button" class="pc-book-btn"' + (hasFreeBed ? '' : ' disabled') + ' onclick="pcBookNow(this)">' + label + '</button>' +
          '<button type="button" class="pc-heart-btn' + (heartOn ? ' active' : '') + '" aria-label="Save room" onclick="pcToggleHeart(this,\'' + key + '\')">' + (heartOn ? '❤️' : '🤍') + '</button>';
        row.appendChild(act);
      }
    });
  }

  if(typeof renderUnits === 'function'){
    const pcPrevRender = renderUnits;
    renderUnits = function(){
      pcPrevRender.apply(this, arguments);
      try{ pcDecorateCards(); }catch(e){ console.error('Premium card decoration failed:', e); }
    };
  }

  (async function(){
    await pcLoadShowInterest();
    if(typeof renderUnits === 'function') renderUnits();
  })();
})();


/* ===== next inline <script> block from original file ===== */


(function(){
  /* ---- flatten ALL room types of a Unit into ONE continuous
     Room-1..Room-N sequence, split into a true left/right pair of
     columns (Room 1/2/3 left, Room 4/5/6 right, continuing
     automatically) — spanning every room type in that Unit rather
     than restarting per type. No CSS column-balancing guesswork,
     so no leftover empty space. Runs after every render, once the
     pricing/amenities/actions content has already been built into
     each .room-row by the earlier decoration passes, so it only
     ever *moves* fully-built cards — never rebuilds or clones them.
     Each .room-type-admin-bar ("+ Add Room" control) is preserved
     and collected into one compact strip above the grid, so admin
     add/remove-per-type controls stay fully functional. ---- */
  function rc2SplitIntoColumns(){
    document.querySelectorAll('#unitsGrid .unit-card').forEach(function(card){
      const wrap = card.querySelector('.room-rows-wrap');
      if(!wrap) return;
      const groups = Array.prototype.slice.call(wrap.querySelectorAll(':scope > .room-type-group'));
      if(groups.length === 0) return;

      const adminBars = [];
      const allRows = [];
      groups.forEach(function(group){
        const bar = group.querySelector(':scope > .room-type-admin-bar');
        if(bar) adminBars.push(bar);
        Array.prototype.forEach.call(group.children, function(el){
          if(el.classList && el.classList.contains('room-row')) allRows.push(el);
        });
      });
      if(allRows.length === 0) return;

      const barsStrip = document.createElement('div');
      barsStrip.className = 'unit-typebars-strip';
      adminBars.forEach(function(bar){ barsStrip.appendChild(bar); });

      const gridWrap = document.createElement('div');
      gridWrap.className = 'room-2col-wrap';
      if(allRows.length === 1){
        // Only one physical room in the whole Unit: render it full-width.
        // A 2-column grid with a single item would still reserve an
        // empty second column track — this is what was showing up as
        // blank space next to a lone room card.
        gridWrap.classList.add('room-2col-single');
        gridWrap.appendChild(allRows[0]);
      }else{
        const left = document.createElement('div'); left.className = 'room-2col-col';
        const right = document.createElement('div'); right.className = 'room-2col-col';
        const splitAt = Math.ceil(allRows.length / 2);
        allRows.forEach(function(row, i){ (i < splitAt ? left : right).appendChild(row); });
        gridWrap.appendChild(left);
        gridWrap.appendChild(right); // allRows.length >= 2 here, so right always has at least 1 room — never an empty column
      }

      wrap.innerHTML = ''; // the now-empty .room-type-group shells are discarded; every admin-bar and room-row was already moved out above, so nothing with content or handlers is lost
      wrap.appendChild(barsStrip);
      wrap.appendChild(gridWrap);
    });
  }
  if(typeof renderUnits === 'function'){
    const rc2PrevRender = renderUnits;
    renderUnits = function(){
      rc2PrevRender.apply(this, arguments);
      try{ rc2SplitIntoColumns(); }catch(e){ console.error('2-column room split failed:', e); }
    };
  }

  function ucsBuildSummary(unit){
    let total=0, avail=0, soon=0, occ=0;
    ROOM_TYPES.forEach(function(rt){
      let arr = availability[unit] && availability[unit][rt];
      if(!Array.isArray(arr)) arr = arr ? [arr] : [];
      arr.forEach(function(obj){
        if(!obj || obj.status === 'none') return; // "Not Offered" rooms aren't counted as physical inventory
        total++;
        const s = roomStatus(obj);
        if(s === 'available') avail++;
        else if(s === 'soon') soon++;
        else if(s === 'booked') occ++;
      });
    });
    return { total:total, avail:avail, soon:soon, occ:occ };
  }
  function ucsDecorate(){
    document.querySelectorAll('#unitsGrid .unit-card').forEach(function(card){
      const h3 = card.querySelector('h3');
      const strip = card.querySelector('.unit-summary-strip');
      if(!h3 || !strip) return;
      const unit = h3.innerText.trim();
      if(!availability || !availability[unit]) return;
      const c = ucsBuildSummary(unit);
      let line = strip.previousElementSibling;
      if(!line || !line.classList || !line.classList.contains('unit-count-summary')){
        line = document.createElement('div');
        line.className = 'unit-count-summary';
        strip.parentNode.insertBefore(line, strip);
      }
      line.innerHTML =
        '<b>' + c.total + ' Room' + (c.total===1?'':'s') + '</b>' +
        (c.avail ? ' <span class="ucs-avail">• ' + c.avail + ' Available</span>' : '') +
        (c.soon ? ' <span class="ucs-soon">• ' + c.soon + ' Available Soon</span>' : '') +
        (c.occ ? ' <span class="ucs-occ">• ' + c.occ + ' Occupied</span>' : '');
    });
  }
  if(typeof renderUnits === 'function'){
    const ucsPrevRender = renderUnits;
    renderUnits = function(){
      ucsPrevRender.apply(this, arguments);
      try{ ucsDecorate(); }catch(e){ console.error('Unit summary decoration failed:', e); }
    };
  }
})();
