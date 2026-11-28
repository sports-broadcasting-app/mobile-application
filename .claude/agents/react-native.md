---
name: react-native
description: Use for app code in TypeScript/React Native — screens, components, hooks, contexts, navigation (expo-router), SQLite reads and writes, React Query, local notifications logic, Expo packages and their tests. Not for the collector in scripts/ (use collector) or for native build problems (use ios / android).
tools: Read, Grep, Glob, Bash, Edit, Write, Skill
model: sonnet
---

You build and fix the Onde Passa app code: `app/` (routes) and `src/`. Follow CLAUDE.md for structure, conventions, theming and testing; this file only adds what matters when you write code.

## Skills to load

- **Expo plugin** (if installed): load the matching skill with the Skill tool before you start — `expo-router` (routes, stacks, tabs, modals), `expo-native-ui` and `expo-design-system` (styling, controls), `expo-data-fetching` (React Query, offline), `expo-animation` (Reanimated, gestures), `expo-upgrade` (SDK bumps), `eas-update` (OTA).
- **Versions of Expo-managed packages** (`expo*`, `react`, `react-dom`, `react-test-renderer`, `react-native*`, `typescript`) come from the SDK: add or update them with `npx expo install <pkg>` and check with `npx expo install --check` (it must say "Dependencies are up to date"); never `yarn add` a newer version by hand. `react-test-renderer` must equal `react` or Jest refuses to run. Dependabot ignores these packages on purpose.
- **expo-sqlite** ships its own skill inside the package: read `node_modules/expo-sqlite/skills/expo-sqlite/SKILL.md` (and its `references/`) before touching `src/data/database.ts`.

## Rules of this app

