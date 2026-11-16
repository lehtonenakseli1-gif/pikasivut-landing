/* Suutarilan AD-Autohuolto – demo v2. Ei ulkoisia palveluita, lomake ei lähetä mitään. */
(function () {
  'use strict';
  var NUM = '050 557 2709';

  /* ---------- Aukiolo (Europe/Helsinki), ma–pe 8–17 ----------
     Soita-napit näkyvät ja ovat tel:-linkkejä vain aukioloaikana. Suljettuna ne piilotetaan
     (Varaa aika jää pääpainikkeeksi) ja numero näkyy tekstinä. Testaus: ?auki=1 / ?auki=0. */
  function helsinkiNow() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var days = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    return { d: days[p.weekday], m: parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10) };
  }
  function state() {
    var q = new URLSearchParams(location.search).get('auki');
    var t = helsinkiNow(), wk = t.d >= 1 && t.d <= 5;
    var open = wk && t.m >= 480 && t.m < 1020;
    if (q === '1') open = true;
    if (q === '0') open = false;
    var txt;
    if (open) txt = 'Avoinna nyt, klo 17 asti';
    else if (q === '0') txt = 'Suljettu nyt · avaamme arkisin klo 8';
    else if (wk && t.m < 480) txt = 'Suljettu nyt · avaamme tänään klo 8';
    else if (t.d >= 1 && t.d <= 4) txt = 'Suljettu nyt · avaamme huomenna klo 8';
    else txt = 'Suljettu nyt · avaamme maanantaina klo 8';
    return { open: open, txt: txt };
  }
  function refresh() {
    var s = state();
    document.querySelectorAll('[data-status]').forEach(function (el) {
      el.textContent = s.txt + (s.open ? '' : ' · ');
      if (!s.open) { var n = document.createElement('span'); n.className = 'tel-txt'; n.textContent = NUM; el.appendChild(n); }
      el.toggleAttribute('data-open', s.open);
    });
    document.querySelectorAll('[data-call]').forEach(function (a) { a.hidden = !s.open; });
    document.querySelectorAll('[data-call-info]').forEach(function (a) {
      var sm = a.querySelector('[data-call-small]');
      if (s.open) { a.setAttribute('href', 'tel:+358505572709'); sm.textContent = 'Soita meille'; }
      else { a.removeAttribute('href'); sm.textContent = 'Avoinna ma–pe 8–17'; }
    });
  }
  refresh();
  setInterval(refresh, 60000);

  /* ---------- Mobiilivalikko ---------- */
  var burger = document.querySelector('details.burger');
  if (burger) {
    burger.addEventListener('toggle', function () {
      var p = burger.querySelector('.burger-p');
      p.style.top = Math.round(document.querySelector('.head').getBoundingClientRect().bottom) + 'px';
      document.documentElement.style.overflow = burger.open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.open) { burger.open = false; burger.querySelector('summary').focus(); }
    });
    burger.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { burger.open = false; }); });
  }

  /* ---------- Lomake ---------- */
  var f = document.getElementById('qf');
  if (!f) return;
  var sel = document.getElementById('palvelu');
  var desc = document.getElementById('kuvaus');
  var pre = new URLSearchParams(location.search).get('palvelu');
  if (sel && pre && sel.querySelector('option[value="' + pre.replace(/[^a-z-]/g, '') + '"]')) sel.value = pre;

  /* Varaa aika -sivun valinnat: esivalitsee palvelun ja näyttää, mitä kannattaa kertoa. */
  var tip = document.getElementById('tip');
  if (tip && window.PICKS) {
    document.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        tip.innerHTML = '';
        if (!on) { tip.hidden = true; return; }
        b.setAttribute('aria-pressed', 'true');
        var p = window.PICKS[+b.dataset.i];
        sel.value = p.s;
        if (!desc.value.trim() || desc.dataset.auto === desc.value) { desc.value = p.t + ': '; desc.dataset.auto = desc.value; }
        var t = document.createElement('p');
        var bb = document.createElement('b'); bb.textContent = p.n; t.appendChild(document.createTextNode('Valittu palvelu: ')); t.appendChild(bb);
        var ul = document.createElement('ul');
        p.l.forEach(function (x) { var li = document.createElement('li'); li.textContent = x; ul.appendChild(li); });
        tip.appendChild(t); tip.appendChild(ul); tip.hidden = false;
      });
    });
  }

  var reg = document.getElementById('reg');
  if (reg) reg.addEventListener('input', function () {
    var p = reg.selectionStart;
    reg.value = reg.value.toUpperCase();
    reg.setSelectionRange(p, p);
  });
  var MSG = { rekisteri: 'Kirjoita auton rekisterinumero.', kuvaus: 'Kerro lyhyesti, mitä autolle pitää tehdä.', nimi: 'Kirjoita nimesi.', puhelin: 'Kirjoita puhelinnumero, niin voimme soittaa takaisin.', email: 'Tarkista sähköpostiosoite.' };
  function check(el) {
    var v = el.value.trim(), bad = false;
    if (el.required && !v) bad = true;
    if (el.name === 'kuvaus' && desc.dataset.auto && v === desc.dataset.auto.trim()) bad = true;
    if (el.name === 'puhelin' && v && v.replace(/[^0-9]/g, '').length < 6) bad = true;
    if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
    var e = el.parentElement.querySelector('.err');
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (e) e.textContent = bad ? MSG[el.name] || 'Tarkista kenttä.' : '';
    return !bad;
  }
  var fields = f.querySelectorAll('input[required], textarea[required], input[type=email]');
  fields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value.trim() || el.getAttribute('aria-invalid') === 'true') check(el); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
  });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    fields.forEach(function (el) { if (!check(el) && !first) first = el; });
    if (first) { first.focus(); return; }
    /* Demo: ei lähetystä. Tuotannossa FormSubmit/Apps Script, konversio vasta onnistuneesta vastauksesta. */
    f.hidden = true;
    var tipEl = document.getElementById('tip'); if (tipEl) tipEl.hidden = true;
    document.querySelectorAll('.chips, .chips-l').forEach(function (x) { x.hidden = true; });
    var d = document.getElementById('done');
    d.hidden = false;
    d.focus({ preventScroll: true });
    d.scrollIntoView({ block: 'nearest' });
  });
})();
