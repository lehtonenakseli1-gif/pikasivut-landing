// Pienet käyttöliittymän lisät kaikille sivuille: aukiolotila, mobiilin
// varauspalkki ja osioiden ilmestymisanimaatio.
(function () {
  var OPEN_HOUR = 8, CLOSE_HOUR = 17; // ma–pe

  function helsinkiNow() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    return { day: days[get('weekday')], minutes: parseInt(get('hour'), 10) % 24 * 60 + parseInt(get('minute'), 10) };
  }

  function openStatus() {
    var n = helsinkiNow();
    var weekday = n.day <= 5;
    var open = weekday && n.minutes >= OPEN_HOUR * 60 && n.minutes < CLOSE_HOUR * 60;
    if (open) return { open: true, text: 'Avoinna nyt, klo ' + CLOSE_HOUR + ' asti' };
    var next;
    if (weekday && n.minutes < OPEN_HOUR * 60) next = 'tänään klo ' + OPEN_HOUR;
    else if (n.day <= 4) next = 'huomenna klo ' + OPEN_HOUR;
    else next = 'maanantaina klo ' + OPEN_HOUR;
    return { open: false, text: 'Suljettu, avataan ' + next };
  }

  function renderStatus() {
    var st = openStatus();
    document.querySelectorAll('[data-open-status]').forEach(function (el) {
      el.textContent = st.text;
      el.classList.toggle('is-open', st.open);
    });
    return st;
  }

  function stickyBar(st) {
    var path = location.pathname;
    if (/varaa-aika\.html|tarjous\.html|tietosuoja\.html/.test(path)) return;
    var base = (document.querySelector('script[src$="ui.js"]') || {}).src || location.href;
    var href = new URL('varaa-aika.html', base).href;
    var label = 'Varaa aika';
    // Palvelusivuilla kalenteri tai tarjouslomake on samalla sivulla.
    var onPage = document.getElementById('varaa') || document.getElementById('tarjous');
    if (onPage) {
      href = '#' + onPage.id;
      if (onPage.id === 'tarjous') label = 'Pyydä tarjous';
    }
    var css = document.createElement('style');
    css.textContent =
      '.m-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;gap:10px;align-items:center;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:rgba(15,20,32,.97);border-top:1px solid var(--line,#29314A);transform:translateY(110%);transition:transform .25s ease}' +
      '.m-bar.show{transform:none}.m-bar .m-st{flex:1;font-size:12.5px;color:#96A0BC;line-height:1.3}.m-bar .m-st b{display:block;color:#F4F6FB;font-size:13.5px}' +
      '.m-bar a{flex:none;padding:12px 18px;border-radius:8px;background:#E8A33D;color:#171208;font-weight:700;font-size:15px;text-decoration:none}' +
      '@media(min-width:960px){.m-bar{display:none}}body.has-m-bar{padding-bottom:72px}@media(min-width:960px){body.has-m-bar{padding-bottom:0}}';
    document.head.appendChild(css);
    var bar = document.createElement('div');
    bar.className = 'm-bar';
    bar.innerHTML = '<div class="m-st"><b>044 961 0348</b>' + st.text + '</div><a href="' + href + '">' + label + '</a>';
    document.body.appendChild(bar);
    document.body.classList.add('has-m-bar');
    var onScroll = function () {
      var hide = false;
      if (onPage) {
        var r = onPage.getBoundingClientRect();
        hide = r.top < window.innerHeight * 0.6 && r.bottom > 0; // ei peitetä kalenteria tai lomaketta
      }
      bar.classList.toggle('show', window.scrollY > 420 && !hide);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function reveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var css = document.createElement('style');
    css.textContent = '.rv{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}.rv.in{opacity:1;transform:none}';
    document.head.appendChild(css);
    var els = document.querySelectorAll('main section:not(.hero):not(.phero):not(.pagehead) .section-head, .service, .steps li, .review, .split > *, .price-box, .sub-cta');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          el.classList.add('in');
          io.unobserve(el);
          // Poistetaan luokat animaation jälkeen, ettei ne peitä hover-efektejä.
          setTimeout(function () { el.classList.remove('rv', 'in'); }, 700);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) return; // jo näkyvissä: ei animoida
      el.classList.add('rv');
      io.observe(el);
    });
    // Varmistus: nopeassa vierityksessä tai ankkurihypyssä ohitetut elementit näytetään heti.
    var pending = false;
    window.addEventListener('scroll', function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        document.querySelectorAll('.rv:not(.in)').forEach(function (el) {
          if (el.getBoundingClientRect().bottom < 0) {
            io.unobserve(el);
            el.classList.remove('rv');
          }
        });
      });
    }, { passive: true });
  }

  function polish() {
    var css = document.createElement('style');
    css.textContent = [
      // Kortit nousevat ja reunaan tulee meripihkan hehku
      '.service,.review,.steps li,.symptom-box,.price-box,.sub-cta,.cat-btn,.t-card{transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s ease,border-color .25s ease,background-color .25s ease}',
      '.service:hover,.review:hover,.steps li:hover,.cat-btn:hover{transform:translateY(-4px);box-shadow:0 14px 30px -12px rgba(0,0,0,.6),0 0 0 1px rgba(232,163,61,.35);border-color:rgba(232,163,61,.6)}',
      '.price-box:hover,.symptom-box:hover{transform:translateY(-2px);box-shadow:0 12px 26px -14px rgba(232,163,61,.45)}',
      // Ikoni ja "Lue lisää" -nuoli elävät kortin mukana
      '.svc-icon{transition:transform .3s cubic-bezier(.2,.8,.2,1),background-color .3s ease}',
      '.service:hover .svc-icon{transform:scale(1.1) rotate(-6deg);background:rgba(232,163,61,.22)}',
      '.service .more{transition:letter-spacing .25s ease,transform .25s ease}',
      '.service:hover .more{transform:translateX(4px)}',
      '.cat-btn .arrow{display:inline-block;transition:transform .25s ease}.cat-btn:hover .arrow{transform:translateX(4px)}',
      // Napit: pieni nousu, varjo ja valojuova ensisijaisessa napissa
      '.btn{transition:transform .2s ease,box-shadow .2s ease,background-color .2s ease,border-color .2s ease}',
      '.btn:not(.phone-btn):hover{transform:translateY(-2px)}',
      '.btn-primary{position:relative;overflow:hidden}',
      '.btn-primary:hover{box-shadow:0 10px 24px -10px rgba(232,163,61,.75)}',
      '.btn-primary::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);transition:left .6s ease}',
      '.btn-primary:hover::after{left:120%}',
      '.btn:active{transform:translateY(0) scale(.98)}',
      // Navigaation alleviivaus liukuu sisään
      '.nav-links a{position:relative}',
      '.nav-links a::after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--accent,#E8A33D);transform:scaleX(0);transform-origin:left;transition:transform .25s ease}',
      '.nav-links a:hover::after{transform:scaleX(1)}',
      // Kuvat zoomaavat hitaasti kehyksen sisällä
      '.split-img{overflow:hidden}.split-img img{transition:transform .8s cubic-bezier(.2,.8,.2,1)}.split-img:hover img{transform:scale(1.04)}',
      // Heron taustakuva liukuu hitaasti paikalleen
      '.hero-img,.phero-img{animation:kb 9s ease-out both}@keyframes kb{from{transform:scale(1.07)}to{transform:scale(1)}}',
      // Hinta-merkki ja tähdet saavat pienen hehkun
      '.price-tag{transition:box-shadow .3s ease}.price-tag:hover{box-shadow:0 0 0 4px rgba(232,163,61,.12)}',
      '.hero-badge b,.trust-row b{display:inline-block;transition:transform .3s ease}.hero-badge:hover b,.trust-row a:hover b{transform:scale(1.15) rotate(-8deg)}',
      // UKK: avautuva vastaus liukuu esiin
      'details[open] p{animation:fadeDown .3s ease}@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}',
      'details summary{transition:color .2s ease}details summary:hover{color:var(--accent,#E8A33D)}',
      // Tarkistuslistan merkit poksahtavat näkyviin
      '.checklist .icon{transition:transform .25s ease}.checklist li:hover .icon{transform:scale(1.15)}',
      // Aukiolon vihreä pallo sykkii hiljaa kun on auki
      '.open-status.is-open::before{animation:pulse 2.4s ease-in-out infinite}@keyframes pulse{0%,100%{box-shadow:0 0 0 3px rgba(62,207,142,.18)}50%{box-shadow:0 0 0 6px rgba(62,207,142,.05)}}',
      // Näppäimistökäyttäjille selkeä kohdistus
      'a:focus-visible,button:focus-visible,summary:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent,#E8A33D);outline-offset:3px;border-radius:6px}',
      // Kaikki liike pois, jos käyttäjä on pyytänyt
      '@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation:none!important;transition:none!important}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  document.addEventListener('DOMContentLoaded', function () {
    polish();
    var st = renderStatus();
    stickyBar(st);
    reveal();
  });
})();
