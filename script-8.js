
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
