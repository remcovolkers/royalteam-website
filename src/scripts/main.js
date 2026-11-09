import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel-decorative/700.css';
import '../styles/main.css';
import teamsData from '../data/teams.json';
import progressData from '../data/progress.json';
import streamersData from '../data/streamers.json';
import rosterData from '../data/roster.json';

const DIFFICULTIES = {
  normal: { label: 'Normal', text: 'text-secondary-fixed', bar: 'bg-secondary-fixed' },
  heroic: { label: 'Heroic', text: 'text-primary', bar: 'bg-primary-container' },
  mythic: { label: 'Mythic', text: 'text-secondary', bar: 'bg-secondary' },
};

const TEAM_ICONS = {
  crusaders: 'military_tech',
  templars: 'shield',
  'social-raid': 'groups',
};

// Voegt de statische teamgegevens (teams.json) samen met de door Warcraft Logs gegenereerde progress (progress.json).
function mergeTeams() {
  return teamsData.teams.map((team) => ({
    ...team,
    raids: progressData.teams[team.id]?.raids ?? [],
  }));
}

function renderProgressUpdated() {
  const el = document.querySelector('#progress-updated');
  if (!el || !progressData.updatedAt) return;

  const date = new Date(progressData.updatedAt);
  if (Number.isNaN(date.getTime())) return;

  el.textContent = `Laatst bijgewerkt op ${date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  el.closest('[data-updated-wrapper]')?.classList.remove('hidden');
}

function renderDifficultyBars(difficulties) {
  return Object.entries(difficulties)
    .map(([difficulty, { killed, total }]) => {
      const style = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal;
      const pct = total ? Math.round((killed / total) * 100) : 0;
      const cleared = total > 0 && killed === total ? ' (Cleared)' : '';
      return `
        <div class="flex flex-col gap-1">
          <div class="flex justify-between font-label-sm text-label-sm">
            <span class="text-on-surface">${style.label}</span>
            <span class="${style.text} font-bold">${killed} / ${total}${cleared}</span>
          </div>
          <div class="w-full h-2.5 rounded bg-surface-container-highest overflow-hidden" role="progressbar" aria-label="${style.label} progress" aria-valuenow="${killed}" aria-valuemin="0" aria-valuemax="${total}">
            <div class="h-full ${style.bar} rounded transition-all duration-700" style="width: ${pct}%"></div>
          </div>
        </div>`;
    })
    .join('');
}

const isPaused = (team) => team.status === 'paused';
const pausedNote = (team) => team.statusNote || 'Gepauzeerd';

const WEEKDAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

function sortSchedule(schedule) {
  return [...schedule].sort((a, b) => WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day));
}

// Groepeert dagen met dezelfde tijd: "Maandag & Woensdag 20:00 - 23:00"
function formatSchedule(schedule) {
  const byTime = new Map();
  for (const slot of sortSchedule(schedule)) {
    byTime.set(slot.time, [...(byTime.get(slot.time) ?? []), slot.day]);
  }
  return [...byTime].map(([time, days]) => `${days.join(' &amp; ')} ${time}`).join(' &middot; ');
}

function renderTeams(teams) {
  const grid = document.querySelector('#teams-grid');
  if (!grid) return;

  grid.innerHTML = teams
    .map((team) => {
      const raids = team.raids
        .map(
          (raid) => `
            <div class="flex flex-col gap-space-md">
              <div class="p-space-sm bg-surface-container rounded">
                <span class="font-label-sm text-label-sm text-on-surface-variant block uppercase text-[10px]">Raid</span>
                <span class="font-headline-sm text-headline-sm text-on-surface">${raid.name}</span>
              </div>
              ${renderDifficultyBars(raid.difficulties)}
            </div>`,
        )
        .join('');
      const raidContent = raids || '<p class="font-body-sm text-body-sm text-on-surface-variant">Nog geen raidprogress beschikbaar.</p>';
      const paused = isPaused(team);
      const badge = paused
        ? `<span class="inline-flex items-center gap-1 mt-space-xs px-space-sm py-0.5 rounded bg-surface-container-highest text-secondary font-label-sm text-label-sm uppercase tracking-wider"><span class="material-symbols-outlined text-[14px]" aria-hidden="true">pause_circle</span>${pausedNote(team)}</span>`
        : '';
      const scheduleText = paused ? pausedNote(team) : formatSchedule(team.schedule);
      const description = team.description ? `<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">${team.description}</p>` : '';

      return `
        <article class="flex flex-col p-space-lg rounded-xl bg-surface-container-low shadow-xl${paused ? ' opacity-70' : ''}">
          <div class="flex items-start justify-between gap-space-md pb-space-md">
            <div>
              <h3 class="font-headline-lg text-headline-lg text-primary">${team.name}</h3>
              ${description}
              ${badge}
            </div>
            <span class="material-symbols-outlined text-primary text-[28px]" aria-hidden="true">${TEAM_ICONS[team.id] ?? 'military_tech'}</span>
          </div>
          <div class="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
            <span class="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">calendar_clock</span>
            <span>${scheduleText}</span>
          </div>
          <div class="flex flex-col gap-space-lg mb-space-xl flex-1">${raidContent}</div>
          <a class="inline-flex items-center justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-sm text-label-sm uppercase tracking-wider transition-colors" href="${team.warcraftLogsUrl}" target="_blank" rel="noopener noreferrer">
            <span>Warcraft Logs</span>
            <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
          </a>
        </article>`;
    })
    .join('');
}

