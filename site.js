/* Pikasivut — Hakukenttä-teeman interaktiiviset osat. Ei riippuvuuksia.
   Sivu toimii ja näyttää valmiilta ilman tätä tiedostoa; tämä vain lisää interaktiota. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxFmf_zBQ45lB0psUKaxxtubsk5aVtn3p87HeufD5Mebf57PY44iVr12qSaSdG26pI0/exec'; // Apps Script: lomake ja nimetön kävijälaskenta
  var SEND_TIMEOUT_MS = 20000; // lomakkeen lähetyksen aikakatkaisu
  var doc = document.documentElement;
  doc.classList.add('js');
  var EN = doc.lang === 'en';
  var T = EN ? {
    sending: 'Sending\u2026', send: 'Get a free assessment',
    errA: ['We couldn\'t submit the form. Please check your details and try again, or email us at ', '.'],
    errB: ['We didn\'t get confirmation that your request was saved. Please try again, or email us at ', '.'],
    sc: function (ok, all) { return ok + '/' + all + ' in order. ' + (ok === all ? 'Great, the basics of your account are in order.' : ok >= all - 2 ? 'Almost. Fix the missing items and your budget will work noticeably better.' : 'Your account probably has clear waste. An audit would show how much.'); },
    bgOk: function (n) { return 'All correct. In this example you saved about \u20ac' + n + ' a month on searches that would never have brought a customer.'; },
    bgPart: function (r, a) { return r + '/' + a + ' correct. Yellow rows are still missing as negatives, red rows are good searches you should not block.'; },
    term: [
      ['click_to_call', 'ok', '\u2192 Call from the site \u00b7 counted once \u2713'],
      ['generate_lead', 'ok', '\u2192 Quote request sent \u2713'],
      ['page_view', 't', '\u2192 not a conversion, ignored'],
      ['click_to_call', 'dup', '\u2192 same visitor, 2nd time \u00b7 not counted again'],
      ['booking_step_5', 'ok', '\u2192 Booking completed \u2713'],
      ['mailto_click', 'ok', '\u2192 Email \u2713'],
      ['form_open', 't', '\u2192 form opened, not a conversion yet'],
      ['ads_call', 'ok', '\u2192 Call straight from the ad \u2713']
    ],
    direct: 'direct'
  } : {
    sending: 'L\u00e4hetet\u00e4\u00e4n\u2026', send: 'Pyyd\u00e4 ilmainen arvio',
    errA: ['L\u00e4hetys ei mennyt l\u00e4pi. Tarkista tiedot ja yrit\u00e4 uudelleen, tai l\u00e4het\u00e4 pyynt\u00f6 s\u00e4hk\u00f6postilla: ', '.'],
    errB: ['Emme saaneet vahvistusta siit\u00e4, ett\u00e4 pyynt\u00f6 tallentui. Yrit\u00e4 uudelleen, tai l\u00e4het\u00e4 pyynt\u00f6 s\u00e4hk\u00f6postilla: ', '.'],
    sc: function (ok, all) { return ok + '/' + all + ' kunnossa. ' + (ok === all ? 'Hienoa, tilisi perusasiat ovat kunnossa.' : ok >= all - 2 ? 'Melkein. Korjaa puuttuvat kohdat, niin budjetti tehoaa selv\u00e4sti paremmin.' : 'Tilill\u00e4 on todenn\u00e4k\u00f6isesti selv\u00e4\u00e4 hukkaa. Auditointi kertoisi, paljonko.'); },
    bgOk: function (n) { return 'Kaikki oikein. S\u00e4\u00e4stit t\u00e4ss\u00e4 esimerkiss\u00e4 noin ' + n + ' \u20ac kuukaudessa hauista, joista ei olisi tullut asiakkaita.'; },
    bgPart: function (r, a) { return r + '/' + a + ' oikein. Keltaiset j\u00e4iv\u00e4t viel\u00e4 negatiivisiksi lis\u00e4\u00e4m\u00e4tt\u00e4, punaiset ovat hyvi\u00e4 hakuja, joita ei kannata est\u00e4\u00e4.'; },
    term: [
      ['click_to_call', 'ok', '\u2192 Puhelu sivulta \u00b7 laskettu kerran \u2713'],
      ['generate_lead', 'ok', '\u2192 Tarjouspyynt\u00f6 l\u00e4hetetty \u2713'],
      ['page_view', 't', '\u2192 ei konversio, ohitetaan'],
      ['click_to_call', 'dup', '\u2192 sama k\u00e4vij\u00e4 2. kerran \u00b7 ei lasketa uudelleen'],
      ['booking_step_5', 'ok', '\u2192 Ajanvaraus valmis \u2713'],
      ['mailto_click', 'ok', '\u2192 S\u00e4hk\u00f6posti \u2713'],
      ['form_open', 't', '\u2192 lomake avattu, ei viel\u00e4 konversio'],
      ['ads_call', 'ok', '\u2192 Puhelu suoraan mainoksesta \u2713']
    ],
    direct: 'suora'
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- vuosi footeriin ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- korostuskynä näkyviin tullessa ---------- */
  // Oma näkyvyystarkistus IntersectionObserverin sijaan: toimii varmasti myös
  // taustavälilehdissä ja kuvakaappauksissa.
  var pending = [];
  function checkPending() {
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) { el.classList.add('is-in'); return false; }
      return true;
    });
  }
  document.querySelectorAll('.hl').forEach(function (el) { pending.push(el); });
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
      ['plumber near me', 'brightflowplumbing.com/emergency', 'Emergency Plumber Near You | Same-Day Service', 'Licensed and insured. Upfront pricing. Call or book online, 24/7.'],
      ['ac repair phoenix', 'coolairhvac.com/repair', 'AC Repair in Phoenix | Fast, Fair Pricing', 'Same-day repairs on all makes. Free estimates. Book online in 60 seconds.'],
      ['roof replacement cost', 'summitroofing.com/estimate', 'Roof Replacement | Get a Free Estimate', 'Fixed-price quotes. 25-year workmanship warranty. Financing available.']
    ] : [
      ['kotisiivous helsinki', 'siivousyritys.fi/kotisiivous', 'Kotisiivous Helsingissä | Näe hinta heti ja varaa', 'Valitse sopiva aika netistä. Hinta näkyy ennen varausta.'],
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

  /* ================= ALASIVUJEN ERIKOISUUDET ================= */

  /* ---------- terminaali: konversiotapahtumat juoksevat ---------- */
  document.querySelectorAll('[data-terminal]').forEach(function (term) {
    var body = term.querySelector('.terminal-body');
    var lines = T.term.map(function (l) { return ['ev', l[0], l[1], l[2]]; });
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
      out.textContent = T.sc(ok, all);
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
          saved += parseInt(nums[0].textContent, 10) * parseFloat(nums[1].textContent.replace(/[^0-9.,]/g, '').replace(',', '.'));
        }
      });
      msg.textContent = right === boxes.length ? T.bgOk(Math.round(saved)) : T.bgPart(right, boxes.length);
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

  /* ---------- valuuttavalitsin (USD / EUR), vain englanninkielisellä sivustolla ---------- */
  if (EN) {
    var curBtns = document.querySelectorAll('[data-set-cur]');
    var qsCur = new URLSearchParams(location.search).get('cur');
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var curNow = qsCur === 'eur' || qsCur === 'usd' ? qsCur : (tz === 'Europe/Helsinki' ? 'eur' : 'usd');
    var applyCur = function (c) {
      curNow = c;
      document.querySelectorAll('[data-cur]').forEach(function (el) { el.hidden = el.dataset.cur !== c; });
      curBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setCur === c)); });
    };
    curBtns.forEach(function (b) { b.addEventListener('click', function () { applyCur(b.dataset.setCur); }); });
    applyCur(curNow);
  }

  /* ---------- Ilmainen arvio -lomake ---------- */
  var arvio = document.getElementById('arvio-form');

  // Lähettää lomakkeen Apps Scriptille ja lukee vastauksen: 'ok' = tallentui, 'invalid' = tiedot hylättiin
  // (virhe A), kaikki muu (muu vastaus, HTTP-virhe, verkkovirhe, aikakatkaisu) = virhe B.
  function submitLead(btn, status, body, mailto) {
    var done = false;
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer;
    var timeout = new Promise(function (resolve, reject) {
      timer = setTimeout(function () { if (ctrl) ctrl.abort(); reject(new Error('timeout')); }, SEND_TIMEOUT_MS);
    });
    var request = new Promise(function (resolve) {
      resolve(fetch(ENDPOINT, { method: 'POST', body: body, signal: ctrl ? ctrl.signal : undefined }));
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.text();
    });
    var fail = function (kind) {
      var parts = kind === 'A' ? T.errA : T.errB, link = document.createElement('a');
      btn.disabled = false; btn.textContent = T.send;
      link.href = mailto; link.textContent = 'akseli@pikasivut.com';
      status.textContent = '';
      status.appendChild(document.createTextNode(parts[0]));
      status.appendChild(link);
      status.appendChild(document.createTextNode(parts[1]));
      status.hidden = false;
      status.tabIndex = -1;
      status.focus();
    };
    Promise.race([request, timeout]).then(function (text) {
      clearTimeout(timer);
      if (done) return;
      done = true;
      var answer = String(text).trim();
      if (answer === 'ok') {
        arvio.dispatchEvent(new Event('arvio:sent'));
        arvio.hidden = true;
        arvio.parentNode.querySelector('.arvio-done').hidden = false;
        scrollTo({ top: 0, behavior: 'smooth' });
      } else fail(answer === 'invalid' ? 'A' : 'B');
    }, function () {
      clearTimeout(timer);
      if (done) return;
      done = true;
      fail('B');
    });
  }

  if (arvio && arvio.elements.business) {
    // Englanninkielinen (USA) arviolomake: yrityksen nimi + verkkosivu
    var enErr = function (name, on) { var el = arvio.querySelector('[data-err="' + name + '"]'); if (el) el.hidden = !on; };
    var enStatus = arvio.querySelector('.form-status');
    arvio.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = arvio.elements;
      var okB = f.business.value.trim().length > 1, okS = /\./.test(f.site.value.trim()) && f.site.value.trim().length > 3;
      var okM = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()), okC = f.consent.checked;
      enErr('business', !okB); enErr('site', !okS); enErr('email', !okM); enErr('consent', !okC);
      if (!(okB && okS && okM && okC)) { (!okB ? f.business : !okS ? f.site : !okM ? f.email : f.consent).focus(); return; }
      if (f.hp.value) return;
      var btn = arvio.querySelector('button[type=submit]');
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = T.sending; enStatus.hidden = true;
      var qs = new URLSearchParams(location.search);
      var body = new URLSearchParams({
        market: 'en', business: f.business.value.trim(), site: f.site.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
        country: f.country.value, goal: f.goal.value, consent: 'yes', hp: '',
        source: qs.get('utm_source') || qs.get('s') || (document.referrer ? new URL(document.referrer).hostname : T.direct)
      });
      var mailto = 'mailto:akseli@pikasivut.com?subject=Free%20Google%20Ads%20assessment&body=' +
        encodeURIComponent('Business: ' + f.business.value.trim() + '\nWebsite: ' + f.site.value.trim() + '\n');
      submitLead(btn, enStatus, body, mailto);
    });
  } else if (arvio) {
    var showErr = function (name, on) { var el = arvio.querySelector('[data-err="' + name + '"]'); if (el) el.hidden = !on; };
    var status = arvio.querySelector('.form-status');
    arvio.addEventListener('submit', function (e) {
      e.preventDefault();
      var yritys = arvio.elements.yritys;
      var okYr = yritys.value.trim().length >= 2, okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(arvio.elements.email.value.trim()), okC = arvio.elements.consent.checked;
      showErr('yritys', !okYr); showErr('email', !okMail); showErr('consent', !okC);
      if (!(okYr && okMail && okC)) { (!okYr ? yritys : !okMail ? arvio.elements.email : arvio.elements.consent).focus(); return; }
      if (arvio.elements.website.value) return; // robotti
      var btn = arvio.querySelector('button[type=submit]');
      if (btn.disabled) return;
      btn.disabled = true; btn.textContent = T.sending;
      status.hidden = true;
      var qs = new URLSearchParams(location.search);
      var name = yritys.value.trim().slice(0, 120);
      var body = new URLSearchParams({
        yritys: name, email: arvio.elements.email.value.trim(), phone: arvio.elements.phone.value.trim(),
        goal: arvio.elements.goal.value, consent: 'yes', website: '',
        source: qs.get('utm_source') || qs.get('s') || (document.referrer ? new URL(document.referrer).hostname : T.direct)
      });
      var mailto = 'mailto:akseli@pikasivut.com?subject=Ilmainen%20mainonta-arvio&body=' +
        encodeURIComponent('Yritys: ' + name + '\nTavoite: ' + (arvio.elements.goal.value || '-') + '\n');
      submitLead(btn, status, body, mailto);
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
      if (h.indexOf('/arvio/') === 0) track('cta_click');
    });
    var f = document.getElementById('arvio-form');
    if (f) {
      var started = false;
      f.addEventListener('focusin', function () { if (!started) { started = true; track('form_start'); } });
      f.addEventListener('arvio:sent', function () { track('form_submit'); });
    }
  })();
})();
