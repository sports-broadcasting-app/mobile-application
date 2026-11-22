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
- `addNflScores(competition, previous, { key, now, fetchText })` runs after `collectNfl`: keeps finished quarters from `previous` while they add up; asks at most `MAX_DATES_PER_RUN` (2) UTC dates per run (Sunday night games cross midnight UTC), only for live games and finished games of the last 36 h without quarters. Live games get `homeScore`/`awayScore` (ge sends null) plus the quarters so far; finished ones only get quarters that add up to the ge score and have at least four entries. Never throws.
- Plan: free, one sport per account (American football here; an NBA call answered 403), 1,000 requests/day, 100/minute. Budget: ≤ 96 requests/day (2 per run), only on NFL days.
- Terms (https://bigballsdata.com/legal/terms): displaying the data in the app is fine; republishing raw fields as an API, file or feed is not. Keep only the fields above in the snapshot; never add a passthrough of their payloads.
- Why ge stays the base for the NFL (schedule, standings, broadcasters, team ids, Portuguese labels): broadcasters only exist on ge, switching team ids would break saved favorites and reminders, and Big Balls lists no NFL standings. Big Balls only adds what ge lacks.

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
