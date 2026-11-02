# RoyalTeam guildpagina

De website van de World of Warcraft guild **RoyalTeam** op **Silvermoon-EU**.

## Ontwikkelen

Dit project gebruikt [Vite](https://vite.dev) als build tool en dev server, met vanilla JavaScript en [Tailwind CSS](https://tailwindcss.com) (v3).

```bash
npm install       # eenmalig, installeert dependencies
npm run dev       # start de dev server met live reload
npm run build     # bouwt de statische site naar dist/
npm run preview   # preview van de productie-build
```

Deployment naar GitHub Pages (`royal-team.nl`) gebeurt automatisch via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) bij elke push naar `main`.

## Bestanden

- `index.html`, `retail/index.html`, `forever/index.html` — de pagina's (statische HTML met Tailwind-klassen; iconen via een Google Fonts Material Symbols-subset in de `<head>`, voeg een nieuw icoon toe aan `icon_names`)
- `src/styles/main.css` — Tailwind-entry; design tokens (kleuren, fonts, spacing) staan in `tailwind.config.js` en komen uit het Stitch-ontwerp (`src/styles/stitch/design.html`, alleen referentie)
- `src/scripts/main.js` — rendert teamprogress, planning en streamers en regelt het mobiele menu
- `src/data/teams.json` + `progress.json` — teams en door Warcraft Logs gegenereerde progress
- `scripts/generate-icons.mjs` — genereert de favicon/icon-bundel uit `src/assets/images/logo-source.png`

## Inhoud

- Link hub voor Discord, Raider.IO en Warcraft Logs
- Guildstats, raidprogress per team en raidplanning

## Guild links

- Discord: <https://discord.gg/2UTBfxj>
- Raider.IO: <https://raider.io/guilds/eu/silvermoon/RoyalTeam>
- Warcraft Logs: <https://www.warcraftlogs.com/guild/eu/silvermoon/RoyalTeam>
- Recruitment Discord: <https://discord.gg/EQys4YTHCk>

## Raidteams

| Team | Warcraft Logs |
| --- | --- |
| Crusaders | <https://www.warcraftlogs.com/guild/id/744461> |
| Templars | <https://www.warcraftlogs.com/guild/id/816789> |

## Warcraft Logs-data

De raidprogress komt uit Warcraft Logs (v2 API) en wordt gegenereerd door [scripts/fetch-wcl.mjs](scripts/fetch-wcl.mjs):

- `src/data/teams.json` — teams, raidavonden, WCL guild-ID's en `warcraftLogs.zoneIds` (de raids die getoond worden)
- `src/data/progress.json` — gegenereerde kills per team/raid/moeilijkheid; de gecommitte versie is de fallback-snapshot

Eenmalig instellen:

1. Maak een API-client op <https://www.warcraftlogs.com/api/clients> en voeg `WCL_CLIENT_ID` en `WCL_CLIENT_SECRET` toe als GitHub repo secrets (lokaal: een `.env` bestand).
2. Draai `npm run wcl:zones` en zet de ID's van de huidige raid(s) in `zoneIds` in `teams.json`.
3. `npm run wcl:fetch` ververst `progress.json` lokaal. In GitHub Actions gebeurt dit automatisch bij elke deploy en dagelijks om 06:00 UTC; mislukt het, dan blijft de snapshot staan.

## SEO

- Pagina's: `/` (homepage), `/retail/`, `/forever/`, elk met eigen title, description, H1, canonical en Open Graph.
- `public/robots.txt`, `public/sitemap.xml` en `public/404.html` worden mee gedeployed.
- Voeg bij nieuwe pagina's een `rollupOptions.input`-entry toe in `vite.config.js` en een `<url>` in de sitemap.
