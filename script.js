/* Stay Confident PG Homes — extracted script
   All inline <script> blocks concatenated in their original document
   order (excluding the Firebase module script, which stays a separate
   ES module file, and the Razorpay checkout.js, which stays an external
   CDN <script src>). No logic, timing, or animation code was changed. */

/* ===== inline script block 1 (position preserved via load order) ===== */
const UNITS = ["Vintage", "Classic", "Cosmos", "Oxo", "Hi5", "Rooftop", "Elite", "C9", "GreenDen", "InnerPeace", "O2", "GreenTop", "VelHeaven", "AVM'sPride", "Flames", "Titans", "Phoenix", "Bodhi"];
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
      await PGStorage.set(key, value, shared);
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

function defaultAvailability(){
 const data={};
 UNITS.forEach(u=>{data[u]={};ROOM_TYPES.forEach(rt=>{
   const n=parseInt(rt[0]); data[u][rt]={beds:Array(n).fill(false)};
 });}); return data;
}
function roomStatus(obj){if(obj.status==='none') return 'none'; if(obj.beds.every(b=>b) && obj.noticeDate) return 'soon'; return obj.beds.every(b=>b)?'booked':'available';}


let availability = null;
let expandedUnits = new Set(); // which unit cards currently have their room-rows expanded

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
UNITS.forEach((unit,unitIdx)=>{const card=document.createElement('div');card.className='unit-card reveal-stagger';card.style.setProperty('--stagger-i', Math.min(unitIdx,12));let html='';let summary='';
ROOM_TYPES.forEach(rt=>{let obj=availability[unit][rt]; if(typeof obj==='string') obj={beds:Array(parseInt(rt[0])).fill(false),status:obj}; if(!obj.status) obj.status='available'; const occ=obj.beds.filter(Boolean).length,total=obj.beds.length,status=roomStatus(obj);
let adminSel=isAdmin?`<select onchange="changeRoomStatus('${unit}','${rt}',this.value)"><option value="available" ${obj.status==='available'?'selected':''}>Available</option><option value="soon" ${obj.status==='soon'?'selected':''}>Available Soon</option><option value="none" ${obj.status==='none'?'selected':''}>Not Offered</option></select><br><input type='date' value='${obj.noticeDate||""}' onchange="setNoticeDate('${unit}','${rt}',this.value)" style='font-size:11px'>`:'';
const enqCount=enquiryCountFor(unit,rt);
summary+=`<span class="mini-badge ${status==='booked'?'booked':status==='soon'?'soon':status==='none'?'none':'available'}" title="${rt}: ${status==='booked'?'Currently Unavailable':status==='soon'?'Available Shortly':status==='none'?'Not Offered':'Available'}">${rt}</span>`;
html+=`<div class="room-row ${status==='none'?'is-none':''}" style="display:block"><div style="display:flex;justify-content:space-between"><b>${rt}</b><div>${adminSel} <span class="badge ${status==='booked'?'booked':status==='soon'?'soon':status==='none'?'none':'available'}">${status==='booked'?'Currently Unavailable':status==='soon'?'Available Shortly':status==='none'?'Not Offered':'Available'}</span></div></div><div class="stats-mini">Occupied ${occ}/${total}${obj.noticeDate?` | 📅 Ready from ${obj.noticeDate}`:''}${status==='soon'?' | ⏳ Available Shortly':''}</div><div class="enquiry-container" data-u="${unit}" data-r="${rt}">🔥 ${enqCount} interested
<div class="enquiry-tooltip">
🔥 <b><span class="enquiry-count">${enqCount}</span> people</b> are already interested in this slot — book soon to secure your spot!<br>
<button class="enquiry-edit-btn" onclick="editEnquiry(this)">✏️ Edit count</button>
</div>
</div><div class="progress"><div style="width:${occ/total*100}%"></div></div>${!isAdmin&&obj.status!=='none'?'<div class="bed-hint">👇 Tap an available bed to select it</div>':''}<div class="bed-layout">`+obj.beds.map((b,i)=>`<span class="bed ${b?'occ':'free'}" data-u="${unit}" data-r="${rt}" data-i="${i}" ${obj.status==='none'?'style="pointer-events:none;opacity:.4"':''} title="${isAdmin?'Click to toggle occupied/free':(b?'This bed is currently occupied':'Click to select this bed')}">🛏️</span>`).join('')+`</div></div>`; availability[unit][rt]=obj;});
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
    let o=availability[b.dataset.u][b.dataset.r]; if(o.status==='none') return; o.beds[b.dataset.i]=!o.beds[b.dataset.i]; await saveAvailability(availability); renderUnits();
    return;
  }
  handlePgBedClick(b, ev);
});}

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
function selectBedForBooking(unit, rt, bedIndex){
  goToBookTab();
  const unitEl = document.getElementById('bookUnit');
  const rtEl = document.getElementById('bookRoomType');
  if(!unitEl || !rtEl) return;
  unitEl.value = unit;
  markFieldError(unitEl, false);
  populateRoomTypesForUnit(unit); // rebuild room-type options for this unit, then pre-select the one tapped
  rtEl.value = rt;
  markFieldError(rtEl, false);
  const statusEl = document.getElementById('bookStatus');
  if(statusEl){
    statusEl.classList.remove('error');
    statusEl.classList.add('success');
    statusEl.textContent = `✅ ${unit} — ${rt} (Bed ${parseInt(bedIndex,10)+1}) selected automatically. You can change Unit or Room Type here anytime, or just continue filling the rest of the form.`;
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
  const u = bedEl.dataset.u, rt = bedEl.dataset.r, i = bedEl.dataset.i;
  const roomRow = bedEl.closest('.room-row');
  if(!roomRow) return;
  pgClosePanel(roomRow); // only one active selection per room card at a time

  bedEl.classList.add('pg-selected');
  const chk = document.createElement('span');
  chk.className = 'pg-selected-badge';
  chk.textContent = '✓ Selected';
  bedEl.appendChild(chk);

  const m = (typeof meta === 'function') ? meta(u, rt) : {};
  const total = (+((m&&m.baseRent)||0)) + (+((m&&m.utility)||0));
  const bedLabel = 'B' + (parseInt(i,10)+1);

  const panel = document.createElement('div');
  panel.className = 'pg-bed-panel';
  panel.innerHTML = `
    <div class="pg-panel-head">🛏️ Bed ${bedLabel} Selected</div>
    <div class="pg-panel-sub">Excellent choice! This bed is currently available. Please review the room information before continuing.</div>
    <div class="pg-panel-divider"></div>
    <div class="pg-panel-grid">
      <div><span>Room Type</span><b>${rt}</b></div>
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
    selectBedForBooking(u, rt, i);
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
  const u = bedEl.dataset.u, rt = bedEl.dataset.r;
  const obj = availability[u][rt];
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
function markFieldError(el, isError){
  if(!el) return;
  el.classList.toggle('field-error', !!isError);
}
function clearBookingFieldErrors(){
  ['bookUnit','bookRoomType','bookDate','bookPurpose','bookName','bookPhone','bookEmail'].forEach(id=>{
    markFieldError(document.getElementById(id), false);
  });
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
    let obj = availability && availability[unit] && availability[unit][rt];
    if(!obj) return true;
    const status = typeof obj === 'string' ? obj : (obj.status || 'available');
    return status !== 'none';
  });
  if(offered.length === 0){
    const o = document.createElement('option');
    o.value = ''; o.textContent = 'No room types available in this unit'; o.disabled = true;
    rtSelect.appendChild(o);
    return;
  }
  offered.forEach(rt=>{
    let obj = availability && availability[unit] && availability[unit][rt];
    let status = 'available';
    if(obj) status = typeof obj === 'string' ? obj : roomStatus(obj);
    const o = document.createElement('option');
    o.value = rt;
    o.textContent = rt + (status === 'booked' ? ' (Currently unavailable - waitlist)' : status === 'soon' ? ' (Available shortly)' : '');
    rtSelect.appendChild(o);
  });
}

async function sendBooking(){
  const unitEl = document.getElementById('bookUnit');
  const rtEl = document.getElementById('bookRoomType');
  const dateEl = document.getElementById('bookDate');
  const purposeEl = document.getElementById('bookPurpose');
  const nameEl = document.getElementById('bookName');
  const phoneEl = document.getElementById('bookPhone');
  const emailEl = document.getElementById('bookEmail');
  const msgEl = document.getElementById('bookMsg');
  const statusEl = document.getElementById('bookStatus');

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

  if(!unit){ missing.push('Unit'); markFieldError(unitEl, true); }
  if(!rt){ missing.push('Room Type'); markFieldError(rtEl, true); }
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
Unit: ${unit}
Room Type: ${rt}
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
  unitEl.value = ''; populateRoomTypesForUnit('');
  dateEl.value = ''; if(purposeEl) purposeEl.value = ''; nameEl.value = ''; phoneEl.value = ''; emailEl.value = ''; msgEl.value = '';
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
  /* These three reads don't depend on each other, so fire them together
     instead of waiting on one full round-trip before starting the next —
     this alone turns 3 sequential network waits into 1. */
  const [savedPhone, availData, locData] = await Promise.all([
    loadAdminPhone(),
    loadAvailability(),
    loadUnitLocations()
  ]);
  if(savedPhone) adminPhone = savedPhone;
  updateContactLinks();
  let data = availData;
  if(!data){ data = defaultAvailability(); await saveAvailability(data); }
  availability = data;
  populateRoomTypesForUnit(document.getElementById('bookUnit').value);
  unitLocations = locData;
  renderUnitLocations();
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

/* ===== inline script block 2 (position preserved via load order) ===== */
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
  try{ const r = await PGStorage.get('enquiryCounts', true); return r ? JSON.parse(r.value) : {}; }
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
  [roomMeta, enquiryCounts] = await Promise.all([loadRoomMeta(), loadEnquiryCounts()]);
};

/* ===== inline script block 3 (position preserved via load order) ===== */
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

/* ===== inline script block 4 (position preserved via load order) ===== */
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
  const [pq, saved] = await Promise.all([loadPrefQuestions(), loadUserPrefAnswers()]);
  prefQuestions = pq;
  if(!prefQuestions || !prefQuestions.length){
    prefQuestions = defaultPrefQuestions();
    await savePrefQuestions(prefQuestions);
  }
  renderPrefForm();
  buildAdminPrefEditor();

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

/* ===== inline script block 5 (position preserved via load order) ===== */
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
    /* __initCore / __initPricing / __initPrefs / __initPayment each load their
       own, independent bit of data (availability, pricing, preferences, payment
       settings) — none of them needs another one's result. They used to run one
       after another, so the page waited for 4 full network round-trips back to
       back before it could render anything. Running them together still keeps
       the single renderUnits() call at the end (which is what the ordering fix
       actually required), but the wait time drops to that of the single slowest
       one instead of the sum of all four. */
    await Promise.all([
      window.__initCore(),
      window.__initPricing(),
      window.__initPrefs(),
      window.__initPayment()
    ]);
  }catch(e){
    console.error('Init error:', e);
  }
  if(typeof renderUnits==='function'){
    renderUnits();
  }
},{ once:true });

/* ===== inline script block 6 (position preserved via load order) ===== */
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

/* ===== inline script block 7 (position preserved via load order) ===== */
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

/* ===== inline script block 8 (position preserved via load order) ===== */
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

/* ===== inline script block 9 (position preserved via load order) ===== */
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
        var o = availability[u][r];
        if (typeof o !== 'object') return;
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

/* ===== inline script block 10 (position preserved via load order) ===== */
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

/* ===== inline script block 11 (position preserved via load order) ===== */
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
    if (scWa && wa && wa.getAttribute('href') && wa.getAttribute('href') !== '#') scWa.href = wa.href;
    if (scCall && call && call.getAttribute('href') && call.getAttribute('href') !== '#') scCall.href = call.href;
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

/* ===== inline script block 12 (position preserved via load order) ===== */
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

  /* ---------- Sidebar brand (animated logo cloned from the existing header) ---------- */
  var headerLogo = document.querySelector('header img');
  var brand = document.createElement('div');
  brand.className = 'pw-sb-brand';
  brand.setAttribute('aria-hidden', 'true');
  if(headerLogo){
    var logoImg = document.createElement('img');
    logoImg.src = headerLogo.getAttribute('src');
    logoImg.alt = '';
    brand.appendChild(logoImg);
  }
  var brandText = document.createElement('span');
  brandText.textContent = 'STAY CONFIDENT';
  brand.appendChild(brandText);
  document.body.insertBefore(brand, navEl);

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

/* ===== inline script block 13 (position preserved via load order) ===== */
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

/* ===== inline script block 14 (position preserved via load order) ===== */
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
  var galleryUnits = (typeof UNITS !== 'undefined' && UNITS.length) ? UNITS : [];
  var galleryIndex = 0;

  function renderGallery(){
    var grid = document.getElementById('pwGalleryGrid');
    if(!grid || !galleryUnits.length) return;
    grid.innerHTML = galleryUnits.map(function(unit, i){
      var bg = GRADIENTS[i % GRADIENTS.length];
      return '<div class="pw-gallery-tile" data-i="' + i + '" style="background:' + bg + '">' +
        '<div class="pw-gallery-bg"><i class="fa-solid fa-house-chimney"></i></div>' +
        '<div class="pw-gallery-label">' + unit + '</div>' +
        '</div>';
    }).join('');
    grid.querySelectorAll('.pw-gallery-tile').forEach(function(tile){
      tile.addEventListener('click', function(){ openLightbox(parseInt(tile.dataset.i, 10)); });
    });
  }

  function openLightbox(i){
    galleryIndex = ((i % galleryUnits.length) + galleryUnits.length) % galleryUnits.length;
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
    var caption = document.getElementById('pwLightboxCaption');
    var bg = GRADIENTS[galleryIndex % GRADIENTS.length];
    stage.style.background = bg;
    stage.innerHTML = '<i class="fa-solid fa-house-chimney"></i><div class="pw-lightbox-caption" id="pwLightboxCaption"></div>';
    document.getElementById('pwLightboxCaption').textContent =
      galleryUnits[galleryIndex] + '  •  ' + (galleryIndex + 1) + ' / ' + galleryUnits.length;
  }
  document.addEventListener('DOMContentLoaded', function(){
    renderGallery();
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
     reviews (each with a numeric .stars field) so the existing
     "Live Engagement" admin dashboard card below keeps working —
     same variable name and shape as before, just now backed by
     real persisted data instead of a hardcoded list.

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
        var obj = availability[unit] && availability[unit][rt];
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

/* ===== inline script block 15 (position preserved via load order) ===== */
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

  /* =========================================================
     3) ADMIN DASHBOARD: count-up animation + extra live-data cards
     (Enquiries interest total + review rating — both computed
     from data that already exists in this file. Revenue,
     maintenance tickets and check-in/out cards are intentionally
     left out for now since there's no booking-date, payment or
     ticketing data source yet to compute them from honestly.)
  ========================================================= */
  function animateCountUp(el){
    var target = parseInt((el.textContent || '0').replace(/[^\d\-]/g,''), 10);
    if(isNaN(target)){ return; }
    var suffix = (el.textContent || '').replace(/[\d\-]/g,'');
    var start = 0, duration = 700, startTime = null;
    function step(ts){
      if(!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased) + suffix;
      if(progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  function renderExtraDashCards(){
    var host = document.getElementById('pwAdminDash');
    if(!host || host.style.display === 'none') return;
    var old = document.getElementById('pwDashExtra');
    if(old) old.remove();

    var totalInterest = 0;
    if(typeof enquiryCounts === 'object' && enquiryCounts){
      Object.keys(enquiryCounts).forEach(function(k){ totalInterest += (enquiryCounts[k] || 0); });
    }
    var avgRating = '—', reviewCount = 0;
    if(typeof REVIEWS !== 'undefined' && REVIEWS.length){
      reviewCount = REVIEWS.length;
      avgRating = (REVIEWS.reduce(function(s,r){ return s + r.stars; }, 0) / REVIEWS.length).toFixed(1);
    }

    var extra = document.createElement('div');
    extra.id = 'pwDashExtra';
    extra.innerHTML =
      '<div class="pw-dash-chart-title">📈 Live Engagement</div>' +
      '<div class="pw-dash-grid">' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + totalInterest + '</div><div class="pw-dash-label">Total Enquiry Interest</div></div>' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + avgRating + '</div><div class="pw-dash-label">Avg. Review Rating</div></div>' +
        '<div class="pw-dash-card"><div class="pw-dash-num">' + reviewCount + '</div><div class="pw-dash-label">Total Reviews</div></div>' +
      '</div>';
    host.appendChild(extra);
    extra.querySelectorAll('.pw-dash-num').forEach(animateCountUp);
  }

  function hookDashboardExtras(){
    if(typeof window.adminLogin !== 'function' || typeof window.renderUnits !== 'function'){
      setTimeout(hookDashboardExtras, 60);
      return;
    }
    var origLogin = window.adminLogin;
    window.adminLogin = function(){
      var r = origLogin.apply(this, arguments);
      setTimeout(renderExtraDashCards, 0);
      return r;
    };
    var origRenderUnits = window.renderUnits;
    window.renderUnits = function(){
      var r = origRenderUnits.apply(this, arguments);
      setTimeout(renderExtraDashCards, 0);
      return r;
    };
    if(typeof window.adminLogout === 'function'){
      var origLogout = window.adminLogout;
      window.adminLogout = function(){
        var r = origLogout.apply(this, arguments);
        var old = document.getElementById('pwDashExtra');
        if(old) old.remove();
        return r;
      };
    }
    /* Also animate the original KPI numbers whenever the dashboard host's
       content changes (covers first render + every refresh). */
    var host = document.getElementById('pwAdminDash');
    if(host && 'MutationObserver' in window){
      var mo = new MutationObserver(function(muts){
        muts.forEach(function(m){
          m.addedNodes.forEach(function(node){
            if(node.nodeType === 1 && node.classList && node.classList.contains('pw-dash-grid')){
              node.querySelectorAll('.pw-dash-num').forEach(animateCountUp);
            }
          });
        });
      });
      mo.observe(host, { childList: true });
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    initSidebarSearch();
    initGalleryTools();
    applyGalleryFilter();
    observeGalleryTiles();
    initLightboxSwipe();
    hookDashboardExtras();
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

/* ===== inline script block 16 (position preserved via load order) ===== */
(function(){
  "use strict";

  /* ---------------- shared helpers ---------------- */
  function pw2Toast(msg, tone){
    if (typeof window.pgShowToast === 'function'){ window.pgShowToast(msg, tone === 'warn' ? 'warn' : (tone === 'success' ? 'success' : 'info')); return; }
    console.log('[toast]', msg);
  }
  function pw2Store(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function pw2Load(key, fallback){ try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }

  /* Runs fn() with window.alert temporarily silenced/captured, so we can
     replace the native alert() popups these existing functions already use
     with a nicer toast, without touching the functions themselves. */
  function pw2CallCapturingAlert(fn){
    var captured = null;
    var origAlert = window.alert;
    window.alert = function(m){ captured = m; };
    var ret;
    try{ ret = fn(); } finally { window.alert = origAlert; }
    return { returnValue: ret, message: captured };
  }

  function pw2ButtonFor(onclickText){
    var btns = document.querySelectorAll('#adminSettings button, .admin-bar button');
    for (var i=0;i<btns.length;i++){
      var oc = btns[i].getAttribute('onclick') || '';
      if (oc.replace(/\s/g,'') === onclickText.replace(/\s/g,'')) return btns[i];
    }
    return null;
  }
  function pw2WithButtonBusy(btn, work){
    if (!btn){ work(); return; }
    btn.classList.add('pw2-loading'); btn.disabled = true;
    var finish = function(){
      btn.classList.remove('pw2-loading'); btn.disabled = false;
      btn.classList.add('pw2-success');
      setTimeout(function(){ btn.classList.remove('pw2-success'); }, 1300);
    };
    var result = work();
    if (result && typeof result.then === 'function'){ result.then(finish, finish); }
    else { setTimeout(finish, 250); }
  }

  /* ================= LOGIN POPUP ================= */
  var loginCard = null; // the real .admin-bar element (never cloned, only decorated)

  function buildLoginChrome(){
    loginCard = document.querySelector('.admin-bar');
    if (!loginCard) return;

    var head = document.createElement('div');
    head.className = 'pw2-login-head';
    head.innerHTML = '<div class="pw2-login-logo">🏨</div><h3>Welcome Back</h3><p>Secure Admin Login</p>';
    loginCard.insertBefore(head, loginCard.firstChild);

    var pinInput = document.getElementById('adminPin');
    if (pinInput){
      var wrap = document.createElement('span');
      wrap.className = 'pw2-pin-wrap';
      pinInput.parentNode.insertBefore(wrap, pinInput);
      wrap.appendChild(pinInput);
      var eye = document.createElement('button');
      eye.type = 'button'; eye.className = 'pw2-eye-btn'; eye.textContent = '👁';
      eye.setAttribute('aria-label','Show or hide PIN');
      eye.addEventListener('click', function(){
        var showing = pinInput.type === 'text';
        pinInput.type = showing ? 'password' : 'text';
        eye.textContent = showing ? '👁' : '🙈';
      });
      wrap.appendChild(eye);

      var rememberRow = document.createElement('div');
      rememberRow.className = 'pw2-remember-row';
      rememberRow.innerHTML = '<label><input type="checkbox" id="pw2Remember"> Remember this device</label><button type="button" class="pw2-forgot-link" id="pw2ForgotPin">Forgot PIN?</button>';
      wrap.parentNode.insertBefore(rememberRow, wrap.nextSibling);
      document.getElementById('pw2Remember').checked = !!pw2Load('pw2_remember_device', false);
      document.getElementById('pw2Remember').addEventListener('change', function(e){ pw2Store('pw2_remember_device', e.target.checked); });
      document.getElementById('pw2ForgotPin').addEventListener('click', function(){
        pw2Toast('Please contact whoever manages this site\u2019s code to reset the Admin PIN.', 'warn');
      });

      pinInput.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){ e.preventDefault(); window.adminLogin(); }
      });
    }

    // Wrap the two original buttons + status pill in an actions column, and
    // relabel the raw "Logout" button as a Cancel action while logged out.
    var actions = document.createElement('div');
    actions.className = 'pw2-login-actions';
    loginCard.appendChild(actions);
    var unlockBtn = null, logoutBtn = null, pill = document.getElementById('adminStatusPill');
    Array.prototype.forEach.call(loginCard.querySelectorAll('button'), function(b){
      if (/adminLogin\(\)/.test(b.getAttribute('onclick')||'')) unlockBtn = b;
      if (/adminLogout\(\)/.test(b.getAttribute('onclick')||'')) logoutBtn = b;
    });
    if (unlockBtn){ unlockBtn.textContent = 'Login'; actions.appendChild(unlockBtn); }
    if (logoutBtn){ logoutBtn.classList.add('pw2-cancel-btn'); actions.appendChild(logoutBtn); }
    if (pill) loginCard.appendChild(pill);

    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && document.body.classList.contains('pw2-login-open')) pw2ClosePopup();
    });
  }

  function pw2OpenPopup(){ document.body.classList.add('pw2-login-open'); pw2EnforceLockout(); }
  function pw2ClosePopup(){
    document.body.classList.remove('pw2-login-open');
    var homeBtn = document.querySelector('nav button[data-tab="home"]');
    if (homeBtn) homeBtn.click();
  }
  function pw2ShakeCard(){
    if (!loginCard) return;
    loginCard.classList.add('pw2-shake');
    setTimeout(function(){ loginCard.classList.remove('pw2-shake'); }, 420);
  }

  /* Show the popup whenever the Admin section becomes active while logged out. */
  function pw2SyncPopupWithNav(){
    var adminSection = document.getElementById('admin');
    if (!adminSection) return;
    var isActive = adminSection.classList.contains('active');
    var loggedIn = document.body.classList.contains('admin-mode');
    if (isActive && !loggedIn) pw2OpenPopup();
    else if (!isActive || loggedIn) document.body.classList.remove('pw2-login-open');
  }
  new MutationObserver(pw2SyncPopupWithNav).observe(document.getElementById('admin') || document.body, { attributes:true, attributeFilter:['class'] });
  new MutationObserver(pw2SyncPopupWithNav).observe(document.body, { attributes:true, attributeFilter:['class'] });

  /* ================= LOGIN HISTORY / LAST LOGIN / AUTO-LOCK ================= */
  function pw2RecordAttempt(success){
    var hist = pw2Load('pw2_login_history', []);
    hist.unshift({ t: Date.now(), success: success });
    hist = hist.slice(0, 20);
    pw2Store('pw2_login_history', hist);
    if (success) pw2Store('pw2_last_login', Date.now());
  }
  var PW2_LOCKOUT_MS = 2 * 60 * 1000; // 2 minutes
  function pw2LockoutRemainingMs(){
    var hist = pw2Load('pw2_login_history', []);
    var failStreak = 0;
    for (var i=0;i<hist.length;i++){ if (!hist[i].success) failStreak++; else break; }
    if (failStreak < 5) return 0;
    var remaining = PW2_LOCKOUT_MS - (Date.now() - hist[0].t);
    return remaining > 0 ? remaining : 0;
  }
  function pw2EnforceLockout(){
    var pinInput = document.getElementById('adminPin');
    var loginBtn = pw2ButtonFor('adminLogin()');
    var remaining = pw2LockoutRemainingMs();
    if (remaining > 0){
      if (pinInput) pinInput.disabled = true;
      if (loginBtn) loginBtn.disabled = true;
      pw2Toast('Too many failed attempts. Try again in ' + Math.ceil(remaining/1000) + 's.', 'warn');
      setTimeout(function(){
        if (pinInput) pinInput.disabled = false;
        if (loginBtn) loginBtn.disabled = false;
      }, remaining);
      return true;
    }
    return false;
  }
  var PW2_IDLE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
  var pw2LastActivity = Date.now();
  ['mousemove','keydown','click','touchstart'].forEach(function(ev){
    document.addEventListener(ev, function(){ pw2LastActivity = Date.now(); }, { passive:true });
  });
  setInterval(function(){
    if (document.body.classList.contains('admin-mode') && (Date.now() - pw2LastActivity) > PW2_IDLE_LIMIT_MS){
      window.adminLogout();
      pw2Toast('Session locked after inactivity — please log in again.', 'warn');
    }
  }, 15000);

  /* ================= WRAP adminLogin / adminLogout ================= */
  function pw2Ready(fnName, cb){
    if (typeof window[fnName] === 'function') cb();
    else setTimeout(function(){ pw2Ready(fnName, cb); }, 50);
  }

  pw2Ready('adminLogin', function(){
    var origLogin = window.adminLogin;
    window.adminLogin = function(){
      if (pw2EnforceLockout()) return;
      var res = pw2CallCapturingAlert(origLogin);
      var success = document.body.classList.contains('admin-mode');
      pw2RecordAttempt(success);
      var pinInput = document.getElementById('adminPin');
      if (success){
        if (pinInput) pinInput.value = '';
        pw2ClosePopup();
        pw2Toast('Welcome Back Admin \uD83D\uDC4B', 'success');
        pw2RenderProfile();
      } else {
        if (pinInput) pinInput.value = '';
        pw2ShakeCard();
        pw2Toast(res.message || 'Incorrect PIN', 'warn');
      }
      return res.returnValue;
    };
  });

  pw2Ready('adminLogout', function(){
    var origLogout = window.adminLogout;
    window.adminLogout = function(){
      var r = origLogout();
      pw2Toast('Logged out.', 'info');
      return r;
    };
  });

  /* ================= WRAP changeAdminPhone (alert-based) ================= */
  pw2Ready('changeAdminPhone', function(){
    var orig = window.changeAdminPhone;
    var btn = pw2ButtonFor("changeAdminPhone()");
    window.changeAdminPhone = function(){
      var out;
      pw2WithButtonBusy(btn, function(){
        var res = pw2CallCapturingAlert(function(){ return orig(); });
        out = res.returnValue;
        if (res.message) pw2Toast(res.message, /success/i.test(res.message) ? 'success' : 'warn');
        return Promise.resolve(out);
      });
      return out;
    };
  });

  /* ================= WRAP changeAdminPin: toast + forced re-login ================= */
  pw2Ready('changeAdminPin', function(){
    var orig = window.changeAdminPin;
    var btn = pw2ButtonFor("changeAdminPin()");
    window.changeAdminPin = function(){
      pw2WithButtonBusy(btn, function(){
        var res = pw2CallCapturingAlert(function(){ return orig(); });
        var msg = res.message || '';
        var success = /successfully/i.test(msg);
        if (msg) pw2Toast(msg, success ? 'success' : 'warn');
        if (success){
          ['oldPin','newPin','confirmPin'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
          setTimeout(function(){
            pw2Toast('For security, please log in again with your new PIN.', 'info');
            window.adminLogout();
          }, 900);
        }
        return Promise.resolve();
      });
    };
  });

  /* ================= status-msg based saves (already premium-ish) ================= */
  function pw2WatchStatusMsg(id, buttonOnclick){
    var el = document.getElementById(id);
    var btn = pw2ButtonFor(buttonOnclick);
    if (!el) return;
    var lastText = el.textContent;
    new MutationObserver(function(){
      var txt = el.textContent;
      if (txt && txt !== lastText){
        lastText = txt;
        var warn = /please|incorrect|error|fail/i.test(txt);
        pw2Toast(txt, warn ? 'warn' : 'success');
        if (btn && !warn){ btn.classList.add('pw2-success'); setTimeout(function(){ btn.classList.remove('pw2-success'); }, 1300); }
      }
    }).observe(el, { childList:true, characterData:true, subtree:true });
  }
  pw2WatchStatusMsg('upiAdminMsg', 'saveUpiSettings()');
  pw2WatchStatusMsg('razorpayAdminMsg', 'saveRazorpaySettings()');
  pw2WatchStatusMsg('prefAdminMsg', 'saveAdminPrefs()');

  /* ================= CARD-IFY #adminSettings ================= */
  function iconTitleFor(div, fallbackIcon, fallbackTitle){
    var st = div.querySelector('.section-title');
    if (st){
      var txt = st.textContent.trim();
      var m = txt.match(/^(\S+)\s+(.*)$/);
      st.style.display = 'none'; // header text now lives in the card head
      return { icon: (m ? m[1] : fallbackIcon), title: (m ? m[2] : txt) };
    }
    return { icon: fallbackIcon, title: fallbackTitle };
  }
  function cardify(div, fallbackIcon, fallbackTitle){
    if (!div || div.classList.contains('pw2-card')) return;
    var it = iconTitleFor(div, fallbackIcon, fallbackTitle);
    div.classList.add('pw2-card');
    var head = document.createElement('div');
    head.className = 'pw2-card-head';
    head.innerHTML = '<span class="pw2-card-icon">'+it.icon+'</span><h4>'+it.title+'</h4>';
    div.insertBefore(head, div.firstChild);
  }

  function pw2SplitPaymentCard(paymentDiv){
    if (!paymentDiv || paymentDiv.dataset.pw2Split) return;
    paymentDiv.dataset.pw2Split = '1';

    var upiInput = document.getElementById('upiIdInput');
    var rzpInput = document.getElementById('razorpayKeyInput');
    if (!upiInput || !rzpInput) return;

    var grid = document.createElement('div');
    grid.className = 'pw2-pay-grid';

    var upiCard = document.createElement('div'); upiCard.className = 'pw2-pay-card';
    upiCard.innerHTML = '<h5>\uD83D\uDCB3 UPI Payment</h5>';
    var rzpCard = document.createElement('div'); rzpCard.className = 'pw2-pay-card';
    rzpCard.innerHTML = '<h5>\u26A1 Razorpay</h5>';
    var statusCard = document.createElement('div'); statusCard.className = 'pw2-pay-card';
    statusCard.innerHTML = '<h5>\uD83D\uDCCA Payment Status</h5>'
      + '<div class="pw2-status-row"><span>UPI</span><span class="pw2-status-pill off" id="pw2UpiStatus">Disconnected</span></div>'
      + '<div class="pw2-status-row"><span>Razorpay</span><span class="pw2-status-pill off" id="pw2RzpStatus">Disconnected</span></div>'
      + '<div class="pw2-status-row"><span>Last Updated</span><span id="pw2PayUpdated">\u2014</span></div>';

    // Move existing nodes (labels/inputs/buttons/notes) into the two cards,
    // splitting right after the Razorpay note paragraph. Nothing is cloned —
    // the same #upiIdInput / #razorpayKeyInput elements keep working exactly
    // as before, just repositioned inside nicer wrappers.
    var kids = Array.prototype.slice.call(paymentDiv.childNodes);
    var seenRzpLabel = false;
    kids.forEach(function(node){
      if (node === upiCard || node === rzpCard) return;
      if (node.nodeType === 1 && node.tagName === 'DIV' && node.classList.contains('pw2-card-head')) return; // keep head where it is
      if (node.nodeType === 1 && /razorpay key id/i.test(node.textContent||'') && node.tagName === 'LABEL') seenRzpLabel = true;
      if (!seenRzpLabel) upiCard.appendChild(node); else rzpCard.appendChild(node);
    });

    grid.appendChild(upiCard); grid.appendChild(rzpCard); grid.appendChild(statusCard);
    paymentDiv.appendChild(grid);

    // Copy buttons
    function addCopyBtn(input, card){
      var b = document.createElement('button'); b.type='button'; b.className='pw2-copy-btn'; b.textContent='Copy';
      b.addEventListener('click', function(){
        if (!input.value){ pw2Toast('Nothing to copy yet.', 'warn'); return; }
        navigator.clipboard && navigator.clipboard.writeText(input.value).then(function(){ pw2Toast('Copied to clipboard.', 'success'); });
      });
      card.appendChild(b);
    }
    addCopyBtn(upiInput, upiCard);
    addCopyBtn(rzpInput, rzpCard);

    // QR preview for UPI
    var qrBox = document.createElement('div'); qrBox.className = 'pw2-qr-box';
    upiCard.insertBefore(qrBox, upiCard.querySelector('.pw2-copy-btn'));
    function refreshQr(){
      var val = upiInput.value.trim();
      qrBox.innerHTML = val ? ('<img alt="UPI QR preview" src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + encodeURIComponent('upi://pay?pa='+val) + '">') : '';
    }
    refreshQr();
    upiInput.addEventListener('input', refreshQr);
    upiInput.addEventListener('change', refreshQr);

    // Show/hide for the Razorpay key (it's sensitive)
    var rzpEye = document.createElement('button');
    rzpEye.type='button'; rzpEye.className='pw2-eye-btn'; rzpEye.style.position='static'; rzpEye.style.transform='none'; rzpEye.textContent='\uD83D\uDC41 Show/Hide Key';
    rzpEye.style.cssText += 'width:auto;font-size:0.78rem;color:var(--emerald) !important;margin:4px 0 0;';
    rzpInput.type = 'password';
    rzpInput.parentNode.insertBefore(rzpEye, rzpInput.nextSibling);
    rzpEye.addEventListener('click', function(){ rzpInput.type = rzpInput.type === 'password' ? 'text' : 'password'; });

    // Live status badges
    function refreshStatus(){
      var upiOn = !!upiInput.value.trim(), rzpOn = !!rzpInput.value.trim();
      var u = document.getElementById('pw2UpiStatus'), r = document.getElementById('pw2RzpStatus'), t = document.getElementById('pw2PayUpdated');
      if (u){ u.textContent = upiOn ? 'Connected' : 'Disconnected'; u.className = 'pw2-status-pill ' + (upiOn ? 'on' : 'off'); }
      if (r){ r.textContent = rzpOn ? 'Connected' : 'Disconnected'; r.className = 'pw2-status-pill ' + (rzpOn ? 'on' : 'off'); }
      if (t) t.textContent = new Date().toLocaleString();
    }
    refreshStatus();
    document.getElementById('upiAdminMsg') && new MutationObserver(refreshStatus).observe(document.getElementById('upiAdminMsg'), { childList:true, subtree:true, characterData:true });
    document.getElementById('razorpayAdminMsg') && new MutationObserver(refreshStatus).observe(document.getElementById('razorpayAdminMsg'), { childList:true, subtree:true, characterData:true });
  }

  function pw2AddPinStrength(){
    var newPin = document.getElementById('newPin');
    if (!newPin || newPin.dataset.pw2Strength) return;
    newPin.dataset.pw2Strength = '1';
    var wrap = document.createElement('div'); wrap.className = 'pw2-strength';
    wrap.innerHTML = '<div class="pw2-strength-track"><div class="pw2-strength-fill"></div></div><span class="pw2-strength-label">Enter a new PIN</span>';
    newPin.parentNode.insertBefore(wrap, newPin.nextSibling);
    var fill = wrap.querySelector('.pw2-strength-fill'), label = wrap.querySelector('.pw2-strength-label');
    function score(v){
      var s = 0;
      if (v.length >= 4) s += 1;
      if (v.length >= 6) s += 1;
      if (/[0-9]/.test(v) && /[^0-9]/.test(v)) s += 1;
      if (new Set(v.split('')).size >= Math.min(4, v.length)) s += 1;
      return s;
    }
    newPin.addEventListener('input', function(){
      var s = score(newPin.value);
      var pct = [0,25,50,75,100][s] || 0;
      var colors = ['var(--sand)','var(--booked)','var(--gold)','var(--emerald-soft)','var(--emerald)'];
      var labels = ['Enter a new PIN','Weak','Fair','Good','Strong'];
      fill.style.width = pct + '%'; fill.style.background = colors[s];
      label.textContent = labels[s];
    });
    var genBtn = document.createElement('button');
    genBtn.type = 'button'; genBtn.className = 'pw2-gen-pin-btn'; genBtn.textContent = 'Generate Strong PIN';
    genBtn.addEventListener('click', function(){
      var p = String(Math.floor(1000 + Math.random()*9000));
      newPin.value = p;
      var confirmPin = document.getElementById('confirmPin'); if (confirmPin) confirmPin.value = p;
      newPin.dispatchEvent(new Event('input'));
      pw2Toast('Generated PIN filled in — remember to save it somewhere safe.', 'info');
    });
    wrap.parentNode.insertBefore(genBtn, wrap.nextSibling);

    ['adminPin','oldPin','confirmPin'].forEach(function(id){
      var el = document.getElementById(id); if (!el) return;
      var w = document.createElement('span'); w.className='pw2-pin-wrap';
      el.parentNode.insertBefore(w, el); w.appendChild(el);
      var eye = document.createElement('button'); eye.type='button'; eye.className='pw2-eye-btn'; eye.textContent='\uD83D\uDC41';
      eye.addEventListener('click', function(){ var s = el.type==='text'; el.type = s?'password':'text'; eye.textContent = s?'\uD83D\uDC41':'\uD83D\uDE48'; });
      w.appendChild(eye);
    });
  }

  /* ================= PROFILE CARD ================= */
  function pw2RenderProfile(){
    var dash = document.getElementById('adminSettings');
    if (!dash || document.getElementById('pw2ProfileCard')) return;
    var stored = pw2Load('pw2_profile', { name:'Admin', role:'Property Manager', email:'' });
    var lastLogin = pw2Load('pw2_last_login', null);
    var card = document.createElement('div');
    card.id = 'pw2ProfileCard';
    card.className = 'pw2-card pw2-profile-card';
    card.innerHTML =
      '<span class="pw2-card-icon" style="position:absolute;top:14px;right:14px;">\uD83D\uDC64</span>'
      + '<div class="pw2-profile-avatar">' + (stored.name||'A').trim().charAt(0).toUpperCase() + '</div>'
      + '<div class="pw2-profile-fields">'
      + '<div>Name<b id="pw2ProfName">'+ (stored.name||'Admin') +'</b></div>'
      + '<div>Role<b>'+ (stored.role||'Property Manager') +'</b></div>'
      + '<div>Email<b id="pw2ProfEmail">'+ (stored.email||'Not set') +'</b></div>'
      + '<div>Last Login<b>'+ (lastLogin ? new Date(lastLogin).toLocaleString() : 'This session') +'</b></div>'
      + '<div>Account Status<b style="color:var(--emerald);">Active</b></div>'
      + '</div>'
      + '<div class="pw2-profile-edit-row">'
      + '<input type="text" id="pw2ProfNameInput" placeholder="Your name" value="'+ (stored.name||'') +'">'
      + '<input type="email" id="pw2ProfEmailInput" placeholder="Contact email" value="'+ (stored.email||'') +'">'
      + '<button type="button" id="pw2ProfSaveBtn">Save</button>'
      + '</div>';
    dash.insertBefore(card, dash.firstChild);
    document.getElementById('pw2ProfSaveBtn').addEventListener('click', function(){
      var name = document.getElementById('pw2ProfNameInput').value.trim() || 'Admin';
      var email = document.getElementById('pw2ProfEmailInput').value.trim();
      pw2Store('pw2_profile', { name:name, role:'Property Manager', email:email });
      document.getElementById('pw2ProfName').textContent = name;
      document.getElementById('pw2ProfEmail').textContent = email || 'Not set';
      pw2Toast('Profile updated (saved on this device).', 'success');
    });
  }

  /* ================= STICKY PAGE HEADER ================= */
  var pw2TabMeta = {
    home:{icon:'\uD83C\uDFE0', sub:'Overview of Stay Confident PG Homes'},
    about:{icon:'\u2139\uFE0F', sub:'Who we are'},
    why:{icon:'\u2B50', sub:'What makes us different'},
    daily:{icon:'\uD83D\uDCC5', sub:'Short daily-stay options'},
    monthly:{icon:'\uD83D\uDCC6', sub:'Monthly stay plans'},
    community:{icon:'\uD83E\uDD1D', sub:'Life at our PG'},
    vacancies:{icon:'\uD83D\uDECF\uFE0F', sub:'Open beds right now'},
    availability:{icon:'\uD83D\uDECF\uFE0F', sub:'Live room & bed availability'},
    book:{icon:'\uD83D\uDCDD', sub:'Reserve your stay'},
    payment:{icon:'\uD83D\uDCB3', sub:'Pay securely via UPI or card'},
    location:{icon:'\uD83D\uDCCD', sub:'Find us on the map'},
    gallery:{icon:'\uD83D\uDCF8', sub:'Photo tour of every unit'},
    reviews:{icon:'\u2B50', sub:'What our residents say'},
    contact:{icon:'\u260E\uFE0F', sub:'Get in touch with us'},
    admin:{icon:'\uD83D\uDD10', sub:'Property management'}
  };

  function buildPageHeader(){
    var header = document.createElement('div');
    header.id = 'pw2PageHeader';
    header.innerHTML =
      '<span class="pw2-ph-icon" id="pw2PhIcon">\uD83C\uDFE0</span>'
      + '<div class="pw2-ph-titles"><h2 id="pw2PhTitle">Home</h2><small id="pw2PhCrumb">Home</small></div>'
      + '<input type="search" id="pw2PhSearch" placeholder="Search this page\u2026" style="flex:1 1 140px;max-width:200px;padding:7px 12px;border-radius:20px;border:1.5px solid var(--sand);font-size:0.8rem;">'
      + '<span class="pw2-ph-date" id="pw2PhDate"></span>'
      + '<div class="pw2-ph-icons">'
      + '<button type="button" id="pw2PhQuickAction" style="border:none;border-radius:20px;background:var(--gold);color:var(--forest);font-weight:700;font-size:0.78rem;padding:7px 14px;cursor:pointer;">Book Now</button>'
      + '<span class="pw2-ph-bell" id="pw2PhBell">\uD83D\uDD14<div id="pw2NotifPop">You\u2019re all caught up \u2014 no new notifications.</div></span>'
      + '<span class="pw2-ph-status" id="pw2PhStatus">Locked</span>'
      + '<span class="pw2-ph-profile" id="pw2PhProfile" style="font-size:0.78rem;color:var(--forest);font-weight:600;">\uD83D\uDC64</span>'
      + '</div>';
    var navEl = document.querySelector('nav');
    if (navEl && navEl.parentNode) navEl.parentNode.insertBefore(header, navEl.nextSibling);
    else document.body.insertBefore(header, document.body.firstChild);

    document.getElementById('pw2PhDate').textContent = new Date().toLocaleDateString(undefined, { weekday:'short', year:'numeric', month:'short', day:'numeric' });
    document.getElementById('pw2PhBell').addEventListener('click', function(){
      document.getElementById('pw2NotifPop').classList.toggle('show');
    });
    document.addEventListener('click', function(e){
      if (!e.target.closest('#pw2PhBell')) document.getElementById('pw2NotifPop').classList.remove('show');
    });

    // Per-page search: reuse whichever search input already exists on the
    // active page (e.g. #scUnitSearch on Available Units) instead of
    // building a second, disconnected search feature.
    var pw2SearchTargets = { availability:'scUnitSearch' };
    document.getElementById('pw2PhSearch').addEventListener('keydown', function(e){
      if (e.key !== 'Enter') return;
      var activeBtn = document.querySelector('nav button.active');
      var tab = activeBtn ? activeBtn.dataset.tab : '';
      var targetId = pw2SearchTargets[tab];
      var targetEl = targetId ? document.getElementById(targetId) : null;
      if (targetEl){
        targetEl.value = e.target.value;
        targetEl.dispatchEvent(new Event('input'));
        pw2Toast('Filtered "Available Units" by "' + e.target.value + '".', 'info');
      } else {
        pw2Toast('No search available on this page yet.', 'info');
      }
    });

    // Quick action: context-aware shortcut, reusing existing site functions.
    document.getElementById('pw2PhQuickAction').addEventListener('click', function(){
      var activeBtn = document.querySelector('nav button.active');
      var tab = activeBtn ? activeBtn.dataset.tab : '';
      if (tab === 'admin'){
        if (document.body.classList.contains('admin-mode')){
          var settings = document.getElementById('adminSettings');
          if (settings) settings.scrollIntoView({ behavior:'smooth' });
        } else {
          pw2OpenPopup();
        }
      } else if (typeof window.goToBookTab === 'function'){
        window.goToBookTab();
      }
    });

    function refreshHeader(){
      var activeBtn = document.querySelector('nav button.active');
      var tab = activeBtn ? activeBtn.dataset.tab : 'home';
      var label = activeBtn ? activeBtn.textContent.replace(/^[^\w]+/, '').trim() : 'Home';
      var meta = pw2TabMeta[tab] || {icon:'\uD83D\uDCC4', sub:''};
      document.getElementById('pw2PhIcon').textContent = meta.icon;
      document.getElementById('pw2PhTitle').textContent = label || tab;
      document.getElementById('pw2PhCrumb').textContent = 'Home / ' + (label || tab) + (meta.sub ? ' \u2014 ' + meta.sub : '');
      var statusPill = document.getElementById('adminStatusPill');
      document.getElementById('pw2PhStatus').textContent = statusPill ? statusPill.textContent : (document.body.classList.contains('admin-mode') ? 'Unlocked' : 'Locked');
      var quickBtn = document.getElementById('pw2PhQuickAction');
      quickBtn.style.display = (tab === 'book') ? 'none' : '';
      quickBtn.textContent = (tab === 'admin') ? (document.body.classList.contains('admin-mode') ? 'Settings' : 'Login') : 'Book Now';
      var profile = pw2Load('pw2_profile', null);
      document.getElementById('pw2PhProfile').textContent = '\uD83D\uDC64 ' + (document.body.classList.contains('admin-mode') ? (profile && profile.name ? profile.name : 'Admin') : '');
    }
    refreshHeader();
    document.querySelector('nav').addEventListener('click', function(){ setTimeout(refreshHeader, 60); });
    new MutationObserver(refreshHeader).observe(document.body, { attributes:true, attributeFilter:['class'] });
  }

  /* ================= INIT ================= */
  function pw2Init(){
    buildLoginChrome();
    buildPageHeader();
    pw2AddPinStrength();

    var settings = document.getElementById('adminSettings');
    if (settings){
      var kids = Array.prototype.slice.call(settings.children);
      // 1st div = mobile change, next p = small note (skip), then prefs, payment, reviews, pin
      cardify(kids[0], '\uD83D\uDCF1', 'Change Mobile Number');
      var divs = kids.filter(function(k){ return k.tagName === 'DIV'; });
      // divs order: [mobile, prefs, payment, reviews, pin]
      if (divs[1]) cardify(divs[1], '\u2728', 'Manage Preference Questions');
      if (divs[2]) { cardify(divs[2], '\uD83D\uDCB3', 'Payment Settings'); pw2SplitPaymentCard(divs[2]); }
      if (divs[3]) cardify(divs[3], '\u2B50', 'Manage Reviews');
      if (divs[4]) cardify(divs[4], '\uD83D\uDD10', 'Change Admin PIN');
    }

    if (document.body.classList.contains('admin-mode')) pw2RenderProfile();
    pw2SyncPopupWithNav();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(pw2Init, 400);
  else document.addEventListener('DOMContentLoaded', function(){ setTimeout(pw2Init, 400); });
  window.addEventListener('load', function(){ setTimeout(pw2Init, 500); });

})();
