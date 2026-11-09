// Haalt het aantal guildleden (roster count) op en schrijft src/data/roster.json.
// Gebruik: node scripts/fetch-roster.mjs
//
// - Retail: publieke Raider.IO API (geen credentials nodig).
// - Forever: officiële Blizzard API, namespace "profile-forever-eu". Vereist BLIZZARD_CLIENT_ID en
//   BLIZZARD_CLIENT_SECRET (env of .env; maak een client op https://develop.battle.net/access/clients).
//   Zonder credentials blijft het bestaande aantal in roster.json staan.
//   Optioneel: BLIZZARD_FOREVER_GUILD_SLUG (standaard "royalteam").
import { readFile, writeFile } from 'node:fs/promises';

try {
  process.loadEnvFile('.env');
} catch {
  // geen .env aanwezig; env-variabelen komen dan uit de omgeving (bijv. GitHub Actions)
}

const ROSTER_PATH = new URL('../src/data/roster.json', import.meta.url);
const RETAIL_URL = 'https://raider.io/api/v1/guilds/profile?region=eu&realm=silvermoon&name=RoyalTeam&fields=members';
const BLIZZARD_TOKEN_URL = 'https://oauth.battle.net/token';
const FOREVER_NAMESPACE = 'profile-forever-eu';

const { BLIZZARD_CLIENT_ID: clientId, BLIZZARD_CLIENT_SECRET: clientSecret } = process.env;
const foreverSlug = process.env.BLIZZARD_FOREVER_GUILD_SLUG || 'royalteam';

const roster = JSON.parse(await readFile(ROSTER_PATH, 'utf8'));
let changed = false;

async function fetchRetailCount() {
  const res = await fetch(RETAIL_URL);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const { members } = await res.json();
  if (!Array.isArray(members) || members.length === 0) throw new Error('lege ledenlijst');
  return members.length;
}

async function fetchForeverCount() {
  const tokenRes = await fetch(BLIZZARD_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) throw new Error(`token ophalen mislukt: ${tokenRes.status}`);
  const { access_token: token } = await tokenRes.json();

  const url = `https://eu.api.blizzard.com/data/wow/guild/${encodeURIComponent(foreverSlug)}/roster?namespace=${FOREVER_NAMESPACE}&locale=en_GB`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`roster ophalen mislukt: ${res.status} (guild-slug "${foreverSlug}")`);
  const { members } = await res.json();
  if (!Array.isArray(members) || members.length === 0) throw new Error('lege ledenlijst');
  return members.length;
}

try {
  const count = await fetchRetailCount();
  roster.retail = { count };
  changed = true;
  console.log(`Retail roster: ${count} characters`);
} catch (error) {
  console.warn(`Retail roster ophalen mislukt (${error.message}): bestaand aantal blijft staan.`);
}

if (clientId && clientSecret) {
  try {
    const count = await fetchForeverCount();
    roster.forever = { count };
    changed = true;
    console.log(`Forever roster: ${count} characters`);
  } catch (error) {
    console.warn(`Forever roster ophalen mislukt (${error.message}): bestaand aantal blijft staan.`);
  }
} else {
  console.warn('BLIZZARD_CLIENT_ID/BLIZZARD_CLIENT_SECRET ontbreken: Forever roster blijft ongewijzigd.');
}

if (changed) {
  roster.updatedAt = new Date().toISOString();
  await writeFile(ROSTER_PATH, `${JSON.stringify(roster, null, 2)}\n`);
  console.log('roster.json bijgewerkt.');
}
