# Where to Watch - Mobile Application

## Project Overview

A React Native (Expo) mobile application that shows where Superliga volleyball matches (men's and women's), Brasileirão Série A football matches, NFL and NBA games are broadcast, with day matches and standings. There is no login and no backend: the app downloads a static JSON on first run and keeps everything on the device in SQLite.

## Tech Stack

- **Framework**: React Native with Expo SDK 58
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: Expo Router (file-based routing with tabs + stack-over-tabs)
- **Package Manager**: Yarn (do NOT use npm)
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint 9 (flat config) with TypeScript, React, React Native, and Prettier plugins
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged (runs ESLint + Prettier on pre-commit)
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons)
- **Local storage**: `expo-sqlite` (matches, standings, teams, favorites)

## Project Structure

```
.
├── app/                        # Expo Router file-based routes (re-export src/screens)
│   ├── _layout.tsx             # Providers, SyncGate, root Stack
│   ├── (tabs)/                 # Jogos, Classificacao, Configuracoes
│   └── match/[id].tsx          # Match detail
├── src/
│   ├── components/             # MatchCard, StandingsList, SegmentedChips, SyncGate, TeamCircle...
│   ├── screens/                # Home, Standings, Favorites, MatchDetail
│   ├── contexts/               # ThemeContext, SyncContext, FavoritesContext
│   ├── data/database.ts        # SQLite schema and every query
│   ├── services/               # snapshotService (download), syncService (freshness rules)
│   ├── hooks/useSuperliga.ts   # React Query reads over SQLite
│   ├── types/snapshot.ts       # Snapshot contract, shared with the collector
│   ├── constants/              # config, competitions (slugs, labels, standings columns), theme, designTokens
│   ├── utils/                  # date, broadcast, teamColor
│   └── __tests__/              # Test files
├── scripts/collect.ts          # Collector entry point: writes onde-passa.json and the legacy superliga.json
├── scripts/superliga/          # CBV parser for both Superligas, curated transfers
├── scripts/brasileirao/        # ge parser for the Brasileirão Série A
├── scripts/multisport/         # ge "multisport" pages (standings page + matches GraphQL), shared by NFL and NBA
├── scripts/nfl/, scripts/nba/  # league configs for the multisport collector
└── .github/workflows/          # Scheduled collector, publishes to GitHub Pages
```

## Navigation Flow

```
Bottom Tabs:
  Jogos (/)                    → Ontem/Hoje/Amanha, filter by followed competition + "Editar" (Suas competições sheet);
                                 "Todos" groups the day: Seus times first, then one section per competition;
                                 a day with fewer than 3 games is filled with the next ones
  Classificacao (/classificacao) → standings per followed competition (columns depend on the sport)
  Configuracoes (/configuracoes) → reminders switch; Competições e times (follow switch + team sheet per competition); theme

Stack over tabs:
  MatchDetailScreen (/match/[id]) → score, sets, channel links
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

## Data Flow

```
Cloudflare Worker cron (every 30 min) → workflow_dispatch → GitHub Action → reads cbv.com.br and ge.globo.com → validates → publishes onde-passa.json
  → Cloudflare R2 bucket onde-passa-data, served at https://dados.onde-passa.app/onde-passa.json (app 1.2+)
  → GitHub Pages (older builds, plus the legacy superliga.json)
App → downloads the JSON (EXPO_PUBLIC_DATA_URL) → writes SQLite → screens read only SQLite
```

- **Trigger**: GitHub's cron is best effort (it ran the 30-min schedule only every 6-9 h), so the Worker `onde-passa-trigger` (`infra/cloudflare/data-trigger/worker.js`, pasted in the Cloudflare dashboard) calls `workflow_dispatch` every 30 min with a fine-grained token (this repo, Actions read/write) in its secret `GITHUB_TOKEN`. The token expires: a 401 in the Worker logs means renew it. The workflow keeps a backup cron every 3 h.
- **Collector resilience**: `scripts/http.ts` retries timeouts, network errors, 5xx and 429 twice (5 s, 15 s); other statuses fail at once. `scripts/fallback.ts` validates each source on its own: one that fails or looks suspicious keeps its competitions from the published file (`PREVIOUS_SNAPSHOT_URL`, the R2 copy, with their old `updatedAt`) and leaves a `::warning` on the run. A league never published yet (just added) that fails is left out with a warning. The run fails only when the published file could not be read and a source failed, or when every source failed. Offline (fixtures) runs never fall back. The Pages upload tries twice and the deploy three times, since GitHub's artifact and OIDC services drop now and then; the R2 upload (AWS CLI, secrets `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, cache 5 min) runs even when Pages failed.

