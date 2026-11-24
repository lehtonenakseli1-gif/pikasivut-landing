(function () {
  'use strict';
  var K = window.KORJAAMO, D = ['sunnuntaina', 'maanantaina', 'tiistaina', 'keskiviikkona', 'torstaina', 'perjantaina', 'lauantaina'];
  function hm(m) { return Math.floor(m / 60) + (m % 60 ? '.' + ('0' + m % 60).slice(-2) : ''); }
  function now() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { d: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), m: +p.hour * 60 + +p.minute };
  }
  /* Soittonapit vain aukioloaikana. Testaus: ?auki=1 / ?auki=0 */
  function state() {
    var q = new URLSearchParams(location.search).get('auki'), t = now(), h = K.hours[t.d], open = !!h && t.m >= h[0] && t.m < h[1];
    if (q === '1') open = true;
    if (q === '0') open = false;
    if (open) return { open: true, txt: 'Avoinna nyt' + (h ? ', klo\u00a0' + hm(h[1]) + ' asti' : '') };
    for (var i = 0; i < 8; i++) {
      var d = (t.d + i) % 7, x = K.hours[d];
      if (x && (i > 0 || t.m < x[0])) return { open: false, txt: 'Suljettu nyt, avaamme ' + (i === 0 ? 'tänään' : i === 1 ? 'huomenna' : D[d]) + ' klo\u00a0' + hm(x[0]) };
    }
    return { open: false, txt: 'Suljettu nyt' };
  }
  function refresh() {
    var s = state();
    document.querySelectorAll('[data-status]').forEach(function (el) { el.textContent = s.open ? s.txt : s.txt + '. Puh.\u00a0' + K.num.replace(/ /g, '\u00a0'); el.toggleAttribute('data-open', s.open); });
    document.querySelectorAll('[data-call]').forEach(function (a) { a.hidden = !s.open; });
    document.querySelectorAll('[data-call-info]').forEach(function (a) { if (s.open) a.setAttribute('href', 'tel:' + K.tel); else a.removeAttribute('href'); });
  }
  refresh(); setInterval(refresh, 60000);

  var b = document.querySelector('details.burger');
  if (b) {
    b.addEventListener('toggle', function () {
      b.querySelector('.burger-p').style.top = Math.round(document.querySelector('.head').getBoundingClientRect().bottom) + 'px';
      document.documentElement.style.overflow = b.open ? 'hidden' : '';
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.open) { b.open = false; b.querySelector('summary').focus(); } });
    b.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { b.open = false; }); });
  }
  document.querySelectorAll('.map').forEach(function (m) {
    m.querySelector('button').addEventListener('click', function () {
      var f = document.createElement('iframe'); f.src = m.dataset.mapSrc; f.title = m.dataset.mapTitle; f.loading = 'lazy';
      m.innerHTML = ''; m.appendChild(f);
    });
  });

  var f = document.getElementById('qf');
  if (!f) return;
  var sel = document.getElementById('palvelu'), pre = new URLSearchParams(location.search).get('palvelu');
  if (pre && sel.querySelector('option[value="' + pre.replace(/[^a-z-]/g, '') + '"]')) sel.value = pre;
  var reg = document.getElementById('reg');
  reg.addEventListener('input', function () { var p = reg.selectionStart; reg.value = reg.value.toUpperCase(); reg.setSelectionRange(p, p); });
  var MSG = { rekisteri: 'Kirjoita auton rekisterinumero.', kuvaus: 'Kerro lyhyesti, mitä autolle pitää tehdä.', nimi: 'Kirjoita nimesi.', puhelin: 'Kirjoita puhelinnumero, niin voimme soittaa takaisin.', email: 'Tarkista sähköpostiosoite.' };
  function check(el) {
    var v = el.value.trim(), bad = el.required && !v;
    if (el.name === 'puhelin' && v && v.replace(/\D/g, '').length < 6) bad = true;
    if (el.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) bad = true;
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    var e = el.parentElement.querySelector('.err'); if (e) e.textContent = bad ? MSG[el.name] : '';
    return !bad;
  }
  var fields = f.querySelectorAll('input[required], textarea[required], input[type=email]');
  fields.forEach(function (el) {
    el.addEventListener('blur', function () { if (el.value.trim() || el.getAttribute('aria-invalid') === 'true') check(el); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') check(el); });
  });
  /* Esikatselu: mitään ei lähetetä. Lähetys (Apps Script) lisätään julkaisussa. */
  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var first = null;
    fields.forEach(function (el) { if (!check(el) && !first) first = el; });
    if (first) { first.focus(); return; }
    f.hidden = true;
    var d = document.getElementById('done'); d.hidden = false; d.focus({ preventScroll: true }); d.scrollIntoView({ block: 'nearest' });
  });
})();
