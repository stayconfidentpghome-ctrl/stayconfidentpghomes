
(function(){
  'use strict';

  /* ---------- Static content for the new landing sections ---------- */
  var WHY_US = [
    { icon:'fa-solid fa-award', title:'10+ Years Experience' },
    { icon:'fa-solid fa-map-location-dot', title:'Multiple Locations' },
    { icon:'fa-solid fa-calendar-day', title:'Daily Stay' },
    { icon:'fa-solid fa-calendar-check', title:'Monthly Stay' },
    { icon:'fa-solid fa-briefcase', title:'Working Professionals' },
    { icon:'fa-solid fa-graduation-cap', title:'Students' },
    { icon:'fa-solid fa-shield-halved', title:'Safe Environment' },
    { icon:'fa-solid fa-kitchen-set', title:'Kitchen Access' },
    { icon:'fa-solid fa-utensils', title:'Self Cooking' },
    { icon:'fa-solid fa-broom', title:'Housekeeping' },
    { icon:'fa-solid fa-truck-moving', title:'Relocation Support' },
    { icon:'fa-solid fa-people-group', title:'Community Living' }
  ];
  var DAILY_STAYS = [
    { icon:'❄️', title:'Single Occupancy A/C Room', desc:'A private, air-conditioned room ideal for solo travellers who want comfort and privacy for a short stay.', link:'https://airbnb.com/h/stayconfidenthome' },
    { icon:'🛏️', title:'Private A/C Master Bedroom (1–3 Guests)', desc:'A spacious master bedroom with attached comforts — perfect for couples or guests wanting extra space.', link:'https://airbnb.com/h/stayconfidentc9' },
    { icon:'🏡', title:'Entire 2BHK Home (Families & Groups)', desc:'Book the whole home for family visits, group stays or extended trips, with full access to all amenities.', link:'https://airbnb.com/h/cozyacroom' }
  ];
  var MONTHLY_CHIPS = ["Men's PG","Women's PG","Single Sharing","Double Sharing","Triple Sharing","AC","Non AC"];
  var COMMUNITY = [
    { title:'Safe Living', desc:'Secure homes with verified residents and watchful housekeeping staff.' },
    { title:'Friendly Residents', desc:'A warm mix of professionals, students and families who look out for one another.' },
    { title:'Respectful Environment', desc:'House rules that keep every home peaceful and considerate for all residents.' },
    { title:'Peaceful Homes', desc:'Quiet, clean spaces designed for genuine rest after a long day.' },
    { title:'Confidence', desc:'A place that lets you focus on your goals without worrying about where you live.' },
    { title:'Growth', desc:'A community that supports your journey, whatever stage of life you are in.' }
  ];

  function el(tag, cls, html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }

  var whyGrid = document.getElementById('scWhyGrid');
  if (whyGrid){
    WHY_US.forEach(function(item, i){
      var c = el('div','sc-card sc-fade');
      c.style.transitionDelay = (i*0.05)+'s';
      c.innerHTML = '<div class="sc-icon"><i class="'+item.icon+'" aria-hidden="true"></i></div><h4>'+item.title+'</h4>';
      whyGrid.appendChild(c);
    });
  }

  var dailyGrid = document.getElementById('scDailyGrid');
  if (dailyGrid){
    DAILY_STAYS.forEach(function(item, i){
      var c = el('div','sc-stay-card sc-fade');
      c.style.transitionDelay = (i*0.08)+'s';
      c.innerHTML =
        '<div class="sc-stay-photo">'+item.icon+'</div>' +
        '<div class="sc-stay-body"><h4>'+item.title+'</h4><p>'+item.desc+'</p>' +
        '<div class="sc-stay-actions">' +
          '<button type="button" data-sc-nav="book">Book Now</button>' +
          '<a class="secondary" href="'+item.link+'" target="_blank" rel="noopener">🔗 View on Airbnb</a>' +
        '</div></div>';
      dailyGrid.appendChild(c);
    });
  }

  var monthlyChips = document.getElementById('scMonthlyChips');
  if (monthlyChips){
    MONTHLY_CHIPS.forEach(function(label, i){
      var c = el('span','sc-chip sc-fade', label);
      c.style.transitionDelay = (i*0.05)+'s';
      monthlyChips.appendChild(c);
    });
  }

  var communityGrid = document.getElementById('scCommunityGrid');
  if (communityGrid){
    COMMUNITY.forEach(function(item, i){
      var c = el('div','sc-community-card sc-fade');
      c.style.transitionDelay = (i*0.06)+'s';
      c.innerHTML = '<h4>'+item.title+'</h4><p>'+item.desc+'</p>';
      communityGrid.appendChild(c);
    });
  }

  /* ---------- Hero / CTA buttons that jump to another tab ---------- */
  document.querySelectorAll('[data-sc-nav]').forEach(function(node){
    node.addEventListener('click', function(e){
      e.preventDefault();
      var tab = node.getAttribute('data-sc-nav');
      var target = document.querySelector('nav button[data-tab="'+tab+'"]');
      if (target) target.click();
      var nav = document.querySelector('nav');
      if (nav) nav.scrollIntoView({ behavior:'smooth' });
    });
  });

  /* Keep the Home "Call Now" / "WhatsApp" buttons in sync with the
     admin-configured numbers used elsewhere on the site (waLink/callLink). */
  function syncHomeContactLinks(){
    var wa = document.getElementById('waLink');
    var call = document.getElementById('callLink');
    var scWa = document.getElementById('scWaNow');
    var scCall = document.getElementById('scCallNow');
    if (scWa && wa && wa.getAttribute('href') && wa.getAttribute('href') !== '#') scWa.href = wa.href;
    if (scCall && call && call.getAttribute('href') && call.getAttribute('href') !== '#') scCall.href = call.href;
  }
  syncHomeContactLinks();
  var contactObserver = new MutationObserver(syncHomeContactLinks);
  var waLinkEl = document.getElementById('waLink');
  if (waLinkEl) contactObserver.observe(waLinkEl, { attributes:true, attributeFilter:['href'] });
  var callLinkEl = document.getElementById('callLink');
  if (callLinkEl) contactObserver.observe(callLinkEl, { attributes:true, attributeFilter:['href'] });

  /* ---------- Fade-up reveal for all new .sc-fade elements ---------- */
  var scObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('sc-show');
        scObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  document.querySelectorAll('.sc-fade').forEach(function(node){ scObserver.observe(node); });

  /* ---------- Debounced search: filter Available Units by unit name ---------- */
  var searchInput = document.getElementById('scUnitSearch');
  if (searchInput){
    var debounceTimer = null;
    searchInput.addEventListener('input', function(){
      clearTimeout(debounceTimer);
      var q = searchInput.value;
      debounceTimer = setTimeout(function(){
        var term = q.trim().toLowerCase();
        document.querySelectorAll('#unitsGrid .unit-card').forEach(function(card){
          var h3 = card.querySelector('h3');
          var name = h3 ? h3.textContent.trim().toLowerCase() : '';
          card.style.display = (!term || name.indexOf(term) !== -1) ? '' : 'none';
        });
      }, 250);
    });
  }

})();
