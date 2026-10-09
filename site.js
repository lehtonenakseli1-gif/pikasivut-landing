/* Pikasivut — Hakukenttä-teeman liikkuvat osat. Ei riippuvuuksia.
   Sivu toimii ja näyttää valmiilta ilman tätä tiedostoa; tämä vain lisää liikettä. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxFmf_zBQ45lB0psUKaxxtubsk5aVtn3p87HeufD5Mebf57PY44iVr12qSaSdG26pI0/exec'; // Apps Script: lomake ja nimetön kävijälaskenta
  var doc = document.documentElement;
  doc.classList.add('js');
  var EN = doc.lang === 'en';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- vuosi footeriin ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- scroll-palkki ja vaihepalkki ---------- */
  var bar = document.createElement('div');
  bar.className = 'scrollbar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var steps = document.querySelector('.steps');
  function onScroll() {
    var h = doc.scrollHeight - innerHeight;
    bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h) : 0);
    if (steps) {
      var r = steps.getBoundingClientRect();
      var p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
      steps.style.setProperty('--sp', Math.max(0, Math.min(1, p)));
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- korostuskynä ja kirjoittuvat hakupillerit näkyviin tullessa ---------- */
  function typeInto(el, text, speed, done) {
    if (reduce) { el.textContent = text; if (done) done(); return; }
    var i = 0;
    el.textContent = '';
    (function step() {
      el.textContent = text.slice(0, ++i);
      if (i < text.length) setTimeout(step, speed + Math.random() * speed);
      else if (done) done();
    })();
  }
  // Oma näkyvyystarkistus IntersectionObserverin sijaan: toimii varmasti myös
  // taustavälilehdissä ja kuvakaappauksissa.
  var pending = [];
  function reveal(el) {
    if (el.classList.contains('hl')) el.classList.add('is-in');
    else typeInto(el, el.dataset.full, 45);
  }
  function checkPending() {
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) { reveal(el); return false; }
      return true;
    });
  }
  document.querySelectorAll('.hl').forEach(function (el) { pending.push(el); });
  document.querySelectorAll('.q-text').forEach(function (el) {
    el.dataset.full = el.textContent;
    if (!reduce) { el.textContent = ''; pending.push(el); }
  });
  addEventListener('scroll', checkPending, { passive: true });
  addEventListener('resize', checkPending);
  checkPending();
  // varmuuden vuoksi: jos jokin jää kesken (esim. hyppy ankkuriin), täytetään se
  setTimeout(checkPending, 600);

  /* ---------- hero: hakukenttä, joka kirjoittaa itse ja johon voi kirjoittaa ---------- */
  var input = document.getElementById('hero-q');
  var ad = document.querySelector('.ad-preview');
  if (input && ad) {
    var demos = EN ? [
      ['home cleaning helsinki', 'cleaningcompany.fi/home-cleaning', 'Home Cleaning in Helsinki | See the Price and Book', 'The same cleaner every time. 100% quality guarantee. Pick a free slot online.'],
      ['car repair near me', 'garage.fi/service', 'Scheduled Service for All Makes | Book a Time', 'Fixed price up front. Service book stamp. Book online 24/7.'],
      ['bathroom renovation price', 'renovation.fi/bathroom', 'Turnkey Bathroom Renovation | Get a Quote', 'We handle the household tax deduction for you. Certified waterproofing.']
    ] : [
      ['kotisiivous helsinki', 'siivousyritys.fi/kotisiivous', 'Kotisiivous Helsingissä | Näe hinta heti ja varaa', 'Tuttu siivooja joka kerta. 100 % laatutakuu. Valitse vapaa aika netistä.'],
      ['autokorjaamo lähellä', 'korjaamo.fi/huolto', 'Määräaikaishuolto kaikille merkeille | Varaa aika', 'Kiinteä hinta etukäteen. Huoltokirjamerkintä. Ajanvaraus netissä 24/7.'],
      ['kylpyhuoneremontti hinta', 'remontti.fi/kylpyhuone', 'Kylpyhuoneremontti avaimet käteen | Pyydä tarjous', 'Kotitalousvähennys hoidetaan puolestasi. Vedeneristys sertifioidusti.']
    ];
    var url = ad.querySelector('.ad-url'), title = ad.querySelector('.ad-title'), desc = ad.querySelector('.ad-desc'), you = ad.querySelector('.ad-you');
    var userTyping = false, demoIdx = 0, timer = null;

    var adToken = 0;
    function showAd(u, t, d, mine) {
      var my = ++adToken;
      ad.classList.add('swap');
      setTimeout(function () {
        if (my !== adToken) return;
        url.textContent = u; title.textContent = t; desc.textContent = d;
        you.hidden = !mine;
        ad.classList.remove('swap');
      }, reduce ? 0 : 300);
    }
    function demoLoop() {
      if (userTyping) return;
      var d = demos[demoIdx++ % demos.length];
      if (reduce) { input.placeholder = d[0]; showAd(d[1], d[2], d[3], false); return; }
      var i = 0;
      (function typeStep() {
        if (userTyping) return;
        input.placeholder = d[0].slice(0, ++i) + '|';
        if (i < d[0].length) timer = setTimeout(typeStep, 55 + Math.random() * 70);
        else {
          input.placeholder = d[0];
          showAd(d[1], d[2], d[3], false);
          timer = setTimeout(demoLoop, 3600);
        }
      })();
    }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
    function runSearch() {
      var q = input.value.trim();
      if (!q) return;
      if (/barrel roll|tynnyri/i.test(q)) { barrelRoll(); return; }
      var slug = q.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
      showAd('sinunyrityksesi.fi/' + slug,
        cap(q).slice(0, 40) + (EN ? ' | Your Business Here' : ' | Sinun yrityksesi tässä'),
        EN ? 'People search "' + q + '" every day. With the right campaign, your ad is the first thing they see.'
           : 'Ihmiset hakevat "' + q + '" joka päivä. Oikein rakennetulla kampanjalla sinun mainoksesi on ensimmäinen, minkä he näkevät.',
        true);
    }
    input.addEventListener('focus', function () { userTyping = true; clearTimeout(timer); input.placeholder = EN ? 'Type what your customers search…' : 'Kirjoita, mitä asiakkaasi hakevat…'; });
    input.addEventListener('blur', function () { if (!input.value) { userTyping = false; demoLoop(); } });
    input.form && input.form.addEventListener('submit', function (e) { e.preventDefault(); runSearch(); });
    demoLoop();
  }

  /* ---------- kelluvien ilmoitusten kellonajat oikeiksi ---------- */
  document.querySelectorAll('.chip [data-ago]').forEach(function (el) {
    var t = new Date(Date.now() - el.dataset.ago * 60000);
    el.textContent = ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2);
  });

  /* ---------- 3D-kallistus korteille ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.problem-card, .offer-card, .price-card, .guide-list a').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateY(' + (x * 8) + 'deg) rotateX(' + (-yy * 8) + 'deg) translateY(-4px)';
        card.classList.add('is-tilting');
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; card.classList.remove('is-tilting'); });
    });
  }

  /* ---------- klikkaus: +1 klikkaus, joka viides on asiakas ---------- */
  var clicks = 0;
  if (!reduce) {
    document.addEventListener('click', function (e) {
      if (e.target.closest('input, textarea, summary, select')) return;
      clicks++;
      var win = clicks % 5 === 0;
      var s = document.createElement('div');
      s.className = 'click-pop' + (win ? ' win' : '');
      s.textContent = win ? (EN ? '+1 customer!' : '+1 asiakas!') : (EN ? '+1 click' : '+1 klikkaus');
      s.style.left = e.clientX + 'px';
      s.style.top = e.clientY + 'px';
      document.body.appendChild(s);
      setTimeout(function () { s.remove(); }, 1000);
    });
  }

  /* ---------- hiiren perässä Googlen väriset pisteet ---------- */
  if (finePointer && !reduce) {
    var colors = ['#1a3fd1', '#4f6fe0', '#8aa3f0'], ci = 0, last = 0;
    addEventListener('mousemove', function (e) {
      var now = Date.now();
      if (now - last < 40) return;
      last = now;
      var d = document.createElement('div');
      d.className = 'trail';
      d.style.left = (e.clientX - 4) + 'px';
      d.style.top = (e.clientY - 4) + 'px';
      d.style.background = colors[ci++ % 3];
      document.body.appendChild(d);
      setTimeout(function () { d.remove(); }, 600);
    }, { passive: true });
  }

  /* ---------- Kokeilen onneani: satunnainen alasivu ---------- */
  document.querySelectorAll('[data-lucky]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var pages = ['/google-ads-hinta/', '/google-ads-auditointi/', '/google-ads-siivousyritykselle/', '/google-ads-autokorjaamolle/', '/google-ads-remonttiyritykselle/', '/opas/google-ads-ei-tuo-yhteydenottoja/', '/opas/negatiiviset-hakusanat/', '/opas/konversioseuranta/'];
      e.preventDefault();
      location.href = pages[Math.floor(Math.random() * pages.length)];
    });
  });

  /* ---------- tynnyrikierre: logo viisi kertaa nopeasti tai haku "barrel roll" ---------- */
  function barrelRoll() {
    if (reduce) return;
    document.body.classList.remove('barrel-roll');
    void document.body.offsetWidth;
    document.body.classList.add('barrel-roll');
    setTimeout(function () { document.body.classList.remove('barrel-roll'); }, 1500);
  }
  var logoHits = [], logo = document.querySelector('header .logo');
  if (logo) logo.addEventListener('click', function (e) {
    var now = Date.now();
    logoHits = logoHits.filter(function (t) { return now - t < 2000; });
    logoHits.push(now);
    if (location.pathname === '/' || location.pathname === '/eng/') e.preventDefault();
    if (logoHits.length >= 5) { logoHits = []; barrelRoll(); }
    else if (location.pathname === '/' || location.pathname === '/eng/') scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ================= ALASIVUJEN ERIKOISUUDET ================= */

  /* ---------- budjettilaskuri (hintasivu) ---------- */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var cb = calc.querySelector('#c-budget'), cc = calc.querySelector('#c-cpc'), cr = calc.querySelector('#c-cr');
    var bars = calc.querySelector('.calc-bars');
    for (var bi = 0; bi < 24; bi++) bars.appendChild(document.createElement('i'));
    var fmt = function (n) { return Math.round(n).toLocaleString('fi-FI'); };
    function calcUpdate() {
      var b = +cb.value, c = +cc.value, r = +cr.value;
      var clicks = b / c, leads = clicks * r / 100;
      var pkg = b < 1500 ? [300, 'Perus'] : b < 3000 ? [500, 'Kasvu'] : [750, 'Kattava'];
      calc.querySelector('output[for=c-budget]').textContent = fmt(b) + ' €';
      calc.querySelector('output[for=c-cpc]').textContent = c.toFixed(2).replace('.', ',') + ' €';
      calc.querySelector('output[for=c-cr]').textContent = r.toFixed(1).replace('.', ',') + ' %';
      calc.querySelector('[data-o=clicks]').textContent = fmt(clicks);
      calc.querySelector('[data-o=leads]').textContent = fmt(leads);
      calc.querySelector('[data-o=cpl]').textContent = fmt((b + pkg[0]) / Math.max(leads, 1)) + ' €';
      calc.querySelector('[data-o=pkg]').textContent = pkg[1];
      var lit = Math.max(1, Math.round(24 * r / 12));
      Array.prototype.forEach.call(bars.children, function (bar, k) {
        bar.style.height = Math.min(100, 18 + (b / 6000) * 82 * (0.55 + 0.45 * Math.abs(Math.sin(k * 1.7)))) + '%';
        bar.classList.toggle('on', k % Math.max(1, Math.round(24 / lit)) === 0);
      });
    }
    [cb, cc, cr].forEach(function (el) { el.addEventListener('input', calcUpdate); });
    calcUpdate();
  }

  /* ---------- suodatin: pisteet putoavat, harva pääsee läpi ---------- */
  document.querySelectorAll('[data-funnel]').forEach(function (box) {
    var seed = 11;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (var k = 0; k < 40; k++) {
      var d = document.createElement('span');
      var pass = k % 6 === 2, left = 6 + rnd() * 86;
      d.className = 'f-dot ' + (pass ? 'f-pass' : 'f-block');
      d.style.left = left.toFixed(1) + '%';
      d.style.animationDelay = (rnd() * 7).toFixed(2) + 's';
      d.style.animationDuration = (5.5 + rnd() * 2).toFixed(2) + 's';
      d.style.setProperty('--dx', ((left < 50 ? -1 : 1) * Math.round(80 + rnd() * 120)) + 'px');
      if (reduce) d.style.top = (30 + rnd() * 330) + 'px';
      box.appendChild(d);
    }
  });

  /* ---------- terminaali: konversiotapahtumat juoksevat ---------- */
  document.querySelectorAll('[data-terminal]').forEach(function (term) {
    var body = term.querySelector('.terminal-body');
    var lines = [
      ['ev', 'click_to_call', 'ok', '→ Puhelu sivulta · laskettu kerran ✓'],
      ['ev', 'generate_lead', 'ok', '→ Tarjouspyyntö lähetetty ✓'],
      ['ev', 'page_view', 't', '→ ei konversio, ohitetaan'],
      ['ev', 'click_to_call', 'dup', '→ sama kävijä 2. kerran · ei lasketa uudelleen'],
      ['ev', 'booking_step_5', 'ok', '→ Ajanvaraus valmis ✓'],
      ['ev', 'mailto_click', 'ok', '→ Sähköposti ✓'],
      ['ev', 'form_open', 't', '→ lomake avattu, ei vielä konversio'],
      ['ev', 'ads_call', 'ok', '→ Puhelu suoraan mainoksesta ✓']
    ];
    var n = 0;
    function addLine() {
      var l = lines[n++ % lines.length], t = new Date();
      var ts = [t.getHours(), t.getMinutes(), t.getSeconds()].map(function (x) { return ('0' + x).slice(-2); }).join(':');
      var row = document.createElement('div');
      row.innerHTML = '<span class="t">[' + ts + ']</span> <span class="' + l[0] + '">' + l[1] + '</span> <span class="' + l[2] + '">' + l[3] + '</span>';
      body.appendChild(row);
      while (body.children.length > 9) body.removeChild(body.firstChild);
    }
    for (var k = 0; k < 5; k++) addLine();
    if (!reduce) setInterval(addLine, 1600);
  });

  /* ---------- itsetarkistus ---------- */
  document.querySelectorAll('[data-selfcheck]').forEach(function (box) {
    var boxes = box.querySelectorAll('input[type=checkbox]'), meter = box.querySelector('.sc-meter i'), out = box.querySelector('.sc-result');
    function upd() {
      var ok = box.querySelectorAll('input:checked').length, all = boxes.length;
      meter.style.width = (ok / all * 100) + '%';
      out.textContent = ok + '/' + all + ' kunnossa. ' + (ok === all ? 'Hienoa, tilisi perusasiat ovat kunnossa.' : ok >= all - 2 ? 'Melkein. Korjaa puuttuvat kohdat, niin budjetti tehoaa selvästi paremmin.' : 'Tilillä on todennäköisesti selvää hukkaa. Auditointi kertoisi, paljonko.');
    }
    boxes.forEach(function (b) { b.addEventListener('change', upd); });
    upd();
  });

  /* ---------- hakutermiraportti: valitse negatiiviset ---------- */
  document.querySelectorAll('[data-blockgame]').forEach(function (rep) {
    var boxes = rep.querySelectorAll('input[type=checkbox]'), score = rep.querySelector('[data-score]'), msg = rep.querySelector('.st-msg');
    boxes.forEach(function (b) {
      b.addEventListener('change', function () {
        b.closest('.st-row').classList.remove('miss', 'wrong', 'right');
        score.textContent = rep.querySelectorAll('input:checked').length;
      });
    });
    rep.querySelector('[data-check]').addEventListener('click', function () {
      var right = 0, saved = 0;
      boxes.forEach(function (b) {
        var row = b.closest('.st-row'), bad = b.dataset.bad === '1';
        row.classList.toggle('miss', bad && !b.checked);
        row.classList.toggle('wrong', !bad && b.checked);
        row.classList.toggle('right', bad && b.checked);
        if (bad === b.checked) right++;
        if (bad && b.checked) {
          var nums = row.querySelectorAll('.st-num');
          saved += parseInt(nums[0].textContent, 10) * parseFloat(nums[1].textContent.replace(',', '.'));
        }
      });
      msg.textContent = right === boxes.length
        ? 'Kaikki oikein. Säästit tässä esimerkissä noin ' + Math.round(saved) + ' € kuukaudessa hauista, joista ei olisi tullut asiakkaita.'
        : right + '/' + boxes.length + ' oikein. Keltaiset jäivät vielä negatiivisiksi lisäämättä, punaiset ovat hyviä hakuja, joita ei kannata estää.';
    });
  });

  /* ---------- mobiilivalikko: sulkeutuu linkistä, Escapesta ja ulkopuolelta ---------- */
  var mm = document.querySelector('.mobile-menu');
  if (mm) {
    mm.addEventListener('click', function (e) { if (e.target.closest('a')) mm.removeAttribute('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') mm.removeAttribute('open'); });
    document.addEventListener('click', function (e) { if (!mm.contains(e.target)) mm.removeAttribute('open'); });
    addEventListener('resize', function () { if (innerWidth > 960) mm.removeAttribute('open'); });
  }

  /* ---------- Ilmainen arvio -lomake ---------- */
  var arvio = document.getElementById('arvio-form');
  if (arvio) {
    function ytOk(v) {
      var m = /^(\d{7})-(\d)$/.exec(v);
      if (!m) return false;
      var w = [7, 9, 10, 5, 8, 4, 2], sum = 0;
      for (var i = 0; i < 7; i++) sum += parseInt(m[1].charAt(i), 10) * w[i];
      var r = sum % 11;
      if (r === 1) return false;
      return (r === 0 ? 0 : 11 - r) === parseInt(m[2], 10);
    }
    function normYt(v) {
      var d = v.replace(/[^0-9]/g, '');
      return d.length === 8 ? d.slice(0, 7) + '-' + d.slice(7) : v.trim();
    }
    var yt = arvio.elements.ytunnus;
    yt.addEventListener('blur', function () { yt.value = normYt(yt.value); });
    var showErr = function (name, on) { var el = arvio.querySelector('[data-err="' + name + '"]'); if (el) el.hidden = !on; };
    var status = arvio.querySelector('.form-status');
    arvio.addEventListener('submit', function (e) {
      e.preventDefault();
      yt.value = normYt(yt.value);
      var okYt = ytOk(yt.value), okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(arvio.elements.email.value.trim()), okC = arvio.elements.consent.checked;
      showErr('ytunnus', !okYt); showErr('email', !okMail); showErr('consent', !okC);
      if (!(okYt && okMail && okC)) { (!okYt ? yt : !okMail ? arvio.elements.email : arvio.elements.consent).focus(); return; }
      if (arvio.elements.website.value) return; // robotti
      var btn = arvio.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Lähetetään…';
      status.hidden = true;
      var qs = new URLSearchParams(location.search);
      var body = new URLSearchParams({
        ytunnus: yt.value, email: arvio.elements.email.value.trim(), phone: arvio.elements.phone.value.trim(),
        goal: arvio.elements.goal.value, consent: 'yes', website: '',
        source: qs.get('utm_source') || qs.get('s') || (document.referrer ? new URL(document.referrer).hostname : 'suora')
      });
      var done = function () { arvio.dispatchEvent(new Event('arvio:sent')); arvio.hidden = true; arvio.parentNode.querySelector('.arvio-done').hidden = false; scrollTo({ top: 0, behavior: 'smooth' }); };
      var fail = function () {
        btn.disabled = false; btn.textContent = 'Pyydä ilmainen arvio';
        status.hidden = false;
        status.innerHTML = 'Lähetys ei onnistunut. Soita <a href="tel:+358458505051">045 850 5051</a> tai kirjoita <a href="mailto:akseli@pikasivut.com">akseli@pikasivut.com</a>.';
      };
      if (ENDPOINT.indexOf('http') !== 0) { fail(); return; }
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: body }).then(done, fail);
    });
  }

  /* ---------- nimetön kävijälaskenta: ei evästeitä, ei tunnistetta, ei IP-osoitetta ---------- */
  (function () {
    if (!navigator.sendBeacon || navigator.doNotTrack === '1' || /^(localhost|127\.)/.test(location.hostname)) return;
    var qs = new URLSearchParams(location.search);
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (ref === location.hostname.replace(/^www\./, '')) ref = '';
    var source = qs.get('utm_source') || qs.get('s') || ref || 'suora';
    var device = innerWidth < 760 ? 'mobiili' : innerWidth < 1100 ? 'tabletti' : 'tietokone';
    var track = function (type) {
      try {
        navigator.sendBeacon(ENDPOINT, new URLSearchParams({ type: type, path: location.pathname, source: source, ref: ref, device: device, lang: doc.lang || 'fi' }));
      } catch (e) {}
    };
    track('view');
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (h.indexOf('tel:') === 0) track('tel_click');
      else if (h.indexOf('/arvio/') === 0) track('cta_click');
    });
    var f = document.getElementById('arvio-form');
    if (f) {
      var started = false;
      f.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });
      f.addEventListener('arvio:sent', function () { track('form_submit'); });
    }
  })();

  /* ---------- välilehden otsikko, kun käyttäjä lähtee ---------- */
  var origTitle = document.title;
  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? (EN ? 'Your customers are searching right now…' : 'Asiakkaasi hakevat sinua juuri nyt…') : origTitle;
  });
})();
