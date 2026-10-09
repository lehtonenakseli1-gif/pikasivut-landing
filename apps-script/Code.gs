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

function doPost(e) {
  var p = (e && e.parameter) || {};
  var out = ContentService.createTextOutput();
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
