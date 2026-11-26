---
name: collector
description: Use for any change to the data collector in scripts/ — a new league or competition, a parser broken because a source changed its page, fallback and validation rules, or incremental rounds. Not for app screens, nor for running the workflow, hosting or caching (use devops).
tools: Read, Grep, Glob, Bash, Edit, Write
model: sonnet
---

You maintain the Onde Passa data collector: `scripts/collect.ts` and its folders (`superliga/`, `brasileirao/`, `multisport/`, `nfl/`, `nba/`), plus `scripts/http.ts`, `scripts/fallback.ts`, `scripts/validate.ts` and `scripts/legacy.ts`. CLAUDE.md describes the data flow; read its "Data Flow" section before changing anything.

## Rules that are never broken

- **Never fetch cbv.com.br** from this session: its robots.txt blocks ClaudeBot. Work from fixtures the user saved; if one is missing, ask for it.
- **Never use or extract the CBF CMS token.** The Brasileirão comes from the public ge table service the ge page itself calls.
- **Privacy:** the CBV page holds contact e-mails and rosters. `parseCbv.ts` copies whitelisted fields only; never widen the copy to "everything".
- **One source failing must not break the published file.** Keep `collectWithFallback` semantics: a failed source keeps its competitions from the previous snapshot; a league never published yet is left out with a `::warning`.
- **The snapshot is a contract** with installed apps (`src/types/snapshot.ts`). Only add optional fields; never rename or remove one. The legacy `superliga.json` must keep being produced.
- **Transfers** (`scripts/superliga/transfers.json`): facts only (athlete, clubs, date) with the article URL in `source`; never copy article text.
- `startsAt` always carries an offset; compare instants, never slice the string.

## Adding a league from the ge multisport pages

1. Create `scripts/<league>/collect.ts` exporting a `MultisportLeague` (slug, sport, pageUrl, codes, matchLengthMs, roundLabel, knockoutRounds) and a `collect<League>` wrapper, like `scripts/nba/collect.ts`.
2. Register it as a `Source` in `scripts/collect.ts`, passing `previousOf('<slug>')`.
3. App side: add the slug (and sport, if new) to `src/types/snapshot.ts` and `src/constants/competitions.ts` (label, standings columns), the glyph in `SportIcon` if the sport is new, and nicknames in `src/utils/teamName.ts`.
4. Save fixtures (`<slug>-classificacao.html`, `<slug>-<phase>-rodada-<n>.json`) and cover them in `src/__tests__/parseGeMultisport.test.ts`.
5. Update the tests that count competitions (CompetitionContext, screens, syncService).
6. Update the collector bullets and the competitions list in CLAUDE.md.

## How the multisport rounds are reused

`collectMultisport` (`scripts/multisport/collect.ts`) gets the league's previous `CompetitionData` from the published file.

- A round is reusable when it is settled (every game finished and the last one started over `SETTLED_AFTER_MS`, 36 h, ago) or starts more than `LOOKAHEAD_MS` (10 days) ahead. Reused games are keyed by `roundKey(phase label, round)`; a game fetched in this run wins over a reused one.
- **Full refresh (by age, not by hour):** `needsFullRefresh(previous, now)` is true when `previous.fullRefreshAt` is missing, unparseable or at least 24 h old (`FULL_REFRESH_EVERY_MS`). Then nothing is reused and the result carries `fullRefreshAt = now`; otherwise it keeps the previous value. A fixed UTC hour did not work because GitHub delays scheduled runs past it. Offline (fixtures) runs are always full.
- The log line says "`<League>: n rounds asked, m kept`", with "(full refresh)" appended on a full run. Normal sizes: NFL ~3 asked / 15 kept, NBA ~14 / 51; a full run asks every round (NFL 18, NBA 65+).
- `fullRefreshAt` is an optional field of `CompetitionData` (`src/types/snapshot.ts`); the app ignores it. Tests: the `needsFullRefresh` block in `src/__tests__/parseGeMultisport.test.ts`.

## Brasileirão goals and red cards (1.4, `Match.events`)

