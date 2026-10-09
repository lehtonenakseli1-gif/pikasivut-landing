# Pikasivut — landing page

Staattinen myyntisivu nettisivubisnekselle. Ei buildia, ei riippuvuuksia.
Pelkkä HTML + CSS + vanilla JS. Tekstit me-muodossa (yritys, ei minä), eikä palvelua kohdenneta erikseen pk-yrityksille. Ei ulkoisia palveluita: fontit on hostattu itse (`fonts/`).

## Tiedostot

| Tiedosto | Sisältö |
| --- | --- |
| `index.html` | Etusivu: nav, hero, palvelut, vaiheet, yhteydenotto |
| `site.css` | Koko sivuston tyylit (Hakukenttä-teema). Kaikki sivut käyttävät tätä |
| `site.js` | Liikkuvat osat: kirjoittava hakukenttä, hakupillerit, korostuskynä, kallistuvat kortit, +1 klikkaus, hiiren väripisteet, Kokeilen onneani, tynnyrikierre (logo 5× tai haku "barrel roll"). Alasivuilla: budjettilaskuri ja klikkihintanauha (hinta), suodatin ja hakutermitaulu (auditointi), pyörivät tarrat ja teipit (toimialat), itsetarkistus, hakutermiraportti jossa valitaan negatiiviset, konversioterminaali (oppaat) |
| `fonts/` | Itse hostatut fontit: Bricolage Grotesque, Figtree, DM Mono |
| `google-ads-hinta/` | Hinnasto: Perus 300, Kasvu 500, Kattava 750 €/kk, mainosbudjetin alaraja 500 €/kk, Perus-paketin suositus 1 000 €/kk |
| `google-ads-auditointi/` | Google Ads -tilin auditointi |
| `google-ads-siivousyritykselle/`, `google-ads-autokorjaamolle/`, `google-ads-remonttiyritykselle/` | Toimialasivut |
| `opas/` | Oppaat (hakemisto + 3 artikkelia) |
| `404.html` | Virhesivu (noindex) |
| `esimerkkitarjous.pdf` | Tarjousapilla generoitu esimerkki. Ei enää linkitetty sivulta — säilytetty tiedostojärjestelmässä, jos tarvitset sitä myöhemmin |
| `privacy.html` | Tietosuojaseloste |
| `terms.html` | Toimitusehdot |

## Aja paikallisesti

```bash
python3 -m http.server 4322 --directory .
```

Avaa http://localhost:4322

## Sivuston rakenne

Jokaisella asialla on yksi koti, eikä sisältöä toisteta sivulta toiselle:

| Sivu | Tehtävä |
| --- | --- |
| `/` | Yleiskatsaus: ongelmat, mitä teemme (linkkikortit), miksi Pikasivut. Ei hintoja, UKK:ta eikä prosessia |
| `/palvelut/` | Palvelut yksityiskohtaisesti, yhteistyön eteneminen, linkit toimialoihin |
| `/google-ads-hinta/` | Paketit, hinnat ja budjettilaskuri (ainoa paikka, jossa paketit kuvataan) |
| `/google-ads-auditointi/`, `/google-ads-*yritykselle/`, `/google-ads-autokorjaamolle/` | Auditointi ja toimialasivut (Palvelut-valikon alla) |
| `/opas/` | Oppaat |
| `/ukk/` | Usein kysyttyä (ainoa paikka, jossa UKK on, ja siellä FAQPage-schema) |
| `/yhteystiedot/` | Yhteystiedot ja mitä kertoa ensimmäisessä viestissä |

Navigaatio (`header()` ja `footer()` generaattorissa) on sama joka sivulla: aktiivinen sivu
korostetaan (`aria-current`), Palvelut-kohdassa on alasvetovalikko, mobiilissa avautuva
valikko, ja jokaisella alasivulla on "Olet täällä" -murupolku. `eng/` on edelleen
yksisivuinen englanninkielinen versio.

## Yhteydenotto

Lomaketta ei ole. Kaikki tarjous-CTA:t vievät etusivun #contact-osioon (puhelin, sähköposti).

Hinnat näkyvät etusivun #hinnat-osiossa, `google-ads-hinta/`-sivulla, UKK:ssa, laskurissa (`site.js`) ja toimitusehdoissa. **Jos muutat hintoja, päivitä kaikki** (myös `eng/index.html`).

## Deploy GitHub Pagesiin

```bash
gh repo create pikasivut-landing --public --source=. --push
```

Sitten repossa: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.

## Uusi alasivu

Alasivut ovat tavallista HTML:ää: kopioi lähin olemassa oleva sivu kansioineen,
vaihda title, description, canonical, og-tagit, murupolku ja sisältö, ja lisää
osoite `sitemap.xml`:ään sekä footerin linkkilistaan.

## Lomake ja kävijälaskenta

`apps-script/Code.gs` on Google Apps Script -web-sovellus (sidottu Google Sheets -taulukkoon
"Pikasivut arviopyynnöt"). Sama osoite (`ENDPOINT` tiedostossa `site.js`) vastaanottaa
`/arvio/`-lomakkeen (välilehti 1) ja nimettömän kävijälaskennan (välilehti "Tapahtumat",
yhteenveto välilehdellä "Yhteenveto"). Ei evästeitä eikä tunnisteita. Jos muokkaat skriptiä,
julkaise uusi versio (Ota käyttöön → Hallinnoi → muokkaa → Uusi versio), jolloin osoite säilyy.
Biolinkin lähde näkyy, kun käytät osoitetta `pikasivut.com/arvio/?s=tiktok`.
