import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel-decorative/700.css';
import '../styles/main.scss';
import progressData from '../data/progress.json';
import warcraftLogsIcon from '../assets/icons/warcraftlogs.png';

const DIFFICULTY_LABELS = {
  normal: 'Normal',
  heroic: 'Heroic',
  mythic: 'Mythic',
};

function renderDifficultyBars(difficulties) {
  return Object.entries(difficulties)
    .map(([difficulty, { killed, total }]) => {
      const pct = total ? Math.round((killed / total) * 100) : 0;
      return `
        <div class="progress-row">
          <span class="progress-label">${DIFFICULTY_LABELS[difficulty] ?? difficulty}</span>
          <div class="progress-bar" role="progressbar" aria-valuenow="${killed}" aria-valuemin="0" aria-valuemax="${total}">
            <div class="progress-bar__fill progress-bar__fill--${difficulty}" style="width: ${pct}%"></div>
          </div>
          <span class="progress-count">${killed}/${total}</span>
        </div>`;
    })
    .join('');
}

function renderTeams(teams) {
  const grid = document.querySelector('#teams-grid');
  if (!grid) return;

  // teams met minder raidavonden krijgen onzichtbare vulregels, zodat de WCL-link overal even hoog uitkomt
  const maxScheduleRows = Math.max(...teams.map((team) => team.schedule.length));

  grid.innerHTML = teams
    .map((team) => {
      const raidBlocks = team.raids
        .map(
          (raid) => `
            <div class="raid-progress">
              <h4 class="raid-progress__title">${raid.name}</h4>
              ${renderDifficultyBars(raid.difficulties)}
            </div>`,
        )
        .join('');

      const scheduleRows = team.schedule
        .map(
          (s) =>
            `<span class="team-card__schedule-day">${s.day}</span><span class="team-card__schedule-time">${s.time}</span>`,
        )
        .join('');
      const paddingRows = '<span aria-hidden="true">&nbsp;</span><span aria-hidden="true">&nbsp;</span>'.repeat(
        maxScheduleRows - team.schedule.length,
      );
      const description = team.description ? `<p class="team-card__desc">${team.description}</p>` : '';

      return `
        <article class="card team-card">
          <header class="team-card__header">
            <h3>${team.name}</h3>
          </header>
          ${description}
          <div class="raid-progress-list">
            ${raidBlocks}
          </div>
          <footer class="team-card__footer">
            <div class="team-card__schedule">
              ${scheduleRows}${paddingRows}
            </div>
            <a class="team-card__wcl-link" href="${team.warcraftLogsUrl}" target="_blank" rel="noopener noreferrer">
              <img src="${warcraftLogsIcon}" alt="" width="18" height="18" />
              Warcraft Logs &rarr;
            </a>
          </footer>
        </article>`;
    })
    .join('');
}

function renderSchedule(teams) {
  const body = document.querySelector('#schedule-body');
  if (!body) return;

  body.innerHTML = teams
    .flatMap((team) => team.schedule.map((slot) => ({ team: team.name, ...slot })))
    .map((row) => `<tr><td>${row.team}</td><td>${row.day}</td><td>${row.time}</td></tr>`)
    .join('');
}

function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-group');

  if (!('IntersectionObserver' in window) || revealEls.length === 0) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
  );

  revealEls.forEach((el) => observer.observe(el));
}

const HEADER_REVEAL_OFFSET = 40;

function initHeaderReveal() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;

  const syncHeader = () => {
    header.classList.toggle('is-visible', window.scrollY > HEADER_REVEAL_OFFSET);
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(syncHeader);
        ticking = true;
      }
    },
    { passive: true },
  );

  syncHeader();
}

document.addEventListener('DOMContentLoaded', () => {
  renderTeams(progressData.teams);
  renderSchedule(progressData.teams);
  // Reveal groups are populated dynamically, so observe them after render.
  initScrollReveal();
  initHeaderReveal();
});

