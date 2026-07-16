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
