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
