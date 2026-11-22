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
- Switches are `ThemedSwitch`, never a bare `Switch` (PR #28): it sets the `primary` track and, on Android, the thumb, which otherwise shows the system teal.
- A style that depends on a condition goes in the style array as `cond && { … }`, not as an object with a ternary and a literal (`backgroundColor: x ? 'transparent' : color`): `react-native/no-inline-styles` warns on the literal, and the CI fails on any warning (fixed in `TeamCircle`, PR #22).
- Platform files: `.web.tsx` variants exist for ads, notifications and splash. Keep them in sync when you change the native one.
- Dependencies: `yarn expo install <pkg>` (picks the version for SDK 58; never npm). A package with native code, or a change to `app.json` plugins, needs a new `eas build` — say so; JS-only changes can ship with `eas update` (`runtimeVersion` follows the app version).

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
