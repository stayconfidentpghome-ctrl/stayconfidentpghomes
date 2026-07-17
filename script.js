/* ===== Extracted <script> block 2 ===== */
const UNITS = ["Vintage", "Classic", "Cosmos", "Oxo", "Hi5", "Rooftop", "Elite", "C9", "GreenDen", "InnerPeace", "O2", "GreenTop", "VelHeaven", "AVM'sPride", "Flames", "Titans", "Phoenix", "Bodhi"];
const ROOM_TYPES = ["1AC", "2AC", "3AC", "1NAC", "2NAC", "3NAC"];
let ADMIN_PIN = localStorage.getItem("adminPIN") || "1234";
let isAdmin = false;
let adminPhone = "919999999999"; // fallback default, overwritten by saved value

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

async function storageSetWithRetry(key, value, shared, label, attempts){
  attempts = attempts || 3;
  for(let i=0;i<attempts;i++){
    try{
      await window.storage.set(key, value, shared);
      return true;
    }catch(e){
      console.error(`storage.set('${key}') attempt ${i+1}/${attempts} failed:`, e);
      if(i < attempts-1) await new Promise(r=>setTimeout(r, 400*(i+1)));
    }
  }
  showSaveStatus(`⚠️ Couldn't save ${label||'your change'} — please try again.`, true);
  return false;
}

// ---------- storage helpers ----------
async function loadAvailability(){
  try{
    const res = await window.storage.get('availability', true);
    return res ? JSON.parse(res.value) : null;
  }catch(e){ return null; }
}
async function saveAvailability(data){
  await storageSetWithRetry('availability', JSON.stringify(data), true, 'room availability');
}
async function loadAdminPhone(){
  try{
    const res = await window.storage.get('adminPhone', true);
    return res ? res.value : null;
  }catch(e){ return null; }
}
async function saveAdminPhoneToStorage(phone){
  await storageSetWithRetry('adminPhone', phone, true, 'the contact number');
}
async function loadPaymentInfo(){
  try{
    const res = await window.storage.get('paymentInfo', true);
    return res ? JSON.parse(res.value) : null;
  }catch(e){ return null; }
}
async function savePaymentInfo(info){
  await storageSetWithRetry('paymentInfo', JSON.stringify(info), true, 'the UPI payment details');
}

function defaultAvailability(){
 const data={};
 UNITS.forEach(u=>{data[u]={};ROOM_TYPES.forEach(rt=>{
   const n=parseInt(rt[0]); data[u][rt]={beds:Array(n).fill(false)};
 });}); return data;
}
function roomStatus(obj){if(obj.status==='none') return 'none'; if(obj.beds.every(b=>b) && obj.noticeDate) return 'soon'; return obj.beds.every(b=>b)?'booked':'available';}


let availability = null;

