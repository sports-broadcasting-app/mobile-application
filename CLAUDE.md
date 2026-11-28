# Where to Watch - Mobile Application

## Project Overview

A React Native (Expo) mobile application that shows where Superliga volleyball matches (men's and women's), Brasileirão Série A football matches, NFL and NBA games and Formula 1 sessions are broadcast, with day matches and standings. There is no login and no backend: the app downloads a static JSON on first run and keeps everything on the device in SQLite.

## Tech Stack

- **Framework**: React Native with Expo SDK 58
- **Language**: TypeScript (`strict`, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`); no casts outside tests
- **Navigation**: Expo Router (file-based routing with tabs + stack-over-tabs)
- **Package Manager**: Yarn (do NOT use npm)
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint 9 (flat config) with TypeScript, React, React Native, and Prettier plugins
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged (runs ESLint + Prettier on pre-commit)
- **Icons**: `Icon` (`src/shared/ui/Icon.tsx`, `react-native-svg`): the Material Design Icons the app uses, as 24 pt paths in `icons.ts` (no icon font)
- **Local storage**: `expo-sqlite` (matches, standings, teams, favorites)

## Project Structure

```
.
├── app/                        # Expo Router routes only, each re-exporting a page (`@/pages/...`)
│   ├── _layout.tsx             # Providers, gates, root Stack
│   ├── (tabs)/                 # Jogos, Classificacao, Configuracoes
│   └── match/[id].tsx, grand-prix/[id].tsx, transferencias.tsx
├── src/                        # Feature-Sliced Design, see Architecture
│   ├── app/                    # start-up and layouts: AnimatedSplash, SyncGate, OnboardingGate, ErrorBoundary, NotificationResponder, TabsLayout
│   ├── pages/                  # home, match, grand-prix, standings, transfers, settings, onboarding
│   ├── features/               # follow-competitions, pick-team, reminders, watch-match, choose-theme, ads
│   ├── entities/               # competition, team, match, session, broadcast
│   ├── shared/                 # ui (AppText, Card, rows, sheets…), theme, api (snapshot contract, SQLite, queries, sync), lib, config
│   └── test/                   # test helpers: utils (render with providers), fixtures, sqlite mock, setup
├── scripts/collect.ts          # Collector entry point: writes onde-passa.json and the legacy superliga.json
├── scripts/source.ts           # SourceIO: network or saved pages for every collector
├── scripts/periodScores.ts     # engine for score APIs (apiSports/, bigBalls/ are providers)
├── scripts/superliga/          # CBV parser for both Superligas, curated transfers
├── scripts/brasileirao/        # ge parser for the Brasileirão Série A
├── scripts/multisport/         # ge "multisport" pages (standings page + matches GraphQL), shared by NFL and NBA
├── scripts/nfl/, scripts/nba/  # league configs for the multisport collector
├── scripts/f1/                 # Formula 1 sessions from the ge agenda GraphQL (published in `series`)
├── infra/cloudflare/           # the data trigger Worker
└── .github/workflows/          # Scheduled collector, publishes to GitHub Pages
```

Tests sit next to the file they test (`AppText.tsx` + `AppText.test.tsx`), in `src/` and in `scripts/`; tests across several pages live in `src/pages/` (`screens.test.tsx`).

## Architecture (Feature-Sliced Design)

The app follows [Feature-Sliced Design](https://feature-sliced.design). Layers, from top to bottom:

| Layer          | What goes there                                                | Examples                                                                                                       |
| -------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/app`      | start-up and global wiring, used only by the layouts in `app/` | `SyncGate`, `OnboardingGate`, `NotificationResponder`, splash, `TabsLayout`                                    |
| `src/pages`    | one slice per screen: the screen and what only it uses         | `pages/home` (`HomeScreen`, `MatchCard`, `DayStrip`, `useHomeDay`, `home.ts`)                                  |
| `src/features` | a user action that changes something                           | `follow-competitions`, `pick-team`, `reminders`, `watch-match`, `choose-theme`, `ads`                          |
| `src/entities` | the business things the app shows                              | `competition` (followed list), `team` (favorites, `TeamCircle`), `match`, `session`, `broadcast` (channels)    |
| `src/shared`   | no business meaning, used everywhere                           | `ui`, `theme`, `api` (snapshot contract, SQLite, React Query reads, sync), `lib`, `config` (competitions list) |

- **Slices and segments**: inside a layer, one folder per slice (`features/reminders`); inside a slice, segments: `ui/` (components), `model/` (contexts, hooks, state), `api/` (I/O), `lib/` (pure helpers), `config/`. `shared` has segments only.
- **The import rule** (ESLint `no-restricted-imports`, `layerRule` in `eslint.config.mjs`): a layer imports only from layers below it, and never from another slice of its own layer. Inside a slice, imports are relative; another slice or layer is reached by its `@/` path (`@/entities/team/ui/TeamCircle`), and `../../` (leaving the slice) is refused so every crossing goes through a checked `@/` path. Tests and `src/test/` are exempt. Files the collector runs in Node (`shared/lib/json.ts`, `guards.ts`, `search.ts`, `shared/api/snapshot.ts`) keep relative imports with the `.ts` extension: Node does not resolve `@/`.
- **Where a new file goes**: used by one screen → that page's slice; a user action reused by screens → a feature; data about a business thing → an entity; generic → shared. When two slices of the same layer need each other, move the shared part down a layer (as `openChannel` moved to `entities/broadcast` and the competitions list to `shared/config`).
- **No barrel files** (`index.ts`): imports name the file (`@/features/reminders/model/NotificationsContext`), which keeps `jest.mock` paths exact.
- **`src/app` vs `app/`**: Expo Router would take `src/app` as the routes folder when it exists; `app.json` pins it with the `expo-router` plugin option `"root": "./app"`. Never put routes in `src/app`, nor screens in `app/`.

## Navigation Flow

```
Bottom Tabs (TabsLayout: headless expo-router/ui tabs + GlassTabBar, a floating glass capsule drawn by the app, the same on
iOS and Android; icons only, the active tab shows its name):
  Jogos (/)                    → week strip (DayStrip: yesterday to +13 days, dot on days with something), one chip per
                                 followed sport (named after the competition when it is the sport's only one; picking a sport
                                 with 2+ swaps the same row for ‹ · Superliga M · Superliga F, ‹ back to Todos, the picked one
                                 again back to the sport) + "Editar" (Suas competições sheet);
                                 "Todos" groups the day: Seus times first, then one section per competition (F1: GrandPrixCard);
                                 a day with fewer than 3 games is filled with the next games and sessions;
                                 NewsCard offers once a new competition of a sport the user does not follow
  Classificacao (/classificacao) → standings per followed competition (columns depend on the sport)
  Configuracoes (/configuracoes) → reminders switch; Esportes e competições (sport switch, competition checks (2+ competitions or `listsCompetitions`: football, motorsport), team sheet;
                                 F1: "Avisos" → SessionRemindersSheet by session kind); theme

Stack over tabs:
  MatchDetailScreen (/match/[id]) → score, sets, channel links
  GrandPrixScreen (/grand-prix/[id]) → F1 weekend: session now/next with channel buttons, sessions by day, a bell per session kind
  TransfersScreen (/transferencias) → season transfers, favorite team first; opened from Classificacao, link hidden while there are none
```

- **Transfers**: CBV publishes no transfer list, so they are hand-curated from news articles in `scripts/superliga/transfers.json` and merged by the collector. Each line needs the article URL in `source` (shown in the app as "Fonte"); Superliga clubs go by their standings code (e.g. `SDC`) or full name, any other club by plain name. `resolveTransfers` rejects the whole run on a bad line, so the last good snapshot stays published. Record facts only (athlete, clubs, date), never copy article text.

```json
{
  "masculina": [
    {
      "athlete": "Nome",
      "position": "Ponteiro",
      "from": "Modena (ITA)",
      "to": "SDC",
      "date": "2026-07-15",
      "loan": false,
      "source": "https://..."
    }
  ],
  "feminina": []
}
```

- **Streaming broadcasters (curated)**: ge only lists Globo's channels and its partners, so games streamed in Brazil by Netflix or Prime Video (NFL Thanksgiving Eve, Black Friday, Christmas) come with no broadcaster. They are hand-curated in `scripts/broadcasts.json` (per competition slug: `date` = Brasília day of the kickoff, `home`/`away` = standings codes or full names in either order, `channels`, `source` = article URL saying it is shown **in Brazil**) and `applyBroadcasts` adds them after the source's channels on every run (kept competitions too, since a live run asks ge for the round again). A bad line rejects the run; a line whose game is not found is a `::warning`. Never derive Brazilian broadcasters from US ones (Big Balls `broadcast`): Thursday Night Football is Prime Video in the US only.

```json
{
  "nfl": [
    {
      "date": "2026-11-25",
      "home": "LAR",
      "away": "GB",
      "channels": ["Netflix"],
      "source": "https://..."
    }
  ]
}
```

## Data Flow

```
Cloudflare Worker cron (every 5 min: full run at 06:00, live runs during game windows) → workflow_dispatch → GitHub Action → reads cbv.com.br, ge.globo.com, API-Sports (NBA quarters) and Big Balls (NFL live and quarter scores) → validates → publishes onde-passa.json
  → Cloudflare R2 bucket onde-passa-data, served at https://dados.onde-passa.app/onde-passa.json (app 1.2+)
  → GitHub Pages (older builds, plus the legacy superliga.json)
App → downloads the JSON (EXPO_PUBLIC_DATA_URL, If-None-Match with the saved ETag) → writes SQLite only when the data changed → screens read only SQLite
```

- **Trigger (schedule-aware)**: GitHub's cron is best effort, so the Worker `onde-passa-trigger` (`infra/cloudflare/data-trigger/worker.js`, pasted in the Cloudflare dashboard, Cron Trigger `*/5 * * * *`) decides when to run from the published file and calls `workflow_dispatch` with inputs `mode` and `competitions`:
  - `full` at **06:00 Brasília** (09:00 UTC): everything, once a day (also when the file is over 26 h old, i.e. the morning run was missed);
  - `live` during **game windows** (30 min before kickoff until 30 min after the expected end, or while a game is live, up to 6 h after its expected end (`STALE_LIVE_MS`: CBV once left a game live for days), or an NFL game waits for its score), when the file is at least 8 min old, i.e. about every 10 minutes, listing only the competitions with a game in the window;
  - nothing otherwise (no runs at night or between games).
    The window rule lives in `scripts/schedule.ts` (`inLiveWindow`, lengths per sport, F1 sessions 2 h) and is mirrored in the Worker, which also reads the sessions in `series`: keep both in sync (`scripts/windowMirror.test.ts` runs both over the same games for every sport and fails on any difference; the Worker is type-checked through JSDoc against `src/shared/api/snapshot.ts` and linted). Its secret `GITHUB_TOKEN` is a fine-grained token (this repo, Actions read/write) that expires: a 401 in the Worker logs means renew it. The workflow's own cron (`40 9 * * *`) only backs up the morning run: its `gate` job skips unless the published file is over 2 h old.
- **Live runs**: `COLLECT_MODE=live` with `COLLECT_COMPETITIONS` (from the inputs) makes `scripts/collect.ts` collect only the listed sources (`planSources`); the others stay as published with their own `updatedAt`. Inside a listed source, only rounds with a game in its window are asked (Brasileirão also its standings and the pages of those games; NFL/NBA the standings page and today's round), every other round, and the broadcasters already found, come from the published file. A live run makes ~5 requests in ~1 min, against ~68 in ~3.5 min for a full one. Live runs never do the multisport full refresh.
- **Collector resilience**: `scripts/http.ts` retries timeouts, network errors, 5xx and 429 twice (5 s, 15 s); other statuses fail at once. `scripts/fallback.ts` validates each source on its own: one that fails or looks suspicious keeps its competitions from the published file (`PREVIOUS_SNAPSHOT_URL`, the R2 copy, with their old `updatedAt`) and leaves a `::warning` on the run. A league never published yet (just added) that fails is left out with a warning. CBV agenda games with a club outside the table (`withoutForeignMatches`): when one unknown id meets the only table club without a game, it is the same club renumbered and its games take the table id; otherwise up to `MAX_FOREIGN_MATCHES` (3) games are left out and more reject the source, with the ids in the error. Each case leaves a `::warning`. The run fails only when the published file could not be read and a source failed, or when every source failed. Offline (fixtures) runs never fall back. The Pages upload tries twice and the deploy three times, since GitHub's artifact and OIDC services drop now and then; the R2 upload (AWS CLI, secrets `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, cache 5 min) runs even when Pages failed.

- **Competitions**: `masculina` and `feminina` (volleyball, CBV), `serie-a` (football, ge), `nfl` (American football, ge), `nba` (basketball, ge) and `f1` (motorsport, `automobilismo`, ge agenda). `src/shared/config/competitions.ts` is the single list: slug, sport, names and the standings columns of each sport. The app ignores competitions it does not know, so a sport can be added to the file before the app update ships.
- **Scores**: `homeScore`/`awayScore` are sets in volleyball, goals in football and points in the NFL; `setScores` is empty outside volleyball. Football matches may carry `events` (goals, own goals, red cards with side, player, period and minute) from the ge live feed; the match detail shows them with the score by half. Quarter scores for the NFL/NBA are not available from ge. `Standing.scoredFor`/`scoredAgainst` follow the same rule, and `draws` is always 0 in volleyball. `Standing.group` names the NFL division ("AFC Leste") or the NBA conference, `position` counts within it, and `points` is 0; `StandingsList` renders one section per group.
- **Legacy file**: the first release reads `superliga.json` (version 1, Superligas only). `scripts/legacy.ts` keeps publishing it from the new snapshot until those installs are gone.
- **Builds already released**: `scripts/oldBuilds.ts` holds frozen copies of what each released build checks before taking the file (first release: `superliga.json` with exactly the two Superligas; 1.0 to 1.4: `version` 2, every competition with teams, one slug it knows). Every run calls `assertOldBuildsRead` before writing, and `oldBuilds.test.ts` checks a full snapshot on every PR. Never edit a frozen reader to make something pass; add one when a new build changes its checks.
- **Stale data turns the run red**: `staleCompetitions` (`scripts/freshness.ts`) lists competitions whose `updatedAt` is over 1 h old while a game's window has been open for over 1 h, or over 26 h old at all. The run still publishes; the collect step sets the output `stale` and the last step of `data.yml` fails with it, so a source stuck on the fallback sends the failure e-mail.
- **Brasileirão source**: the ge championship page names the public table service (`api.globoesporte.globo.com/tabela/...`) the page itself calls; rounds and standings come from there, and the broadcasters from each match page (`liveWatchSources`), fetched only for matches up to 8 days ahead. The same pages give goals and red cards (`plays` live feed) for live matches and, 20 per run, finished ones; finished events are reused from the published file. ge gives Brasília wall-clock times; `toInstant` adds the offset.
- **NFL and NBA source**: one collector, `scripts/multisport/` (each league is a `MultisportLeague` in `scripts/nfl/collect.ts` / `scripts/nba/collect.ts`). The ge standings page (`ge.globo.com/futebol-americano/nfl/classificacao/`, `ge.globo.com/basquete/nba/classificacao/`) embeds a `tabela-context` JSON with the season phases and the table by division/conference; each round comes from the GraphQL service the page itself calls (`geql.globo.com/graphql`, `GetMultisportMatchesByPhase`), already with the Brazilian broadcasters per game, so no match pages and no manual curation. Playoff phases are asked for only once the season reaches them (the service errors on future ones); NBA series ask up to 7 rounds and stop at the first empty one. NFL rounds are "Semana n"; NBA rounds are game days (150+ a season), so cards show the phase name. ge's odd NFL codes (`KCC`, `SF4`) are mapped to the league ones; games with teams outside the table (All-Star, Pro Bowl) are dropped.
- **Formula 1 (`series`)**: F1 has sessions (`RaceSession`: weekend `grandPrixId`, `name`, `kind` practice/sprint-qualifying/sprint/qualifying/race, `startsAt`, `status`, channels, circuit), no teams, matches or standings. It is published in **`Snapshot.series`, never in `competitions`**: every build up to 1.4 rejects the whole file when an entry of `competitions` has no teams (`isValidSnapshot`), and ignores `series`. Inside the collector it is a `CompetitionData` like the others (`loadPrevious` merges `series` back; `toPublished` splits it out; `assertValidSnapshot` throws if a teamless entry lands in `competitions`); the app merges it back in `withSeries`. Source: the ge agenda GraphQL (`multisportTabAgenda(date)`, the query ge.globo.com/agenda makes, `scripts/f1/parseGe.ts`), one request per Brasília date: a full run asks yesterday to +27 days, Thursday to Sunday only (16 requests); a live run only the dates of sessions in their window. Asked dates replace what was published for them, the rest of the season is kept (sessions not asked again 6 h after their start become finished; kept 400 days). ge answering dates of published sessions with none fails the source (fallback keeps the file). ge has no F1 results or standings (Classificação shows a notice); jolpi.ca blocks Claude and OpenF1 is non-commercial. Offline fixtures: `f1-agenda-YYYY-MM-DD.json`.
- **NBA quarter scores (API-Sports)**: ge has no quarter or live scores for the NBA/NFL (live games come with an empty scoreboard). `scripts/apiSports/nba.ts` adds `Match.periodScores` (points per quarter, then overtimes) from API-NBA v2 (`https://v2.nba.api-sports.io/games?date=YYYY-MM-DD`, a **UTC** date; header `x-apisports-key`). It asks one date per run at most, only for games ge marks finished in the last 36 h and without quarters, keeps published quarters, and matches games by team name/code and start; quarters must add up to the ge score. A missing key or an API error leaves quarters out with a warning; it never fails the run. Both score APIs run on one engine, `scripts/periodScores.ts` (`addPeriodScores` with a `ScoreProvider` per API: `nbaQuarters`, `nflScores`); a new score API is a parser plus a provider.
  - Site: https://api-sports.io (NBA product page https://api-sports.io/sports/nba; docs https://api-sports.io/documentation/nba/v2). Account, API key and per-API usage: https://dashboard.api-football.com (My Access). One key for every API-Sports API; each API has its own daily quota.
  - Plan: Free, 100 requests/day per API, reset at 00:00 UTC; the collector uses about 10/day for the NBA. The free plan serves the current NBA season but **not the current NFL season** ("Free plans do not have access to this season, try from 2022 to 2024"); NFL scores come from Big Balls instead (next bullet).
  - Secret: `API_SPORTS_KEY` (GitHub Actions secret, passed only to the collect step of `data.yml`). Set it with `gh secret set API_SPORTS_KEY`; never paste it in chats, logs or code. If it leaks, reset it in the dashboard (My Access) and set the secret again.
- **NFL live and quarter scores (Big Balls Sports Data)**: ge sends live NFL games with an empty scoreboard and no quarters, and the free API-Sports plan refuses the current NFL season. `scripts/bigBalls/nfl.ts` (`addNflScores`, run in the NFL source of `scripts/collect.ts` after `collectNfl`) fills `homeScore`/`awayScore` of **live** games (and of finished ones while ge, which marks them finished by the clock, has not published the final score yet) and `Match.periodScores` (quarters played so far, then overtime) from `GET https://api.bigballsdata.com/v1/matches?league=nfl&date=YYYY-MM-DD&tz=UTC` (header `x-api-key`; `score.home|away`, `linescore.home|away` with `null` for unplayed quarters, `status` `live`/`finished`). It asks at most two UTC dates per run, only when there are live games or finished ones of the last 36 h without quarters; finished quarters are kept from the published file. Games are matched by full team name (either order) and kickoff; quarters must add up to the score. ge stays the source of the schedule, standings, broadcasters, team ids and Portuguese labels; Big Balls only adds scores. No key or an API error leaves them out with a warning.
  - Site: https://bigballsdata.com (NFL page https://bigballsdata.com/nfl-api). Docs for machines: https://bigballsdata.com/llms-full.txt and the OpenAPI spec https://bigballsdata.com/openapi.json. API key: https://bigballsdata.com/dashboard/keys. Terms: https://bigballsdata.com/legal/terms.
  - Plan: Free, **one sport** per account (this account's is American football: an NBA request answered 403), 1,000 requests/day, 100/minute; headers `x-ratelimit-remaining`. Covers the current NFL season, live. Not used for the NBA (API-Sports does it; Big Balls lists NBA only up to 2025-26).
  - Terms: building products on the API and **displaying** its data in an app is allowed ("A site, an app or a dashboard that displays statistics to its own readers is not redistribution"); reselling or republishing the raw fields as an API, file or feed is not. Our `onde-passa.json` is a public file read by the app: confirm with legal@bigballsdata.com that this is fine before relying on it long term.
  - Secret: `BIGBALLS_KEY` (GitHub Actions, only the `collect` step of `data.yml`). Set with `gh secret set BIGBALLS_KEY`; never paste it anywhere else.
- **Incremental rounds**: with the published file, the multisport collector reuses rounds that are settled (all finished, last game over 36 h ago) or more than 10 days ahead, and asks for the rest (NBA: ~13 rounds instead of 65+). A fetched game wins over a reused one. Every round is asked again in a full run when the league's `fullRefreshAt` is over 20 h old, so the daily 06:00 run always does it (by age, not by hour: GitHub delays runs).

- **First run**: `SyncGate` blocks with a loader; on failure it shows a retry. Then `OnboardingGate` shows `OnboardingScreen` once (`@onboarding_done` in AsyncStorage): two steps: the sports, then their competitions already marked (skipped when every chosen sport has a single competition).
- **Followed competitions**: `CompetitionContext.followed`, stored as `@followed_competitions`; nothing stored (installs from before) means all. `@known_competitions` (absent: the five competitions up to 1.4) lists what the install was offered: on load (`resolveNewCompetitions`) a new competition of a followed sport is followed straight away, one of another sport (F1 for everyone who set up the app before 1.5) is offered once by the Home `NewsCard` (`news`, `answerNews`); the onboarding marks everything known. The Home filter is `'todos' | Sport | CompetitionSlug`; sport switches and the last-competition lock live in `useFollowToggles`. Filters, standings, the Home and reminders only use followed ones; the last one cannot be unfollowed. Favorite teams are picked in Configurações (`TeamSheet`); the first pick offers the reminders once (`@reminders_offered`).
- **Match reminders**: local notifications only (`expo-notifications` with `enableRemoteNotifications: false`; no push server, no Firebase/FCM, no `google-services.json`). `NotificationsContext` keeps the pending list equal to the reminders 30 min before each scheduled match of the favorites whenever favorites, data or the switch change: `replaceScheduledReminders` cancels or schedules only what changed (each request carries `matchId`, `path` and `fireAt` in `data` to compare; `path` is the screen a tap opens). F1 has no team: reminders go by session kind (`@session_reminder_kinds`, default race and qualifying; `SessionRemindersSheet`, or the bells of `GrandPrixScreen`) for followed series (max 60, iOS caps at 64). `NotificationResponder` opens `data.path` on tap (reminders from before 1.5: `/match/[matchId]`), with `router.replace` when a match or Grand Prix detail is already open, `push` otherwise. On only when the in-app choice (`@match_reminders`) and the system permission are both on. Android declares `SCHEDULE_EXACT_ALARM`: without it Android 12+ may fire a reminder up to 1 h late (after kickoff); Android 14+ leaves it off, so turning reminders on explains it and opens "Alarmes e lembretes", and Configuracoes keeps a notice while it is off. Web has no reminders (`notifications.web.ts`).
- **Ads**: `react-native-google-mobile-ads`. Nothing starts at launch: `AdsStarter` (inside `OnboardingGate`) runs consent, then the iOS tracking prompt (only when the app is active, retried on the next foreground while unanswered), then the SDK. Test unit ids everywhere except store builds (`AdBanner`).
- **Later runs**: opens from SQLite and refreshes in the background when data is older than 6h, 15 min on match days, **5 min while a game is on** (`isGameOn`: live, or from 15 min before kickoff to 4 h after); an open app re-checks every minute (`SyncContext`). A check sends the saved ETag (304: nothing downloaded) and skips the write when the snapshot's `fingerprint` equals the saved one; only `lastSyncAt` moves. Screens' queries are keyed by `dataVersion` (the saved fingerprint), not `lastSyncAt`, so they re-read only when the data changed. `saveSnapshot` writes multi-row INSERTs (≤ 999 bound values each): ~12 statements for ~1,900 rows.
- **Offline**: keeps local data and says so on the Home header.
- **`saveSnapshot` must never touch the `favorites` table.**
- **Schema changes**: bump `SCHEMA_VERSION` in `database.ts` whenever a data table changes columns. A mismatch drops and recreates the data tables (never `favorites`), because `CREATE TABLE IF NOT EXISTS` keeps an old table as it is. Standings are read in snapshot order (`sortOrder`), since divided tables restart `position` per group.
- **Dates**: `startsAt` carries an offset (European for the CBV, Brasília for ge). Always compare instants; never slice the text to get the day.
- **Collector privacy**: the source page holds contact e-mails and rosters. `parseCbv.ts` copies only whitelisted fields.

```bash
node scripts/collect.ts public                 # live collection: public/onde-passa.json + public/superliga.json
node scripts/collect.ts out <dir-with-fixtures> # offline (fixturesIO in scripts/source.ts; collectors take a SourceIO): {slug}-agenda.html, {slug}-classificacao.html (CBV),
                                               # serie-a-tabela.html, serie-a-classificacao.json, serie-a-rodada-{n}.json, serie-a-jogo-{id}.html (ge)
                                               # nfl-classificacao.html, nfl-{phase-slug}-rodada-{n}.json (ge), same for nba-
                                               # f1-agenda-YYYY-MM-DD.json (ge agenda GraphQL answer per date)
```

## Commands

```bash
yarn start            # Start Expo dev server
yarn android          # Start on Android
yarn ios              # Start on iOS
yarn web              # Start on web
yarn test             # Run tests
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Run tests with coverage report
yarn lint             # Run ESLint
yarn lint:fix         # Run ESLint with auto-fix
yarn format           # Format code with Prettier
yarn format:check     # Check formatting without writing
yarn type-check       # Run TypeScript type checking
```

### EAS Build & Update

```bash
# Full native build (required for native changes: new packages, app.json plugins, etc.)
eas build --platform android --profile development    # Dev build (Android)
eas build --platform android --profile production     # Production build (Android)

# OTA JavaScript update (no rebuild needed — for JS-only changes)
eas update --channel development --message "description"   # Update dev builds
eas update --channel preview --message "description"       # Update preview builds
eas update --channel production --message "description"    # Update production builds
```

**When to use each:**

- **`eas build`**: Native changes (new packages, `app.json` plugin changes, permissions, icons, etc.)
- **`eas update`**: JS-only changes (bug fixes, UI changes, logic changes) — much faster, no reinstall needed

## Code Conventions

- **Always use TypeScript strict mode** — no `any` types unless absolutely necessary
- **No casts** (`as X`, non-null `!`) in `src/`, `scripts/` and `app/`; ESLint enforces it (`consistent-type-assertions: never`, `no-non-null-assertion`), tests excepted. `as const` and `satisfies` are fine. Data from outside (source pages, APIs, SQLite, AsyncStorage, the published file, `transfers.json`/`broadcasts.json`) is read as `unknown` and checked: `src/shared/lib/json.ts` (`parseJson`, `asObject`, `objectsOf`, `asList`, `toText`, `toNumber`, `readBalanced`) and `src/shared/lib/guards.ts` (`isSnapshot`, `isMatch`, `isTeam`, `isStanding`, `isRaceSession`, `isTransfer`); curated files through `toTransferFile` / `toBroadcastFile`. Both utils are imported by the collector too, so their own imports carry the `.ts` extension.
- **`noUncheckedIndexedAccess`**: `list[0]` may be `undefined`. Destructure and check (`const [first] = list; if (!first) …`) instead of indexing; a named default (`DEFAULT_COMPETITION`, the first palette color) where a value must exist. Optional props that callers fill from maybe-missing values are declared `prop?: T | undefined` (`exactOptionalPropertyTypes`); snapshot fields stay exact and are only spread in when present (`...(group ? { group } : {})`).
- **Route files** in `app/` only re-export a page: `export { default } from '@/pages/home/ui/HomeScreen';`
- **Component files**: PascalCase (e.g., `MatchCard.tsx`)
- **Hook files**: camelCase with `use` prefix (e.g., `useTodayMatches.ts`)
- **Utility files**: camelCase (e.g., `championshipLabel.ts`)
- **Test files**: next to the file they test, named `<File>.test.ts(x)` (casts and `!` are allowed there: `list[0]!` when the test would fail anyway without it); helpers in `src/test/`
- **Styles**: Use `StyleSheet.create()` for layout/spacing; override colors via style arrays `[styles.card, { backgroundColor: colors.surface }]`
- **Theming**: Always use `useTheme()` for colors — never hardcode color values. ESLint enforces it in every `.tsx` of `src/` and `app/` (tests aside) (hex/rgb/hsl literals, a bare `Switch` instead of `ThemedSwitch`, inline styles are errors); a palette that is data (team colors with `TEAM_TEXT_COLOR`, the splash) lives in a `.ts` file (`src/entities/team/lib/teamColor.ts`, `src/app/splash.ts`)
- **Functional components only**: No class components
- **Named exports** for components; default export for route/screen components
- **Expo Router hooks**: `useRouter()` for navigation, `useLocalSearchParams()` for route params, `<Stack.Screen options={...}/>` for dynamic headers

## Testing Guidelines

- Every new component/hook must have at least one test
- Use `@testing-library/react-native` for component tests
- Mock `expo-router` in tests: `jest.mock('expo-router', () => ({ useRouter, useLocalSearchParams, Stack: { Screen: () => null } }))`
- Mock `@/shared/api/database` for screen tests (mock paths use the same `@/` paths as the imports); for tests of the SQL itself, mock `expo-sqlite` with `createExpoSqliteMock()` from `src/test/sqlite.ts` (real SQLite through `node:sqlite`)
- Jest runs with `TZ=America/Sao_Paulo` (set in `jest.config.js`)
- `render` from `@/test/utils` wraps a `SafeAreaProvider` (`TEST_SAFE_AREA`: 390×844, 47 top, 34 bottom). Navigator tests use `renderRouter` from `expo-router/testing-library` (`src/app/TabsLayout.test.tsx`)
- Mock `expo-linking` in tests that use Linking: `jest.mock('expo-linking', () => ({ openURL: jest.fn() }))`
- Test behavior, not implementation details
- Run `yarn test` before committing (husky pre-commit runs lint-staged, which only lints and formats the staged files)
- The CI job `checks` (`.github/workflows/ci.yml`) runs `type-check`, `lint --max-warnings 0`, `format:check`, `yarn test --coverage` and `expo export` (iOS and Android bundles) on every PR; `main` only takes PRs with it green. Type-check and lint cover the Worker (`infra/**/*.js`, JSDoc types, `@eslint/js` recommended). Coverage counts `src/` and `scripts/` and has a floor in `jest.config.js` (`coverageThreshold`, just under the current numbers): raise it when coverage climbs, never lower it to pass. `npx expo install --check` only warns (Expo ships patches with no change here)

## Theming (Dark Mode / Light Mode)

The app supports automatic dark/light mode via `ThemeContext`. System preference is detected via `useColorScheme()` from React Native, with manual toggle override.

### Architecture

- **`src/shared/theme/theme.ts`**: Defines `ThemeColors` interface, `lightTheme` and `darkTheme` palettes
- **`src/shared/theme/ThemeContext.tsx`**: `ThemeProvider` (wraps app in `_layout.tsx`), `useTheme()` hook
- **`app.json`**: `userInterfaceStyle: "automatic"` (enables system dark mode detection)

### Usage

```tsx
const { colors, toggleTheme, isDark } = useTheme();
// Use colors.primary, colors.surface, etc. in style arrays
<View style={[styles.card, { backgroundColor: colors.surface }]}>
```

### Color Tokens

Named by role, never by component (no `watchBtnBg`): reuse these before adding one. Source of truth is `src/shared/theme/theme.ts`.

| Token               | Light              | Dark                  | Usage                                       |
| ------------------- | ------------------ | --------------------- | ------------------------------------------- |
| `background`        | `#f8f9fa`          | `#0b1120`             | Screen backgrounds                          |
| `surface`           | `#fff`             | `#141d2e`             | Cards, sheets, grouped lists                |
| `surfaceAlt`        | `#f1f5f9`          | `#1b2740`             | Wells: icon tiles, disabled buttons, search |
| `primary`           | `#16a34a`          | `#22c55e`             | Main actions, selection, links              |
| `onPrimary`         | `#fff`             | `#07140c`             | Text/icons over `primary` (dark: contrast)  |
| `primarySoft`       | `#dcfce7`          | green 14%             | Favorite row, broadcaster pills             |
| `live` / `onLive`   | `#dc2626` / `#fff` | `#ef4444` / `#fff`    | AO VIVO badge                               |
| `textPrimary`       | `#111827`          | `#f1f5f9`             | Titles, team names                          |
| `textSecondary`     | `#6b7280`          | `#8b94a6`             | Dates, labels                               |
| `textTertiary`      | `#9ca3af`          | `#64748b`             | Placeholders, counts                        |
| `sectionHeaderText` | `#6b7280`          | `#94a3b8`             | `SectionHeader` labels                      |
| `versusText`        | `#6b7280`          | `#475569`             | The "×" between clubs                       |
| `border`            | `#e5e7eb`          | white 10%             | Dividers, outlined buttons                  |
| `borderLight`       | `#f3f4f6`          | white 8%              | List separators                             |
| `controlBg`/`Text`  | `#fff` / `#374151` | `#172033` / `#c3cad6` | Unselected chips                            |
| `controlBorder`     | `#d1d5db`          | white 8%              | Chips, checkboxes, radios                   |
| `controlThumb`      | `#fff`             | `#fff`                | Knob of an "on" switch (`ThemedSwitch`)     |
| `error`             | `#dc2626`          | `#ef4444`             | Error text, "Adiado"                        |
| `redCard`           | `#dc2626`          | `#ef4444`             | Red card in the match timeline              |
| `overlayBg`         | black 50%          | black 70%             | Sheet backdrops                             |
| `glass`             | white 60%          | `#172033` 55%         | Fill over the blur of the tab bar           |
| `glassBorder`       | slate 8%           | white 14%             | Hairline around a glass surface             |
| `statusBar`         | `dark`             | `light`               | StatusBar style (`ThemedStatusBar`)         |

### Tokens and building blocks (`src/shared/theme/designTokens.ts`)

- `spacing`, `radius`, `typography`, `iconSize`, `shadows`: use them instead of numbers.
- `touchTarget` (44): minimum height of anything tappable; small links get `hitSlop`.
- `maxFontScale` (1.3): `<AppText capped>` on text in fixed-width columns or one-line chips (`ScheduleRow`, `StandingsList`, `SegmentedChips`, pills, `MatchCard` names, score and buttons) and on screen titles. Free text scales without a cap and wraps; boxes that hold text use `minHeight`, not `height`.
- `sectionLabel`: the uppercase label style.
- **`SectionHeader`** (`title`, `icon`, `detail`): every label above a group of rows. Don't restyle a `Text` for it.
- **`Button`** (`primary` | `secondary` | `plain`, `icon`, `disabled`): every full-width action. Disabled primary turns `surfaceAlt`.
- **`PeriodScoreboard`** / **`MatchTimeline`**: score by period (sets, halves) and the football goals/red cards timeline in the match detail.
- **`ThemedSwitch`**: every switch. `primary` track; on Android the thumb is `controlThumb` (white) when on (a bare `Switch` shows the system teal there).
- **`AppText`** (`variant`, `tone`, `capped`): every text. Variants by role (`caption`, `captionMedium`, `captionStrong`, `meta`, `body`, `bodyStrong`, `rowTitle`, `label`, `labelStrong`, `heading`, `screenTitle`, `tiny`) carry size and weight; `tone` is the theme color (`primary` default, `secondary`, `tertiary`, `accent`, `onPrimary`, `onLive`, `error`, `section`, `inherit` for text inside text). A one-off (the big score) takes the nearest variant plus `style`. ESLint forbids importing `Text` from `react-native` outside `AppText.tsx`. Text inside text needs the parent's `variant` (a nested `AppText` sets its own size).
- **`Card`**: a group of rows on `surface`, `radius.lg`, clipped. **`IconTile`**: an icon on the `surfaceAlt` well (36 sheets, 34 settings, 40 onboarding, `active` = `primary`).
- **`SwitchRow`** (`label`, `detail`, `leading`, switch) and its sport form **`SportToggleRow`**; **`CheckRow`** (`label`, `detail`, `checked`, `locked` with its hint) over **`Checkbox`** (`square` 24, `round` 22). The sheet, settings and onboarding are built from these.
- **`ScheduleRow`** (when · title · `BroadcasterPill` or "a definir"): `MatchRow` and `SessionRow` are thin adapters over it. **`BroadcasterPill`** (`sm` in cards, `md` at the end of a row) is the only channel pill.
- **`SheetFrame`** (modal, backdrop, handle, keyboard lift) under every sheet; **`BottomSheet`** is its titled form (`closeButton`: a round X beside the title, for a sheet with no "Pronto", such as `TeamSheet`). **`IconButton`**: a round icon-only button (back).
- **`GlassTabBar`** / **`TabBarButton`** / **`GlassSurface`**: the tab bar. `GlassSurface` picks the material (`glassMaterial()`): Liquid Glass (`expo-glass-effect`) on iOS 26, `expo-blur` + `glass` fill on older iOS and Android 12+ (blurring the `BlurTargetView` around the screens), plain `surface` below Android 12. `GlassTabBar` spans the screen less 20 pt per side; `TabBarButton` is a 52 pt pill with the 24 pt template icon at 26 (`controlText`, sharing the width with the other inactive tabs; active `primary` on `primarySoft` with its name, as wide as it needs). Tab screens pad their scroll end with `useTabBarSpace()` (content scrolls under the glass).
- **`ChannelButtons`**: "Assistir no X" per channel or "Transmissão a definir"; links open through `openLink` / `openChannel` (`src/shared/lib/links.ts`), never `Linking.openURL` directly.

## Git Workflow

- **Main branch**: `main` (production)
- **Development branch**: `develop`
- **Feature branches**: `feature/<feature-name>`
- **Bugfix branches**: `bugfix/<bug-name>`
- Pre-commit hooks automatically run ESLint and Prettier on staged files

### Agent notes on every PR

Before opening a PR, update the agents in `.claude/agents/` that own the areas it touches (`collector`: scripts/; `devops`: workflows, Worker, R2, EAS; `react-native`: src/; `android` / `ios`: platform behavior; `ui-reviewer`: design system rules), in the same branch:

- A technical note of what was done: the problem, the mechanism (functions, constants, config keys, step ids), the files, why this way and not the obvious alternative, and how to check it (command, screen, test file). Cite the PR number.
- Fix or delete notes the change makes wrong; an agent with stale notes misleads the next session.
- Put each note under the agent's section it belongs to; keep it short, facts only.
- Say in the PR description which agents were updated. A PR that changes nothing an agent relies on (copy, a version bump) says so instead.
