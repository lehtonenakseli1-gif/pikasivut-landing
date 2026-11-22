/* Pikasivut: seuranta koko sivustolle (GTM + Consent Mode v2 + evästepalkki + klikkitunnisteet + tapahtumat).
   Ladataan <head>:ssä synkronisesti ennen muita skriptejä:  <script src="/seuranta.js?v=..."></script>
   Mainossivulla (google-ads-hallinta) suostumus, GTM ja palkki ovat jo sivun omassa koodissa, joten siellä
   tiedosto ladataan attribuutilla data-vain-tapahtumat: silloin lisätään vain klikkitapahtumat.

   dataLayer-tapahtumat GTM:ää varten (Custom Event -laukaisimet):
     phone_click     tel:-linkin klikkaus           { link_url, sivu }
     email_click     mailto:-linkin klikkaus        { link_url, sivu }
     cta_click       arvio-/laskuri-/tarjousnapit   { cta_teksti, link_url, sivu }
     arvio_start     arviolomakkeen ensimmäinen kosketus { sivu }
     arvio_submit    arviolomake tallentui (palvelin vastasi 'ok') { tavoite, sivu }
     consent_update  evästevalinta                  { suostumus: 'kaikki' | 'valttamattomat' }
   Mainossivun laskuri lähettää lisäksi calculator_start, calculator_step {vaihe}, calculator_prices_ready,
   calculator_contact_start ja calculator_submit (laskuri.js). Kaikki tapahtumat välitetään myös Clarityyn. */