- **Competitions**: `masculina` and `feminina` (volleyball, CBV), `serie-a` (football, ge), `nfl` (American football, ge) and `nba` (basketball, ge). `src/constants/competitions.ts` is the single list: slug, sport, names and the standings columns of each sport. The app ignores competitions it does not know, so a sport can be added to the file before the app update ships.
- **Scores**: `homeScore`/`awayScore` are sets in volleyball, goals in football and points in the NFL; `setScores` is empty outside volleyball. Football matches may carry `events` (goals, own goals, red cards with side, player, period and minute) from the ge live feed; the match detail shows them with the score by half. Quarter scores for the NFL/NBA are not available from ge. `Standing.scoredFor`/`scoredAgainst` follow the same rule, and `draws` is always 0 in volleyball. `Standing.group` names the NFL division ("AFC Leste") or the NBA conference, `position` counts within it, and `points` is 0; `StandingsList` renders one section per group.
- **Legacy file**: the first release reads `superliga.json` (version 1, Superligas only). `scripts/legacy.ts` keeps publishing it from the new snapshot until those installs are gone.
- **Brasileirão source**: the ge championship page names the public table service (`api.globoesporte.globo.com/tabela/...`) the page itself calls; rounds and standings come from there, and the broadcasters from each match page (`liveWatchSources`), fetched only for matches up to 8 days ahead. The same pages give goals and red cards (`plays` live feed) for live matches and, 20 per run, finished ones; finished events are reused from the published file. ge gives Brasília wall-clock times; `toInstant` adds the offset.
- **NFL and NBA source**: one collector, `scripts/multisport/` (each league is a `MultisportLeague` in `scripts/nfl/collect.ts` / `scripts/nba/collect.ts`). The ge standings page (`ge.globo.com/futebol-americano/nfl/classificacao/`, `ge.globo.com/basquete/nba/classificacao/`) embeds a `tabela-context` JSON with the season phases and the table by division/conference; each round comes from the GraphQL service the page itself calls (`geql.globo.com/graphql`, `GetMultisportMatchesByPhase`), already with the Brazilian broadcasters per game, so no match pages and no manual curation. Playoff phases are asked for only once the season reaches them (the service errors on future ones); NBA series ask up to 7 rounds and stop at the first empty one. NFL rounds are "Semana n"; NBA rounds are game days (150+ a season), so cards show the phase name. ge's odd NFL codes (`KCC`, `SF4`) are mapped to the league ones; games with teams outside the table (All-Star, Pro Bowl) are dropped.
- **Incremental rounds**: with the published file, the multisport collector reuses rounds that are settled (all finished, last game over 36 h ago) or more than 10 days ahead, and asks for the rest (NBA: ~13 rounds instead of 65+). A fetched game wins over a reused one. Every round is asked again when the league's `fullRefreshAt` is over 24 h old (by age, not by hour: GitHub delays scheduled runs).

- **First run**: `SyncGate` blocks with a loader; on failure it shows a retry. Then `OnboardingGate` shows `OnboardingScreen` once (`@onboarding_done` in AsyncStorage): pick the competitions to follow (at least one).
- **Followed competitions**: `CompetitionContext.followed`, stored as `@followed_competitions`; nothing stored (installs from before) means all. Filters, standings, the Home and reminders only use followed ones; the last one cannot be unfollowed. Favorite teams are picked in Configurações (`TeamSheet`); the first pick offers the reminders once (`@reminders_offered`).
- **Match reminders**: local notifications only (`expo-notifications` with `enableRemoteNotifications: false`; no push server, no Firebase/FCM, no `google-services.json`). `NotificationsContext` keeps the pending list equal to the reminders 30 min before each scheduled match of the favorites whenever favorites, data or the switch change: `replaceScheduledReminders` cancels or schedules only what changed (each request carries `matchId` and `fireAt` in `data` to compare) (max 60, iOS caps at 64). `NotificationResponder` uses `router.replace` when a match detail is already open, `push` otherwise. On only when the in-app choice (`@match_reminders`) and the system permission are both on. `NotificationResponder` opens `/match/[id]` on tap. Android declares `SCHEDULE_EXACT_ALARM`: without it Android 12+ may fire a reminder up to 1 h late (after kickoff); Android 14+ leaves it off, so turning reminders on explains it and opens "Alarmes e lembretes", and Configuracoes keeps a notice while it is off. Web has no reminders (`notifications.web.ts`).
- **Ads**: `react-native-google-mobile-ads`. Nothing starts at launch: `AdsStarter` (inside `OnboardingGate`) runs consent, then the iOS tracking prompt (only when the app is active, retried on the next foreground while unanswered), then the SDK. Test unit ids everywhere except store builds (`AdBanner`).
- **Later runs**: opens from SQLite and refreshes in the background when data is older than 6h (15min on match days).
- **Offline**: keeps local data and says so on the Home header.
- **`saveSnapshot` must never touch the `favorites` table.**
- **Schema changes**: bump `SCHEMA_VERSION` in `database.ts` whenever a data table changes columns. A mismatch drops and recreates the data tables (never `favorites`), because `CREATE TABLE IF NOT EXISTS` keeps an old table as it is. Standings are read in snapshot order (`sortOrder`), since divided tables restart `position` per group.
- **Dates**: `startsAt` carries an offset (European for the CBV, Brasília for ge). Always compare instants; never slice the text to get the day.
- **Collector privacy**: the source page holds contact e-mails and rosters. `parseCbv.ts` copies only whitelisted fields.