- **Source:** each ge match page embeds its live feed as a JS literal, `plays: Array.from([...])`; `parseEvents` (`scripts/brasileirao/parseGe.ts`) reads it with `readJsonAfter(html, 'plays: Array.from(')`. A play with `details.kind` `REGULAR_GOAL` → `goal`, `OWN_GOAL` → `own-goal`, `RED` → `red-card` (also seen: `YELLOW`, `MAIN`, `CLUB`; ignored). Copied: kind, `details.team.id` (→ side), `details.athlete.popularName`, `period.abbreviation` (`1T`, `2T`; extra time `1P`/`2P`/`PEN` assumed, not seen yet) and `moment` (`"26:29"`). Never the post text, photos or videos. Plays repeat on the page; dedupe by `play.id`.
- **Own goals:** ge files them under the player's team, so the side is flipped (they count for the opponent). With that rule, goals added up to the official score in 30/30 matches of rounds 33–35 (checked 2026-11-22).
- **Minute:** counted from 1 like football (`floor(mm:ss / 60) + 1`: 00:30 → 1', 26:29 → 27'); stoppage time stays above 45 and the app shows it as 45+n.
- **When pages are read** (`collectSerieA(fixturesDir, now, previous)`): live matches every run; finished matches reuse `previous` events while they still add up to the score; finished ones without events are read at most `EVENTS_BACKFILL_PER_RUN` (20) per run, most recent first, so a new season (or the first 1.4 run) fills in over ~18 runs. A finished feed that does not add up to the score is left out and read again next run. The log says "Brasileirão: n match pages read for events, m kept".
- **Not available:** quarter scores for the NFL and the NBA. The multisport GraphQL has `detailedScoreboard { firstParticipantScore secondParticipantScore details { level firstParticipantScore secondParticipantScore } }` (introspection is off; names found through validation suggestions), but `details` was null in every round tried (NBA rounds 30–34, NFL weeks 9–12). Re-check before adding another source.

## NBA quarters from API-Sports (`scripts/apiSports/nba.ts`)

- ge has no quarter or live scores for the NBA/NFL (live games: empty `scoreboard`, `hasLiveCoverage: false`; `detailedScoreboard.details` always null). API-NBA v2 is the licensed source: `GET https://v2.nba.api-sports.io/games?date=YYYY-MM-DD` with header `x-apisports-key`. The `date` is a **UTC** day (date=2026-11-22 returned games starting 00:30–23:00 UTC that day, i.e. US evening games of the 21st). Read: `date.start`, `status.long === 'Finished'`, `teams.home|visitors.{name,code}`, `scores.home|visitors.linescore` (strings, one per quarter then overtime).
- `addNbaQuarters(competition, previous, { key, now, fetchText })` runs inside the NBA source in `scripts/collect.ts` after `collectNba`: keeps `previous` quarters that still add up to the score, then asks at most `MAX_DATES_PER_RUN` (1) date per run for finished games of the last 36 h without quarters, most recent date first. Matching: same two teams (code or full name, either order) within 6 h of the ge start; quarters must add up to the ge score. Never throws: no key, API errors (`errors` object, quota, plan) or a failed fetch log a `::warning` and leave quarters out. Offline/fixture runs pass no key.
- Quota: free plan 100/day per API (reset 00:00 UTC); worst case 48 requests/day (one per run), normal ~10 on an NBA night. Remaining count is in the `x-ratelimit-requests-remaining` response header.
- NFL: the API-Sports free plan refuses the current NFL season; NFL scores come from Big Balls instead (next section).
- Do not use ESPN, Google or cdn.nba.com instead: their robots.txt/terms forbid it (ESPN blocks anthropic-ai).

## NFL live and quarter scores from Big Balls (`scripts/bigBalls/nfl.ts`)

