# Pikasivut — landing page

Staattinen myyntisivu nettisivubisnekselle. Ei buildia, ei riippuvuuksia.
Pelkkä HTML + CSS + vanilla JS. Ainoa ulkoinen palvelu on Google Fonts (Inter).

## Tiedostot

| Tiedosto | Sisältö |
| --- | --- |
| `index.html` | Etusivu: nav, hero, hinnat, UKK, yhteydenotto |
| `styles.css` | Tyylit, mobile-first, breakpointit 700px ja 960px |
| `esimerkkitarjous.pdf` | Tarjousapilla generoitu esimerkki. Ei enää linkitetty sivulta — säilytetty tiedostojärjestelmässä, jos tarvitset sitä myöhemmin |
| `privacy.html` | Tietosuojaseloste |
| `terms.html` | Toimitusehdot |

## Aja paikallisesti

```bash
python3 -m http.server 4322 --directory .
```

Avaa http://localhost:4322

## Yhteydenotto

Sivulla ei ole lomaketta eikä puhelinnumeroa — kaikki CTA:t ovat `mailto:`-linkkejä.
Myynti tapahtuu kylmäsähköpostin kautta, sivu on tukimateriaali joka vahvistaa
hinnat. Jos otat käyttöön lomakkeen (esim. Formspree), lisää se `#contact`-osioon.

## Hinnat täsmäävät tarjousappiin

Tämän sivun hinnoittelumalli (59 / 99 / 199 €, hosting ja verkkotunnus
sisältyy, ei erillistä muutostyökiintiötä) on sama kuin
[`tarjousappi/server/config/profile.fi.js`](../tarjousappi/server/config/profile.fi.js):ssä.
**Jos muutat hintoja jompaankumpaan, päivitä myös toinen** — muuten sivu
lupaa jotain mitä oikea tarjous ei enää vastaa.

## Deploy GitHub Pagesiin

```bash
gh repo create pikasivut-landing --public --source=. --push
```

Sitten repossa: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
