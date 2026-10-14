// Suostumus (Consent Mode v2) ja mittaus. Kaikki sivut lataavat tämän <head>:ssä.
// Kun GTM_ID on tyhjä, Googlelle ei ladata mitään eikä evästebanneria näytetä.
(function () {
  var GTM_ID = ''; // Asiakkaan GTM-säiliö, esim. 'GTM-XXXXXXX'.
  var CONSENT_KEY = 'kylasaari_consent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  gtag('set', 'url_passthrough', true);
  gtag('set', 'ads_data_redaction', true);

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function saveConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
  }
  function applyConsent(granted) {
    var v = granted ? 'granted' : 'denied';
    gtag('consent', 'update', { ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v });
  }

  var saved = readConsent();
  if (saved === 'granted') applyConsent(true);

  if (GTM_ID) {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    document.head.appendChild(s);
  }

  // Tapahtumat GTM:lle. Ensisijaiset konversiot: booking_completed, lead_submitted.
  var sent = {};
  window.kTrack = function (event, params) {
    params = params || {};
    if (params.transaction_id) {
      var key = event + ':' + params.transaction_id;
      if (sent[key]) return;
      sent[key] = true;
    }
    var payload = { event: event };
    for (var k in params) payload[k] = params[k];
    window.dataLayer.push(payload);
  };

  var base = (document.currentScript && document.currentScript.src) || location.href;
  var privacyUrl = new URL('tietosuoja.html', base).href;

  function showBanner() {
    var css = document.createElement('style');
    css.textContent =
      '.kc-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:100;max-width:560px;margin:0 auto;padding:18px 20px;background:#161D2E;border:1px solid #29314A;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4);color:#F4F6FB;font:14.5px/1.5 Inter,system-ui,sans-serif}' +
      '.kc-banner p{margin:0 0 14px;color:#C9CFDD}.kc-banner a{color:#E8A33D}' +
      '.kc-actions{display:flex;gap:10px;flex-wrap:wrap}.kc-actions button{flex:1 1 140px;padding:11px 14px;border-radius:8px;font:inherit;font-weight:700;cursor:pointer;border:1.5px solid #E8A33D}' +
      '.kc-accept{background:#E8A33D;color:#171208}.kc-deny{background:transparent;color:#F4F6FB}';
    document.head.appendChild(css);
    var el = document.createElement('div');
    el.className = 'kc-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Evästeasetukset');
    el.innerHTML =
      '<p>Käytämme evästeitä mainonnan tulosten mittaamiseen. Voit hyväksyä ne tai jatkaa ilman niitä. ' +
      '<a href="' + privacyUrl + '">Tietosuojaseloste</a></p>' +
      '<div class="kc-actions"><button type="button" class="kc-deny">Vain välttämättömät</button>' +
      '<button type="button" class="kc-accept">Hyväksy</button></div>';
    el.querySelector('.kc-accept').addEventListener('click', function () {
      saveConsent('granted'); applyConsent(true); el.remove();
    });
    el.querySelector('.kc-deny').addEventListener('click', function () {
      saveConsent('denied'); applyConsent(false); el.remove();
    });
    document.body.appendChild(el);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (GTM_ID && !saved) showBanner();

    // Puhelinnumero ei ole linkki (asiakkaan toive), joten mitataan vain
    // klikkaus ja kopiointi toissijaisina tapahtumina.
    document.querySelectorAll('[data-track="phone"]').forEach(function (node) {
      node.addEventListener('click', function () { window.kTrack('phone_click'); });
      node.addEventListener('copy', function () { window.kTrack('phone_copy'); });
    });

    // Google Maps ladataan vasta kävijän pyynnöstä (asettaa Googlen evästeitä).
    document.querySelectorAll('[data-map-src]').forEach(function (box) {
      var btn = box.querySelector('button');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var iframe = document.createElement('iframe');
        iframe.src = box.getAttribute('data-map-src');
        iframe.title = box.getAttribute('data-map-title') || 'Kartta';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        box.innerHTML = '';
        box.appendChild(iframe);
        window.kTrack('map_open');
      });
    });
  });
})();
