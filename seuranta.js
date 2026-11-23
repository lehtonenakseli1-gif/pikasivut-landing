/* Pikasivut: seuranta koko sivustolle (GTM + Consent Mode v2 + evästepalkki + klikkitunnisteet + tapahtumat).
   Ladataan <head>:ssä synkronisesti ennen muita skriptejä:  <script src="/seuranta.js?v=..."></script>
   Mainossivulla (google-ads-hallinta) consent default ja GTM ovat jo sivun head-skriptissä, joten siellä
   tiedosto ladataan attribuutilla data-vain-tapahtumat: silloin GTM:ää ei ladata uudelleen, mutta evästepalkki,
   klikkitunnisteet ja tapahtumat tulevat tästä tiedostosta kuten muillakin sivuilla.

   Evästepalkki (Akseli 22.11.): ei-estävä alapalkki, kytkimet Analytiikka ja Markkinointi (oletuksena pois)
   ja kolme samankokoista nappia: Hylkää kaikki, Salli valitut, Salli kaikki.
     Analytiikka  -> analytics_storage + Microsoft Clarity
     Markkinointi -> ad_storage, ad_user_data, ad_personalization + klikkitunnisteiden (gclid) tallennus
   localStorage 'pikasivut_suostumus' = { valinta: 'kaikki'|'valitut'|'valttamattomat', analytiikka, markkinointi, aika }.
   Vanha muoto { valinta: 'kaikki'|'valttamattomat' } luetaan edelleen (kaikki = molemmat päällä).

   dataLayer-tapahtumat GTM:ää varten (Custom Event -laukaisimet):
     phone_click     tel:-linkin klikkaus           { link_url, sivu }
     email_click     mailto:-linkin klikkaus        { link_url, sivu }
     cta_click       arvio-/laskuri-/tarjousnapit   { cta_teksti, link_url, sivu }
     arvio_start     arviolomakkeen ensimmäinen kosketus { sivu }
     arvio_submit    arviolomake tallentui (palvelin vastasi 'ok') { tavoite, sivu }
     consent_update  evästevalinta                  { suostumus: 'kaikki' | 'valitut' | 'valttamattomat', analytiikka, markkinointi }
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

  // Palauttaa { analytiikka, markkinointi } tai null, jos valintaa ei ole tehty
  function lueSuostumus() {
    try {
      var v = JSON.parse(localStorage.getItem(SUOSTUMUS_AVAIN) || 'null');
      if (!v) return null;
      if (typeof v.analytiikka === 'boolean' && typeof v.markkinointi === 'boolean') return { analytiikka: v.analytiikka, markkinointi: v.markkinointi };
      if (v.valinta === 'kaikki') return { analytiikka: true, markkinointi: true };
      if (v.valinta === 'valttamattomat') return { analytiikka: false, markkinointi: false };
      return null;
    } catch (e) { return null; }
  }
  function consentTila(s) {
    var m = s && s.markkinointi ? 'granted' : 'denied';
    return { ad_storage: m, ad_user_data: m, ad_personalization: m, analytics_storage: s && s.analytiikka ? 'granted' : 'denied' };
  }
  var suostumus = lueSuostumus();
  function markkinointiOk() { return !!(suostumus && suostumus.markkinointi); }
  function analytiikkaOk() { return !!(suostumus && suostumus.analytiikka); }
  var sivu = location.pathname;

  /* ---------- 1. Consent Mode + GTM (heti, ennen sivun muuta sisältöä) ---------- */
  if (!vainTapahtumat) {
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
    window.gtag('set', 'ads_data_redaction', true);
    if (suostumus && (suostumus.analytiikka || suostumus.markkinointi)) {
      window.gtag('consent', 'update', consentTila(suostumus));
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
    if (!markkinointiOk() || !Object.keys(tunnisteMuisti).length) return;
    try {
      var uusi = { gclid: '', gbraid: '', wbraid: '', aika: new Date().toISOString() };
      Object.keys(tunnisteMuisti).forEach(function (k) { uusi[k] = tunnisteMuisti[k]; });
      localStorage.setItem(GCLID_AVAIN, JSON.stringify(uusi));
    } catch (e) {}
  }
  // Lomakkeet (site.js) liittävät nämä lähetykseen: vain suostumuksella
  window.pikasivutTunnisteet = function () {
    suostumus = lueSuostumus();
    if (!markkinointiOk()) return {};
    var v = Object.keys(tunnisteMuisti).length ? tunnisteMuisti : lueTallennetut();
    var ulos = {};
    ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { if (v[k]) ulos[k] = v[k]; });
    return ulos;
  };
  if (markkinointiOk()) tallennaTunnisteet();

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
  if (analytiikkaOk()) lataaClarity();

  if (!window.__psClarityForward) {
    window.__psClarityForward = true;
    var alkupPush = window.dataLayer.push;
    window.dataLayer.push = function () {
      var tulos = alkupPush.apply(window.dataLayer, arguments);
      try {
        for (var i = 0; i < arguments.length; i++) {
          var o = arguments[i];
          if (o && o.event === 'consent_update' && (o.analytiikka === true || o.suostumus === 'kaikki')) lataaClarity();
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
    rakennaPalkki();
  });

  /* ---------- 4. Evästepalkki (ei-estävä alapalkki: kytkimet + 3 samankokoista nappia, Akseli 22.11.) ---------- */
  function rakennaPalkki() {
    var css = document.createElement('style');
    css.textContent =
      '.ps-evaste{position:fixed;left:0;right:0;bottom:0;z-index:100;background:#16171c;color:#fff;border-top:4px solid #1a3fd1;border-image:linear-gradient(90deg,#1a3fd1 0 25%,#e8453c 25% 50%,#f4b400 50% 75%,#0f9d58 75%) 1;box-shadow:0 -10px 30px rgba(22,23,28,.25);font-family:var(--body,system-ui,sans-serif);}' +
      '.ps-evaste[hidden]{display:none;}' +
      '.ps-evaste-sisus{max-width:1400px;margin:0 auto;padding:1rem 16px calc(1rem + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:.85rem;}' +
      '.ps-evaste-alku{display:flex;align-items:flex-start;gap:.85rem;min-width:0;}' +
      '.ps-keksi{width:2.5rem;height:2.5rem;flex:none;transform:rotate(-8deg);}' +
      '.ps-evaste-otsikko{display:block;font-family:var(--body,system-ui,sans-serif);font-size:1.0625rem;font-weight:700;line-height:1.3;color:#fff;margin:0 0 .25rem;letter-spacing:0;}' +
      '.ps-evaste-otsikko:focus{outline:none;}.ps-evaste-otsikko:focus-visible{outline:3px solid #f4b400;outline-offset:2px;}' +
      '.ps-evaste-teksti{font-size:.875rem;line-height:1.45;color:#c9cbd3;margin:0;}' +
      '.ps-evaste-teksti a{color:#9fb3ff;}' +
      '.ps-evaste-valinnat{display:flex;flex-wrap:wrap;gap:.4rem .5rem;margin:0;padding:0;border:0;min-width:0;}' +
      '.ps-evaste-valinnat legend{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}' +
      '.ps-kytkin{position:relative;display:inline-flex;align-items:center;gap:.55rem;padding:.45rem .7rem .45rem .5rem;border:1px solid #3a3c46;border-radius:999px;font-size:.875rem;font-weight:600;line-height:1.2;color:#fff;cursor:pointer;user-select:none;}' +
      '.ps-kytkin input{position:absolute;opacity:0;width:1px;height:1px;margin:0;}' +
      '.ps-rata{position:relative;width:2.25rem;height:1.3rem;border-radius:999px;background:#4a4d59;flex:none;transition:background .15s;}' +
      '.ps-rata::after{content:"";position:absolute;top:.15rem;left:.15rem;width:1rem;height:1rem;border-radius:50%;background:#fff;transition:transform .15s;}' +
      '.ps-kytkin input:checked+.ps-rata{background:#1a3fd1;}' +
      '.ps-kytkin input:checked+.ps-rata::after{transform:translateX(.95rem);}' +
      '.ps-kytkin input:focus-visible+.ps-rata{outline:3px solid #f4b400;outline-offset:2px;}' +
      '.ps-kytkin.ps-lukittu{cursor:default;color:#9a9caa;}.ps-kytkin.ps-lukittu input:checked+.ps-rata{background:#5b6fbf;}' +
      '.ps-evaste-napit{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;}' +
      '.ps-evaste-nappi{min-height:3rem;padding:.35rem .4rem;border:2px solid #fff;border-radius:0;background:transparent;color:#fff;font:inherit;font-weight:700;font-size:.9375rem;line-height:1.2;cursor:pointer;}' +
      '.ps-evaste-nappi:hover{background:rgba(255,255,255,.1);}' +
      '.ps-evaste-nappi.ps-ensisijainen{background:#1a3fd1;border-color:#1a3fd1;}' +
      '.ps-evaste-nappi.ps-ensisijainen:hover{background:#2c52e8;border-color:#2c52e8;}' +
      '.ps-evaste-nappi:focus-visible{outline:3px solid #f4b400;outline-offset:2px;}' +
      '.ps-evaste-asetukset{background:none;border:0;padding:0;font:inherit;color:inherit;text-decoration:underline;cursor:pointer;}' +
      '@media (max-width:374px){.ps-evaste-teksti{font-size:.8125rem;}.ps-evaste-nappi{font-size:.875rem;}.ps-kytkin{font-size:.8125rem;}}' +
      '@media (min-width:768px) and (min-height:501px){' +
        '.ps-evaste-sisus{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1.5rem 2rem;padding:2.25rem 32px;}' +
        '.ps-evaste-vasen{display:contents;}' +
        '.ps-evaste-alku{grid-column:1 / -1;align-items:center;gap:1.5rem;}' +
        '.ps-keksi{width:4.5rem;height:4.5rem;}' +
        '.ps-evaste-otsikko{font-size:1.5rem;margin-bottom:.4rem;}' +
        '.ps-evaste-teksti{font-size:1.0625rem;line-height:1.55;max-width:60rem;}' +
        '.ps-evaste-valinnat{gap:.6rem .75rem;}' +
        '.ps-kytkin{font-size:.9375rem;padding:.5rem .9rem .5rem .6rem;gap:.65rem;}' +
        '.ps-rata{width:2.75rem;height:1.55rem;}.ps-rata::after{width:1.25rem;height:1.25rem;}' +
        '.ps-kytkin input:checked+.ps-rata::after{transform:translateX(1.2rem);}' +
        '.ps-evaste-napit{display:flex;gap:.75rem;}' +
        '.ps-evaste-nappi{width:11rem;min-height:3.5rem;font-size:1.0625rem;}' +
      '}' +
      '@media (min-width:768px) and (max-width:1299px) and (min-height:501px){.ps-evaste-valinnat{grid-column:1 / -1;}.ps-evaste-napit{grid-column:1 / -1;justify-content:flex-end;}}' +
      '@media (min-width:768px) and (max-width:1023px) and (min-height:501px){.ps-evaste-napit{justify-content:stretch;}.ps-evaste-nappi{flex:1 1 0;width:auto;}}' +
      '@media (max-height:500px) and (min-width:480px){' +
        '.ps-evaste-sisus{flex-direction:row;flex-wrap:wrap;align-items:center;gap:.5rem 1rem;padding:.5rem 16px;}' +
        '.ps-evaste-vasen{flex:1 1 20rem;display:flex;flex-direction:column;gap:.4rem;}' +
        '.ps-keksi{display:none;}' +
        '.ps-evaste-otsikko{display:inline;font-size:.875rem;margin-right:.3rem;}' +
        '.ps-evaste-teksti{font-size:.8125rem;}' +
        '.ps-kytkin{padding:.25rem .55rem .25rem .4rem;font-size:.8125rem;}' +
        '.ps-evaste-napit{display:flex;}.ps-evaste-nappi{min-height:2.5rem;font-size:.875rem;padding:.3rem .7rem;}' +
      '}';
    document.head.appendChild(css);

    var palkki = document.createElement('div');
    palkki.className = 'ps-evaste';
    palkki.setAttribute('role', 'region');
    palkki.setAttribute('aria-labelledby', 'ps-evaste-otsikko');
    palkki.hidden = true;
    palkki.innerHTML =
      '<div class="ps-evaste-sisus"><div class="ps-evaste-vasen"><div class="ps-evaste-alku"><svg class="ps-keksi" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M33.5 6.2c6.4-.6 13 1.6 19.4 7.1-2.8 1.7-3.6 5.1-1.2 7.4 2.1 2 5.6 2 7.9.2 1.9 6.2 1.7 13.4-1.4 20.2-4.6 10.1-14.2 16.8-25.6 16.3C19.1 56.9 8.6 49 6.3 36.6 3.9 23.7 11 11.2 22.4 7.5c3.6-1.1 7.4-1.2 11.1-1.3z" fill="#e8b46a" stroke="#4a2c12" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><path d="M10.6 30.4c.9-.6 2-.6 2.9.3M45.2 33.6c1.2-.2 2.1.5 2.3 1.6M29.6 47.9c1-.7 2.3-.7 3.2.1M17.6 46.1c.6-.9 1.6-1.2 2.6-.7" fill="none" stroke="#b9823f" stroke-width="1.6" stroke-linecap="round"/><path d="M19.2 19.6l4.8-2.3 2.6 3.6-3.1 3.4-4.6-1.2zM35.4 26.1l4.5.9-.4 4.9-5.3.3-1.1-3.6zM21.3 37.4l4.1-1.5 2.4 3.8-2.6 3.4-4.4-1.5zM39.8 43.2l4.7-1.6.7 4.2-3.6 2.6-2.7-2.1zM29.6 13.8l3.1-.7 1.4 2.8-2.6 1.6-2.4-1.4zM47.9 27.4l2.6-.4.6 2.6-2.4 1z" fill="#4a2c12" stroke="#4a2c12" stroke-width="1" stroke-linejoin="round"/><path d="M57.6 13.6a1.3 1.4 0 1 0 .1 0zM61 10.4a.9 1 0 1 0 .1 0zM55.4 8.7a1.1 1 0 1 0 .1 0z" fill="#e8b46a" stroke="#4a2c12" stroke-width="1.2"/></svg>' +
      '<div><h2 class="ps-evaste-otsikko" id="ps-evaste-otsikko" tabindex="-1">Evästeasetukset</h2>' +
      '<p class="ps-evaste-teksti">Käytämme evästeitä kävijäanalytiikkaan sekä Google Ads -mainonnan mittaamiseen ja kohdentamiseen vain, jos hyväksyt. Sivu toimii myös ilman niitä, ja voit muuttaa valintaa sivun alalaidasta. <a href="/privacy.html">Tietosuojaseloste</a></p></div></div>' +
      '<fieldset class="ps-evaste-valinnat"><legend>Valitse sallitut evästeet</legend>' +
      '<label class="ps-kytkin ps-lukittu" title="Sivun toiminnan kannalta välttämättömät, aina päällä"><input type="checkbox" checked disabled><span class="ps-rata"></span>Välttämättömät</label>' +
      '<label class="ps-kytkin"><input type="checkbox" data-luokka="analytiikka"><span class="ps-rata"></span>Analytiikka</label>' +
      '<label class="ps-kytkin"><input type="checkbox" data-luokka="markkinointi"><span class="ps-rata"></span>Markkinointi</label>' +
      '</fieldset></div>' +
      '<div class="ps-evaste-napit"><button type="button" class="ps-evaste-nappi" data-valinta="valttamattomat">Hylkää kaikki</button>' +
      '<button type="button" class="ps-evaste-nappi" data-valinta="valitut">Salli valitut</button>' +
      '<button type="button" class="ps-evaste-nappi ps-ensisijainen" data-valinta="kaikki">Salli kaikki</button></div></div>';
    document.body.appendChild(palkki);
    var kAnalytiikka = palkki.querySelector('[data-luokka="analytiikka"]');
    var kMarkkinointi = palkki.querySelector('[data-luokka="markkinointi"]');
    var otsikko = palkki.querySelector('#ps-evaste-otsikko');

    var valike = document.createElement('div');
    valike.setAttribute('aria-hidden', 'true');
    document.body.appendChild(valike);
    var avaaja = null;
    function paivita() {
      var h = palkki.hidden ? 0 : palkki.offsetHeight;
      valike.style.height = h + 'px';
      document.documentElement.style.scrollPaddingBottom = h ? (h + 8) + 'px' : '';
    }
    function nayta(avaavaElementti) {
      kAnalytiikka.checked = analytiikkaOk();
      kMarkkinointi.checked = markkinointiOk();
      palkki.hidden = false;
      paivita();
      avaaja = avaavaElementti || null;
      if (avaaja) otsikko.focus({ preventScroll: true });
    }
    function piilota() {
      palkki.hidden = true;
      paivita();
      if (avaaja && document.contains(avaaja)) avaaja.focus({ preventScroll: true });
      avaaja = null;
    }

    palkki.addEventListener('click', function (e) {
      var b = e.target.closest('[data-valinta]');
      if (!b) return;
      var valinta = b.getAttribute('data-valinta');
      var a = valinta === 'kaikki' ? true : valinta === 'valttamattomat' ? false : kAnalytiikka.checked;
      var m = valinta === 'kaikki' ? true : valinta === 'valttamattomat' ? false : kMarkkinointi.checked;
      var nimi = a && m ? 'kaikki' : (!a && !m ? 'valttamattomat' : 'valitut');
      suostumus = { analytiikka: a, markkinointi: m };
      window.gtag('consent', 'update', consentTila(suostumus));
      window.dataLayer.push({ event: 'consent_update', suostumus: nimi, analytiikka: a, markkinointi: m });
      try { localStorage.setItem(SUOSTUMUS_AVAIN, JSON.stringify({ valinta: nimi, analytiikka: a, markkinointi: m, aika: new Date().toISOString() })); } catch (err) {}
      if (m) tallennaTunnisteet();
      else { try { localStorage.removeItem(GCLID_AVAIN); } catch (err) {} }
      piilota();
    });
    window.addEventListener('resize', paivita);
    if (typeof ResizeObserver === 'function') new ResizeObserver(paivita).observe(palkki);

    // Alatunnisteeseen Evästeasetukset-linkki valinnan muuttamiseen
    var ala = document.querySelector('.footer-legal') || document.querySelector('footer .linkit') || document.querySelector('footer p');
    if (ala) {
      var nappi = document.createElement('button');
      nappi.type = 'button';
      nappi.className = 'ps-evaste-asetukset';
      nappi.textContent = 'Evästeasetukset';
      nappi.addEventListener('click', function () { nayta(nappi); });
      ala.appendChild(document.createTextNode(ala.classList.contains('linkit') ? ' ' : ' · '));
      ala.appendChild(nappi);
    }
    if (!suostumus) nayta();
  }
})();