function renderSchedule(teams) {
  const body = document.querySelector('#schedule-body');
  if (!body) return;

  body.innerHTML = teams
    .flatMap((team) =>
      isPaused(team)
        ? [{ team: team.name, id: team.id, paused: true, note: pausedNote(team) }]
        : sortSchedule(team.schedule).map((slot) => ({ team: team.name, id: team.id, ...slot })),
    )
    .map(
      (row, index) => `
        <tr class="hover:bg-surface-container transition-colors${index % 2 ? ' bg-surface-container-lowest/40' : ''}">
          <td class="py-space-md px-space-lg">
            <div class="flex items-center gap-space-sm">
              <span class="material-symbols-outlined text-primary text-[20px]" aria-hidden="true">${TEAM_ICONS[row.id] ?? 'military_tech'}</span>
              <span class="font-headline-sm text-headline-sm text-primary">${row.team}</span>
            </div>
          </td>
          ${
            row.paused
              ? `<td class="py-space-md px-space-lg font-semibold text-secondary" colspan="2"><span class="inline-flex items-center gap-1"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">pause_circle</span>${row.note}</span></td>`
              : `<td class="py-space-md px-space-lg font-semibold text-on-surface">${row.day}</td>
          <td class="py-space-md px-space-lg font-mono text-on-surface-variant whitespace-nowrap">${row.time}</td>`
          }
        </tr>`,
    )
    .join('');
}

// Twitch controleert de "parent" query-param tegen het domein dat de pagina embedt.
function renderStreamers(streamers) {
  const grid = document.querySelector('#streamers-grid');
  if (!grid) return;

  const parent = window.location.hostname;

  grid.innerHTML = streamers
    .map(
      (streamer) => `
        <article class="rounded-xl bg-surface-container-low overflow-hidden shadow-xl flex flex-col group">
          <div class="relative w-full aspect-video bg-surface-container overflow-hidden">
            <iframe
              class="absolute inset-0 w-full h-full"
              src="https://player.twitch.tv/?channel=${streamer.channel}&parent=${parent}&muted=true&autoplay=false"
              title="Twitch-stream van ${streamer.name}"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
          <div class="p-space-md flex items-center justify-between gap-space-md">
            <h3 class="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">${streamer.name}</h3>
            <a class="inline-flex shrink-0 items-center gap-space-xs text-primary hover:text-primary-fixed font-label-sm text-label-sm uppercase tracking-wider transition-colors" href="${streamer.url}" target="_blank" rel="noopener noreferrer">
              <span>Twitch</span>
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            </a>
          </div>
        </article>`,
    )
    .join('');
}

// Toont het aantal guildleden (roster.json). Elk element met data-roster-tile="retail|forever" blijft verborgen
// totdat er een geldig aantal is; data-roster-show bevat de display-klasse die dan wordt toegevoegd (bijv. "flex").
function renderRoster() {
  for (const tile of document.querySelectorAll('[data-roster-tile]')) {
    const count = rosterData[tile.dataset.rosterTile]?.count;
    if (!Number.isInteger(count) || count <= 0) continue;
    for (const el of tile.querySelectorAll('[data-roster-count]')) el.textContent = count.toLocaleString('nl-NL');
    tile.classList.remove('hidden');
    if (tile.dataset.rosterShow) tile.classList.add(tile.dataset.rosterShow);
  }

  // Wrapper met meerdere tegels (homepage): pas tonen als minstens één tegel zichtbaar is.
  for (const group of document.querySelectorAll('[data-roster-group]')) {
    if (group.querySelector('[data-roster-tile]:not(.hidden)')) {
      group.classList.remove('hidden');
      group.classList.add('flex');
    }
  }
}

// Verbergt de scroll-hint op de homepage zodra de bezoeker begint te scrollen.
function initScrollHint() {
  const hint = document.querySelector('#scroll-hint');
  if (!hint) return;

  const update = () => {
    const hidden = window.scrollY > 40;
    hint.classList.toggle('opacity-0', hidden);
    hint.classList.toggle('pointer-events-none', hidden);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function initMobileNav() {
  const toggle = document.querySelector('#nav-toggle');
  const panel = document.querySelector('#mobile-nav');
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.material-symbols-outlined').textContent = open ? 'close' : 'menu';
  };

  toggle.addEventListener('click', () => setOpen(panel.classList.contains('hidden')));
  panel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
}

document.addEventListener('DOMContentLoaded', () => {
  const teams = mergeTeams();
  renderTeams(teams);
  renderSchedule(teams);
  renderProgressUpdated();
  renderRoster();
  renderStreamers(streamersData.streamers);
  initMobileNav();
  initScrollHint();
});
