# Pikasivut — landing page

Staattinen myyntisivu nettisivubisnekselle. Ei buildia, ei riippuvuuksia.
Pelkkä HTML + CSS + vanilla JS. Ainoa ulkoinen palvelu on Google Fonts (Inter).

## Tiedostot

| Tiedosto | Sisältö |
| --- | --- |
| `index.html` | Etusivu: nav, hero, esimerkkitarjous, hinnat, UKK, yhteydenotto |
| `styles.css` | Tyylit, mobile-first, breakpointit 700px ja 960px |
| `esimerkkitarjous.pdf` | Oikea, tarjousapilla generoitu esimerkkitarjous (Plus-paketti) |
| `privacy.html` | Tietosuojaseloste |
| `terms.html` | Toimitusehdot |

## Aja paikallisesti

```bash
python3 -m http.server 4322 --directory .
```

Avaa http://localhost:4322

## Yhteydenotto

Sivulla ei ole lomaketta — kaikki CTA:t ovat `tel:` tai `mailto:` -linkkejä.
Tämä on tarkoituksellista: myynti tapahtuu kylmäsoiton/-sähköpostin kautta,
sivu on vain tukimateriaali joka vahvistaa hinnat ja näyttää esimerkin.
Jos otat käyttöön lomakkeen (esim. Formspree), lisää se `#contact`-osioon.

## Hinnat ja tekstit

Kaikki hinnat, aikataulut ja ehdot on kopioitu suoraan tiedostosta
[`tarjousappi/server/config/profile.fi.js`](../tarjousappi/server/config/profile.fi.js).
**Jos muutat hintoja tai ehtoja tarjousapissa, päivitä ne myös tänne** —
muuten sivu lupaa jotain mitä oikea tarjous ei vastaa.

## Esimerkkitarjouksen päivitys

```bash
cd ../tarjousappi
node --input-type=module -e "
import fs from 'node:fs';
const { buildTarjous } = await import('./server/lib/pdf-tarjous.js');
const bytes = await buildTarjous({
  asiakasNimi: 'Kyläsaaren Autohuolto Oy', yhteyshenkilo: 'Matti Virtanen',
  asiakasYtunnus: '1234567-8', asiakasOsoite: 'Esimerkkitie 1, 00100 Helsinki',
  asiakasPuhelin: '040 123 4567', asiakasEmail: 'matti@autohuolto.fi',
  paketti: 'plus', hostaus: 10, tarjousNro: 'ESIMERKKI', paivays: '2026-08-20', lisateksti: '',
});
fs.writeFileSync('../pikasivut-landing/esimerkkitarjous.pdf', bytes);
"
```

## Deploy GitHub Pagesiin

```bash
gh repo create pikasivut-landing --public --source=. --push
```

Sitten repossa: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
