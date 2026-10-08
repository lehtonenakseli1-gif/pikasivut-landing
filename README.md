# Pikasivut — landing page

Staattinen myyntisivu nettisivubisnekselle. Ei buildia, ei riippuvuuksia.
Pelkkä HTML + CSS + vanilla JS. Ei ulkoisia palveluita: Inter-fontti on hostattu itse (`inter-latin.woff2`).

## Tiedostot

| Tiedosto | Sisältö |
| --- | --- |
| `index.html` | Etusivu: nav, hero, palvelut, vaiheet, yhteydenotto |
| `site.css` | Alasivujen yhteiset tyylit (kopio etusivun tyyleistä + artikkelityylit) |
| `google-ads-hinta/` | Hinnasto: Perus 300, Kasvu 500, Kattava 750 €/kk, mainosbudjetti vähintään 1 000 €/kk |
| `google-ads-auditointi/` | Google Ads -tilin auditointi |
| `google-ads-siivousyritykselle/`, `google-ads-autokorjaamolle/`, `google-ads-remonttiyritykselle/` | Toimialasivut |
| `opas/` | Oppaat (hakemisto + 3 artikkelia) |
| `404.html` | Virhesivu (noindex) |
| `styles.css` | Vain `privacy.html`:n ja `terms.html`:n tyylit. Etusivu ja `eng/` käyttävät inline-tyylejä |
| `esimerkkitarjous.pdf` | Tarjousapilla generoitu esimerkki. Ei enää linkitetty sivulta — säilytetty tiedostojärjestelmässä, jos tarvitset sitä myöhemmin |
| `privacy.html` | Tietosuojaseloste |
| `terms.html` | Toimitusehdot |

## Aja paikallisesti

```bash
python3 -m http.server 4322 --directory .
```

Avaa http://localhost:4322

## Yhteydenotto

Lomake rakentaa JavaScriptillä `mailto:`-linkin (aihe ja viesti valmiiksi täytettynä)
ja näyttää sähköpostiosoitteen ja puhelinnumeron varalle, jos sähköpostiohjelma ei
aukea. Hinnat näkyvät etusivun #hinnat-osiossa, `google-ads-hinta/`-sivulla, UKK:ssa ja toimitusehdoissa. **Jos muutat hintoja, päivitä kaikki neljä** (sekä `eng/index.html`). Jos haluat oikean
lomakepalvelun (esim. Formspree), vaihda `form.contact-form`in käsittelijä
`index.html`:ssä ja `eng/index.html`:ssä.

## Deploy GitHub Pagesiin

```bash
gh repo create pikasivut-landing --public --source=. --push
```

Sitten repossa: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.

## Uusi alasivu

Alasivut ovat tavallista HTML:ää: kopioi lähin olemassa oleva sivu kansioineen,
vaihda title, description, canonical, og-tagit, murupolku ja sisältö, ja lisää
osoite `sitemap.xml`:ään sekä footerin linkkilistaan.