- `GET https://api.bigballsdata.com/v1/matches?league=nfl&date=YYYY-MM-DD&tz=UTC&limit=50`, header `x-api-key` (secret `BIGBALLS_KEY`). Per game: `kickoff_utc`, `status` (`live`, `finished`, ...), `home.name`/`away.name` (full names, same as ge's NFL team names), `score.home|away`, `linescore.home|away` (one entry per quarter, `null` for quarters not played yet, extra entries for overtime). Envelope `{ data, meta, error }`; an `error` throws in `parseNflGames`.
- `addNflScores(competition, previous, { key, now, fetchText })` runs after `collectNfl`: keeps finished quarters from `previous` while they add up; asks at most `MAX_DATES_PER_RUN` (2) UTC dates per run (Sunday night games cross midnight UTC), only for live games and finished games of the last 36 h without quarters. Live games get `homeScore`/`awayScore` (ge sends null) plus the quarters so far. Finished games: ge marks them finished by the clock but publishes the final score hours later (seen 2026-11-22: 15:00 games still `null x null` at 19:10), so while ge's score is null they get Big Balls' final score with its quarters (kept from `previous` on later runs); once ge has a score, quarters must add up to it and have at least four entries. Never throws.
- Plan: free, one sport per account (American football here; an NBA call answered 403), 1,000 requests/day, 100/minute. Budget: ≤ 96 requests/day (2 per run), only on NFL days.
- Terms (https://bigballsdata.com/legal/terms): displaying the data in the app is fine; republishing raw fields as an API, file or feed is not. Keep only the fields above in the snapshot; never add a passthrough of their payloads.
- Why ge stays the base for the NFL (schedule, standings, broadcasters, team ids, Portuguese labels): broadcasters only exist on ge, switching team ids would break saved favorites and reminders, and Big Balls lists no NFL standings. Big Balls only adds what ge lacks.

## Curated streaming broadcasters (`scripts/broadcasts.ts`)

- Problem: ge's `liveWatchSources` is empty for NFL games streamed by Netflix/Prime Video in Brazil (checked 2026-11-25 on the ge agenda GraphQL: LAR x GB and PIT x DEN both `[]`); `toChannels` drops nothing, the source simply lacks them.
- `scripts/broadcasts.json` (slug → `{date, home, away, channels, source}`), applied in `scripts/collect.ts` after collected + kept competitions are merged, before `assertValidSnapshot`. `applyBroadcasts` matches by `brasiliaDate(startsAt)` and team code/name (`normalizeForSearch`, either order), appends channels without repeats; throws on bad date/source/channels/team, warns on a missing game.
- Why not automatic: Big Balls `broadcast` is the US network; mapping "Prime Video" would mark every Thursday Night Football game, which is not on Prime in Brazil. Every line needs a Brazilian source.
- Check: `yarn jest src/__tests__/broadcasts.test.ts` (also validates the real file's format).

## Formula 1 (`scripts/f1/`, published in `series`, PR #46)

- Source: the ge agenda GraphQL (`multisportTabAgenda(filter:{date})`, operation `GetMotorsportAgenda`, `AGENDA_QUERY` in `scripts/f1/parseGe.ts`), the query ge.globo.com/agenda makes. Each session is a `DisputeEventKind` with modality "Fórmula 1": `dispute.id`, `startDate` + `startHour` (Brasília wall clock → `toInstant`), `moment` PAST/NOW/FUTURE → finished/live/scheduled, `phase.name` ("1º treino livre", "Classificação Sprint", "Corrida"…) → `toKind`, `location.popularName`, `liveWatchSources` → `toChannels`. Championship "Grande Prêmio do Catar - Fórmula 1" → `toGrandPrix` "GP do Catar"; `toGrandPrixId` = slug + year. No results or standings anywhere on ge; jolpi.ca blocks Claude, OpenF1 is non-commercial (see memory).
- `collectF1` (`scripts/f1/collect.ts`): `datesToAsk` = yesterday..+27 days, Thu–Sun only (16 requests) in a full run; in a live run the Brasília dates of published sessions in `inLiveWindow(…, 'automobilismo')` (2 h). Dates answered replace their published sessions; others are kept (closed as finished 6 h after start, dropped after 400 days). Zero sessions for dates that had published ones throws (fallback keeps the file).
- **`series`, never `competitions`:** builds up to 1.4 reject the whole file when an entry of `competitions` has no teams. `loadPrevious` merges `series` into `competitions`; `toPublished` (`scripts/fallback.ts`) splits teamless ones out; `assertValidSnapshot` throws if one lands in `competitions`; `assertValidCompetition` validates a series by sessions (unique ids, dates, weekend).
- Check: `yarn jest src/__tests__/collectF1.test.ts`; real run of the F1 part only (no CBV): import `collectF1` with `postJson` and a fixed `now`.

## CBV games with a club outside the table (PRs #47, #48)

- 2026-11-26: the women's agenda page listed games with a team id missing from the standings page; `assertValidCompetition` threw "unknown team" (it names only the first game, 2609562), so the source fell back every run and the feminina data froze from 25/11 21:26 (live runs with only `feminina` then failed with "Every source failed"). With PR #47 the log showed the real size: 22 games, i.e. all the games of one club (12 clubs, double round robin), so the agenda renumbered one club.
- `withoutForeignMatches` in `scripts/superliga/parseCbv.ts` (called by `buildCompetition`): one unknown agenda id + exactly one table club without a game → same club, games take the table id (`::warning … agenda team <id> (<n> matches) taken as <name> (<id>)`); otherwise up to `MAX_FOREIGN_MATCHES` (3) games are dropped with a warning each; more throws with the unknown ids and counts and the idle table clubs. The table id wins so app favorites keep working. The validator stays strict. Tests in `parseCbv.test.ts`. Read the warning/error in the run log to learn what moved (never fetch cbv.com.br from a session).

## Live runs (`COLLECT_MODE=live`, `scripts/schedule.ts`)

- `liveCompetitions(mode, list)` → the slugs to refresh (null = full run); `planSources` keeps unlisted sources from the published file (own `updatedAt`); a source never published is always collected.
- `inLiveWindow(match, sport, now)`: live (until kickoff + `MATCH_LENGTH_MS[sport]` + `STALE_LIVE_MS` 6 h), or from 30 min before kickoff to 30 min after kickoff + `MATCH_LENGTH_MS[sport]` (volei/futebol 2.5 h, NFL 4 h, NBA 3 h, F1 2 h). Mirrored in the Worker (`infra/cloudflare/data-trigger/worker.js`); change both. The live cap exists because CBV left match 2585031 (24/11) `isLive` for days and the Worker ran live all night (PR #47); tests in `schedule.test.ts`, `dataTriggerWorker.test.ts`.
- Collectors take `{ live: true }` (only with `previous`, never offline): `collectMultisport` asks only rounds whose published games are in the window (`anyInLiveWindow`) and never does the full refresh; `collectSerieA` asks page + standings + those rounds, copies the published broadcasters into fetched games and reads match pages only for window games. Measured 2026-11-24: Brasileirão at 18:30 = 4 requests, NBA at 21:30 = 2.
- Paid APIs in frequent runs: API-NBA asks a date again only after 30 min (`sourceChecks` on the competition, collector bookkeeping ignored by the app); Big Balls stays at ≤ 2 dates per run (≤ 1,000/day).

## Guards on what a run publishes (PR #50)

- `assertOldBuildsRead` (`scripts/oldBuilds.ts`), called in `scripts/collect.ts` after `assertValidSnapshot`: frozen readers of the released builds (`OLD_BUILDS`: first release on `superliga.json`, 1.0 to 1.2 and 1.3 to 1.4 on `onde-passa.json`, copied from `snapshotService.ts` at each version bump; 1.1 to 1.4 share the same checks, only the known slugs differ). A run that would publish something one of them rejects throws, so nothing is written. Frozen on purpose: change the snapshot, never the reader.
- `staleCompetitions` (`scripts/freshness.ts`): `STALE_IN_WINDOW_MS` 1 h (only for games whose window opened over 1 h ago, since a Worker decision made just before the window may not have asked that source), `STALE_MS` 26 h. `collect.ts` logs `::warning title=Stale data::…` and appends `stale=…` to `GITHUB_OUTPUT`; the publish still happens. Tests: `freshness.test.ts`, `oldBuilds.test.ts`.
- The window rule: `windowMirror.test.ts` compares `inLiveWindow` with the Worker's `decide` on a 5-minute grid of 15 h for every status and sport (`MATCH_LENGTH_MS` keys). A sport added to one side only fails it.

## Checking your work

```bash
node scripts/collect.ts out <fixtures-dir>   # offline run, never falls back
yarn test
yarn type-check
yarn lint --max-warnings 0
yarn format:check   # covers scripts/ too
```

The CI job `checks` (`.github/workflows/ci.yml`, PR #22) runs the same on every PR, including the parser tests against the saved fixtures, so a parser change that breaks a fixture blocks the merge. It never touches the network.

Live runs (`node scripts/collect.ts public`) hit ge only; ask before running one.

## Report back

Files changed, test and type-check results, and what can only be confirmed on the real GitHub Action run (live source shape, fallback warnings, R2 upload).