(function () {
  'use strict';
  var GTM_ID = 'GTM-W7BH9F5S';
  var SUOSTUMUS_AVAIN = 'pikasivut_suostumus';   // sama kuin mainossivulla: valinta pätee koko sivustolla
  var GCLID_AVAIN = 'pikasivut_gclid';
  var GCLID_VOIMASSA_MS = 90 * 24 * 3600 * 1000;

  var skripti = document.currentScript;
  var vainTapahtumat = !!(skripti && skripti.hasAttribute('data-vain-tapahtumat'));

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (typeof window.gtag !== 'function') window.gtag = gtag;

  function lueSuostumus() {
    try {
      var v = JSON.parse(localStorage.getItem(SUOSTUMUS_AVAIN) || 'null');
      return (v && (v.valinta === 'kaikki' || v.valinta === 'valttamattomat')) ? v.valinta : null;
    } catch (e) { return null; }
  }
  var suostumus = lueSuostumus();
  var sivu = location.pathname;

  /* ---------- 1. Consent Mode + GTM (heti, ennen sivun muuta sisältöä) ---------- */
  if (!vainTapahtumat) {
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
    window.gtag('set', 'ads_data_redaction', true);
    if (suostumus === 'kaikki') {
      window.gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    }
    (function (w, d, s, l, i) {
      w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s);
      j.async = true;
      j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', GTM_ID);
  }

  /* ---------- 2. Klikkitunnisteet (gclid/gbraid/wbraid), 90 pv vain suostumuksella ---------- */
  var qs = new URLSearchParams(location.search);
  var tunnisteMuisti = {};
  ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { var v = qs.get(k); if (v) tunnisteMuisti[k] = v.slice(0, 200); });
  function lueTallennetut() {
    try {
      var v = JSON.parse(localStorage.getItem(GCLID_AVAIN) || 'null');
      if (!v) return {};
      var ika = Date.now() - Date.parse(v.aika);
      if (!(ika >= 0 && ika <= GCLID_VOIMASSA_MS)) { localStorage.removeItem(GCLID_AVAIN); return {}; }
      return v;
    } catch (e) { return {}; }
  }
  function tallennaTunnisteet() {
    if (suostumus !== 'kaikki' || !Object.keys(tunnisteMuisti).length) return;
    try {
      var uusi = { gclid: '', gbraid: '', wbraid: '', aika: new Date().toISOString() };
      Object.keys(tunnisteMuisti).forEach(function (k) { uusi[k] = tunnisteMuisti[k]; });
      localStorage.setItem(GCLID_AVAIN, JSON.stringify(uusi));
    } catch (e) {}
  }
  // Lomakkeet (site.js) liittävät nämä lähetykseen: vain suostumuksella
  window.pikasivutTunnisteet = function () {
    suostumus = lueSuostumus();
    if (suostumus !== 'kaikki') return {};
    var v = Object.keys(tunnisteMuisti).length ? tunnisteMuisti : lueTallennetut();
    var ulos = {};
    ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { if (v[k]) ulos[k] = v[k]; });
    return ulos;
  };
  if (!vainTapahtumat && suostumus === 'kaikki') tallennaTunnisteet();

  /* ---------- 2b. Tapahtumat myös Clarityyn (vain jos Clarity on ladattu, eli suostumuksella) ----------
     Näin Clarityn tallenteet voi suodattaa esim. tapahtumalla calculator_submit tai phone_click. */
  // Clarity ladataan vain evästehyväksynnällä: heti, jos valinta on jo tallennettu, tai kun kävijä hyväksyy
  // (consent_update). Sama __psClarity-vahti on GTM:n Clarity-tagissa, joten kaksoislatausta ei tule.
  var CLARITY_ID = 'zh67xy7ndp';
  function lataaClarity() {
    if (window.__psClarity) return;
    window.__psClarity = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    window.clarity('consent');
  }
  if (lueSuostumus() === 'kaikki') lataaClarity();

  if (!window.__psClarityForward) {
    window.__psClarityForward = true;
    var alkupPush = window.dataLayer.push;
    window.dataLayer.push = function () {
      var tulos = alkupPush.apply(window.dataLayer, arguments);
      try {
        for (var i = 0; i < arguments.length; i++) {
          var o = arguments[i];
          if (o && o.event === 'consent_update' && o.suostumus === 'kaikki') lataaClarity();
          if (o && typeof o.event === 'string' && o.event.indexOf('gtm.') !== 0 && typeof window.clarity === 'function') {
            window.clarity('event', o.event);
          }
        }
      } catch (e) {}
      return tulos;
    };
  }

  /* ---------- 3. Tapahtumat ---------- */
  function push(o) { o.sivu = sivu; window.dataLayer.push(o); }
  function onCta(a) {
    var h = a.getAttribute('href') || '';
    return /^\/arvio\/?(\?|#|$)/.test(h) || /^\/?google-ads-hallinta\/#laskuri/.test(h) || /^\/google-ads-hallinta\/#laskuri/.test(h) ||
      h === '#laskuri' || a.classList.contains('nav-cta') || a.classList.contains('btn-primary');
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href');
    if (/^tel:/i.test(h)) push({ event: 'phone_click', link_url: h });
    else if (/^mailto:/i.test(h)) push({ event: 'email_click', link_url: h.split('?')[0] });
    else if (onCta(a)) push({ event: 'cta_click', cta_teksti: (a.textContent || '').trim().slice(0, 60), link_url: h });
  }, true);

  function kunValmis(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  kunValmis(function () {
    var arvio = document.getElementById('arvio-form');
    if (arvio) {
      var aloitettu = false;
      var aloita = function () { if (!aloitettu) { aloitettu = true; push({ event: 'arvio_start' }); } };
      arvio.addEventListener('focusin', aloita);
      arvio.addEventListener('arvio:sent', function () {
        var g = arvio.elements.goal;
        push({ event: 'arvio_submit', tavoite: g ? g.value : '' });
      });
    }
    if (!vainTapahtumat) rakennaPalkki();
  });

  /* ---------- 4. Evästepalkki (ei-estävä, sama teksti kuin mainossivulla) ---------- */
  function rakennaPalkki() {
    var css = document.createElement('style');
    css.textContent =
      '.ps-evaste{position:fixed;left:0;right:0;bottom:0;z-index:100;background:#fff7e0;border-top:3px solid #f2b84b;box-shadow:0 -10px 30px rgba(22,23,28,.14);font-family:var(--body,system-ui,sans-serif);}' +
      '.ps-evaste-sisus{max-width:1200px;margin:0 auto;padding:1.1rem 1rem calc(1.1rem + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:.9rem;}' +
      '.ps-evaste-alku{display:flex;align-items:flex-start;gap:.85rem;}' +
      '.ps-keksi{width:2.75rem;height:2.75rem;flex:none;transform:rotate(-8deg);}' +
      '.ps-evaste-teksti{font-size:.9375rem;line-height:1.5;color:#4b4a45;margin:0;}' +
      '.ps-evaste-teksti strong{display:block;font-size:1.125rem;color:#16171c;margin:0 0 .3rem;}' +
      '.ps-evaste-teksti a{color:var(--blue,#1a3fd1);}' +
      '.ps-evaste-napit{display:flex;gap:.6rem;}' +
      '.ps-evaste-nappi{flex:1 1 0;min-height:3rem;padding:.5rem .8rem;border:0;border-radius:100px;background:var(--blue,#1a3fd1);color:#fff;font:inherit;font-weight:700;font-size:1rem;cursor:pointer;}' +
      '.ps-evaste-nappi:hover{background:var(--blue-dark,#0f2a96);}' +
      '.ps-evaste-asetukset{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer;}' +
      '@media (min-width:768px){.ps-evaste-sisus{flex-direction:row;align-items:center;gap:2.5rem;padding:2rem 2rem;}.ps-evaste-alku{flex:1 1 auto;align-items:center;gap:1.5rem;}.ps-keksi{width:4.5rem;height:4.5rem;}.ps-evaste-teksti{font-size:1.0625rem;}.ps-evaste-teksti strong{font-size:1.375rem;}.ps-evaste-napit{flex:none;}.ps-evaste-nappi{flex:none;width:14rem;min-height:3.5rem;font-size:1.125rem;}}' +
      '@media (max-height:500px) and (min-width:480px){.ps-evaste-sisus{flex-direction:row;align-items:center;gap:1rem;padding:.5rem 1rem;}.ps-keksi{width:2rem;height:2rem;}.ps-evaste-teksti{font-size:.8125rem;}.ps-evaste-teksti strong{display:inline;font-size:inherit;margin-right:.3rem;}.ps-evaste-napit{flex:none;flex-direction:column;gap:.35rem;}.ps-evaste-nappi{min-height:2.25rem;font-size:.875rem;width:10.5rem;}}';
    document.head.appendChild(css);

    var palkki = document.createElement('div');
    palkki.className = 'ps-evaste';
    palkki.setAttribute('role', 'region');
    palkki.setAttribute('aria-label', 'Evästeasetukset');
    palkki.hidden = true;
    palkki.innerHTML =
      '<div class="ps-evaste-sisus"><div class="ps-evaste-alku"><svg class="ps-keksi" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M33.5 6.2c6.4-.6 13 1.6 19.4 7.1-2.8 1.7-3.6 5.1-1.2 7.4 2.1 2 5.6 2 7.9.2 1.9 6.2 1.7 13.4-1.4 20.2-4.6 10.1-14.2 16.8-25.6 16.3C19.1 56.9 8.6 49 6.3 36.6 3.9 23.7 11 11.2 22.4 7.5c3.6-1.1 7.4-1.2 11.1-1.3z" fill="#e8b46a" stroke="#4a2c12" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.6 30.4c.9-.6 2-.6 2.9.3M45.2 33.6c1.2-.2 2.1.5 2.3 1.6M29.6 47.9c1-.7 2.3-.7 3.2.1M17.6 46.1c.6-.9 1.6-1.2 2.6-.7" fill="none" stroke="#b9823f" stroke-width="1.6" stroke-linecap="round"/><path d="M19.2 19.6l4.8-2.3 2.6 3.6-3.1 3.4-4.6-1.2zM35.4 26.1l4.5.9-.4 4.9-5.3.3-1.1-3.6zM21.3 37.4l4.1-1.5 2.4 3.8-2.6 3.4-4.4-1.5zM39.8 43.2l4.7-1.6.7 4.2-3.6 2.6-2.7-2.1zM29.6 13.8l3.1-.7 1.4 2.8-2.6 1.6-2.4-1.4zM47.9 27.4l2.6-.4.6 2.6-2.4 1z" fill="#4a2c12" stroke="#4a2c12" stroke-width="1" stroke-linejoin="round"/><path d="M57.6 13.6a1.3 1.4 0 1 0 .1 0zM61 10.4a.9 1 0 1 0 .1 0zM55.4 8.7a1.1 1 0 1 0 .1 0z" fill="#e8b46a" stroke="#4a2c12" stroke-width="1.2"/></svg><p class="ps-evaste-teksti"><strong>Evästeasetukset</strong>Käytämme evästeitä Google Ads -mainonnan mittaamiseen ja kohdentamiseen sekä kävijäanalytiikkaan vain, jos hyväksyt. Sivu toimii myös ilman niitä. Voit muuttaa valintaa sivun alalaidasta. <a href="/privacy.html">Tietosuojaseloste</a></p></div>' +
      '<div class="ps-evaste-napit"><button type="button" class="ps-evaste-nappi" data-valinta="kaikki">Hyväksy</button><button type="button" class="ps-evaste-nappi" data-valinta="valttamattomat">Vain välttämättömät</button></div></div>';
    document.body.appendChild(palkki);

    var valike = document.createElement('div');
    valike.setAttribute('aria-hidden', 'true');
    document.body.appendChild(valike);
    function paivita() {
      var h = palkki.hidden ? 0 : palkki.offsetHeight;
      valike.style.height = h + 'px';
      document.documentElement.style.scrollPaddingBottom = h ? (h + 8) + 'px' : '';
    }
    function nayta() { palkki.hidden = false; paivita(); }
    function piilota() { palkki.hidden = true; paivita(); }

    palkki.addEventListener('click', function (e) {
      var b = e.target.closest('[data-valinta]');
      if (!b) return;
      var valinta = b.getAttribute('data-valinta');
      var tila = valinta === 'kaikki' ? 'granted' : 'denied';
      window.gtag('consent', 'update', { ad_storage: tila, ad_user_data: tila, ad_personalization: tila, analytics_storage: tila });
      window.dataLayer.push({ event: 'consent_update', suostumus: valinta });
      try { localStorage.setItem(SUOSTUMUS_AVAIN, JSON.stringify({ valinta: valinta, aika: new Date().toISOString() })); } catch (err) {}
      suostumus = valinta;
      if (valinta === 'kaikki') tallennaTunnisteet();
      else { try { localStorage.removeItem(GCLID_AVAIN); } catch (err) {} }
      piilota();
    });
    window.addEventListener('resize', paivita);

    // Alatunnisteeseen Evästeasetukset-linkki valinnan muuttamiseen
    var ala = document.querySelector('.footer-legal') || document.querySelector('footer p');
    if (ala) {
      var nappi = document.createElement('button');
      nappi.type = 'button';
      nappi.className = 'ps-evaste-asetukset';
      nappi.textContent = 'Evästeasetukset';
      nappi.addEventListener('click', nayta);
      ala.appendChild(document.createTextNode(' · '));
      ala.appendChild(nappi);
    }
    if (!suostumus) nayta();
  }
})();