```bash
node scripts/collect.ts public                 # live collection: public/onde-passa.json + public/superliga.json
node scripts/collect.ts out <dir-with-fixtures> # offline: {slug}-agenda.html, {slug}-classificacao.html (CBV),
                                               # serie-a-tabela.html, serie-a-classificacao.json, serie-a-rodada-{n}.json, serie-a-jogo-{id}.html (ge)
                                               # nfl-classificacao.html, nfl-{phase-slug}-rodada-{n}.json (ge), same for nba-
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
- **Route files** in `app/` import from `../../src/` (relative paths)
- **Component files**: PascalCase (e.g., `MatchCard.tsx`)
- **Hook files**: camelCase with `use` prefix (e.g., `useTodayMatches.ts`)
- **Utility files**: camelCase (e.g., `championshipLabel.ts`)
- **Test files**: Co-locate tests in `src/__tests__/` directory
- **Styles**: Use `StyleSheet.create()` for layout/spacing; override colors via style arrays `[styles.card, { backgroundColor: colors.surface }]`
- **Theming**: Always use `useTheme()` for colors — never hardcode color values
- **Functional components only**: No class components
- **Named exports** for components; default export for route/screen components
- **Expo Router hooks**: `useRouter()` for navigation, `useLocalSearchParams()` for route params, `<Stack.Screen options={...}/>` for dynamic headers

## Testing Guidelines

- Every new component/hook must have at least one test
- Use `@testing-library/react-native` for component tests
- Mock `expo-router` in tests: `jest.mock('expo-router', () => ({ useRouter, useLocalSearchParams, Stack: { Screen: () => null } }))`
- Mock `../data/database` for screen tests; for tests of the SQL itself, mock `expo-sqlite` with `createExpoSqliteMock()` from `src/test-sqlite.ts` (real SQLite through `node:sqlite`)
- Jest runs with `TZ=America/Sao_Paulo` (set in `jest.config.js`)
- Mock `expo-linking` in tests that use Linking: `jest.mock('expo-linking', () => ({ openURL: jest.fn() }))`
- Test behavior, not implementation details
- Run `yarn test` before committing (husky pre-commit runs lint-staged, which only lints and formats the staged files)
- The CI job `checks` (`.github/workflows/ci.yml`) runs `type-check`, `lint --max-warnings 0`, `format:check` and `yarn test` on every PR; `main` only takes PRs with it green

## Theming (Dark Mode / Light Mode)

The app supports automatic dark/light mode via `ThemeContext`. System preference is detected via `useColorScheme()` from React Native, with manual toggle override.

### Architecture

- **`src/constants/theme.ts`**: Defines `ThemeColors` interface, `lightTheme` and `darkTheme` palettes
- **`src/contexts/ThemeContext.tsx`**: `ThemeProvider` (wraps app in `_layout.tsx`), `useTheme()` hook
- **`app.json`**: `userInterfaceStyle: "automatic"` (enables system dark mode detection)

### Usage

```tsx
const { colors, toggleTheme, isDark } = useTheme();
// Use colors.primary, colors.surface, etc. in style arrays
<View style={[styles.card, { backgroundColor: colors.surface }]}>
```

### Color Tokens

Named by role, never by component (no `watchBtnBg`): reuse these before adding one. Source of truth is `src/constants/theme.ts`.

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
| `skeletonBase`      | `#e5e7eb`          | `#1b2740`             | Loading placeholders                        |
| `statusBar`         | `dark`             | `light`               | StatusBar style (`ThemedStatusBar`)         |

### Tokens and building blocks (`src/constants/designTokens.ts`)

- `spacing`, `radius`, `typography`, `iconSize`, `shadows`: use them instead of numbers.
- `touchTarget` (44): minimum height of anything tappable; small links get `hitSlop`.
- `maxFontScale` (1.3): pass as `maxFontSizeMultiplier` on text in fixed-width columns or one-line chips (`MatchRow`, `StandingsList`, `SegmentedChips`, pills, `MatchCard` names, score and buttons) and on screen titles. Free text scales without a cap and wraps; boxes that hold text use `minHeight`, not `height`.
- `sectionLabel`: the uppercase label style.
- **`SectionHeader`** (`title`, `icon`, `detail`): every label above a group of rows. Don't restyle a `Text` for it.
- **`Button`** (`primary` | `secondary` | `plain`, `icon`, `disabled`): every full-width action. Disabled primary turns `surfaceAlt`.
- **`PeriodScoreboard`** / **`MatchTimeline`**: score by period (sets, halves) and the football goals/red cards timeline in the match detail.
- **`ThemedSwitch`**: every switch. `primary` track; on Android the thumb is `controlThumb` (white) when on (a bare `Switch` shows the system teal there).

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
