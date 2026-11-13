/* ===== LASKURIN ASETUKSET: säädä näitä =====
   Kaikki rahasummat euroina ilman alv:ta. */
var ASETUKSET = {
  minBudjetti: 500,              // mainosbudjetin alaraja €/kk (sama kuin hinnastossa)
  minBudjettiPerKampanja: 250,   // ohjeellinen vähimmäisbudjetti per kampanja €/kk
  budjettiKatto: 10000,          // suurin tuloksissa näytettävä budjetti €/kk (suositusta suuremmat)
  budjetinPyoristys: 100,        // budjettitasot pyöristetään ylöspäin tähän
  suositusBudjetti: 1000,       // suositeltu mainosbudjetti €/kk (vähintään alaraja)
  suositusKertoimet: [2, 3],     // suosituksen jälkeen näytettävät budjetit = suositus × nämä
  alv: 0.255,                    // kuluttajahinnasta poistettava alv
  // Klikkihinta (€) palvelun hinnan mukaan. Välissä interpoloidaan logaritmisesti
  // hinnan suhteen; alle ensimmäisen ja yli viimeisen käytetään reuna-arvoja.
  klikkihinta: [
    { hinta: 80,   min: 1, max: 2 },
    { hinta: 500,  min: 2, max: 4 },
    { hinta: 5000, min: 4, max: 8 }
  ],
  // Alue: klikkikerroin kertoo klikkihinnan; klikkikatto = arvioitu klikkimäärä/kk
  // per palvelu, jota enempää hakuja ei yleensä ole (kysyntäraja)
  alue: {
    paikallinen: { nimi: 'paikallisesti', klikkikerroin: 1.0,  klikkikattoPerPalvelu: 300 },
    suomi:       { nimi: 'koko Suomessa', klikkikerroin: 1.15, klikkikattoPerPalvelu: 1500 }
  },
  // Osuus klikkaajista, joka ottaa yhteyttä OPTIMOINNIN JÄLKEEN (2–3 kk)
  tavoite: {
    lomake:     { min: 0.05,  max: 0.08 },
    puhelu:     { min: 0.06,  max: 0.10 },
    ajanvaraus: { min: 0.04,  max: 0.07 },
    kauppa:     { min: 0.015, max: 0.03 }
  },
  // Kun valitaan useampi tavoite: suurin osuus kokonaan + tämä osuus muiden osuuksista
  // (sama kävijä ei sekä soita että lähetä lomaketta, joten osuudet eivät summaudu)
  lisatavoitteenOsuus: 0.3,
  // Paketit kampanjamäärän mukaan; hinta null = sovitaan erikseen
  paketit: [
    { nimi: 'Perus',   kampanjatMin: 1,  kampanjatMax: 1,        hinta: 320 },
    { nimi: 'Kasvu',   kampanjatMin: 2,  kampanjatMax: 4,        hinta: 490 },
    { nimi: 'Kattava', kampanjatMin: 5,  kampanjatMax: 9,        hinta: 750 },
    { nimi: 'Skaala',  kampanjatMin: 10, kampanjatMax: Infinity, hinta: null }
  ]
};

