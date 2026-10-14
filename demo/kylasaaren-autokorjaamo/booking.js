// Ajanvaraus- ja tarjouslomakeosio. Käytössä palvelusivuilla ja tarjous.html:ssä.
//
//   <div data-booking data-service="maaraaikaishuollot" data-cal="kylasaaren-autokorjaamo/maaraaikaishuollot"></div>
//     → Cal.com-kalenteri + nappi, joka avaa tarjouslomakkeen samalle sivulle
//   <div data-booking data-service="moottori-vaihteisto"></div>
//     → tarjouslomake suoraan
//   data-prefill="url" lukee palvelun ja lisätiedot osoiteriviltä (tarjous.html).
(function () {
  // Kun FormSubmit-osoite on aktivoitu, vaihda sähköpostin tilalle FormSubmitin antama alias.
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/kylasaarenautokorjaamo@gmail.com';
  var PHONE = '044&nbsp;961&nbsp;0348';

  var SERVICES = [
    ['maaraaikaishuollot', 'Määräaikaishuolto'],
    ['moottori-vaihteisto', 'Moottori- ja vaihteistokorjaus'],
    ['vikadiagnostiikka', 'Vikadiagnostiikka'],
    ['kori-maalaus', 'Kori-, maalaus- ja hitsaustyö'],
    ['sahkoviat', 'Sähkötyöt'],
    ['jarrut-alusta', 'Jarrut ja alusta'],
    ['ilmastointi', 'Ilmastointihuolto'],
    ['dpf-paastot', 'DPF- ja päästöjärjestelmä'],
    ['muu', 'Muu, mikä?']
  ];

  var base = (document.currentScript && document.currentScript.src) || location.href;
  var privacyUrl = new URL('tietosuoja.html', base).href;
  var homeUrl = new URL('index.html', base).href;

  function track(event, params) { if (window.kTrack) window.kTrack(event, params || {}); }

  function ensureCal() {
    if (window.Cal) return;
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal; var ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || [];
          if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');
    window.Cal('init', { origin: 'https://cal.com' });
    window.Cal('on', { action: 'bookingSuccessfulV2', callback: function (e) {
      var d = (e && e.detail && e.detail.data) || {};
      track('booking_completed', { service: window.__kCalService || '', transaction_id: d.uid || d.bookingId || ('cal-' + Date.now()) });
    }});
    window.Cal('on', { action: 'linkFailed', callback: function () {
      track('cal_link_failed', { service: window.__kCalService || '' });
      document.querySelectorAll('.bk-cal-loading').forEach(function (el) {
        el.innerHTML = 'Kalenteri ei latautunut. Soita meille numeroon ' + PHONE + ' tai pyydä tarjous alta.';
      });
    }});
    window.Cal('on', { action: 'linkReady', callback: function () {
      document.querySelectorAll('.bk-cal-loading').forEach(function (el) { el.remove(); });
    }});
  }

  function injectStyles() {
    if (document.getElementById('booking-css')) return;
    var css = document.createElement('style');
    css.id = 'booking-css';
    css.textContent = [
      '.bk-cal{border-radius:14px;overflow:hidden;border:1px solid var(--line,#29314A);background:var(--surface,#161D2E)}',
      '.bk-cal-loading{display:grid;place-items:center;min-height:480px;padding:24px;text-align:center;color:var(--muted,#96A0BC);font-size:14.5px}',
      '.bk-alt{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;justify-content:space-between;margin-top:18px;padding:18px 20px;background:var(--surface,#161D2E);border:1px solid var(--line,#29314A);border-radius:12px}',
      '.bk-alt p{margin:0;color:var(--text,#F4F6FB);font-weight:600}.bk-alt span{display:block;margin-top:2px;color:var(--muted,#96A0BC);font-weight:400;font-size:14px}',
      '.bk-form-wrap{margin-top:18px}.bk-form-wrap[hidden]{display:none}',
      '.bk-card{padding:26px 22px;background:var(--surface,#161D2E);border:1px solid var(--line,#29314A);border-radius:14px}',
      '.bk-card .field{margin-top:18px}.bk-card label{display:block;margin-bottom:7px;color:var(--text,#F4F6FB);font-size:14px;font-weight:600}',
      '.bk-card .hint{color:var(--muted,#96A0BC);font-weight:400;font-size:12.5px}',
      '.bk-card .input,.bk-card select,.bk-card textarea{width:100%;padding:12px 14px;background:var(--surface-2,#1C2438);border:1px solid var(--line,#29314A);border-radius:8px;color:var(--text,#F4F6FB);font:inherit;font-size:15px}',
      '.bk-card .input:focus,.bk-card select:focus,.bk-card textarea:focus{outline:none;border-color:var(--accent,#E8A33D)}',
      '.bk-card textarea{resize:vertical;min-height:90px}',
      '.bk-card .row2{display:grid;gap:14px}@media(min-width:700px){.bk-card .row2{grid-template-columns:1fr 1fr}}',
      '.bk-card fieldset{border:0;padding:0;margin:26px 0 0;padding-top:22px;border-top:1px solid var(--line,#29314A)}',
      '.bk-card fieldset:first-of-type{margin-top:0;padding-top:0;border-top:0}',
      '.bk-card legend+*{clear:both}',
      '.bk-card legend{float:left;width:100%;padding:0;margin-bottom:4px;color:var(--accent,#E8A33D);font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}',
      '.bk-seg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}',
      '.bk-seg label{margin:0;cursor:pointer}.bk-seg input{position:absolute;opacity:0;pointer-events:none}',
      '.bk-seg span{display:block;padding:12px 14px;text-align:center;background:var(--surface-2,#1C2438);border:1.5px solid var(--line,#29314A);border-radius:8px;color:var(--muted,#96A0BC);font-size:14px;font-weight:600}',
      '.bk-seg input:checked+span{border-color:var(--accent,#E8A33D);color:var(--text,#F4F6FB);background:rgba(232,163,61,.1)}',
      '.bk-mode[hidden],.bk-other[hidden]{display:none}.bk-other{margin-top:14px}',
      '.bk-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}',
      '.bk-submit{margin-top:26px}.bk-submit .btn{width:100%}',
      '.bk-error{margin-top:14px;padding:14px 16px;border:1px solid #d9534f;border-radius:8px;background:rgba(217,83,79,.1);color:var(--text,#F4F6FB);font-size:14.5px}',
      '.bk-error[hidden]{display:none}',
      '.bk-privacy{margin:12px 0 0;font-size:12.5px;color:var(--muted,#96A0BC)}.bk-privacy a{color:var(--accent,#E8A33D)}',
      '.bk-success{padding:30px 22px;text-align:center;background:var(--surface,#161D2E);border:1px solid var(--line,#29314A);border-radius:14px}',
      '.bk-success[hidden]{display:none}',
      '.bk-success .ok{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 14px;border-radius:50%;background:rgba(232,163,61,.14);color:var(--accent,#E8A33D);font-size:26px}',
      '.bk-success p{margin:10px auto 0;max-width:44ch;color:var(--muted,#96A0BC)}',
      '.bk-card button[disabled]{opacity:.6;cursor:wait}'
    ].join('\n');
    document.head.appendChild(css);
  }

  var uid = 0;
  function renderForm(container, opts) {
    var n = 'bk' + (++uid);
    var options = SERVICES.map(function (s) {
      return '<option value="' + s[0] + '"' + (s[0] === opts.service ? ' selected' : '') + '>' + s[1] + '</option>';
    }).join('');
    container.innerHTML =
      '<div class="bk-success" hidden><div class="ok">✓</div><h3>Kiitos tarjouspyynnöstä!</h3>' +
      '<p>Olemme sinuun yhteydessä mahdollisimman pian, yleensä samana tai seuraavana arkipäivänä.</p></div>' +
      '<form class="bk-card" novalidate>' +
      '<fieldset><legend>Auton tiedot</legend>' +
      '<div class="bk-seg"><label><input type="radio" name="vehicleMode" value="rekkari" checked><span>Rekisteritunnus</span></label>' +
      '<label><input type="radio" name="vehicleMode" value="manual"><span>Kirjoitan tiedot itse</span></label></div>' +
      '<div class="bk-mode" data-mode="rekkari"><div class="field"><label for="' + n + '-rek">Rekisteritunnus</label>' +
      '<input class="input" id="' + n + '-rek" name="rekisteritunnus" placeholder="ABC-123" autocomplete="off"></div></div>' +
      '<div class="bk-mode" data-mode="manual" hidden><div class="field row2">' +
      '<div><label for="' + n + '-merkki">Merkki</label><input class="input" id="' + n + '-merkki" name="merkki" placeholder="esim. Volkswagen"></div>' +
      '<div><label for="' + n + '-malli">Malli</label><input class="input" id="' + n + '-malli" name="malli" placeholder="esim. Golf"></div></div>' +
      '<div class="field row2"><div><label for="' + n + '-vm">Vuosimalli</label><input class="input" id="' + n + '-vm" name="vuosimalli" placeholder="esim. 2015" inputmode="numeric"></div>' +
      '<div><label for="' + n + '-kv">Käyttövoima</label><select class="input" id="' + n + '-kv" name="kayttovoima"><option value="">Valitse...</option>' +
      '<option>Bensiini</option><option>Diesel</option><option>Sähkö</option><option>Hybridi</option><option>Muu</option></select></div></div></div>' +
      '</fieldset>' +
      '<fieldset><legend>Mitä tarvitset</legend>' +
      '<div class="field"><label for="' + n + '-pv">Palvelu</label><select class="input" id="' + n + '-pv" name="palvelu" required>' +
      '<option value="">Valitse palvelu...</option>' + options + '</select></div>' +
      '<div class="bk-other" hidden><label for="' + n + '-muu">Kerro mikä palvelu</label><input class="input" id="' + n + '-muu" name="muuPalvelu" placeholder="Kuvaile lyhyesti"></div>' +
      '</fieldset>' +
      '<fieldset><legend>Yhteystiedot</legend>' +
      '<div class="field row2"><div><label for="' + n + '-en">Etunimi</label><input class="input" id="' + n + '-en" name="etunimi" required autocomplete="given-name"></div>' +
      '<div><label for="' + n + '-sn">Sukunimi</label><input class="input" id="' + n + '-sn" name="sukunimi" required autocomplete="family-name"></div></div>' +
      '<div class="field row2"><div><label for="' + n + '-ph">Puhelinnumero</label><input class="input" type="tel" id="' + n + '-ph" name="puhelin" required autocomplete="tel" placeholder="040 123 4567"></div>' +
      '<div><label for="' + n + '-em">Sähköposti <span class="hint">(vapaaehtoinen)</span></label><input class="input" type="email" id="' + n + '-em" name="sahkoposti" autocomplete="email"></div></div>' +
      '<div class="field"><label for="' + n + '-lt">Lisätietoja <span class="hint">(vapaaehtoinen)</span></label>' +
      '<textarea id="' + n + '-lt" name="lisatiedot" placeholder="Kerro esim. oireet, aikataulutoive tai muuta huomioitavaa"></textarea></div>' +
      '</fieldset>' +
      '<div class="bk-submit"><div class="bk-hp" aria-hidden="true"><label>Jätä tyhjäksi<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label></div>' +
      '<button type="submit" class="btn btn-primary btn-lg">Lähetä tarjouspyyntö</button>' +
      '<div class="bk-error" role="alert" hidden>Lähetys ei onnistunut. Yritä hetken päästä uudelleen tai soita meille numeroon ' + PHONE + '.</div>' +
      '<p class="bk-privacy">Käytämme antamiasi tietoja vain tarjouspyyntöösi vastaamiseen. Lue lisää <a href="' + privacyUrl + '">tietosuojaselosteesta</a>.</p></div>' +
      '</form>';

    var form = container.querySelector('form');
    var success = container.querySelector('.bk-success');
    var errorBox = container.querySelector('.bk-error');
    var btn = form.querySelector('button[type=submit]');
    var palvelu = form.elements.palvelu;
    var other = container.querySelector('.bk-other');
    var muu = form.elements.muuPalvelu;

    form.querySelectorAll('input[name=vehicleMode]').forEach(function (r) {
      r.addEventListener('change', function () {
        container.querySelectorAll('.bk-mode').forEach(function (m) { m.hidden = m.getAttribute('data-mode') !== r.value; });
      });
    });
    function syncOther() { var isMuu = palvelu.value === 'muu'; other.hidden = !isMuu; muu.required = isMuu; }
    palvelu.addEventListener('change', syncOther);

    if (opts.prefill) {
      var q = new URLSearchParams(location.search);
      var pre = q.get('palvelu');
      if (pre && palvelu.querySelector('option[value="' + pre + '"]')) palvelu.value = pre;
      if (q.get('muu') && palvelu.value === 'muu') muu.value = q.get('muu');
      if (q.get('lisatiedot')) form.elements.lisatiedot.value = q.get('lisatiedot');
    }
    syncOther();

    var sending = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      if (!form.reportValidity()) return;
      errorBox.hidden = true;
      var f = form.elements;
      var serviceText = palvelu.selectedIndex > 0 ? palvelu.options[palvelu.selectedIndex].text : '';
      var mode = form.querySelector('input[name=vehicleMode]:checked').value;
      var data = {
        'Palvelu': serviceText + (palvelu.value === 'muu' && muu.value.trim() ? ': ' + muu.value.trim() : ''),
        'Rekisteritunnus': mode === 'rekkari' ? f.rekisteritunnus.value.trim() : '',
        'Merkki': mode === 'manual' ? f.merkki.value.trim() : '',
        'Malli': mode === 'manual' ? f.malli.value.trim() : '',
        'Vuosimalli': mode === 'manual' ? f.vuosimalli.value.trim() : '',
        'Käyttövoima': mode === 'manual' ? f.kayttovoima.value : '',
        'Nimi': (f.etunimi.value + ' ' + f.sukunimi.value).trim(),
        'Puhelin': f.puhelin.value.trim(),
        'Sähköposti': f.sahkoposti.value.trim(),
        'Lisätietoja': f.lisatiedot.value.trim(),
        'Lähetetty sivulta': location.pathname.split('/').pop() || 'index.html',
        _subject: 'Uusi tarjouspyyntö: ' + serviceText,
        _template: 'table',
        _captcha: 'false',
        _honey: f._honey.value
      };
      if (data['Sähköposti']) data._replyto = data['Sähköposti'];
      sending = true; btn.disabled = true; btn.textContent = 'Lähetetään…';
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      }).then(function (r) {
        var ok = r.ok && r.body && (r.body.success === true || r.body.success === 'true');
        if (!ok) throw new Error((r.body && r.body.message) || 'Lähetys epäonnistui');
        track('lead_submitted', { service: palvelu.value, transaction_id: 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) });
        form.hidden = true;
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }).catch(function (err) {
        console.warn('Tarjouspyynnön lähetys epäonnistui:', err && err.message);
        errorBox.hidden = false;
      }).finally(function () {
        sending = false; btn.disabled = false; btn.textContent = 'Lähetä tarjouspyyntö';
      });
    });
    return { setService: function (v) { palvelu.value = v; syncOther(); }, focus: function () { palvelu.focus(); } };
  }

  function mountCal(box, calLink, service) {
    var started = false;
    function start() {
      if (started) return; started = true;
      ensureCal();
      window.__kCalService = service;
      window.Cal('inline', { elementOrSelector: box, calLink: calLink, config: { theme: 'dark' } });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
      }, { rootMargin: '600px 0px' });
      io.observe(box);
    } else start();
    return start;
  }

  function init() {
    var nodes = document.querySelectorAll('[data-booking]');
    if (!nodes.length) return;
    injectStyles();
    nodes.forEach(function (node) {
      var service = node.getAttribute('data-service') || '';
      var calLink = node.getAttribute('data-cal');
      var formApi;
      if (calLink) {
        node.innerHTML =
          '<div class="bk-cal"><div class="bk-cal-loading">Ladataan kalenteria…</div></div>' +
          '<div class="bk-alt"><p>Haluatko mieluummin tarjouksen?<span>Kerro auton tiedot ja tarpeesi, niin vastaamme hinta-arviolla.</span></p>' +
          '<button type="button" class="btn btn-outline bk-open">Pyydä tarjous</button></div>' +
          '<div class="bk-form-wrap" hidden></div>';
        var startCal = mountCal(node.querySelector('.bk-cal'), calLink, calLink.split('/').pop());
        var wrap = node.querySelector('.bk-form-wrap');
        var openBtn = node.querySelector('.bk-open');
        openBtn.addEventListener('click', function () {
          if (!formApi) formApi = renderForm(wrap, { service: service });
          var show = wrap.hidden;
          wrap.hidden = !show;
          openBtn.textContent = show ? 'Piilota lomake' : 'Pyydä tarjous';
          if (show) { wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }); track('quote_open', { service: service }); }
        });
        // Ankkuri #varaa (esim. herosta) käynnistää kalenterin heti.
        document.querySelectorAll('a[href="#varaa"]').forEach(function (a) { a.addEventListener('click', startCal); });
      } else {
        formApi = renderForm(node, { service: service, prefill: node.getAttribute('data-prefill') === 'url' });
        // Linkit, jotka valitsevat palvelun valmiiksi (esim. muut-sivun kortit).
        document.querySelectorAll('[data-select-service]').forEach(function (a) {
          a.addEventListener('click', function () { formApi.setService(a.getAttribute('data-select-service')); });
        });
      }
    });
    // Suora linkki #varaa / #tarjous: osio täyttyy vasta nyt, joten vieritetään uudelleen.
    var target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && target.querySelector('[data-booking]')) setTimeout(function () { target.scrollIntoView(); }, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
