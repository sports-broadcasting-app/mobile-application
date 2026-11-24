/**
 * Cloudflare Worker "onde-passa-trigger": decides when the "Match data"
 * workflow runs, from the schedule already published. GitHub's own cron is
 * best effort (it ran this repo only every 6-9 hours); Cloudflare cron
 * triggers fire on time.
 *
 * Every 5 minutes it reads the published snapshot and dispatches:
 * - mode "full" at 06:00 Brasília (09:00 UTC): schedule, standings,
 *   broadcasters and the daily full refresh, for the whole day;
 * - mode "live" during game windows (30 min before kickoff until 30 min after
 *   the expected end, or while a game is live), about every 10 minutes, only
 *   for the competitions with a game in the window;
 * - nothing otherwise.
 * The window rule mirrors scripts/schedule.ts; keep both in sync.
 *
 * Setup (dashboard): Workers & Pages → onde-passa-trigger → Edit code → paste
 * this file → Deploy. Settings → Variables and Secrets → secret GITHUB_TOKEN
 * (fine-grained token, only this repository, "Actions: Read and write").
 * Settings → Trigger Events → Cron Trigger "*\/5 * * * *".
 */

const WORKFLOW_URL =
  'https://api.github.com/repos/sports-broadcasting-app/mobile-application/actions/workflows/data.yml/dispatches';
const SNAPSHOT_URL = 'https://dados.onde-passa.app/onde-passa.json';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
/** 06:00 in Brasília (UTC-3, no daylight saving since 2019). */
const MORNING_UTC_HOUR = 9;
/**
 * A live run starts when the published file is this old. A run takes about
 * 2 minutes from dispatch to publish, so 8 minutes gives one every ~10.
 */
const LIVE_MIN_AGE_MS = 8 * MINUTE_MS;
/** Without a morning run for this long (Worker down at 09:00), run one. */
const MISSED_MORNING_MS = 26 * HOUR_MS;
const WINDOW_MARGIN_MS = 30 * MINUTE_MS;
const MATCH_LENGTH_MS = {
  volei: 2.5 * HOUR_MS,
  futebol: 2.5 * HOUR_MS,
  'futebol-americano': 4 * HOUR_MS,
  basquete: 3 * HOUR_MS,
};

/** Whether a game is live or around its kickoff (mirror of scripts/schedule.ts). */
function inLiveWindow(match, sport, now) {
  if (match.status === 'live') return true;
  if (match.status === 'postponed' || match.status === 'finished') {
    return false;
  }
  const start = Date.parse(match.startsAt);
  const length = MATCH_LENGTH_MS[sport] ?? 3 * HOUR_MS;
  return (
    now >= start - WINDOW_MARGIN_MS && now <= start + length + WINDOW_MARGIN_MS
  );
}

/** Live games marked finished by the clock but still without a score. */
function waitingForScore(match, sport, now) {
  if (match.status !== 'finished' || match.homeScore !== null) return false;
  const end =
    Date.parse(match.startsAt) + (MATCH_LENGTH_MS[sport] ?? 3 * HOUR_MS);
  return now <= end + 3 * HOUR_MS;
}

/** What to run now: { mode, competitions } or null. Exported for tests. */
export function decide(snapshot, now) {
  const date = new Date(now);
  if (date.getUTCHours() === MORNING_UTC_HOUR && date.getUTCMinutes() < 5) {
    return { mode: 'full', competitions: '' };
  }
  if (!snapshot) {
    // File unreadable: a full run every half hour until it is back.
    return date.getUTCMinutes() % 30 < 5
      ? { mode: 'full', competitions: '' }
      : null;
  }
  const age = now - Date.parse(snapshot.generatedAt);
  if (!(age < MISSED_MORNING_MS)) return { mode: 'full', competitions: '' };

  const live = snapshot.competitions
    .filter((c) =>
      c.matches.some(
        (m) =>
          inLiveWindow(m, c.sport, now) || waitingForScore(m, c.sport, now),
      ),
    )
    .map((c) => c.slug);
  if (live.length > 0 && age >= LIVE_MIN_AGE_MS) {
    return { mode: 'live', competitions: live.join(',') };
  }
  return null;
}

async function loadSnapshot() {
  try {
    // A query string skips the 5-minute edge cache: the age must be exact.
    const response = await fetch(`${SNAPSHOT_URL}?t=${Date.now()}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function dispatch(env, { mode, competitions }) {
  const response = await fetch(WORKFLOW_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'onde-passa-trigger',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main', inputs: { mode, competitions } }),
  });
  // 204 means the run was queued. Anything else lands in the Worker logs;
  // 401 usually means the token expired.
  if (response.status !== 204) {
    throw new Error(
      `GitHub answered ${response.status}: ${await response.text()}`,
    );
  }
  console.log(`dispatched ${mode}${competitions ? ` (${competitions})` : ''}`);
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        const decision = decide(await loadSnapshot(), event.scheduledTime);
        if (decision) await dispatch(env, decision);
      })(),
    );
  },
  // The Worker has no public use; its URL only says so.
  async fetch() {
    return new Response('Not found', { status: 404 });
  },
};
