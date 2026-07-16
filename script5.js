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
