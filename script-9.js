
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
