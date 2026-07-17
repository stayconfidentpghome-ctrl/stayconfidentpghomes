
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
