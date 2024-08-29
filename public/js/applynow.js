ua=navigator.userAgent.toLowerCase();isIE=/msie/.test(ua); // detect MSIE 9,10,11, but not Edge
function euCheck(){
  let modal_container = $('#apply-modal');
  let apply_btn = $('.details-footer__btn-apply[data-target="#apply-modal"]');
  modal_container.on('show.bs.modal.eucheck', function(e){
    if(e.relatedTarget.className.includes('details-footer__btn-apply')){
      e.preventDefault(e);
      if (confirm("Are you an EU Citizen or do you have an EU Visa & are currently residing in Republic of Ireland?") == true) {
        $(this).unbind('show.bs.modal.eucheck');
        apply_btn.click();
      }
    }
  });
}
// play it safe with IE, very few users, exec ur JS when all resources are loaded
if(isIE){
  window.onload=function(){ 
    euCheck(); 
  }
}
// else we add event listener to trigger function when DOMContentLoaded
else {
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',euCheck);
  } else {
    euCheck(); // DOMContentLoaded already loaded, so better trigger your function now
  }
}