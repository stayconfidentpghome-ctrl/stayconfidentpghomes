
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