async function initAvailability(){
  let data = await loadAvailability();
  if(!data){
    data = defaultAvailability();
    await saveAvailability(data);
  }
  availability = data;
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
const grid=document.getElementById('unitsGrid');grid.innerHTML='';
UNITS.forEach((unit,unitIdx)=>{const card=document.createElement('div');card.className='unit-card reveal-stagger';card.style.setProperty('--stagger-i', Math.min(unitIdx,12));let html='';
ROOM_TYPES.forEach(rt=>{let obj=availability[unit][rt]; if(typeof obj==='string') obj={beds:Array(parseInt(rt[0])).fill(false),status:obj}; if(!obj.status) obj.status='available'; const occ=obj.beds.filter(Boolean).length,total=obj.beds.length,status=roomStatus(obj);
let adminSel=isAdmin?`<select onchange="changeRoomStatus('${unit}','${rt}',this.value)"><option value="available" ${obj.status==='available'?'selected':''}>Available</option><option value="soon" ${obj.status==='soon'?'selected':''}>Available Soon</option><option value="none" ${obj.status==='none'?'selected':''}>Not Offered</option></select><br><input type='date' value='${obj.noticeDate||""}' onchange="setNoticeDate('${unit}','${rt}',this.value)" style='font-size:11px'>`:'';
const enqCount=enquiryCountFor(unit,rt);
html+=`<div class="room-row ${status==='none'?'is-none':''}" style="display:block"><div style="display:flex;justify-content:space-between"><b>${rt}</b><div>${adminSel} <span class="badge ${status==='booked'?'booked':status==='soon'?'soon':status==='none'?'none':'available'}">${status==='booked'?'Booked':status==='soon'?'Available Soon':status==='none'?'Not Offered':'Available'}</span></div></div><div class="stats-mini">Occupied ${occ}/${total}${obj.noticeDate?` | 📅 Ready from ${obj.noticeDate}`:''}${status==='soon'?' | ⏳ Available Soon':''}</div><div class="enquiry-container" data-u="${unit}" data-r="${rt}">🔥 ${enqCount} interested
<div class="enquiry-tooltip">
🔥 <b><span class="enquiry-count">${enqCount}</span> people</b> are already interested in this slot — book soon to secure your spot!<br>
<button class="enquiry-edit-btn" onclick="editEnquiry(this)">✏️ Edit count</button>
</div>
</div><div class="progress"><div style="width:${occ/total*100}%"></div></div><div class="bed-layout">`+obj.beds.map((b,i)=>`<span class="bed ${b?'occ':'free'}" data-u="${unit}" data-r="${rt}" data-i="${i}" ${obj.status==='none'?'style="pointer-events:none;opacity:.4"':''}>🛏️</span>`).join('')+`</div></div>`; availability[unit][rt]=obj;}); card.innerHTML=`<h3>${unit}</h3>`+html;grid.appendChild(card);});
document.querySelectorAll('.bed').forEach(b=>b.onclick=async()=>{if(!isAdmin) return; let o=availability[b.dataset.u][b.dataset.r]; if(o.status==='none') return; o.beds[b.dataset.i]=!o.beds[b.dataset.i]; await saveAvailability(availability); renderUnits();});}
async function setNoticeDate(u,r,v){availability[u][r].noticeDate=v; await saveAvailability(availability); renderUnits();}
async function changeRoomStatus(u,r,v){availability[u][r].status=v; await saveAvailability(availability); renderUnits();}
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
    document.getElementById('adminSettings').style.display = 'block';
    document.getElementById('adminEditNote').style.display = 'block';
    document.getElementById('currentMobile').value = adminPhone;
    document.getElementById('upiIdInput').value = upiId;
    document.getElementById('upiPayeeInput').value = upiPayeeName;
    document.getElementById('razorpayKeyInput').value = razorpayKeyId;
    renderUnits();
    renderUnitLocations();
  }else{
    alert('Incorrect PIN');
  }
}

function adminLogout(){isAdmin=false;document.body.classList.remove('admin-mode');document.getElementById('adminStatusPill').textContent='Locked';document.getElementById('adminSettings').style.display='none';renderUnits();renderUnitLocations();}
function changeAdminPin(){const o=document.getElementById('oldPin').value;const n=document.getElementById('newPin').value;const c=document.getElementById('confirmPin').value;if(o!==ADMIN_PIN){alert('Current PIN incorrect');return;}if(n!==c){alert('PIN mismatch');return;}localStorage.setItem('adminPIN',n);ADMIN_PIN=n;alert('PIN changed successfully');}


