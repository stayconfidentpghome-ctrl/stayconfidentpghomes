
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
  roomMeta = await loadRoomMeta();
  enquiryCounts = await loadEnquiryCounts();
};
