// Haalt raidprogress per team op via de Warcraft Logs v2 API en schrijft src/data/progress.json.
// Gebruik: node scripts/fetch-wcl.mjs [--zones]
// Vereist WCL_CLIENT_ID en WCL_CLIENT_SECRET (env of .env). Zonder credentials blijft de bestaande snapshot staan.
import { readFile, writeFile } from 'node:fs/promises';

try {
  process.loadEnvFile('.env');
} catch {
  // geen .env aanwezig; env-variabelen komen dan uit de omgeving (bijv. GitHub Actions)
}

const TOKEN_URL = 'https://www.warcraftlogs.com/oauth/token';
const API_URL = 'https://www.warcraftlogs.com/api/v2/client';
const TEAMS_PATH = new URL('../src/data/teams.json', import.meta.url);
const PROGRESS_PATH = new URL('../src/data/progress.json', import.meta.url);
const DIFFICULTIES = { 3: 'normal', 4: 'heroic', 5: 'mythic' };
const MAX_REPORT_PAGES = 30;

const { WCL_CLIENT_ID: clientId, WCL_CLIENT_SECRET: clientSecret } = process.env;

if (!clientId || !clientSecret) {
  console.warn('WCL_CLIENT_ID/WCL_CLIENT_SECRET ontbreken: progress.json blijft ongewijzigd.');
  process.exit(0);
}

async function getToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Token ophalen mislukt: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

const token = await getToken();

async function gql(query, variables = {}) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(`WCL API-fout: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.data;
}

if (process.argv.includes('--zones')) {
  const data = await gql('{ worldData { expansions { id name zones { id name } } } }');
  for (const expansion of data.worldData.expansions) {
    console.log(`\n${expansion.name}`);
    for (const zone of expansion.zones) console.log(`  ${zone.id}\t${zone.name}`);
  }
  process.exit(0);
}

const config = JSON.parse(await readFile(TEAMS_PATH, 'utf8'));
const zoneIds = config.warcraftLogs.zoneIds;

if (zoneIds.length === 0) {
  console.warn('Geen zoneIds ingesteld in src/data/teams.json: progress.json blijft ongewijzigd. Draai "npm run wcl:zones" voor de beschikbare ID\'s.');
  process.exit(0);
}

async function getZone(id) {
  const data = await gql('query ($id: Int!) { worldData { zone(id: $id) { id name encounters { id } } } }', { id });
  return data.worldData.zone;
}

async function getKills(guildID, zoneID) {
  const kills = { normal: new Set(), heroic: new Set(), mythic: new Set() };
  for (let page = 1; page <= MAX_REPORT_PAGES; page++) {
    const data = await gql(
      `query ($guildID: Int!, $zoneID: Int!, $page: Int!) {
        reportData {
          reports(guildID: $guildID, zoneID: $zoneID, limit: 100, page: $page) {
            has_more_pages
            data { fights(killType: Kills) { encounterID difficulty } }
          }
        }
      }`,
      { guildID, zoneID, page },
    );
    const { data: reports, has_more_pages: hasMore } = data.reportData.reports;
    for (const report of reports) {
      for (const fight of report.fights ?? []) {
        const difficulty = DIFFICULTIES[fight.difficulty];
        if (difficulty) kills[difficulty].add(fight.encounterID);
      }
    }
    if (!hasMore) break;
  }
  return kills;
}

const zones = [];
for (const id of zoneIds) {
  const zone = await getZone(id);
  if (!zone) throw new Error(`Zone ${id} niet gevonden`);
  if (zone.encounters.length === 0) {
    console.warn(`Zone ${id} (${zone.name}) heeft nog geen encounters in Warcraft Logs en wordt overgeslagen.`);
    continue;
  }
  zones.push(zone);
}

const progress = { updatedAt: new Date().toISOString(), teams: {} };

for (const team of config.teams) {
  const raids = [];
  for (const zone of zones) {
    const kills = await getKills(team.warcraftLogsGuildId, zone.id);
    const encounterIds = new Set(zone.encounters.map((e) => e.id));
    const total = encounterIds.size;
    const difficulties = {};
    for (const difficulty of Object.keys(kills)) {
      const killed = [...kills[difficulty]].filter((id) => encounterIds.has(id)).length;
      difficulties[difficulty] = { killed, total };
    }
    raids.push({ name: zone.name, difficulties });
  }
  progress.teams[team.id] = { raids };
  console.log(`${team.name}: ${raids.map((r) => `${r.name} ${JSON.stringify(r.difficulties)}`).join(' | ')}`);
}

await writeFile(PROGRESS_PATH, `${JSON.stringify(progress, null, 2)}\n`);
console.log('progress.json bijgewerkt.');
