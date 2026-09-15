Plaats hier het logo (bijv. logo.png) en eventuele andere afbeeldingen.
Verwijs er in HTML/CSS naar via het pad "/src/assets/images/<bestandsnaam>".

## Icon-bundel genereren (favicons, touch-icons, social)

1. Plaats een hi-res bronbestand (bij voorkeur vierkant, min. 512x512) als `logo-source.png` in deze map.
2. Run `npm run generate:icons`.
3. Het script (`scripts/generate-icons.mjs`) genereert PNG's op 16, 32, 48, 180, 192, 400 en 512px in `public/icons/`.
4. Verwijs in `index.html` naar de gewenste formaten, bijv.:

```html
<link rel="icon" type="image/png" sizes="32x32" href="/icons/logo-32x32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/icons/logo-180x180.png" />
```

Pas de `SIZES`-array in het script aan als je andere afmetingen nodig hebt.