async function changeAdminPhone(){
 const current=document.getElementById('currentMobile').value.trim();
 const newMobile=document.getElementById('adminPhone').value.trim();
 const confirm=document.getElementById('confirmMobile').value.trim();
 if(current!==adminPhone){alert('Current mobile number incorrect');return;}
 if(newMobile!==confirm){alert('Mobile numbers do not match');return;}
 adminPhone=newMobile;
 await saveAdminPhoneToStorage(newMobile);
 updateContactLinks();
 document.getElementById('currentMobile').value=newMobile;
 document.getElementById('adminPhone').value='';
 document.getElementById('confirmMobile').value='';
 alert('Mobile number changed successfully');
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
function populateSelects(){
  const u = document.getElementById('bookUnit');
  UNITS.forEach(unit=>{
    const o = document.createElement('option');
    o.value = unit; o.textContent = unit;
    u.appendChild(o);
  });
  u.addEventListener('change', ()=> populateRoomTypesForUnit(u.value));
  populateRoomTypesForUnit(u.value);
}

function populateRoomTypesForUnit(unit){
  const rtSelect = document.getElementById('bookRoomType');
  rtSelect.innerHTML = '';
  const offered = ROOM_TYPES.filter(rt=>{
    const status = (availability && availability[unit] && availability[unit][rt]) || 'available';
    return status !== 'none';
  });
  if(offered.length === 0){
    const o = document.createElement('option');
    o.value = ''; o.textContent = 'No room types available in this unit';
    rtSelect.appendChild(o);
    return;
  }
  offered.forEach(rt=>{
    const status = (availability && availability[unit] && availability[unit][rt]) || 'available';
    const o = document.createElement('option');
    o.value = rt;
    o.textContent = rt + (status === 'booked' ? ' (Booked - waitlist)' : '');
    rtSelect.appendChild(o);
  });
}

async function sendBooking(){
  const unit = document.getElementById('bookUnit').value;
  const rt = document.getElementById('bookRoomType').value;
  const date = document.getElementById('bookDate').value;
  const name = document.getElementById('bookName').value.trim();
  const phone = document.getElementById('bookPhone').value.trim();
  const email = document.getElementById('bookEmail').value.trim();
  const msg = document.getElementById('bookMsg').value.trim();

  if(!rt || !date || !name || !phone){
    document.getElementById('bookStatus').textContent = 'Please select a room type and fill date, name and phone number.';
    return;
  }

  const text = `New Room Booking Request - Stay Confident PG Homes
Unit: ${unit}
Room Type: ${rt}
Date of Joining: ${date}
Name: ${name}
Phone: ${phone}
Email: ${email || '-'}
Message: ${msg || '-'}`;

  const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  document.getElementById('bookStatus').textContent = 'Opening WhatsApp to send your request to admin...';
  if(window.fireConfetti) window.fireConfetti();
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
  if(!data){ data = defaultAvailability(); await saveAvailability(data); }
  availability = data;
  populateRoomTypesForUnit(document.getElementById('bookUnit').value);
  await initUnitLocation();
};

/* ================= Unit Locations (per-unit, shared, accurate) ================= */
let unitLocations = {};

async function loadUnitLocations(){
  try{ const r = await window.storage.get('unitLocations', true); return r ? JSON.parse(r.value) : {}; }
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
function toEmbedUrl(link){
  if(!isUsableMapsLink(link)) return null;
  if(link.includes('output=embed')) return link;
  if(/(^|\.)goo\.gl$/i.test((function(){ try{ return new URL(link).hostname; }catch(e){ return ''; } })())){
    return null;
  }

  const coordMatch = link.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if(coordMatch){
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=16&output=embed`;
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
    const embedUrl = usableLink ? toEmbedUrl(usableLink) : null;

    const card = document.createElement('div');
    card.className = 'loc-card reveal-stagger';
    card.dataset.unit = unit;
    card.style.setProperty('--stagger-i', Math.min(unitIdx, 12));

    const safeUnit = escapeHtml(unit);
    const safeRawLink = escapeHtml(rawLink);
    const safeUsableLink = escapeHtml(usableLink);

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
          ? `<a class="primary" href="${safeUsableLink}" target="_blank" rel="noopener noreferrer">📍 Open in Google Maps</a>`
          : `<button type="button" class="loc-open-disabled" disabled aria-disabled="true">📍 Location Not Available</button>`}
      </div>
      ${usableLink && embedUrl ? `<div class="map-wrap"><iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${escapeHtml(embedUrl)}"></iframe></div>` : ''}
      ${usableLink && !embedUrl ? '<div class="loc-empty">Live preview isn\u2019t available for shortened links — tap "Open in Google Maps" above.</div>' : ''}
      ${editorHtml}
    `;
    list.appendChild(card);
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

/* ===== Extracted <script> block 3 ===== */
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
  try{ const r = await window.storage.get('roomMeta', true); return r ? JSON.parse(r.value) : {}; }
  catch(e){ return {}; }
}
async function saveMeta(){
  await storageSetWithRetry('roomMeta', JSON.stringify(roomMeta), true, 'the pricing/room details');
}

function meta(u,r){
  roomMeta[u]=roomMeta[u]||{};
  if(!roomMeta[u][r]){
    const d = DEFAULT_RENT[r] || {deposit:3000, baseRent:5000, utility:1000};
    roomMeta[u][r] = {deposit:d.deposit, baseRent:d.baseRent, utility:d.utility, toilets:[]};
  }
  return roomMeta[u][r];
}

/* ================= "Interested" / enquiry counters — shared, persistent, admin-editable ================= */
let enquiryCounts = {};

async function loadEnquiryCounts(){
  try{ const r = await window.storage.get('enquiryCounts', true); return r ? JSON.parse(r.value) : {}; }
  catch(e){ return {}; }
}
async function saveEnquiryCounts(){
  await storageSetWithRetry('enquiryCounts', JSON.stringify(enquiryCounts), true, 'the interest count');
}
function defaultEnquiryCount(unit, rt){
  let s = unit + rt, h = 0;
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return 2 + (h % 8); /* a believable 2–9 range, stable per room until admin edits it */
}
function enquiryCountFor(unit, rt){
  const key = unit + '|' + rt;
  if(enquiryCounts[key] === undefined) enquiryCounts[key] = defaultEnquiryCount(unit, rt);
  return enquiryCounts[key];
}

const _render=renderUnits;
renderUnits=function(){_render();document.querySelectorAll('.unit-card').forEach(card=>{const unit=card.querySelector('h3').innerText;card.querySelectorAll('.room-row').forEach(rr=>{const rt=rr.querySelector('b')?.innerText;if(!rt)return;const m=meta(unit,rt);const total=(+m.baseRent||0)+(+m.utility||0); const ac=(rt.includes('AC')&&!rt.includes('NAC'))?'❄️ AC Room':'';if(!isAdmin&&availability[unit][rt].status==='none'){rr.style.display='none';return;}if(rr.querySelector('.pricing-box'))return;let d=document.createElement('div');d.className='pricing-box';d.style='margin-top:8px;font-size:12px';if(isAdmin){d.innerHTML=`💵 Deposit Amount:<input style="width:70px" value="${m.deposit||0}" onchange="meta('${unit}','${rt}').deposit=this.value;saveMeta();renderUnits()"> 💰 Base Rent:<input style="width:70px" value="${m.baseRent}" onchange="meta('${unit}','${rt}').baseRent=this.value;saveMeta();renderUnits()"> ⚡ Utility Charges:<input style="width:70px" value="${m.utility}" onchange="meta('${unit}','${rt}').utility=this.value;saveMeta();renderUnits()"><br>🧾 Total Monthly Rent: ₹${total} ${ac}<br><label><input type=checkbox ${(m.toilets||[]).includes('Western')?'checked':''} onchange="let a=meta('${unit}','${rt}').toilets;this.checked?!a.includes('Western')&&a.push('Western'):meta('${unit}','${rt}').toilets=a.filter(x=>x!='Western');saveMeta();renderUnits()">🚽 Western Toilet</label> <label><input type=checkbox ${(m.toilets||[]).includes('Indian')?'checked':''} onchange="let a=meta('${unit}','${rt}').toilets;this.checked?!a.includes('Indian')&&a.push('Indian'):meta('${unit}','${rt}').toilets=a.filter(x=>x!='Indian');saveMeta();renderUnits()">🚾 Indian Toilet</label><br><label><input type=checkbox ${m.kitchen?'checked':''} onchange="meta('${unit}','${rt}').kitchen=this.checked;saveMeta();renderUnits()">🍳 Kitchen</label> <label><input type=checkbox ${m.electric?'checked':''} onchange="meta('${unit}','${rt}').electric=this.checked;saveMeta();renderUnits()">⚡🍳 Electric Stove</label> <label><input type=checkbox ${m.gas?'checked':''} onchange="meta('${unit}','${rt}').gas=this.checked;saveMeta();renderUnits()">🔥🍳 Gas Stove</label>`;}else{d.innerHTML=`<div>💵 Deposit Amount: ₹${m.deposit||0} | 💰 Base Rent: ₹${m.baseRent} | ⚡ Utility Charges: ₹${m.utility}</div><div>🧾 Total Monthly Rent: ₹${total} ${ac}</div><div>${(m.toilets||[]).includes('Western')?'🚽 Western Toilet':''} ${(m.toilets||[]).includes('Indian')?'🚾 Indian Toilet':''}</div><div>${m.kitchen?'🍳 Kitchen':''} ${m.electric?'⚡🍳 Electric Stove':''} ${m.gas?'🔥🍳 Gas Stove':''}</div>`;}rr.appendChild(d);});});}
window.addRoom=function(unit,room){if(!UNITS.includes(unit)){UNITS.push(unit);availability[unit]={};}availability[unit][room]={beds:Array(parseInt(room[0])).fill(false),status:'available'};saveAvailability(availability);renderUnits();}

// NOTE: this used to auto-run immediately and call renderUnits() itself. Same race
// condition as above — moved into a plain function, run once at the bottom of the file.
window.__initPricing = async function(){
  roomMeta = await loadRoomMeta();
  enquiryCounts = await loadEnquiryCounts();
};

/* ===== Extracted <script> block 4 ===== */
async function editEnquiry(btn){
 const container=btn.closest('.enquiry-container');
 const u=container.dataset.u, r=container.dataset.r;
 const span=btn.parentElement.querySelector('.enquiry-count');
 let v=prompt('How many people have enquired about this slot?', span.innerText);
 if(v!==null && !isNaN(v) && v.trim()!==''){
   enquiryCounts[u+'|'+r] = Math.max(0, parseInt(v));
   await saveEnquiryCounts();
   renderUnits();
 }
}

/* ===== Extracted <script> block 5 ===== */
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
  try{ const r=await window.storage.get('prefQuestions', true); return r?JSON.parse(r.value):null; }catch(e){ return null; }
}
async function savePrefQuestions(q){
  await storageSetWithRetry('prefQuestions', JSON.stringify(q), true, 'the preference questions');
}
async function loadUserPrefAnswers(){
  try{ const r=await window.storage.get('userPrefAnswers', false); return r?JSON.parse(r.value):null; }catch(e){ return null; }
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
      (item.options||[]).forEach(opt=>{const o=document.createElement('option'); o.value=opt; o.textContent=opt; sel.appendChild(o);});
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
    if(item.type==='select') userPrefs[item.id+'Idx']=el.selectedIndex;
    else if(item.type==='date') userPrefs.movein=el.value;
  });
  saveUserPrefAnswers(userPrefs);
  markPrefModalShown();
  closePrefModal();
  document.getElementById('prefSummary').style.display='flex';
  filterRoomsByPreferences();
  /* Scroll to the filtered Room Availability results once the popup has faded out */
  setTimeout(()=>{
    const target = document.getElementById('unitsGrid') || document.getElementById('availability');
    if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
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
      if(show && userPrefs.sharingIdx!==undefined && userPrefs.sharingIdx<3){
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
        let m=null; try{ m = (typeof meta==='function') ? meta(unitName, rt) : null; }catch(e){}
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
      if(item.type==='select' && userPrefs[item.id+'Idx']!==undefined) el.selectedIndex = userPrefs[item.id+'Idx'];
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

/* ===== Extracted <script> block 6 ===== */
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
  }catch(e){
    console.error('Init error:', e);
  }
  if(typeof renderUnits==='function'){
    renderUnits();
  }
},{ once:true });

/* ===== Extracted <script> block 8 ===== */
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

/* ===== Extracted <script> block 9 ===== */
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

/* ===== Extracted <script> block 10 ===== */
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

/* ===== Extracted <script> block 11 ===== */
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

  /* ---------- 2. Room-status helper (reuses existing roomStatus() if present) ---------- */
  function computeCounts(){
    var counts = { available:0, booked:0, soon:0, none:0, total:0 };
    if (typeof availability === 'undefined' || !availability) return counts;
    Object.keys(availability).forEach(function(u){
      Object.keys(availability[u]).forEach(function(r){
        var o = availability[u][r];
        if (typeof o !== 'object') return;
        counts.total++;
        var st = (typeof roomStatus === 'function') ? roomStatus(o) : (o.status || 'available');
        counts[st] = (counts[st] || 0) + 1;
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

    var cue = document.createElement('div');
    cue.id = 'pwScrollCue';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = '⌄';
    header.appendChild(cue);
    cue.addEventListener('click', function(){
      var nav = document.querySelector('nav');
      if (nav) nav.scrollIntoView({ behavior:'smooth', block:'start' });
    });

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
      ['🎧', '24×7 Customer Assistance', 'Average response time: within 30 minutes']
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
    if (!document.getElementById('pwDashboard')) return;
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
    '<button type="button" id="pwFabToggle" aria-label="Quick actions" aria-expanded="false">➕</button>' +
    '<button type="button" class="pw-fab-item pw-fab-wa" aria-label="WhatsApp us"><span class="pw-fab-ic">💬</span> WhatsApp</button>' +
    '<button type="button" class="pw-fab-item pw-fab-call" aria-label="Call us"><span class="pw-fab-ic">📞</span> Call</button>' +
    '<button type="button" class="pw-fab-item pw-fab-book" aria-label="Book a room"><span class="pw-fab-ic">🔑</span> Book</button>' +
    '<button type="button" class="pw-fab-item pw-fab-map" aria-label="View locations"><span class="pw-fab-ic">📍</span> Map</button>';
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

/* ===== Extracted <script> block 12 ===== */
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

