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

## ⚠️ Hinnat EIVÄT enää täsmää tarjousappiin

Tämän sivun hinnoittelumalli (59 / 99 / 199 €, hosting ja verkkotunnus
sisältyy) **poikkeaa** siitä mitä
[`tarjousappi/server/config/profile.fi.js`](../tarjousappi/server/config/profile.fi.js)
tällä hetkellä generoi (89 / 130 / 250 €, hosting +10 €/kk erillisenä rivinä).

Jos lähetät oikean tarjouksen tarjousapilla ennen kuin päivität profiilin,
asiakas saa eri hinnan kuin mitä tällä sivulla luki. **Päivitä
`profile.fi.js` vastaamaan tätä sivua ennen kuin käytät sitä oikeisiin
asiakkaisiin**, tai kysy Claudelta apua siihen.

## Deploy GitHub Pagesiin

```bash
gh repo create pikasivut-landing --public --source=. --push
```

Sitten repossa: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
