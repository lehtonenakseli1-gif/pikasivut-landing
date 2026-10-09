/**
 * Pikasivut: ilmainen mainonta-arvio -lomakkeen vastaanotto.
 * Google Apps Script, sidottu Google Sheets -taulukkoon. Julkaistu web-sovelluksena:
 * Execute as: Me, Who has access: Anyone.
 * Sivun lomake (arvio/) lähettää tiedot POST-pyynnöllä tähän.
 */
var NOTIFY_TO = 'akseli@pikasivut.com';
var HEADERS = ['Aikaleima', 'Y-tunnus', 'Sähköposti', 'Puhelin', 'Tavoite', 'Suostumus', 'Lähde', 'Tila'];

function validYtunnus(v) {
  var m = /^(\d{7})-(\d)$/.exec(String(v || '').trim());
  if (!m) return false;
  var w = [7, 9, 10, 5, 8, 4, 2], sum = 0;
  for (var i = 0; i < 7; i++) sum += parseInt(m[1].charAt(i), 10) * w[i];
  var r = sum % 11;
  if (r === 1) return false;
  var check = r === 0 ? 0 : 11 - r;
  return check === parseInt(m[2], 10);
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

var EVENT_TYPES = ['view', 'cta_click', 'tel_click', 'form_start', 'form_submit'];
var EVENT_HEADERS = ['Aikaleima', 'Tapahtuma', 'Sivu', 'Lähde', 'Viittaaja', 'Laite', 'Kieli'];

// Nimetön kävijälaskenta: ei evästeitä, ei IP-osoitetta eikä tunnistetta.
function logEvent(p) {
  var type = String(p.type || '');
  if (EVENT_TYPES.indexOf(type) < 0) return;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Tapahtumat');
  if (!sh) {
    sh = ss.insertSheet('Tapahtumat');
    sh.appendRow(EVENT_HEADERS);
    sh.setFrozenRows(1);
  }
  var clip = function (v, n) { return String(v || '').slice(0, n); };
  sh.appendRow([new Date(), type, clip(p.path, 120), clip(p.source, 60), clip(p.ref, 80), clip(p.device, 12), clip(p.lang, 5)]);
}

// Aja kerran: luo Yhteenveto-välilehden laskukaavoilla.
function setupSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale('en_US'); // setFormula vaatii englanninkielisen kaavasyntaksin
  var ev = ss.getSheetByName('Tapahtumat');
  if (!ev) { ev = ss.insertSheet('Tapahtumat'); ev.appendRow(EVENT_HEADERS); ev.setFrozenRows(1); }
  var sum = ss.getSheetByName('Yhteenveto') || ss.insertSheet('Yhteenveto');
  sum.clear();
  sum.getRange('A1').setValue('Pikasivut: yhteenveto').setFontWeight('bold').setFontSize(14);
  sum.getRange('A3:B3').setValues([['Mittari', 'Määrä']]).setFontWeight('bold');
  var labels = [['Sivunäytöt yhteensä', 'view'], ['Napin klikkaukset (arvio)', 'cta_click'], ['Puhelinklikkaukset', 'tel_click'], ['Lomake aloitettu', 'form_start'], ['Lomake lähetetty', 'form_submit']];
  labels.forEach(function (l, i) {
    sum.getRange(4 + i, 1).setValue(l[0]);
    sum.getRange(4 + i, 2).setFormula('=COUNTIF(Tapahtumat!B:B,"' + l[1] + '")');
  });
  sum.getRange('A10').setValue('Lomakkeen konversio (lähetetty / sivunäytöt)');
  sum.getRange('B10').setFormula('=IFERROR(B8/B4,0)').setNumberFormat('0.0%');
  sum.getRange('D3').setValue('Sivunäytöt lähteittäin').setFontWeight('bold');
  sum.getRange('D4').setFormula('=IFERROR(QUERY(Tapahtumat!A:G,"select D, count(B) where B=\'view\' and D is not null group by D order by count(B) desc label D \'Lähde\', count(B) \'Näytöt\'",1),"")');
  sum.getRange('G3').setValue('Suosituimmat sivut').setFontWeight('bold');
  sum.getRange('G4').setFormula('=IFERROR(QUERY(Tapahtumat!A:G,"select C, count(B) where B=\'view\' group by C order by count(B) desc limit 15 label C \'Sivu\', count(B) \'Näytöt\'",1),"")');
  sum.setColumnWidth(1, 300);
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var out = ContentService.createTextOutput();
  if (p.type) {
    try { logEvent(p); } catch (err) { /* ei kaadeta */ }
    return out.setContent('ok');
  }
  // Honeypot: oikea käyttäjä ei täytä tätä kenttää
  if (p.website) return out.setContent('ok');
  var yt = String(p.ytunnus || '').trim();
  var email = String(p.email || '').trim();
  if (!validYtunnus(yt) || !validEmail(email) || p.consent !== 'yes') {
    return out.setContent('invalid');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sh.getLastRow() === 0) {
      sh.appendRow(HEADERS);
      sh.setFrozenRows(1);
    }
    sh.appendRow([new Date(), yt, email, String(p.phone || '').trim(), String(p.goal || ''), 'kyllä', String(p.source || ''), 'uusi']);
  } finally {
    lock.releaseLock();
  }
  try {
    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: 'Uusi mainonta-arvio: ' + yt,
      body: 'Uusi pyyntö pikasivut.com/arvio/\n\nY-tunnus: ' + yt + '\nSähköposti: ' + email +
        '\nPuhelin: ' + (p.phone || '-') + '\nTavoite: ' + (p.goal || '-') + '\nLähde: ' + (p.source || '-') +
        '\n\nPRH: https://www.ytj.fi/fi/index/yritystiedot.html?yTunnus=' + yt.replace('-', '') +
        '\n\nTaulukko: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      replyTo: email
    });
  } catch (err) { /* taulukkoon tallentui jo */ }
  return out.setContent('ok');
}

function doGet() {
  return ContentService.createTextOutput('Pikasivut arvio-lomake toimii.');
}
