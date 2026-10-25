# Pikasivut — landing page

Staattinen myyntisivu nettisivubisnekselle. Ei buildia, ei riippuvuuksia.
Pelkkä HTML + CSS + vanilla JS. Tekstit me-muodossa (yritys, ei minä), eikä palvelua kohdenneta erikseen pk-yrityksille. Ei ulkoisia palveluita: fontit on hostattu itse (`fonts/`).

## Tiedostot

| Tiedosto | Sisältö |
| --- | --- |
| `index.html` | Etusivu: nav, hero, palvelut, vaiheet, yhteydenotto |
| `site.css` | Koko sivuston tyylit (Hakukenttä-teema). Kaikki sivut käyttävät tätä |
| `site.js` | Interaktiiviset osat: etusivun hero-hakudemo (itsekirjoittuva hakukenttä ja mainoksen vaihto), korostuskynä (`.hl`), mobiilivalikko, USD/EUR-valitsin (`us/`), arviolomake virheviesteineen (lukee Apps Scriptin vastauksen), nimetön kävijälaskenta sekä oppaiden interaktiiviset osat (itsetarkistus, hakutermiraportti jossa valitaan negatiiviset, konversioterminaali). Hakutermitaulu (auditointi) on pelkkää staattista HTML:ää ja CSS:ää |
| `fonts/` | Itse hostatut fontit: Bricolage Grotesque, Figtree, DM Mono |
| `google-ads-hinta/` | Hinnasto: Perus 320 € (1 kampanja), Kasvu 490 € (2–4), Kattava 750 € (5–9), Skaala 10+ (sovitaan erikseen); paketit eroavat vain kampanjoiden määrältä; mainosbudjetin alaraja 500 €/kk |
| `google-ads-hallinta/` | Mainossivu Google Ads -kampanjoiden laskeutumissivuksi (noindex, ei navigaatiossa eikä sitemapissa). Hintalaskuri tiedostossa `laskuri.js`: säädettävät arvot `ASETUKSET`-objektissa tiedoston alussa. Oma tyyli `mainos.css`. Lähettää laskelmapyynnöt samaan Apps Script -osoitteeseen. |
| `google-ads-auditointi/` | Google Ads -tilin auditointi |
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
| `/` | Yleiskatsaus: ongelmat, mistä aloitetaan (linkkikortit auditointiin, hintoihin ja oppaisiin), miksi Pikasivut |
| `/google-ads-hinta/` | Paketit ja hinnat (ainoa paikka, jossa paketit kuvataan) |
| `/google-ads-auditointi/` | Google Ads -tilin auditointi |
| `/opas/` | Oppaat |
| `/ukk/` | Usein kysyttyä (ainoa paikka, jossa UKK on, ja siellä FAQPage-schema) |
| `/arvio/` | Ilmainen mainonta-arvio: lomake (yrityksen nimi + sähköposti), tallentuu Google Sheetsiin |
| `/yhteystiedot/` | Yhteystiedot ja mitä kertoa ensimmäisessä viestissä |

Navigaatio (`header()` ja `footer()` generaattorissa) on sama joka sivulla: aktiivinen sivu
korostetaan (`aria-current`), mobiilissa avautuva
valikko, ja jokaisella alasivulla on "Olet täällä" -murupolku. `eng/` on edelleen
yksisivuinen englanninkielinen versio.

## Yhteydenotto

Ensisijainen yhteydenotto on /arvio/-lomake (yrityksen nimi + sähköposti) ja sähköposti. Puhelinnumero 045 850 5051 näkyy vain tiedoksi alatunnisteessa ja yhteystiedoissa: ei tel:-linkkiä, ei soittonappia, ei seurantaa.

Hinnat näkyvät etusivun hintakortissa, `google-ads-hinta/`-sivulla, UKK:ssa ja toimitusehdoissa. **Jos muutat hintoja, päivitä kaikki** (myös `eng/index.html`).

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
Kun Code.gs muuttuu, julkaise uusi versio ENNEN kuin sivusto julkaistaan, muuten lomakkeen lähetykset hylätään.
Biolinkin lähde näkyy, kun käytät osoitetta `pikasivut.com/arvio/?s=tiktok`.

Lomake (`/arvio/` ja `/us/assessment/`) lukee Apps Scriptin vastauksen tavallisella CORS-fetchillä: `ok` näyttää kiitosnäkymän, `invalid` näyttää virheen A (tarkista tiedot) ja kaikki muu (muu vastaus, HTTP-virhe, verkkovirhe tai 20 sekunnin aikakatkaisu, vakio `SEND_TIMEOUT_MS`) virheen B. Virheviestissä on mailto-linkki, johon on esitäytetty yrityksen nimi, joten lähetys ei koskaan vain "onnistu" ilman vahvistusta. Automaattista kiitosta ei enää ole. Apps Scriptin on palautettava tekstit `ok` / `invalid` ja `Access-Control-Allow-Origin: *`, joten älä muuta niitä.

## Logo

`logo-mark.svg` on kuvake (sininen neliö + valkoinen nuoli). Wordmark "Pika" (musta) + "sivut" (sininen) on tekstiä sivun omalla Bricolage-fontilla (`logo()` ja `big_logo()` generaattorissa). Favicon-, apple-touch-, icon-192- ja og-kuvat on renderöity samasta kuvakkeesta.

## English site

`/us/` mirrors the Finnish structure but is written for the US market (USD prices, US examples): `/us/` (home), `/us/audit/`, `/us/pricing/`, `/us/faq/`,
`/us/guides/` (+ 3 guides), `/us/assessment/` (form, same endpoint as `/arvio/`), `/us/contact/`.
Each page has a Finnish counterpart (see `FI_EN` in the generator) with `hreflang` alternates and
an FI/EN switch in the header. Privacy policy and terms exist only in Finnish; the English footer
links to them. The dynamic strings in `site.js` switch by `<html lang>` (object `T`).

EN pricing: Starter $450 (1 campaign), Growth $750 (2–4), Complete $1,150 (5–9), Scale 10+ campaigns (custom pricing); the packages differ only in the number of campaigns; min ad budget $1,500. A toggle on `/us/pricing/` switches to EUR (€320/€490/€750 + 25.5% VAT, for English speakers in Finland). The default currency follows the browser time zone (Europe/Helsinki -> EUR). The EN assessment form posts `market=en` with business name + website and lands in the "Leads EN" sheet. `/us/privacy/` and `/us/terms/` are English drafts that should be reviewed by a lawyer.

Old `/eng/...` URLs are small redirect pages (meta refresh + canonical) to the matching `/us/...` page.
