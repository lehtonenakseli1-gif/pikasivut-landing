# Pikasivut — landing page

Staattinen myyntisivu nettisivubisnekselle. Ei buildia, ei riippuvuuksia.
Pelkkä HTML + CSS + vanilla JS. Tekstit me-muodossa (yritys, ei minä), eikä palvelua kohdenneta erikseen pk-yrityksille. Ei ulkoisia palveluita: fontit on hostattu itse (`fonts/`).

## Tiedostot

| Tiedosto | Sisältö |
| --- | --- |
| `index.html` | Etusivu: nav, hero, palvelut, vaiheet, yhteydenotto |
| `site.css` | Koko sivuston tyylit (Hakukenttä-teema). Kaikki sivut käyttävät tätä |
| `site.js` | Liikkuvat osat: kirjoittava hakukenttä, hakupillerit, korostuskynä, kallistuvat kortit, +1 klikkaus, hiiren väripisteet, Kokeilen onneani, tynnyrikierre (logo 5× tai haku "barrel roll"). Alasivuilla: budjettilaskuri ja klikkihintanauha (hinta), suodatin ja hakutermitaulu (auditointi), pyörivät tarrat ja teipit (toimialat), itsetarkistus, negatiivipeli, konversioterminaali ja XP-palkki (oppaat), GAME OVER (404) |
| `fonts/` | Itse hostatut fontit: Bricolage Grotesque, Figtree, DM Mono |
| `google-ads-hinta/` | Hinnasto: Perus 300, Kasvu 500, Kattava 750 €/kk, mainosbudjetti vähintään 1 000 €/kk |
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
