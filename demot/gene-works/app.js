(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- Työmaamalli: sisältö ---------- */
  var COL = { a: 'var(--or)', m: 'var(--k)', s: 'var(--o)' };
  var LBL = { a: 'Aputyö', m: 'Ammattityö', s: 'Sovitaan erikseen' };
  var PHASES = [
    { id: 'runko', no: '01', name: 'Runko ja vesikatto',
      title: 'Runko- ja vesikattovaihe',
      lead: 'Kuormien purku, tarvikkeiden siirrot, rakennusjätteiden keräys ja kulkureittien kunnossapito.',
      spots: [
        { p: [21.2, 8.2, 2.6], k: 'a', r: 'r1', j: 'mat', t: 'Kuormien vastaanotto', i: ['Saapuvien kuormien vastaanotto- ja purkuapu', 'Tarvikkeet sovituille varastointipaikoille', 'Varastointialueiden järjestely työmaan ohjeiden mukaan'] },
        { p: [11, 14, 0.2], k: 'a', r: 'r2', j: 'sii', t: 'Kulkureitit', i: ['Kulkureittien kunnossapito', 'Työmaan ohjeiden mukaiset reitit työpisteille'] },
        { p: [1.5, 8.6, 1.5], k: 'a', j: 'sii', t: 'Jätelavat', i: ['Rakennusjätteiden keräys työpisteiltä', 'Lajittelu oikeille jätelavoille'] },
        { p: [11, 7.5, 9.2], k: 'm', j: 'kat tur', t: 'Vesikatto', i: ['Bitumikermi-, kalvo- ja peltikatot', 'Ylösnostot ja läpivientien tiivistykset suunnitelmien mukaan', 'Turvakaiteet, vaijerijärjestelmät ja ankkurointipisteet'] },
        { p: [5, 8, 3.6], k: 'm', j: 'jul', t: 'Julkisivu', i: ['Sandwich-paneelien asennus', 'Julkisivukasetit ja peltiverhoukset', 'Liittymäpellitykset ja listoitukset'] }
      ] },
    { id: 'tekniikka', no: '02', name: 'Sisätyöt ja talotekniikka',
      title: 'Sisätyö- ja talotekniikkavaihe',
      lead: 'Haalaus, pakkausjätteiden poisto, työmaan siisteys ja asennusryhmien avustaminen.',
      spots: [
        { p: [18, 9, 0.5], k: 'a', r: 'r3', j: 'mat', t: 'Haalaus asennuspisteille', i: ['Materiaalien haalaus kerroksiin ja asennuspisteille', 'Avustaminen toimitusten vastaanotossa ja purussa'] },
        { p: [16.4, 10.4, 2.9], k: 'a', j: 'apu', t: 'Asennusryhmien apu', i: ['Työpisteiden valmistelu', 'Tarvikkeiden siirrot ja sovitut avustavat työt', 'Jätteiden keräys työvaiheen jälkeen'] },
        { p: [1.5, 8.6, 1.5], k: 'a', j: 'sii', t: 'Pakkausjätteet', i: ['Laiteasennusten edetessä pakkausmateriaalien määrä kasvaa', 'Keräämme ja lajittelemme rakennusjätteet', 'Kulkureitit pysyvät vapaina työmaan puhtausohjeiden mukaan'] },
        { p: [5, 8, 1.6], k: 'a', j: 'apu', t: 'Kulunvalvonta ja perehdytys', i: ['Työmaakohtainen perehdytys', 'Kulkuluvat ja alueiden ohjeet käydään läpi tilaajan kanssa', 'Sama ryhmä työskentelee kohteessa pitkäjänteisesti'] }
      ] },
    { id: 'viimeistely', no: '03', name: 'Viimeistely ja luovutus',
      title: 'Viimeistely- ja luovutusvaihe',
      lead: 'Valmiiden pintojen suojaus, väliaikaisten suojausten purku ja avustavat tehtävät.',
      spots: [
        { p: [14, 11, 0.3], k: 'a', j: 'suo', t: 'Valmiit lattiapinnat', i: ['Lattiapinnat, portaat ja kynnykset', 'Suojaukset työvaiheen vaatimusten mukaan'] },
        { p: [18, 8, 0.6], k: 'a', r: 'r3', j: 'suo mat', t: 'Haalausreitit', i: ['Oviaukot ja kulmat haalausreiteillä', 'Kulkureittien suojaus'] },
        { p: [5, 8, 1.6], k: 'a', j: 'suo', t: 'Suojausten purku', i: ['Väliaikaisten suojausten asennus ja purku', 'Avustavat tehtävät luovutuksen alla'] },
        { p: [18, 3, 8.8], k: 'm', j: 'pel', t: 'Pellitykset', i: ['Räystäs-, reuna- ja harjapellitykset', 'Sadevesikourujen ja syöksytorvien asennus', 'Peite-, kulma- ja liitoslistat'] }
      ] },
    { id: 'talvi', no: '04', name: 'Talvikausi',
      title: 'Talvikunnossapito työmaalla',
      lead: 'Sama ryhmä siirtyy sovittuihin talvitöihin. Työjärjestys sovitaan työnjohdon kanssa.',
      spots: [
        { p: [3.3, 10.5, 0.2], k: 'a', r: 'r4', j: 'lum', t: 'Kulkureitit', i: ['Työntekijöiden reitit työpisteille', 'Lumityöt ja hiekoitus työmaan suunnitelman mukaan'] },
        { p: [5, 8, 1.6], k: 'a', j: 'lum', t: 'Sisäänkäynnit ja portaat', i: ['Rakennusten sisäänkäynnit ja ulkoportaat', 'Sosiaalitilojen edustat'] },
        { p: [21.2, 8.2, 2.6], k: 'a', r: 'r1', j: 'lum', t: 'Purkupaikat ja työalueet', i: ['Kuormien purkupaikat', 'Muut sovitut työalueet toimitusten ja työvaiheiden mukaan'] },
        { p: [11, 7.5, 9.2], k: 's', j: 'lum', t: 'Kattojen lumityöt', i: ['Laajuus ja toteutus sovitaan erikseen kohteen mukaan', 'Edellyttää asianmukaista putoamissuojausta ja tilaajan suunnitelmaa'] }
      ] }
  ];

  /* ---------- Työmaamalli: piirto ---------- */
  var U = 30, CX = Math.cos(Math.PI / 6), SY = 0.5;
  var iso = function (x, y, z) { return [(x - y) * U * CX, (x + y) * U * SY - (z || 0) * U]; };
  var pts = function (a) { return a.map(function (p) { var q = iso(p[0], p[1], p[2]); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); };
  var svgEl = function (n, a, parent) {
    var e = document.createElementNS(NS, n);
    Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); });
    if (parent) parent.appendChild(e);
    return e;
  };
  var poly = function (par, a, cls) { return svgEl('polygon', { points: pts(a), 'class': cls }, par); };
  var line = function (par, a, cls) { return svgEl('polyline', { points: pts(a), 'class': cls }, par); };
  var box = function (par, x, y, z, w, d, h, c) {
    var g = svgEl('g', { 'class': 's' }, par);
    poly(g, [[x, y + d, z + h], [x + w, y + d, z + h], [x + w, y + d, z], [x, y + d, z]], c + '2');
    poly(g, [[x + w, y, z + h], [x + w, y + d, z + h], [x + w, y + d, z], [x + w, y, z]], c + '3');
    poly(g, [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c + '1');
    return g;
  };
  var layer = function (par, cls) { return svgEl('g', { 'class': cls ? 'ph ' + cls : '' }, par); };

  function drawSite(svg) {
    var X0 = 5, X1 = 18, Y0 = 3, Y1 = 12, H = 5, RZ = 8.2, i, j;
    /* tontti */
    poly(svg, [[0, 0], [24, 0], [24, 17], [0, 17]], 'g');
    for (i = 2; i < 24; i += 2) line(svg, [[i, 0], [i, 17]], 'gl');
    for (i = 2; i < 17; i += 2) line(svg, [[0, i], [24, i]], 'gl');

    /* kulkureitit */
    var r1 = line(svg, [[21, 10], [21, 13.8]], 'rt'); r1.dataset.r = 'r1';
    var r2 = line(svg, [[3.3, 13.8], [21, 13.8]], 'rt'); r2.dataset.r = 'r2';
    var r3 = line(svg, [[19.6, 8], [18, 8], [15, 8]], 'rt'); r3.dataset.r = 'r3';
    var r4 = line(svg, [[3.3, 13.8], [3.3, 8], [5, 8]], 'rt'); r4.dataset.r = 'r4';

    /* jätelavat */
    box(svg, 0.7, 6.6, 0, 1.6, 2.4, 1, 'gr');
    box(svg, 0.7, 9.4, 0, 1.6, 2.4, 1, 'rd');

    /* lattia ja takaseinät */
    poly(svg, [[X0, Y0, 0.12], [X1, Y0, 0.12], [X1, Y1, 0.12], [X0, Y1, 0.12]], 'floor');

    /* takaseinät paneeleina */
    var walls = layer(svg, 'tekniikka viimeistely talvi');
    var wallsRunko = layer(svg, 'runko');
    [walls, wallsRunko].forEach(function (g, n) {
      var top = n ? 2.4 : H;
      poly(g, [[X0, Y0, 0], [X0, Y1, 0], [X0, Y1, top], [X0, Y0, top]], 'wall2');
      poly(g, [[X0, Y0, 0], [X1, Y0, 0], [X1, Y0, top], [X0, Y0, top]], 'wall');
      for (i = 1; i < 9; i++) line(g, [[X0, Y0 + i, 0], [X0, Y0 + i, top]], 'seam');
      for (i = 1; i < 13; i++) line(g, [[X0 + i, Y0, 0], [X0 + i, Y0, top]], 'seam');
    });
    /* ovi */
    poly(svg, [[X0, 7.2, 0], [X0, 8.8, 0], [X0, 8.8, 2.1], [X0, 7.2, 2.1]], 'y2 s');

    /* teräsrunko */
    var fr = layer(svg, 'runko');
    for (i = 0; i <= 13; i += 3.25) for (j = 0; j <= 9; j += 3) {
      if (i < 0.1 || j < 0.1) box(fr, X0 + i - .1, Y0 + j - .1, 0, .2, .2, H, 'st');
    }
    box(fr, X0, Y0 - .1, H - .2, 13, .2, .2, 'st');
    box(fr, X0 - .1, Y0, H - .2, .2, 9, .2, 'st');

    /* suojaukset */
    var pr = layer(svg, 'viimeistely');
    poly(pr, [[6, 10.6, .16], [17.4, 10.6, .16], [17.4, 11.7, .16], [6, 11.7, .16]], 'prot');
    poly(pr, [[15.2, 7.4, .16], [18, 7.4, .16], [18, 8.8, .16], [15.2, 8.8, .16]], 'prot');
    poly(pr, [[6, 3.5, .16], [6, 3.5, 2.2], [6, 4.4, 2.2], [6, 4.4, .16]], 'prot');

    /* laiterivit */
    [5, 7, 9].forEach(function (y, row) {
      var g = layer(svg, row === 2 ? 'viimeistely talvi' : 'tekniikka viimeistely talvi');
      for (i = 0; i < 6; i++) box(g, 6.6 + i * 1.5, y, .14, 1.4, 1.1, 2.5, 'dk');
      var d = layer(svg, 'tekniikka viimeistely talvi');
      box(d, 6.2, y + .3, 3.7, 9.6, .5, .4, 'ml');
      box(d, 6.2, y + .95, 3.45, 9.6, .22, .1, 'y');
    });
    /* kuormalavat sisällä */
    var inside = layer(svg, 'tekniikka');
    box(inside, 15.9, 7.3, .14, 1, 1, .9, 'wd');
    box(inside, 15.9, 8.5, .14, 1, 1, .6, 'wd');

    /* etuseinän sokkeli ja pilarit */
    var curb = svgEl('g', null, svg);
    box(curb, X0, Y1, 0, X1 - X0, .15, .35, 't');
    box(curb, X1, Y0, 0, .15, 7.2 - Y0 + .0, .35, 't');
    box(curb, X1, 8.8, 0, .15, Y1 - 8.8 + .15, .35, 't');
    var colN = layer(svg, 'tekniikka viimeistely talvi runko');
    [[X1, Y1], [X1, Y0]].forEach(function (c) { box(colN, c[0] - .1, c[1] - .1, 0, .2, .2, H, 'st'); });
    box(colN, X0, Y1 - .1, 0, .2, .2, H, 'st');

    /* lastauspaikka: rekka ja lavat */
    var rk = svgEl('g', null, svg);
    box(rk, 22, 2.2, 0.15, 1.7, 5.2, 2.1, 'wh');
    box(rk, 22.1, .9, 0.15, 1.5, 1.2, 1.6, 'bl');
    var loads = layer(svg, 'runko tekniikka');
    box(loads, 19.9, 6.6, 0, 1.3, 1.3, .7, 'wd');
    box(loads, 19.9, 8.2, 0, 1.3, 1.3, 1.1, 'wd');
    box(loads, 19.9, 8.2, 1.1, 1.3, 1.3, .3, 'wd');

    /* sosiaalitilat */
    box(svg, 1, 14.6, 0, 6, 1.9, 1.3, 'wh');
    box(svg, 7.4, 14.6, 0, 3.6, 1.9, 1.3, 'wh');

    /* irrotettu vesikatto */
    var rf = svgEl('g', null, svg);
    var full = layer(rf, 'tekniikka viimeistely talvi');
    box(full, X0, Y0, RZ, X1 - X0, Y1 - Y0, .22, 'ml');
    var half = layer(rf, 'runko');
    box(half, X0, Y0, RZ, 7, Y1 - Y0, .22, 'ml');
    line(half, [[X0 + 7, Y0, RZ + .22], [X1, Y0, RZ + .22], [X1, Y1, RZ + .22], [X0 + 7, Y1, RZ + .22]], 'seam');
    for (i = 1; i < 9; i++) line(rf, [[X0, Y0 + i, RZ + .22], [X0 + 7, Y0 + i, RZ + .22]], 'seam');
    var snow = layer(rf, 'talvi');
    box(snow, X0 + .1, Y0 + .1, RZ + .22, X1 - X0 - .2, Y1 - Y0 - .2, .12, 'wh');
    /* kaiteet ja ankkurit */
    var rail = [[X0 + .3, Y0 + .3], [X1 - .3, Y0 + .3], [X1 - .3, Y1 - .3], [X0 + .3, Y1 - .3], [X0 + .3, Y0 + .3]];
    line(rf, rail.map(function (p) { return [p[0], p[1], RZ + 1]; }), 'y-rail');
    rail.slice(0, 4).forEach(function (p) { line(rf, [[p[0], p[1], RZ + .2], [p[0], p[1], RZ + 1]], 'y-rail'); });
    [8, 11, 14].forEach(function (x) { box(rf, x, 7.3, RZ + .22, .25, .25, .4, 'y'); });
    /* katon ja rakennuksen kulmat yhteen */
    [[X0, Y1], [X1, Y1], [X1, Y0]].forEach(function (c) { line(rf, [[c[0], c[1], H], [c[0], c[1], RZ]], 'leader'); });

    /* lumikasat */
    var drift = layer(svg, 'talvi');
    box(drift, 19.3, 14.6, 0, 3.6, 1.5, .55, 'wh');
  }

  var phase = 'runko', spot = 0, siteSvg, VIEW = PHASES;
  function cur() { return VIEW.filter(function (x) { return x.id === phase; })[0]; }

  function renderPins() {
    var old = $('#pins', siteSvg);
    if (old) old.remove();
    var g = svgEl('g', { id: 'pins' }, siteSvg);
    var P = cur();
    P.spots.forEach(function (s, i) {
      var q = iso(s.p[0], s.p[1], s.p[2]);
      var pin = svgEl('g', { 'class': 'pin' + (i === spot ? ' on' : ''), tabindex: 0, role: 'button', 'aria-label': (i + 1) + '. ' + s.t, style: '--c2:' + COL[s.k] }, g);
      var big = window.innerWidth < 640;
      pin.style.setProperty('--pf', big ? '27px' : '13px');
      svgEl('circle', { cx: q[0], cy: q[1], r: big ? 27 : 13 }, pin);
      var t = svgEl('text', { x: q[0], y: q[1] }, pin);
      t.textContent = i + 1;
      pin.addEventListener('click', function () { setSpot(i); });
      pin.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSpot(i); } });
    });
    drawTag(g, P.spots[spot]);
  }

  /* valitun kohdan korostus ja nimilappu */
  function drawTag(g, s) {
    if (!s) return;
    var q = iso(s.p[0], s.p[1], s.p[2]), big = window.innerWidth < 640;
    var halo = svgEl('circle', { 'class': 'halo', cx: q[0], cy: q[1], r: big ? 92 : 66 });
    g.insertBefore(halo, g.firstChild);
    var fs = big ? 34 : 16, h = fs * 2.2, pad = fs * .75, w = s.t.length * fs * .56 + pad * 2;
    var gap = big ? 36 : 24, left = q[0] > 120, x = left ? q[0] - gap - w : q[0] + gap;
    x = Math.max(-456, Math.min(x, 636 - w));
    var y = Math.max(-170, Math.min(q[1] - h / 2, 624 - h));
    var t = svgEl('g', { 'class': 'tag' }, g);
    svgEl('rect', { x: x, y: y, width: w, height: h, rx: fs * .35 }, t);
    var txt = svgEl('text', { x: x + pad, y: y + h / 2, style: 'font-size:' + fs + 'px' }, t);
    txt.textContent = s.t;
  }

  function renderSpots() {
    var P = cur();
    $('#ph-title').textContent = P.title;
    $('#ph-lead').textContent = P.lead;
    $('#spots').innerHTML = P.spots.map(function (s, i) {
      return '<div class="spot' + (i === spot ? ' on' : '') + '" style="--c2:' + COL[s.k] + '"><button type="button" aria-expanded="' + (i === spot) + '" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span>' + esc(s.t) + '</span><span class="t">' + LBL[s.k] + '</span></button><ul>' +
        s.i.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('');
    Array.prototype.forEach.call(document.querySelectorAll('#spots button'), function (b) {
      b.addEventListener('click', function () { setSpot(+b.dataset.i); });
    });
    var s = P.spots[spot];
    Array.prototype.forEach.call(siteSvg.querySelectorAll('.rt'), function (r) { r.classList.toggle('on', !!s.r && r.dataset.r === s.r); });
  }

  function setSpot(i) { spot = i; renderPins(); renderSpots(); }
  function setPhase(id) {
    phase = id; spot = 0;
    siteSvg.setAttribute('data-phase', id);
    $('#iso').setAttribute('data-phase', id);
    Array.prototype.forEach.call(document.querySelectorAll('#phases button'), function (b) {
      var on = b.dataset.id === id;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    renderPins(); renderSpots();
  }

  function initModel() {
    var root = $('#iso');
    if (!root) return;
    var job = root.dataset.job;
    if (job) VIEW = PHASES.map(function (p) {
      return { id: p.id, no: p.no, name: p.name, title: p.title, lead: p.lead, spots: p.spots.filter(function (s) { return s.j.split(' ').indexOf(job) > -1; }) };
    }).filter(function (p) { return p.spots.length; });
    siteSvg = svgEl('svg', { viewBox: '-462 -176 1104 806', role: 'img', 'aria-label': 'Aksonometrinen malli datakeskustyömaasta: rakennus, irrotettu vesikatto, lastauspaikka, jätelavat ja kulkureitit.' }, root);
    drawSite(siteSvg);
    $('#phases').innerHTML = VIEW.map(function (p) {
      return '<button type="button" role="tab" data-id="' + p.id + '"><small>' + p.no + '</small>' + esc(p.name) + '</button>';
    }).join('');
    var btns = Array.prototype.slice.call(document.querySelectorAll('#phases button'));
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { setPhase(b.dataset.id); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = btns[(i + d + btns.length) % btns.length];
        n.focus(); setPhase(n.dataset.id);
      });
    });
    if (VIEW.length < 2) $('#phases').hidden = true;
    setPhase(VIEW[0].id);
    var wasBig = window.innerWidth < 640;
    window.addEventListener('resize', function () {
      var big = window.innerWidth < 640;
      if (big !== wasBig) { wasBig = big; renderPins(); }
    });
  }

  /* ---------- Yhteydenotto ---------- */
  var Q_PH = ['Runko- ja vesikattovaihe', 'Sisätyö- ja talotekniikkavaihe', 'Viimeistely- ja luovutusvaihe', 'Talvikausi'];
  var Q_APU = ['Materiaalien siirrot', 'Suojaukset', 'Asennusryhmien apu', 'Työmaan siisteys', 'Lumityöt ja hiekoitus'];
  var Q_AMM = ['Vesikattotyöt', 'Rakennuspeltityöt', 'Julkisivutyöt', 'Kattoturva'];

  function initQuote() {
    var f = $('#qform');
    if (!f) return;
    var want = new URLSearchParams(location.search).get('tyo');
    var opt = function (n, v) { return '<label class="opt"><input type="checkbox" name="' + n + '" value="' + esc(v) + '"' + (v === want ? ' checked' : '') + '><span>' + esc(v) + '</span></label>'; };
    $('#q-apu').innerHTML = Q_APU.map(function (v) { return opt('ta', v); }).join('');
    $('#q-amm').innerHTML = Q_AMM.map(function (v) { return opt('ta', v); }).join('');
    $('#q-phase').innerHTML = Q_PH.map(function (v) { return opt('ph', v); }).join('');
    var panels = Array.prototype.slice.call(f.querySelectorAll('.fm-p'));
    var marks = Array.prototype.slice.call(document.querySelectorAll('#fm-steps li'));
    var back = $('#fm-back'), next = $('#fm-next'), send = $('#fm-send'), step = 0;
    var picks = function (n) { return Array.prototype.map.call(f.querySelectorAll('input[name=' + n + ']:checked'), function (i) { return i.value; }); };
    var val = function (n) { return f.elements[n].value.trim(); };

    function summary() {
      var rows = [['Tarvittava apu', picks('ta').join(', ')], ['Rakennusvaihe', picks('ph').join(', ')], ['Työmaa', val('kohde')], ['Toivottu aloitus', val('aloitus')], ['Ryhmän koko', val('koko')]]
        .filter(function (r) { return r[1]; });
      $('#fm-sum').innerHTML = rows.length ? '<h3>Yhteenveto</h3><dl>' + rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl>' : '';
    }
    function go(n, focus) {
      step = n;
      panels.forEach(function (p, i) { p.hidden = i !== n; });
      marks.forEach(function (m, i) {
        m.classList.toggle('on', i === n);
        m.classList.toggle('past', i < n);
        if (i === n) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current');
      });
      back.hidden = n === 0;
      next.hidden = n === panels.length - 1;
      send.hidden = n !== panels.length - 1;
      if (n === panels.length - 1) summary();
      if (focus) {
        $('legend', panels[n]).focus({ preventScroll: true });
        var top = $('.fm').getBoundingClientRect().top + window.scrollY - 90;
        if (window.scrollY > top) window.scrollTo(0, top);
      }
    }
    next.addEventListener('click', function () { go(step + 1, true); });
    back.addEventListener('click', function () { go(step - 1, true); });

    function check(el) {
      var box = el.parentNode.querySelector('.fe');
      if (!box) return el.checkValidity();
      var ok = el.checkValidity();
      box.textContent = ok ? '' : el.type === 'email' && el.value ? 'Tarkista sähköpostiosoite.' : 'Täytä tämä kenttä.';
      el.setAttribute('aria-invalid', !ok);
      return ok;
    }
    Array.prototype.forEach.call(f.querySelectorAll('input[required]:not([type=checkbox])'), function (el) {
      el.addEventListener('blur', function () { if (el.value) check(el); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('#q-err');
      var bad = Array.prototype.filter.call(f.querySelectorAll('input[required]:not([type=checkbox])'), function (el) { return !check(el); });
      var okBox = f.elements.ok.checked;
      err.hidden = okBox;
      err.textContent = okBox ? '' : 'Hyväksy tietojen käsittely, niin voimme vastata sinulle.';
      if (bad.length) { bad[0].focus(); return; }
      if (!okBox) { f.elements.ok.focus(); return; }
      f.hidden = true;
      $('#fm-steps').hidden = true;
      var d = $('#fm-done');
      d.hidden = false;
      d.focus();
    });
    go(0);
  }

  initModel(); initQuote();
})();
