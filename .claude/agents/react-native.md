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
- **expo-sqlite** ships its own skill inside the package: read `node_modules/expo-sqlite/skills/expo-sqlite/SKILL.md` (and its `references/`) before touching `src/shared/api/database.ts`.

## Rules of this app

- Screens read **only SQLite** (`src/shared/api/database.ts` through `src/shared/api/queries.ts`); the network is used only by `snapshotService`/`syncService`.
- `saveSnapshot` must never touch the `favorites` table. Bump `SCHEMA_VERSION` whenever a data table changes columns.
- Dates: `startsAt` carries an offset. Compare instants; never slice the string.
- New competitions come from `src/shared/config/competitions.ts`; the app ignores slugs it does not know. Followed competitions live in `CompetitionContext` (`@followed_competitions`), and the last one cannot be unfollowed.
- Colors only from `useTheme()`, sizes from `designTokens`, and the building blocks (`Button`, `SectionHeader`, `BottomSheet`, `SearchField`). Sheets with a text field pass `fullHeight`. `BottomSheet` already keeps its content above the keyboard on both platforms (iOS: KeyboardAvoidingView `padding`; Android: `useAndroidKeyboardHeight` as `paddingBottom`, PR #18); don't wrap a sheet's content in another KeyboardAvoidingView.
- **Large text (PR #32):** cap with `maxFontScale` what sits in fixed-width columns, chips and screen titles; let free text wrap; containers with text use `minHeight`; horizontal `ScrollView` rows need `flexShrink: 0`. `MatchCard` team columns are `flex: 1` (not a fixed width) with 2-line names. The tab bar is drawn by the app (glass tab bar section): the active tab's name is an `AppText capped`.
- **Screen readers (PR #33):** matches and standings rows read as one sentence from `src/entities/match/lib/accessibility.ts`. `MatchCard` is `accessible={false}` with a summary `View` (label, role button, `activate` action) so the watch buttons stay separate elements. Tests that look for text hidden from screen readers need `{ includeHiddenElements: true }` (RNTL skips hidden elements by default).
- **Reminders (PR #34):** `replaceScheduledReminders` (`src/features/reminders/api/notifications.ts`) diffs against `getAllScheduledNotificationsAsync()`: a pending request is kept when title, body, `data.matchId` and `data.fireAt` match, cancelled otherwise, and only missing reminders are scheduled. Never go back to cancel-all + reschedule (it left a window with no reminders and lost them if the app was killed mid-loop). Requests from older builds have no `fireAt` and get replaced once.
- **Store vs dev builds:** `IS_STORE_BUILD` (`src/shared/config/buildInfo.ts`, `!__DEV__ && Updates.channel === 'production'`) gates test ads (`AdBanner`) and debug UI (the SyncGate "Ver detalhes"). Use it instead of reading `Updates.channel` again.
- **Long lists:** `TransfersScreen` is a `SectionList` (it grows all season). Its header (chips, search, suggestions) is passed as an element in `ListHeaderComponent`, not a component defined in the render, or the search field remounts and closes the keyboard on every keystroke.
- **Match detail by sport (1.4):** `PeriodScoreboard` (team rows × period columns + total; used for volleyball sets and football halves) and `MatchTimeline` (football `events` by period: minute in the middle, home left, away right; own goals on the side they count for with "(contra)"; red card drawn with the `redCard` token). Football sections only show when `match.events` exists (it is optional: older data and matches not read yet have none). Helpers in `src/entities/match/lib/matchEvents.ts` (`formatMinute` → `45+n'`, `goalsByPeriod`, `describeEvent` for screen readers).
- **NBA and NFL quarters (1.4):** `match.periodScores` (optional; for a live NFL game only the quarters played so far, and `homeScore`/`awayScore` now filled while live) shows as "Placar por quarto" with `PeriodScoreboard`; columns from `quarterColumns` (`src/pages/match/lib/periods.ts`): 1º Q–4º Q, then "Pr" / "Pr 1", "Pr 2" for overtime.
- **No channel, by status (PR #41):** "Transmissão a definir" / "a definir" only before kickoff (`scheduled`, `postponed`). A live game without a channel shows nothing (the AO VIVO badge is enough); a finished one says "Jogo encerrado" on the `MatchCard`; the match detail hides the whole "Onde assistir" section once the game started without a channel. `describeMatch` follows the same rule.
- **Freshness (schedule-aware collection):** `isStale(lastSyncAt, isMatchDay, now, hasLiveGame)` → 5 min with a game on (`isGameOn`), 15 on match days, 6 h otherwise; `SyncContext` re-checks every minute while the app is active (cheap: one SQLite query, downloads only when stale).
- **Formula 1 and sports (PR #46):** `CompetitionData.sessions` (`RaceSession`) for series without teams. The file publishes them in `Snapshot.series` (older builds reject a teamless entry of `competitions`); `withSeries` (`snapshotService`) merges them back before `keepKnownCompetitions`. Table `sessions` (`SCHEMA_VERSION` 4) with `getSessionsBetween`, `getNextSessions`, `getGrandPrix`, `getUpcomingSessions` (reminders by kind), `getEventStarts` (week strip dots). Home filter `'todos' | Sport | CompetitionSlug`; a sport chip becomes the competition when it is the sport's only followed one, and `CompetitionContext` turns a sport filter down to one competition into that slug. New competitions: `@known_competitions` + `resolveNewCompetitions` (same sport → followed; other sport → `news`, shown by `NewsCard`, `answerNews`). Reminders carry `data.path` (`/match/…` or `/grand-prix/…`); F1 reminders go by `@session_reminder_kinds` (default race, qualifying). `GrandPrixScreen` at `app/grand-prix/[id].tsx`. Tests: `src/shared/api/f1Data.test.ts`, `f1Screens.test.tsx`.
- Switches are `ThemedSwitch`, never a bare `Switch` (PR #28): it sets the `primary` track and, on Android, the thumb, which otherwise shows the system teal.
- A style that depends on a condition goes in the style array as `cond && { … }`, not as an object with a ternary and a literal (`backgroundColor: x ? 'transparent' : color`): `react-native/no-inline-styles` warns on the literal, and the CI fails on any warning (fixed in `TeamCircle`, PR #22).
- Platform files: `.web.tsx` variants exist for ads, notifications and splash. Keep them in sync when you change the native one.
- Dependencies: `yarn expo install <pkg>` (picks the version for SDK 58; never npm). A package with native code, or a change to `app.json` plugins that touches native code (permissions, icons, SDK keys), needs a new `eas build` — say so; JS-only changes can ship with `eas update` (`runtimeVersion` follows the app version). Bundler-only plugin options are not native: the `expo-router` `root` option (PR #55) only needs Metro restarted with `--clear`.

## Home chip row (PR #49)

- One row only, from `chipRow(filter, followedSports, followedIn)` in `src/pages/home/lib/home.ts`: a sport with 2+ followed competitions (`split`) gives its competitions, with a `leading` back chip (`chips-back`, `setFilter('todos')`); otherwise the sport chips. No "Todas" chip: picking the sport already shows all of it; `pick` turns a tap on the selected competition back into the sport.
- `SegmentedChips` takes `leading` (before the chips) and gets `key={chips.split ? chips.sport : 'sports'}`, so a new row remounts scrolled to its start (its `chipX` map would otherwise scroll to a chip of the other row).
- Tests: "swaps the row for the competitions of a sport, with a way back" in `screens.test.tsx`. Checked on the Pixel 6a emulator and the iPhone 17 Pro Max simulator.

## Components and the Jogos screen (PR #52)

- Building blocks in `src/shared/ui` (CLAUDE.md, Tokens and building blocks): `AppText`, `Card`, `IconTile`, `Checkbox`, `CheckRow`, `SwitchRow`, `SportToggleRow`, `ScheduleRow`, `BroadcasterPill` (`sm`/`md`), `ChannelButtons`; links through `src/shared/lib/links.ts`. Before writing a row, a pill or a text style, use one of these; a new pattern used twice becomes one.
- `HomeScreen` only draws. Rules are pure functions in `src/pages/home/lib/home.ts` (`scopeOf`, `buildSections`, `sectionDetail`, `mergeNext`, `chipRow`, `homeTitle`, `nextTitle`, `onlySessions`, `describeNext`; tests in `homeRules.test.ts`); the day's data comes from `useHomeDay(today, offset, filter, scope)` (`src/pages/home/model/useHomeDay.ts`, `useHomeDay.test.ts`): sections, `isEmpty`, `next` (empty unless the day has under `FEW_MATCHES`), strip dots, `isFavoriteMatch`.
- `MatchDetailScreen` has local `Section`/`TeamColumn`/`Info`; `SettingsScreen` a local `LinkRow` ("Seu time" / "Avisos"). `SkeletonBlock` and the `skeletonBase` token were removed (unused).
- The Text→AppText move was a codemod; its traps, for the next one: a style shared by two texts lost `fontSize` when one became a variant (the standings cells went 12→14 until fixed), and a comment above `maxFontSizeMultiplier` swallowed `capped`. Check by screenshots diffed below the status bar, not by eye alone.

## Strict types without casts (PR #53)

- `tsconfig.json`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch` on top of `strict`. ESLint forbids `as` and `!` outside tests (`consistent-type-assertions: never`, `no-non-null-assertion`); `ignoreRestSiblings` lets `const { series: _series, ...rest } = x` drop a field.
- SQLite rows come back through `parseRows(rows, isMatch | isTeam | …)` (`src/shared/api/database.ts`): a row that fails the guard is skipped. AsyncStorage values go through `parseJson`. `isValidSnapshot` became `isSnapshot` in `src/shared/lib/guards.ts` (same checks, shared with the collector).
- `getSport` throws on an unknown sport (no `SPORTS[0]` fallback); `DEFAULT_COMPETITION` replaces `ALL_COMPETITIONS[0]`; `isCompetitionSlug` checks the list instead of casting. Optional component props filled from maybe-missing values are `prop?: T | undefined`.

## Sheets, icon buttons and queries (PR #54)

- `SheetFrame` holds what every sheet shares (modal, dim backdrop with "Fechar" and `<testID>-backdrop`, surface, handle, Android keyboard lift); `BottomSheet` is its titled form and `WatchSheet` uses it directly with its smaller title. The sheet is `accessibilityViewIsModal`, so tests reach the backdrop with `includeHiddenElements: true`.
- `IconButton` (`chip` 36 pt outlined with slop to 44, or `full` 44 pt): the chips' back button (`chips-back`) and the onboarding back.
- `src/shared/api/database.ts`: `queryRows(sql, params, guard)` and `placeholders(list)` for the payload queries.
- Checked by before/after screenshots of the sheet and the chip row on both emulators: identical below the status bar.

## Feature-Sliced Design (PR #55)

- Layers `src/app` > `pages` > `features` > `entities` > `shared` (CLAUDE.md, Architecture); `eslint.config.mjs` `layerRule` enforces the direction, no import between slices of one layer, and no `../../` out of a slice. The move was scripted (`git mv`, imports and `jest.mock` paths rewritten: relative inside a slice, `@/` across).
- Placement decisions: `getTeamName` and the competitions list went down to `shared` (`lib/teamName`, `config/competitions`) and the sync to `shared/api/sync`, because several slices of one layer need them; `openChannel` moved from `shared/lib/links` to `entities/broadcast/lib/broadcast`; `periods.ts` lives in `pages/match/lib` (it uses `PeriodScoreboard`'s column type).
- Gotcha: Expo Router takes `src/app` as the routes folder if it exists, which bundled the tests of `src/app` (Metro failed on `@testing-library`); `app.json` sets `["expo-router", { "root": "./app" }]`. Metro must be restarted after that option changes.
- Path strings built with `__dirname` in tests are not imports: the move missed `scripts/broadcasts.test.ts` (fixed). Search for them when moving files again.

## Glass tab bar, one bar on iOS and Android (PR #56)

- Problem: `NativeTabs` drew Liquid Glass with labels on iOS 26 and an opaque Material bar on Android. Now `app/(tabs)/_layout.tsx` re-exports `src/app/TabsLayout.tsx`: headless tabs from `expo-router/ui` (`Tabs`, `TabSlot`, `TabList asChild`, `TabTrigger asChild`) with `GlassTabBar` (`src/shared/ui`), a floating glass bar as wide as the screen less 20 pt per side; inactive tabs show only the icon and share the width (`flex: 1`), the active one the icon and its name at its own width (canvas option B, made wide on request). Same PNG template icons, drawn at 26.
- Why headless and not `expo-router/js-tabs` with `tabBar`: Android blur needs the screens inside a `BlurTargetView` (`expo-blur`) and the bar's `BlurView` pointing at it (`blurTarget`); only the headless tabs let us build that tree. `TabList asChild` must wrap `GlassTabBar` directly and the `TabTrigger`s must be its direct children, or the router finds no tabs.
- `GlassSurface.glassMaterial()`: iOS 26 `GlassView` (`expo-glass-effect`, `colorScheme` follows the in-app theme), older iOS and Android API 31+ `BlurView` (`blurMethod="dimezisBlurViewSdk31Plus"`) + `colors.glass`, Android < 31 plain `surface`. New native packages: needs a store build, not an OTA.
- Tab screens (Home, Classificação, Configurações) dropped `contentInsetAdjustmentBehavior="automatic"` (it existed for the native bar) and pad the scroll end and `scrollIndicatorInsets` with `useTabBarSpace()` = `tabBarBottom(insets.bottom)` + `TAB_BAR_HEIGHT` (64) + 16. `AdBanner` has `marginTop: 'auto'` and the Classificação content `flexGrow: 1`, so on a short page the banner sits right above that space instead of under the capsule (AdMob forbids covering an ad); on a long page it is reached at the end of the scroll. The switch animates with `LayoutAnimation` on press. Lost from the native bar: minimize on scroll.
- Tests: `src/shared/ui/GlassTabBar.test.tsx` (button states, position, material per platform), `src/app/TabsLayout.test.tsx` (`renderRouter`: tab switching, name moves). `@/test/utils` now wraps `SafeAreaProvider` (`TEST_SAFE_AREA`); `jest.config.js` transforms `standard-navigation` (ESM, used by `expo-router/testing-library`).

## Settings competition rows and the team sheet X (PR #56)

- Configurações shows a competition's `CheckRow` when its sport has 2+ competitions or `SportInfo.listsCompetitions` (`src/shared/config/competitions.ts`): true for futebol and automobilismo (umbrellas: Brasileirão, F1, more may come), false for basquete and futebol-americano (NBA and NFL are the sport). Unchecking the only competition turns the sport off, like unchecking both Superligas. Test: `screens.test.tsx` "names the competitions of football and motorsport".
- `BottomSheet closeButton` puts an `IconButton` X ("Fechar", `sheet-close`) beside the title; `TeamSheet` uses it because its footer only had "Sem time nesta competição" (closing used to need a pick, a swipe or the backdrop). Sheets with "Pronto" don't. Tests: `BottomSheet.test.tsx`, `screens.test.tsx` "closes the team sheet with the X".

## Checking your work

```bash
yarn test          # Jest runs with TZ=America/Sao_Paulo
yarn type-check
yarn lint --max-warnings 0
yarn format:check
```

A test that passes locally but fails on CI with "Exceeded timeout of 5000 ms" is usually the cold CI runner transforming every module a screen imports in the file's first test; `jest.config.js` sets `testTimeout: 15_000` and `src/test/setup.ts` sets RNTL `asyncUtilTimeout: 5_000` (findBy/waitFor; six screen tests timed out at the 1 s default on main, PR #34) for that (dependency-updates PR). Raise it only with evidence from the CI timings (`gh run view <id> --log | grep '<file>.test.tsx ('`); a real hang still fails at 15 s.

These are the same gates the CI job `checks` runs on every PR (`.github/workflows/ci.yml`, PR #22); `main` only takes PRs with it green, and a single lint warning fails it. Run them before saying the work is done.

Every new component or hook gets a test next to it, `<File>.test.tsx` (mock `expo-router`, `@/shared/api/database`, `expo-linking` as CLAUDE.md shows; real SQL through `createExpoSqliteMock()`). For a UI change, suggest a pass by the `ui-reviewer` agent; to see it on a device, the `ios` or `android` agent runs the app.

## Report back

Files changed, test/type-check/lint results, and whether the change needs a native build or can go as an OTA update.