(function () {
  'use strict';

  var A = ASETUKSET;
  var TAVOITTEET = ['lomake', 'puhelu', 'ajanvaraus', 'kauppa'];

  /* ---------- sanamuodot (kielioppi, ei laskennan säätöä) ---------- */
  // yks = yksikkö, mon = monikko, lkm = luvun perään (partitiivi), ptv = monikon partitiivi, nimi = lyhyt nimi yhteenvetoon
  var SANAT = {
    lomake:     { yks: 'yhteydenotto', mon: 'yhteydenotot',  lkm: 'yhteydenottoa', ptv: 'yhteydenottoja', nimi: 'tarjouspyynnöt' },
    puhelu:     { yks: 'puhelu',       mon: 'puhelut',       lkm: 'puhelua',       ptv: 'puheluita',      nimi: 'puhelut' },
    ajanvaraus: { yks: 'ajanvaraus',   mon: 'ajanvaraukset', lkm: 'ajanvarausta',  ptv: 'ajanvarauksia',  nimi: 'ajanvaraukset' },
    kauppa:     { yks: 'osto',         mon: 'ostot',         lkm: 'ostoa',         ptv: 'ostoja',         nimi: 'verkkokauppaostot' }
  };
  var SANAT_YHT = { yks: 'yhteydenotto', mon: 'yhteydenotot', lkm: 'yhteydenottoa', ptv: 'yhteydenottoja' };
  var SANAT_SEKA = { yks: 'yhteydenotto tai osto', mon: 'yhteydenotot ja ostot', lkm: 'yhteydenottoa tai ostoa', ptv: 'yhteydenottoja ja ostoja' };
  function sanatTavoitteille(lista) {
    if (lista.length === 1) return SANAT[lista[0]];
    return lista.indexOf('kauppa') >= 0 ? SANAT_SEKA : SANAT_YHT;
  }

  /* ---------- apufunktiot ---------- */
  var nf = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 });
  function fmt(x) { return nf.format(x); }
  function eur(x) { return fmt(Math.round(x)) + ' €'; }
  function haarukka(a, b, suffix) {
    var s = a === b ? fmt(a) : fmt(a) + '–' + fmt(b);
    return suffix ? s + ' ' + suffix : s;
  }
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function ylos(x, askel) { return Math.ceil(x / askel) * askel; }

  function pakettiPalveluille(n) {
    for (var i = 0; i < A.paketit.length; i++) {
      if (n >= A.paketit[i].kampanjatMin && n <= A.paketit[i].kampanjatMax) return A.paketit[i];
    }
    return A.paketit[A.paketit.length - 1];
  }

  // Klikkihinta (€): logaritminen interpolointi ankkureiden välissä, reuna-arvot ulkopuolella
  function klikkihinta(P) {
    var k = A.klikkihinta;
    if (P <= k[0].hinta) return { min: k[0].min, max: k[0].max };
    if (P >= k[k.length - 1].hinta) return { min: k[k.length - 1].min, max: k[k.length - 1].max };
    for (var i = 0; i < k.length - 1; i++) {
      if (P >= k[i].hinta && P <= k[i + 1].hinta) {
        var t = (Math.log(P) - Math.log(k[i].hinta)) / (Math.log(k[i + 1].hinta) - Math.log(k[i].hinta));
        return { min: k[i].min + t * (k[i + 1].min - k[i].min), max: k[i].max + t * (k[i + 1].max - k[i].max) };
      }
    }
    return { min: k[0].min, max: k[0].max };
  }

  // Yhdistetty konversio-osuus valituille tavoitteille
  function konversioOsuus(lista) {
    var j = lista.slice().sort(function (a, b) { return A.tavoite[b].max - A.tavoite[a].max; });
    var min = A.tavoite[j[0]].min, max = A.tavoite[j[0]].max;
    for (var i = 1; i < j.length; i++) {
      min += A.lisatavoitteenOsuus * A.tavoite[j[i]].min;
      max += A.lisatavoitteenOsuus * A.tavoite[j[i]].max;
    }
    return { min: min, max: max };
  }

  /* ---------- LASKENTA (puhdas funktio, ei DOM:ia) ----------
     syotteet: { tavoitteet: [..], palvelut, kohde: 'kuluttaja'|'yritys', hinta, alue }
     hinta = kävijän syöttämä: kuluttajille alv mukana, yrityksille alv 0 % */
  function laske(s) {
    var tavoitteet = TAVOITTEET.filter(function (g) { return s.tavoitteet.indexOf(g) >= 0; });
    var sanat = sanatTavoitteille(tavoitteet);
    var vainKauppa = tavoitteet.length === 1 && tavoitteet[0] === 'kauppa';
    var alue = A.alue[s.alue];
    var n = clamp(Math.round(s.palvelut), 1, 15);
    var P = Number(s.hinta);
    var kuluttaja = s.kohde === 'kuluttaja';
    var Pnetto = kuluttaja ? P / (1 + A.alv) : P;   // myyjälle jäävä hinta ilman alv:ta

    // 1. klikkihinta (syötetyn hinnan mukaan, kuten kävijä hinnan näkee)
    var cpcP = klikkihinta(P);
    var cpcMin = cpcP.min * alue.klikkikerroin;
    var cpcMax = cpcP.max * alue.klikkikerroin;
    var cpcKeski = (cpcMin + cpcMax) / 2;
    // 2. konversio-osuus
    var cvr = konversioOsuus(tavoitteet);
    // 3. mainoskulu per yhteydenotto
    var cplMin = cpcMin / cvr.max;
    var cplMax = cpcMax / cvr.min;
    var cplKeski = Math.sqrt(cplMin * cplMax);
    // 4. kampanjat ja paketti
    var paketti = pakettiPalveluille(n);
    var skaala = paketti.hinta === null;
    var hallinta = paketti.hinta;
    // 5. budjetin alaraja ja kysyntäraja
    var lattia = Math.max(A.minBudjetti, ylos(n * A.minBudjettiPerKampanja, A.budjetinPyoristys));
    var maxKlikit = n * alue.klikkikattoPerPalvelu;
    var kulutettavissa = maxKlikit * cpcKeski;

    // 6. tulokset eri budjeteilla
    function taso(B) {
      var kulu = Math.min(B, kulutettavissa);          // budjetti ei kulu, jos hakuja ei riitä
      var yMinRaw = Math.min(kulu / cplMax, maxKlikit * cvr.min);
      var yMaxRaw = Math.min(kulu / cplMin, maxKlikit * cvr.max);
      var yMin = Math.round(yMinRaw), yMax = Math.max(yMin, Math.round(yMaxRaw));
      var K = skaala ? kulu : kulu + hallinta;            // kokonaiskulu (kannattavuuteen)
      // hinta per yhteydenotto = pelkkä mainoskulu, ilman hallinnointia
      var hMin = Math.round(kulu / Math.max(yMaxRaw, 1e-9));
      var hMax = Math.round(kulu / Math.max(yMinRaw, 1));
      if (hMax < hMin) hMax = hMin;
      return { budjetti: B, kulu: kulu, rajoittaa: B > kulutettavissa, yhtMin: yMin, yhtMax: yMax,
               yhtMinRaw: yMinRaw, yhtMaxRaw: yMaxRaw, K: K, hintaMin: hMin, hintaMax: hMax };
    }
    // alaraja, suositus ja suosituksen kerrannaiset; isompia ei näytetä, jos hakuja ei riitä
    var suositus = Math.max(lattia, ylos(A.suositusBudjetti, A.budjetinPyoristys));
    var budjetit = [lattia, suositus];
    A.suositusKertoimet.forEach(function (k) {
      var B = ylos(suositus * k, A.budjetinPyoristys);
      if (B <= A.budjettiKatto) budjetit.push(B);
    });
    var tasot = [];
    for (var i = 0; i < budjetit.length; i++) {
      if (tasot.length && tasot[tasot.length - 1].budjetti >= budjetit[i]) continue;
      var t0 = taso(budjetit[i]);
      t0.suositus = budjetit[i] === suositus;
      tasot.push(t0);
      if (t0.rajoittaa) break;                          // isompi budjetti ei tuo lisää
    }
    // kannattavuus ja tiivistelmä suositellulla budjetilla (tai suurimmalla järkevällä, jos hakuja ei riitä)
    var alku = tasot.filter(function (x) { return x.suositus; })[0] || tasot[tasot.length - 1];

    // 7. kannattavuus suositellulla budjetilla
    var kaupat = Math.ceil(alku.K / Pnetto);
    var yhtKeski = alku.kulu / cplKeski;
    var kannattava = kaupat <= yhtKeski;
    var hintaTeksti = kuluttaja ? fmt(Math.round(Pnetto)) + ' € (alv 0 %)' : fmt(P) + ' €';
    var kannatRivi1 = 'Kulut ' + fmt(alku.K) + ' €/kk ' + (alku.suositus ? 'suositellulla budjetilla' : 'budjetilla ' + fmt(alku.budjetti) + ' €') + ', palvelun hinta ' + hintaTeksti + ' → ' +
      fmt(kaupat) + (kaupat === 1 ? ' kauppa' : ' kauppaa') + ' kuukaudessa kattaa kulut.' +
      (skaala ? ' (mainosbudjetilla laskettuna, ilman hallinnointia)' : '');
    var kannatRivi2;
    if (kannattava) {
      var suhde = Math.max(1, Math.round(yhtKeski / kaupat));
      if (vainKauppa) kannatRivi2 = 'Eli arvioidut ostot kattavat kulut.';
      else if (suhde === 1) kannatRivi2 = 'Eli lähes jokaisen yhteydenoton pitäisi päätyä kauppaan.';
      else kannatRivi2 = 'Eli noin joka ' + suhde + '. yhteydenoton pitäisi päätyä kauppaan.';
    } else {
      kannatRivi2 = 'Kulujen kattamiseen tarvitaan enemmän kauppoja kuin ' + sanat.ptv + ' arviolta tulee. Mainonta kannattaa silloin vain, jos sama asiakas ostaa useita kertoja.';
    }

    // 8. realismitarkistus
    var realismi = [];
    if (tasot[0].rajoittaa || !alku.suositus) {
      realismi.push({ tyyppi: 'markkina', teksti: 'Hakuja on ' + alue.nimi + ' niin vähän, että koko ' + eur(tasot[tasot.length - 1].budjetti) + ' budjetti ei välttämättä kulu. Maksat vain klikkauksista.' });
    } else if (tasot[tasot.length - 1].rajoittaa) {
      realismi.push({ tyyppi: 'markkina', teksti: 'Yli noin ' + eur(ylos(kulutettavissa, A.budjetinPyoristys)) + ' kuukausibudjetilla hakuja ei todennäköisesti riitä enempään ' + alue.nimi + ' ' + n + (n === 1 ? ' palvelulla.' : ' palvelulla tai kategorialla.') });
    }
    if (cplKeski > Pnetto) {
      realismi.push({ tyyppi: 'hinta', teksti: 'Mainoskulu per ' + sanat.yks + ' on arviolta suurempi kuin palvelusi hinta.' });
    }
    var ok = realismi.length === 0;
    if (ok) realismi.push({ tyyppi: 'ok', teksti: 'Hakuja riittää näille budjeteille tällä arviolla.' });

    return {
      syote: { tavoitteet: tavoitteet, palvelut: n, kohde: s.kohde, hinta: P, hintaNetto: Pnetto, alue: s.alue },
      cpcMin: cpcMin, cpcMax: cpcMax, cvrMin: cvr.min, cvrMax: cvr.max,
      cplMin: cplMin, cplMax: cplMax, cplKeski: cplKeski,
      kampanjat: n, paketti: paketti.nimi, pakettiHinta: hallinta, skaala: skaala, hallinta: hallinta,
      lattia: lattia, maxKlikit: maxKlikit, kulutettavissa: kulutettavissa,
      tasot: tasot, alku: alku,
      kaupat: kaupat, yhtKeski: yhtKeski, kannattava: kannattava,
      kannatRivi1: kannatRivi1, kannatRivi2: kannatRivi2,
      realismi: realismi, realismiOk: ok,
      sanat: sanat, alueNimi: alue.nimi
    };
  }

  window.pikaLaskuri = { laske: laske, ASETUKSET: ASETUKSET, paketti: pakettiPalveluille };

  /* =====================================================================
     KÄYTTÖLIITTYMÄ
     ===================================================================== */
  if (!document.getElementById('laskuri-form')) return;

  // Vastaanottava Apps Script (sama kuin /arvio-lomakkeella)
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbxFmf_zBQ45lB0psUKaxxtubsk5aVtn3p87HeufD5Mebf57PY44iVr12qSaSdG26pI0/exec';

  var qs = new URLSearchParams(location.search);
  // Testitila (ei oikeaa lähetystä, ei seurantaa) VAIN localhostissa. ?testi=virhe simuloi virhevastauksen.
  var PAIKALLINEN = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var TESTI = PAIKALLINEN;
  var TESTI_VIRHE = PAIKALLINEN && qs.get('testi') === 'virhe';

  var $ = function (id) { return document.getElementById(id); };
  var form = $('laskuri-form');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var avattu = false;
  var lahettaa = false;

  var el = {
    tavoiteRyhma: $('q-tavoite'), kohdeRyhma: $('q-kohde'), palvelut: $('q-palvelut'), hinta: $('q-hinta'),
    hintaLabel: $('l-hinta'), hintaApu: $('h-hinta'), alueRyhma: $('q-alue'),
    vahenna: $('pal-vahenna'), lisaa: $('pal-lisaa'),
    paketinNimi: $('paketti-nimi'), rivit: $('rivit'), budjetit: $('budjetit'), budjetitOtsikko: $('budjetit-otsikko'),
    lisat: $('lisat'), realismiLista: $('realismi-lista'),
    kiitos: $('kiitos'), kiitosOtsikko: $('kiitos-otsikko'), lomakeOsa: $('lomake-osa'),
    yritys: $('f-yritys'), email: $('f-email'), phone: $('f-phone'), website: $('f-website'), consent: $('f-consent'),
    nappi: $('laheta'), status: $('status'), loppuCta: $('loppu-cta-nappi'), kortti: $('laskuri')
  };

  /* ---------- lukijat ---------- */
  function valitutTavoitteet() {
    return Array.prototype.map.call(form.querySelectorAll('input[name="tavoite"]:checked'), function (r) { return r.value; });
  }
  function valittuKohde() {
    var r = form.querySelector('input[name="kohde"]:checked');
    return r ? r.value : '';
  }
  function valittuAlue() {
    var r = form.querySelector('input[name="alue"]:checked');
    return r ? r.value : 'paikallinen';
  }
  function lueKokonaisluku(str) {
    var m = String(str).replace(/[^\d]/g, '');
    return m ? parseInt(m, 10) : NaN;
  }
  function luePalvelut() {
    var v = lueKokonaisluku(el.palvelut.value);
    return isNaN(v) ? NaN : clamp(v, 1, 15);
  }
  // Luvun jäsennys: välilyönnit (myös nbsp) pois. Muoto 1.000 / 20,000 / 1.000.000 = tuhaterottimet,
  // muuten pilkku on desimaalierotin (2,5 = 2.5). Palauttaa NaN, jos muoto ei kelpaa.
  function parsiLuku(str) {
    var s = String(str).replace(/[\s ]/g, '');
    if (s === '') return NaN;
    if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return parseInt(s.replace(/[.,]/g, ''), 10);
    s = s.replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }
  var HINTA_MAX = 1000000;
  function lueHinta() { return parsiLuku(el.hinta.value); }

  /* ---------- virheet ---------- */
  function naytaVirhe(kentta, errId, viesti, ryhma) {
    var err = $(errId);
    if (viesti) err.textContent = typeof viesti === 'function' ? viesti() : viesti;
    err.hidden = false;
    if (ryhma) {
      ryhma.querySelector('.valinnat').classList.add('virhe');
      ryhma.querySelectorAll('input').forEach(function (i) { i.setAttribute('aria-invalid', 'true'); });
      ryhma.setAttribute('aria-describedby', errId);
    } else {
      kentta.setAttribute('aria-invalid', 'true');
      var d = (kentta.getAttribute('data-desc') || '').trim();
      kentta.setAttribute('aria-describedby', (d ? d + ' ' : '') + errId);
    }
  }
  function piilotaVirhe(kentta, errId, ryhma) {
    var err = $(errId);
    err.hidden = true;
    if (ryhma) {
      ryhma.querySelector('.valinnat').classList.remove('virhe');
      ryhma.querySelectorAll('input').forEach(function (i) { i.removeAttribute('aria-invalid'); });
      ryhma.removeAttribute('aria-describedby');
    } else {
      kentta.removeAttribute('aria-invalid');
      var d = (kentta.getAttribute('data-desc') || '').trim();
      if (d) kentta.setAttribute('aria-describedby', d); else kentta.removeAttribute('aria-describedby');
    }
  }
  el.palvelut.setAttribute('data-desc', 'h-palvelut');
  el.hinta.setAttribute('data-desc', 'h-hinta');

  // kentän validointi; palauttaa true jos kunnossa. Käsittelee virheen näyttämisen
  var tarkistukset = [
    { id: 'tavoite', kentta: function () { return form.querySelector('input[name="tavoite"]'); }, ryhma: el.tavoiteRyhma, err: 'e-tavoite',
      ok: function () { return valitutTavoitteet().length > 0; }, viesti: 'Valitse vähintään yksi.' },
    { id: 'palvelut', kentta: function () { return el.palvelut; }, err: 'e-palvelut',
      ok: function () { return !isNaN(luePalvelut()); }, viesti: 'Valitse tai täytä tämä.' },
    { id: 'kohde', kentta: function () { return form.querySelector('input[name="kohde"]'); }, ryhma: el.kohdeRyhma, err: 'e-kohde',
      ok: function () { return valittuKohde() !== ''; }, viesti: 'Valitse toinen.' },
    { id: 'hinta', kentta: function () { return el.hinta; }, err: 'e-hinta',
      ok: function () { var h = lueHinta(); return !isNaN(h) && h >= 1 && h <= HINTA_MAX; },
      viesti: function () { var h = lueHinta(); return (!isNaN(h) && h > HINTA_MAX) ? 'Tarkista hinta.' : 'Valitse tai täytä tämä.'; } }
  ];
  var yhteystiedot = [
    { id: 'yritys', kentta: function () { return el.yritys; }, err: 'e-yritys',
      ok: function () { return el.yritys.value.trim().length >= 2; } },
    { id: 'email', kentta: function () { return el.email; }, err: 'e-email',
      ok: function () { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim()); } },
    { id: 'phone', kentta: function () { return el.phone; }, err: 'e-phone',
      ok: function () {
        var v = el.phone.value.trim();
        if (!/^[+()\-\s\d]+$/.test(v)) return false;
        var d = v.replace(/\D/g, '').length;
        return d >= 7 && d <= 15;
      } },
    { id: 'consent', kentta: function () { return el.consent; }, err: 'e-consent',
      ok: function () { return el.consent.checked; } }
  ];

  function aja(t) {
    var ok = t.ok();
    if (ok) piilotaVirhe(t.kentta(), t.err, t.ryhma);
    else naytaVirhe(t.kentta(), t.err, t.viesti, t.ryhma);
    return ok;
  }
  function validoiKaikki(lista) {
    var ensimmainen = null;
    lista.forEach(function (t) { if (!aja(t) && !ensimmainen) ensimmainen = t.kentta(); });
    return ensimmainen; // null jos kaikki kunnossa
  }

  /* ---------- kenttien käsittely ---------- */
  function asetaPalvelut(n) {
    n = clamp(n, 1, 15);
    el.palvelut.value = n === 15 ? '15+' : String(n);
    el.palvelut.setAttribute('aria-valuenow', String(n));
    el.palvelut.setAttribute('aria-valuetext', n === 15 ? '15 tai enemmän' : String(n));
  }
  asetaPalvelut(1);

  el.vahenna.addEventListener('click', function () {
    var n = luePalvelut(); asetaPalvelut((isNaN(n) ? 1 : n) - 1); muutos('palvelut');
  });
  el.lisaa.addEventListener('click', function () {
    var n = luePalvelut(); asetaPalvelut((isNaN(n) ? 1 : n) + 1); muutos('palvelut');
  });
  el.palvelut.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') { e.preventDefault(); el.lisaa.click(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); el.vahenna.click(); }
  });
  el.palvelut.addEventListener('input', function () {
    // ei muotoilua kirjoittaessa ("15+" tulee vasta blurissa ja -/+-napeilla), jotta Backspace toimii
    var raaka = el.palvelut.value.replace(/[^\d]/g, '').slice(0, 3);
    if (raaka !== '' && parseInt(raaka, 10) > 15) raaka = '15';
    el.palvelut.value = raaka;
    if (raaka !== '') {
      var n = clamp(parseInt(raaka, 10), 1, 15);
      el.palvelut.setAttribute('aria-valuenow', String(n));
      el.palvelut.removeAttribute('aria-valuetext');
    }
    muutos('palvelut');
  });
  el.palvelut.addEventListener('blur', function () {
    var n = luePalvelut();
    asetaPalvelut(isNaN(n) ? 1 : n);
    muutos('palvelut');
  });

  el.hinta.addEventListener('input', function () {
    el.hinta.value = el.hinta.value.replace(/[^\d\s ,.]/g, '');
    muutos('hinta');
  });

  // Enter laskurin kentissä ei lähetä lomaketta
  [el.palvelut, el.hinta].forEach(function (i) {
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') e.preventDefault(); });
  });

  form.querySelectorAll('input[name="tavoite"]').forEach(function (r) {
    r.addEventListener('change', function () { muutos('tavoite'); });
  });
  form.querySelectorAll('input[name="kohde"]').forEach(function (r) {
    r.addEventListener('change', function () { paivitaHintaTekstit(); muutos('kohde'); });
  });
  form.querySelectorAll('input[name="alue"]').forEach(function (r) {
    r.addEventListener('change', function () { muutos('alue'); });
  });

  // Yhteystietokenttien virheet poistuvat kirjoittaessa
  yhteystiedot.forEach(function (t) {
    var k = t.kentta();
    var ev = k.type === 'checkbox' ? 'change' : 'input';
    k.addEventListener(ev, function () {
      if (!$(t.err).hidden) aja(t);
    });
  });

  /* ---------- hinnan alv-ohje kohderyhmän mukaan ---------- */
  function paivitaHintaTekstit() {
    var k = valittuKohde();
    if (k === 'kuluttaja') {
      el.hintaLabel.textContent = 'Palvelun tai tuotteen keskimääräinen hinta (sis. alv)';
      el.hintaApu.textContent = 'Kuluttajahinta alv 25,5 % mukana, suunnilleen riittää. Kannattavuus lasketaan ilman alv:ta.';
    } else if (k === 'yritys') {
      el.hintaLabel.textContent = 'Palvelun tai tuotteen keskimääräinen hinta (alv 0 %)';
      el.hintaApu.textContent = 'Yrityshinta ilman alv:ta, suunnilleen riittää.';
    } else {
      el.hintaLabel.textContent = 'Palvelun tai tuotteen keskimääräinen hinta';
      el.hintaApu.textContent = 'Suunnilleen riittää.';
    }
  }

  /* ---------- paketin suositus (julkinen tieto, päivittyy heti) ---------- */
  function paivitaPaketti() {
    var n = luePalvelut();
    if (isNaN(n)) return;
    var p = pakettiPalveluille(n);
    el.paketinNimi.textContent = p.nimi;
    document.querySelectorAll('.paketti').forEach(function (kortti) {
      var on = kortti.getAttribute('data-paketti') === p.nimi;
      kortti.classList.toggle('suositeltu', on);
      kortti.querySelector('.merkki').hidden = !on;
    });
  }

  /* ---------- tulosten piirto ---------- */
  function teeRivi(dl, nimi, teksti, arvot, lisa) {
    var r = dl.querySelector('[data-rivi="' + nimi + '"]');
    if (!r) {
      r = document.createElement('div');
      r.className = 'rivi';
      r.setAttribute('data-rivi', nimi);
      r.appendChild(document.createElement('dt'));
      r.appendChild(document.createElement('dd'));
      dl.appendChild(r);
    }
    if (teksti !== null) r.querySelector('dt').textContent = teksti;
    var dd = r.querySelector('dd');
    dd.textContent = '';
    arvot.forEach(function (a) {
      var s = document.createElement('span');
      s.className = 'arvo';
      if (!avattu) s.setAttribute('aria-hidden', 'true');
      // ei rivinvaihtoa luvun ja €-merkin väliin eikä "+":n jälkeen
      s.textContent = nimi === 'kannat' ? a : a.replace(/ €/g, ' €').replace(/\+ /g, '+ ');
      dd.appendChild(s);
    });
    if (lisa) {
      var l = document.createElement('span');
      l.className = 'lisa';
      if (!avattu) l.setAttribute('aria-hidden', 'true');
      l.textContent = lisa;
      dd.appendChild(l);
    }
  }

  function himmenna(paalle) {
    $('tulos-alue').classList.toggle('himmea', paalle);
    $('tayta').hidden = !paalle;
  }

  // Budjettitasot näkyvät myös lukitussa tilassa (julkinen tieto); luvut vain avatussa
  function piirraBudjetit(t) {
    el.budjetit.textContent = '';
    var sanat = t.sanat;
    el.budjetitOtsikko.textContent = 'Odotetut ' + sanat.mon + ' eri mainosbudjeteilla';
    t.tasot.forEach(function (tt, i) {
      var nimi = fmt(tt.budjetti) + ' €/kk' + (tt.suositus ? ' (suositus)' : (i === 0 ? ' (alaraja)' : ''));
      if (!avattu) {
        teeRivi(el.budjetit, 'b' + i, nimi, ['00–00 ' + sanat.lkm]);
        return;
      }
      var lisa = tt.rajoittaa ? 'hakuja ei riitä koko budjetille' : '';
      var maara = tt.yhtMax < 1 ? 'alle 1 ' + sanat.lkm : haarukka(tt.yhtMin, tt.yhtMax) + ' ' + sanat.lkm;
      teeRivi(el.budjetit, 'b' + i, nimi, [maara + ' / kk'], lisa);
    });
  }

  function piirraTulokset() {
    var s = lueSyotteet();
    if (!s) { if (avattu) himmenna(true); return; }
    himmenna(false);
    var t = laske(s);
    piirraBudjetit(t);
    if (!avattu) { teeRivi(el.rivit, 'hinta', 'Hinta per ' + t.sanat.yks + ' optimoinnin jälkeen', ['00–00 €']); return; }
    teeRivi(el.rivit, 'hallinta', 'Hallinta (' + t.paketti + ')', [t.skaala ? 'Sovitaan erikseen' : fmt(t.hallinta) + ' €/kk + alv'],
      'mainosbudjetti maksetaan suoraan Googlelle, alv 0 %');
    teeRivi(el.rivit, 'hinta', 'Hinta per ' + t.sanat.yks + ' optimoinnin jälkeen', [haarukka(t.alku.hintaMin, t.alku.hintaMax, '€')],
      'mainoskulu, ilman hallinnointia');
    teeRivi($('rivit-kannat'), 'kannat', 'Kannattavuus', [t.kannatRivi1, t.kannatRivi2], 'Laskettu myyntihinnalla ilman alv:ta, ei katteella.');

    // realismitarkistus
    el.realismiLista.textContent = '';
    t.realismi.forEach(function (r) {
      var li = document.createElement('li');
      if (r.tyyppi === 'ok') li.className = 'ok';
      li.textContent = r.teksti;
      el.realismiLista.appendChild(li);
    });
  }

  function lueSyotteet() {
    var g = valitutTavoitteet(), k = valittuKohde();
    var n = luePalvelut(), P = lueHinta();
    if (!g.length || !k || isNaN(n) || isNaN(P) || P < 1 || P > HINTA_MAX) return null;
    return { tavoitteet: g, palvelut: n, kohde: k, hinta: P, alue: valittuAlue() };
  }

  /* ---------- muutoskäsittelijä ---------- */
  function muutos(mika) {
    paivitaPaketti();
    // virhe pois, kun kenttä korjataan; avatussa tilassa virheet näytetään heti
    tarkistukset.forEach(function (t) {
      if (t.id !== mika) return;
      if (!$(t.err).hidden || avattu) aja(t);
    });
    piirraTulokset();
  }

  /* ---------- seuranta ---------- */
  window.dataLayer = window.dataLayer || [];
  var calcStartTehty = false, formStartTehty = false;

  var ref = '';
  try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
  if (ref === location.hostname.replace(/^www\./, '')) ref = '';
  var source = qs.get('utm_source') || qs.get('s') ||
    ((qs.get('gclid') || qs.get('gbraid') || qs.get('wbraid')) ? 'google-ads' : '') || ref || 'suora';
  var device = innerWidth < 760 ? 'mobiili' : innerWidth < 1100 ? 'tabletti' : 'tietokone';

  var LASKENTA_PAALLA = !!navigator.sendBeacon && navigator.doNotTrack !== '1' && !TESTI;
  function track(type) {
    if (!LASKENTA_PAALLA) return;
    try {
      navigator.sendBeacon(ENDPOINT, new URLSearchParams({ type: type, path: location.pathname, source: source, ref: ref, device: device, lang: 'fi' }));
    } catch (e) {}
  }
  track('view');

  var ohitaSeuranta = false; // ohjelmallinen fokus (virheeseen) ei ole kävijän vuorovaikutusta
  function ensiVuorovaikutus(e) {
    if (ohitaSeuranta) return;
    if (!formStartTehty) { formStartTehty = true; track('form_start'); }
    var t = e.target;
    if (!calcStartTehty && t && t.closest && t.closest('.kysymykset')) {
      calcStartTehty = true;
      window.dataLayer.push({ event: 'calculator_start' });
    }
  }
  form.addEventListener('focusin', ensiVuorovaikutus);
  form.addEventListener('click', ensiVuorovaikutus);

  /* ---------- suostumus (Consent Mode v2), evästebanneri ja klikkitunnisteet ----------
     GTM_ID ja consent default -merkinnät ovat sivun head-skriptissä (index.html). */
  var SUOSTUMUS_AVAIN = 'pikasivut_suostumus';
  var GCLID_AVAIN = 'pikasivut_gclid';
  var GCLID_VOIMASSA_MS = 90 * 24 * 3600 * 1000;

  function gtagKutsu() {
    if (typeof window.gtag === 'function') window.gtag.apply(null, arguments);
    else window.dataLayer.push(arguments);
  }
  var GTM_AKTIIVINEN = typeof window.GTM_ID === 'string' && window.GTM_ID !== 'GTM-XXXXXXX' && /^GTM-[A-Z0-9]{4,}$/.test(window.GTM_ID);
  var PAKOTA_BANNERI = PAIKALLINEN && qs.get('evasteet') === '1'; // vain localhostin testausta varten
  var BANNERI_KAYTOSSA = GTM_AKTIIVINEN || PAKOTA_BANNERI;

  function lueSuostumus() {
    try {
      var v = JSON.parse(localStorage.getItem(SUOSTUMUS_AVAIN) || 'null');
      return (v && (v.valinta === 'kaikki' || v.valinta === 'valttamattomat')) ? v.valinta : null;
    } catch (e) { return null; }
  }
  var suostumus = lueSuostumus();

  // Klikkitunnisteet: URL:sta muistiin; localStorageen vain suostumuksella (90 pv)
  var tunnisteMuisti = {};
  ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { var v = qs.get(k); if (v) tunnisteMuisti[k] = v.slice(0, 200); });
  function lueTallennetutTunnisteet() {
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
      // Uusi klikkaus korvaa vanhan kokonaan (ei sekoiteta eri käyntien tunnisteita)
      var uusi = { gclid: '', gbraid: '', wbraid: '', aika: new Date().toISOString() };
      Object.keys(tunnisteMuisti).forEach(function (k) { uusi[k] = tunnisteMuisti[k]; });
      localStorage.setItem(GCLID_AVAIN, JSON.stringify(uusi));
    } catch (e) {}
  }
  function poistaTunnisteet() { try { localStorage.removeItem(GCLID_AVAIN); } catch (e) {} }
  function annaKlikkitunnisteet() {
    if (suostumus !== 'kaikki') return {};
    // Tämän käynnin tunnisteet ensin; muuten aiemmin tallennetut (ei sekoiteta)
    var v = Object.keys(tunnisteMuisti).length ? tunnisteMuisti : lueTallennetutTunnisteet();
    var ulos = {};
    ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { if (v[k]) ulos[k] = v[k]; });
    return ulos;
  }
  if (suostumus === 'kaikki') tallennaTunnisteet();

  var banneri = $('evaste-banneri');
  var asetusNappi = $('evaste-asetukset');
  var evasteOtsikko = $('evaste-otsikko');
  var avaaja = null;           // elementti, johon fokus palaa suljettaessa
  var TAUSTA = ['header', 'main', 'footer'];

  function modaaliAuki() { return !!banneri && !banneri.hidden; }
  function evasteFokusoitavat() {
    return Array.prototype.slice.call(banneri.querySelectorAll('a[href], button:not([disabled])'));
  }
  function asetaTausta(inert) {
    TAUSTA.forEach(function (tag) {
      var n = document.querySelector(tag);
      if (!n) return;
      if (inert) { n.setAttribute('inert', ''); n.inert = true; n.setAttribute('aria-hidden', 'true'); }
      else { n.removeAttribute('inert'); n.inert = false; n.removeAttribute('aria-hidden'); }
    });
  }
  function naytaBanneri(avaavaElementti) {
    if (!banneri) return;
    avaaja = avaavaElementti || null;
    banneri.hidden = false;
    document.documentElement.classList.add('evaste-auki');
    asetaTausta(true);
    evasteOtsikko.focus();
  }
  function suljeBanneri() {
    banneri.hidden = true;
    document.documentElement.classList.remove('evaste-auki');
    asetaTausta(false);
    var kohde = (avaaja && document.contains(avaaja) && !avaaja.hidden) ? avaaja : null;
    avaaja = null;
    if (kohde) kohde.focus();
    else {
      // Ensimmäinen käynti: fokus sivun alkuun (h1), ei BODYyn
      var h1 = document.querySelector('h1');
      if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
  }
  function valitseSuostumus(valinta) {
    var tila = valinta === 'kaikki' ? 'granted' : 'denied';
    gtagKutsu('consent', 'update', { ad_storage: tila, ad_user_data: tila, ad_personalization: tila, analytics_storage: tila });
    window.dataLayer.push({ event: 'consent_update', suostumus: valinta });
    try { localStorage.setItem(SUOSTUMUS_AVAIN, JSON.stringify({ valinta: valinta, aika: new Date().toISOString() })); } catch (e) {}
    suostumus = valinta;
    if (valinta === 'kaikki') tallennaTunnisteet(); else poistaTunnisteet();
    suljeBanneri();
  }
  if (banneri && BANNERI_KAYTOSSA) {
    if (asetusNappi) {
      asetusNappi.hidden = false;
      asetusNappi.addEventListener('click', function () { naytaBanneri(asetusNappi); });
    }
    $('evaste-hyvaksy').addEventListener('click', function () { valitseSuostumus('kaikki'); });
    $('evaste-valttamattomat').addEventListener('click', function () { valitseSuostumus('valttamattomat'); });
    // Fokusloukku (varmistus myös, jos inert ei ole tuettu). Esc ja taustan klikkaus eivät sulje.
    document.addEventListener('keydown', function (e) {
      if (!modaaliAuki()) return;
      if (e.key === 'Escape') { e.preventDefault(); return; }
      if (e.key !== 'Tab') return;
      var lista = evasteFokusoitavat();
      var eka = lista[0], vika = lista[lista.length - 1];
      var akt = document.activeElement;
      if (!banneri.contains(akt) || akt === evasteOtsikko) {
        e.preventDefault(); (e.shiftKey ? vika : eka).focus();
      } else if (e.shiftKey && akt === eka) { e.preventDefault(); vika.focus(); }
      else if (!e.shiftKey && akt === vika) { e.preventDefault(); eka.focus(); }
    });
    // Taustapeiton klikkaus ei vie fokusta pois dialogista
    banneri.addEventListener('mousedown', function (e) {
      if (!e.target.closest('.evaste-kortti')) e.preventDefault();
    });
    document.addEventListener('focusin', function (e) {
      if (modaaliAuki() && !banneri.contains(e.target)) evasteOtsikko.focus();
    });
    if (!suostumus) naytaBanneri();
  }

  /* ---------- lähetys ---------- */
  function rakennaLahetys(t) {
    var g = t.syote.tavoitteet;
    var n = t.syote.palvelut;
    var palveluTeksti = n === 1 ? '1 palvelu' : (n === 15 ? '15+ palvelua' : n + ' palvelua');
    var kohdeTeksti = t.syote.kohde === 'kuluttaja' ? 'kuluttajille' : 'yrityksille';
    var hintaTeksti = fmt(t.syote.hinta) + (t.syote.kohde === 'kuluttaja' ? ' € sis. alv' : ' € alv 0');
    var budjetitTeksti = t.tasot.map(function (tt) { return fmt(tt.budjetti) + ' €: ' + haarukka(tt.yhtMin, tt.yhtMax); }).join(', ');
    var goal = 'Laskuri: ' + g.map(function (x) { return SANAT[x].nimi; }).join(' + ') + ' · ' + palveluTeksti + ' · ' + kohdeTeksti + ' · ' +
      hintaTeksti + ' · ' + t.alueNimi + ' → ' + t.paketti + ' · ' + t.sanat.mon + '/kk budjeteilla ' + budjetitTeksti;
    var a = t.alku;
    var body = new URLSearchParams();
    body.set('lomake', 'google-ads-hallinta');
    body.set('yritys', el.yritys.value.trim());
    body.set('email', el.email.value.trim());
    body.set('phone', el.phone.value.trim());
    body.set('consent', 'yes');
    body.set('website', el.website.value);
    body.set('goal', goal);
    body.set('l_tavoite', g.join(','));
    body.set('l_palvelut', String(n));
    body.set('l_kohde', t.syote.kohde);
    body.set('l_hinta', String(t.syote.hinta));
    body.set('l_alue', t.syote.alue);
    body.set('t_paketti', t.paketti);
    body.set('t_budjetti', String(a.budjetti));
    body.set('t_hallinta', t.skaala ? 'sovitaan erikseen' : String(t.hallinta));
    body.set('t_kokonais', String(a.K));
    body.set('t_hinta_per_yht', a.hintaMin + '–' + a.hintaMax);
    body.set('t_yhteydenotot', a.yhtMin + '–' + a.yhtMax);
    body.set('t_kaupat', String(t.kaupat));
    body.set('t_budjetit', budjetitTeksti);
    body.set('source', source);
    body.set('page', location.pathname);
    // Klikkitunnisteet vain markkinointisuostumuksella
    var tunn = annaKlikkitunnisteet();
    ['gclid', 'gbraid', 'wbraid'].forEach(function (k) { if (tunn[k]) body.set(k, tunn[k]); });
    // Aiemmalta mainosklikkaukselta tallennettu tunniste, mutta tämä käynti tuli muualta
    if (source === 'suora' && Object.keys(tunn).length) body.set('source', 'google-ads (aiempi käynti)');
    return body;
  }

  function lahetaPalvelimelle(body) {
    if (TESTI) {
      console.info('[testitila] lähetys', Object.fromEntries(body));
      return new Promise(function (resolve, reject) {
        setTimeout(function () { TESTI_VIRHE ? reject(new Error('testivirhe')) : resolve(); }, 600);
      });
    }
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var ajastin = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    // no-cors kuten site.js:ssä: Apps Scriptin CORS-otsikoita ei voi varmistaa, eikä vastausta voi lukea.
    // Resolve (opaque-vastaus palautui) = onnistui; reject tai 15 s aikakatkaisu = virhe. Asiakaspään
    // validointi vastaa palvelimen validointia (yritys >= 2 merkkiä, sama sähköpostiregex, consent).
    var pyynto = { method: 'POST', mode: 'no-cors', body: body };
    if (ctrl) pyynto.signal = ctrl.signal;
    return fetch(ENDPOINT, pyynto).then(function () { clearTimeout(ajastin); },
      function (err) { clearTimeout(ajastin); throw err; });
  }

  var VIRHE_HTML = 'Lähetys ei onnistunut. Yritä uudelleen, tai lähetä sähköpostia osoitteeseen <a href="mailto:akseli@pikasivut.com">akseli@pikasivut.com</a>.';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (avattu || lahettaa) return;
    el.status.textContent = '';

    var ens = validoiKaikki(tarkistukset);
    var ens2 = validoiKaikki(yhteystiedot);
    var kohde = ens || ens2;
    if (kohde) { ohitaSeuranta = true; kohde.focus(); ohitaSeuranta = false; return; }

    // hunajapurkki: jos täytetty, ei lähetetä mitään
    if (el.website.value) return;

    var t = laske(lueSyotteet());
    var body = rakennaLahetys(t);

    lahettaa = true;
    el.nappi.disabled = true;
    el.nappi.textContent = 'Lähetetään…';

    lahetaPalvelimelle(body).then(function () {
      lahettaa = false;
      avaaLaskelma(t);
    }).catch(function () {
      lahettaa = false;
      el.nappi.disabled = false;
      el.nappi.textContent = 'Näytä laskelma';
      el.status.innerHTML = VIRHE_HTML;
    });
  });

  function avaaLaskelma(t) {
    avattu = true;
    // seuranta (vain kerran, ei henkilötietoja)
    var tiedot = { event: 'calculator_submit', paketti: t.paketti, budjetti: t.alku.budjetti, tavoite: t.syote.tavoitteet.join(','), kohde: t.syote.kohde };
    window.dataLayer.push(tiedot);
    // GTM hoitaa konversion dataLayer-tapahtumasta; erillistä gtag('event', ...) -kutsua ei tehdä (tuplakonversion esto)
    track('form_submit');

    document.querySelectorAll('.rivit').forEach(function (d) { d.classList.remove('lukittu'); });
    document.getElementById('lukitus-selite').hidden = true;
    el.lomakeOsa.hidden = true;
    el.kiitos.hidden = false;
    el.lisat.hidden = false;
    piirraTulokset();
    paivitaLoppuCta();

    el.kiitosOtsikko.focus({ preventScroll: true });
    el.kiitos.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' });
  }

  function paivitaLoppuCta() {
    if (el.loppuCta) el.loppuCta.textContent = avattu ? 'Katso laskelmasi' : 'Laske oma arviosi';
  }

  /* ---------- #laskuri-linkit: vieritä laskuriin ja fokus kysymykseen a ---------- */
  document.querySelectorAll('a[href="#laskuri"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      el.kortti.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' });
      var eka = form.querySelector('input[name="tavoite"]');
      if (eka) { ohitaSeuranta = true; eka.focus({ preventScroll: true }); ohitaSeuranta = false; }
    });
  });

  /* ---------- alkutila ---------- */
  paivitaHintaTekstit();
  paivitaPaketti();
  piirraTulokset();
})();
