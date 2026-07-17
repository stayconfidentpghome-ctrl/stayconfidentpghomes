
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
