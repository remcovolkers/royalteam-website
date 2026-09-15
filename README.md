# RoyalTeam guildpagina

De website van de World of Warcraft guild **RoyalTeam** op **Silvermoon-EU**.

## Ontwikkelen

Dit project gebruikt [Vite](https://vite.dev) als build tool en dev server, met vanilla JavaScript en SCSS.

```bash
npm install       # eenmalig, installeert dependencies
npm run dev       # start de dev server met live reload
npm run build     # bouwt de statische site naar dist/
npm run preview   # preview van de productie-build
```

Deployment naar GitHub Pages (`royal-team.nl`) gebeurt automatisch via [.github/workflows/deploy.yml](.github/workflows/deploy.yml) bij elke push naar `main`.

## Bestanden

- `index.html` — de pagina-inhoud
- `src/styles/` — SCSS, opgesplitst in `_variables`, `_base`, `_animations` en `_components`
- `src/scripts/main.js` — rendert de teamprogress/planning en regelt de scroll-animaties
- `src/data/progress.json` — statische progressdata voor de Crusaders en Templars raidteams
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

De progress in `src/data/progress.json` is momenteel handmatig bijgewerkt. Zie de sectie hieronder voor het plan om dit te automatiseren.

## Idee: automatische progress-data

Warcraft Logs vereist OAuth (client id/secret) voor de v2 GraphQL API, dus een secret kan niet vanuit de browser worden aangeroepen op een statische site. Voorstel:

1. Een geplande GitHub Action (bijv. dagelijks, `schedule` trigger) draait een Node-script dat met `WCL_CLIENT_ID`/`WCL_CLIENT_SECRET` (repo secrets) de laatste kills/progress ophaalt via de Warcraft Logs API.
2. Het script schrijft de resultaten naar `src/data/progress.json` en commit dit terug (of maakt een PR).
3. De bestaande `deploy.yml`-workflow bouwt en publiceert de site zoals gebruikelijk.

Voor eenvoudigere guild-brede stats (zonder OAuth) kan de publieke [Raider.IO API](https://raider.io/api) eventueel zelfs direct client-side aangeroepen worden, al ondersteunt die geen onderverdeling per raidteam.