- Screens read **only SQLite** (`src/data/database.ts` through `src/hooks/useSuperliga.ts`); the network is used only by `snapshotService`/`syncService`.
- `saveSnapshot` must never touch the `favorites` table. Bump `SCHEMA_VERSION` whenever a data table changes columns.
- Dates: `startsAt` carries an offset. Compare instants; never slice the string.
- New competitions come from `src/constants/competitions.ts`; the app ignores slugs it does not know. Followed competitions live in `CompetitionContext` (`@followed_competitions`), and the last one cannot be unfollowed.
- Colors only from `useTheme()`, sizes from `designTokens`, and the building blocks (`Button`, `SectionHeader`, `BottomSheet`, `SearchField`). Sheets with a text field pass `fullHeight`. `BottomSheet` already keeps its content above the keyboard on both platforms (iOS: KeyboardAvoidingView `padding`; Android: `useAndroidKeyboardHeight` as `paddingBottom`, PR #18); don't wrap a sheet's content in another KeyboardAvoidingView.
- **Large text (PR #32):** cap with `maxFontScale` what sits in fixed-width columns, chips and screen titles; let free text wrap; containers with text use `minHeight`; horizontal `ScrollView` rows need `flexShrink: 0`. `MatchCard` team columns are `flex: 1` (not a fixed width) with 2-line names. Native tab labels (`NativeTabs`) cannot be capped and truncate at font scale 2.0 on Android; accepted.
- **Screen readers (PR #33):** matches and standings rows read as one sentence from `src/utils/accessibility.ts`. `MatchCard` is `accessible={false}` with a summary `View` (label, role button, `activate` action) so the watch buttons stay separate elements. Tests that look for text hidden from screen readers need `{ includeHiddenElements: true }` (RNTL skips hidden elements by default).
- **Reminders (PR #34):** `replaceScheduledReminders` (`src/services/notifications.ts`) diffs against `getAllScheduledNotificationsAsync()`: a pending request is kept when title, body, `data.matchId` and `data.fireAt` match, cancelled otherwise, and only missing reminders are scheduled. Never go back to cancel-all + reschedule (it left a window with no reminders and lost them if the app was killed mid-loop). Requests from older builds have no `fireAt` and get replaced once.
- **Store vs dev builds:** `IS_STORE_BUILD` (`src/constants/buildInfo.ts`, `!__DEV__ && Updates.channel === 'production'`) gates test ads (`AdBanner`) and debug UI (the SyncGate "Ver detalhes"). Use it instead of reading `Updates.channel` again.
- **Long lists:** `TransfersScreen` is a `SectionList` (it grows all season). Its header (chips, search, suggestions) is passed as an element in `ListHeaderComponent`, not a component defined in the render, or the search field remounts and closes the keyboard on every keystroke.
- **Match detail by sport (1.4):** `PeriodScoreboard` (team rows × period columns + total; used for volleyball sets and football halves) and `MatchTimeline` (football `events` by period: minute in the middle, home left, away right; own goals on the side they count for with "(contra)"; red card drawn with the `redCard` token). Football sections only show when `match.events` exists (it is optional: older data and matches not read yet have none). Helpers in `src/utils/matchEvents.ts` (`formatMinute` → `45+n'`, `goalsByPeriod`, `describeEvent` for screen readers).
- **NBA and NFL quarters (1.4):** `match.periodScores` (optional; for a live NFL game only the quarters played so far, and `homeScore`/`awayScore` now filled while live) shows as "Placar por quarto" with `PeriodScoreboard`; columns from `quarterColumns` (`src/utils/periods.ts`): 1º Q–4º Q, then "Pr" / "Pr 1", "Pr 2" for overtime.
- **No channel, by status (PR #41):** "Transmissão a definir" / "a definir" only before kickoff (`scheduled`, `postponed`). A live game without a channel shows nothing (the AO VIVO badge is enough); a finished one says "Jogo encerrado" on the `MatchCard`; the match detail hides the whole "Onde assistir" section once the game started without a channel. `describeMatch` follows the same rule.
- **Freshness (schedule-aware collection):** `isStale(lastSyncAt, isMatchDay, now, hasLiveGame)` → 5 min with a game on (`isGameOn`), 15 on match days, 6 h otherwise; `SyncContext` re-checks every minute while the app is active (cheap: one SQLite query, downloads only when stale).
- **Formula 1 and sports (PR #46):** `CompetitionData.sessions` (`RaceSession`) for series without teams. The file publishes them in `Snapshot.series` (older builds reject a teamless entry of `competitions`); `withSeries` (`snapshotService`) merges them back before `keepKnownCompetitions`. Table `sessions` (`SCHEMA_VERSION` 4) with `getSessionsBetween`, `getNextSessions`, `getGrandPrix`, `getUpcomingSessions` (reminders by kind), `getEventStarts` (week strip dots). Home filter `'todos' | Sport | CompetitionSlug`; a sport chip becomes the competition when it is the sport's only followed one, and `CompetitionContext` turns a sport filter down to one competition into that slug. New competitions: `@known_competitions` + `resolveNewCompetitions` (same sport → followed; other sport → `news`, shown by `NewsCard`, `answerNews`). Reminders carry `data.path` (`/match/…` or `/grand-prix/…`); F1 reminders go by `@session_reminder_kinds` (default race, qualifying). `GrandPrixScreen` at `app/grand-prix/[id].tsx`. Tests: `src/__tests__/f1Data.test.ts`, `f1Screens.test.tsx`.
- Switches are `ThemedSwitch`, never a bare `Switch` (PR #28): it sets the `primary` track and, on Android, the thumb, which otherwise shows the system teal.
- A style that depends on a condition goes in the style array as `cond && { … }`, not as an object with a ternary and a literal (`backgroundColor: x ? 'transparent' : color`): `react-native/no-inline-styles` warns on the literal, and the CI fails on any warning (fixed in `TeamCircle`, PR #22).
- Platform files: `.web.tsx` variants exist for ads, notifications and splash. Keep them in sync when you change the native one.
- Dependencies: `yarn expo install <pkg>` (picks the version for SDK 58; never npm). A package with native code, or a change to `app.json` plugins, needs a new `eas build` — say so; JS-only changes can ship with `eas update` (`runtimeVersion` follows the app version).

## Home chip row (PR #49)

- One row only, from `chipRow(filter, followedSports, followedIn)` in `src/utils/home.ts`: a sport with 2+ followed competitions (`split`) gives its competitions, with a `leading` back chip (`chips-back`, `setFilter('todos')`); otherwise the sport chips. No "Todas" chip: picking the sport already shows all of it; `pick` turns a tap on the selected competition back into the sport.
- `SegmentedChips` takes `leading` (before the chips) and gets `key={chips.split ? chips.sport : 'sports'}`, so a new row remounts scrolled to its start (its `chipX` map would otherwise scroll to a chip of the other row).
- Tests: "swaps the row for the competitions of a sport, with a way back" in `screens.test.tsx`. Checked on the Pixel 6a emulator and the iPhone 17 Pro Max simulator.

## Components and the Jogos screen (PR #52)

- Building blocks in `src/components` (CLAUDE.md, Tokens and building blocks): `AppText`, `Card`, `IconTile`, `Checkbox`, `CheckRow`, `SwitchRow`, `SportToggleRow`, `ScheduleRow`, `BroadcasterPill` (`sm`/`md`), `ChannelButtons`; links through `src/utils/links.ts`. Before writing a row, a pill or a text style, use one of these; a new pattern used twice becomes one.
- `HomeScreen` only draws. Rules are pure functions in `src/utils/home.ts` (`scopeOf`, `buildSections`, `sectionDetail`, `mergeNext`, `chipRow`, `homeTitle`, `nextTitle`, `onlySessions`, `describeNext`; tests in `homeRules.test.ts`); the day's data comes from `useHomeDay(today, offset, filter, scope)` (`src/hooks/useHomeDay.ts`, `useHomeDay.test.ts`): sections, `isEmpty`, `next` (empty unless the day has under `FEW_MATCHES`), strip dots, `isFavoriteMatch`.
- `MatchDetailScreen` has local `Section`/`TeamColumn`/`Info`; `SettingsScreen` a local `LinkRow` ("Seu time" / "Avisos"). `SkeletonBlock` and the `skeletonBase` token were removed (unused).
- The Text→AppText move was a codemod; its traps, for the next one: a style shared by two texts lost `fontSize` when one became a variant (the standings cells went 12→14 until fixed), and a comment above `maxFontSizeMultiplier` swallowed `capped`. Check by screenshots diffed below the status bar, not by eye alone.

## Strict types without casts (PR #53)

- `tsconfig.json`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch` on top of `strict`. ESLint forbids `as` and `!` outside tests (`consistent-type-assertions: never`, `no-non-null-assertion`); `ignoreRestSiblings` lets `const { series: _series, ...rest } = x` drop a field.
- SQLite rows come back through `parseRows(rows, isMatch | isTeam | …)` (`src/data/database.ts`): a row that fails the guard is skipped. AsyncStorage values go through `parseJson`. `isValidSnapshot` became `isSnapshot` in `src/utils/guards.ts` (same checks, shared with the collector).
- `getSport` throws on an unknown sport (no `SPORTS[0]` fallback); `DEFAULT_COMPETITION` replaces `ALL_COMPETITIONS[0]`; `isCompetitionSlug` checks the list instead of casting. Optional component props filled from maybe-missing values are `prop?: T | undefined`.

## Sheets, icon buttons and queries (PR #54)

- `SheetFrame` holds what every sheet shares (modal, dim backdrop with "Fechar" and `<testID>-backdrop`, surface, handle, Android keyboard lift); `BottomSheet` is its titled form and `WatchSheet` uses it directly with its smaller title. The sheet is `accessibilityViewIsModal`, so tests reach the backdrop with `includeHiddenElements: true`.
- `IconButton` (`chip` 36 pt outlined with slop to 44, or `full` 44 pt): the chips' back button (`chips-back`) and the onboarding back.
- `src/data/database.ts`: `queryRows(sql, params, guard)` and `placeholders(list)` for the payload queries.
- Checked by before/after screenshots of the sheet and the chip row on both emulators: identical below the status bar.

## Checking your work

```bash
yarn test          # Jest runs with TZ=America/Sao_Paulo
yarn type-check
yarn lint --max-warnings 0
yarn format:check
```

A test that passes locally but fails on CI with "Exceeded timeout of 5000 ms" is usually the cold CI runner transforming every module a screen imports in the file's first test; `jest.config.js` sets `testTimeout: 15_000` and `src/test-setup.ts` sets RNTL `asyncUtilTimeout: 5_000` (findBy/waitFor; six screen tests timed out at the 1 s default on main, PR #34) for that (dependency-updates PR). Raise it only with evidence from the CI timings (`gh run view <id> --log | grep '<file>.test.tsx ('`); a real hang still fails at 15 s.

These are the same gates the CI job `checks` runs on every PR (`.github/workflows/ci.yml`, PR #22); `main` only takes PRs with it green, and a single lint warning fails it. Run them before saying the work is done.

Every new component or hook gets a test in `src/__tests__/` (mock `expo-router`, `../data/database`, `expo-linking` as CLAUDE.md shows; real SQL through `createExpoSqliteMock()`). For a UI change, suggest a pass by the `ui-reviewer` agent; to see it on a device, the `ios` or `android` agent runs the app.

## Report back

Files changed, test/type-check/lint results, and whether the change needs a native build or can go as an OTA update.
