# Where to Watch - Mobile Application

## Project Overview

A React Native (Expo) mobile application that shows where Superliga volleyball matches (men's and women's) are broadcast, with day matches and standings. There is no login and no backend: the app downloads a static JSON on first run and keeps everything on the device in SQLite.

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
│   ├── (tabs)/                 # Jogos, Classificacao, Favoritos
│   └── match/[id].tsx          # Match detail
├── src/
│   ├── components/             # MatchCard, StandingsList, SegmentedChips, SyncGate, TeamCircle...
│   ├── screens/                # Home, Standings, Favorites, MatchDetail
│   ├── contexts/               # ThemeContext, SyncContext, FavoritesContext
│   ├── data/database.ts        # SQLite schema and every query
│   ├── services/               # snapshotService (download), syncService (freshness rules)
│   ├── hooks/useSuperliga.ts   # React Query reads over SQLite
│   ├── types/superliga.ts      # Snapshot contract, shared with the collector
│   ├── constants/              # config, theme, designTokens
│   ├── utils/                  # date, broadcast, teamColor
│   └── __tests__/              # Test files
├── scripts/superliga/          # Collector that generates superliga.json
└── .github/workflows/          # Scheduled collector, publishes to GitHub Pages
```

## Navigation Flow

```
Bottom Tabs:
  Jogos (/)                    → Ontem/Hoje/Amanha, competition filter, next matches on empty days
  Classificacao (/classificacao) → standings per competition
  Favoritos (/favoritos)       → one favorite team per competition, theme switch

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
GitHub Action (every 2h) → reads cbv.com.br → validates → publishes superliga.json (GitHub Pages)
App → downloads the JSON (EXPO_PUBLIC_SUPERLIGA_DATA_URL) → writes SQLite → screens read only SQLite
```

- **First run**: `SyncGate` blocks with a loader; on failure it shows a retry.
- **Later runs**: opens from SQLite and refreshes in the background when data is older than 6h (15min on match days).
- **Offline**: keeps local data and says so on the Home header.
- **`saveSnapshot` must never touch the `favorites` table.**
- **Dates**: `startsAt` carries a European offset. Always compare instants; never slice the text to get the day.
- **Collector privacy**: the source page holds contact e-mails and rosters. `parseCbv.ts` copies only whitelisted fields.

```bash
node scripts/superliga/collect.ts public/superliga.json            # live collection
node scripts/superliga/collect.ts out.json <dir-with-saved-html>   # offline, {slug}-agenda.html and {slug}-classificacao.html
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

- **`eas build`**: Native changes (new packages, `app.json` plugin changes, `google-services.json`, etc.)
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
- Run `yarn test` before committing (husky pre-commit runs lint-staged)

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

| Token              | Light     | Dark      | Usage                                 |
| ------------------ | --------- | --------- | ------------------------------------- |
| `background`       | `#f5f5f5` | `#111827` | Screen backgrounds                    |
| `surface`          | `#fff`    | `#1f2937` | Cards, headers, tab bar               |
| `surfaceAlt`       | `#f8fafc` | `#374151` | Sport chips, search bar               |
| `primary`          | `#2563eb` | `#3b82f6` | Active tab, links, icons, header tint |
| `textPrimary`      | `#111`    | `#f5f5f5` | Titles, team names                    |
| `textSecondary`    | `#666`    | `#9ca3af` | Dates, labels                         |
| `textTertiary`     | `#999`    | `#6b7280` | Placeholders, inactive tabs           |
| `border`           | `#e5e5e5` | `#374151` | Tab bar border, dividers              |
| `borderLight`      | `#f0f0f0` | `#1f2937` | List separators                       |
| `error`            | `#dc2626` | `#ef4444` | Error text (AO VIVO badge always red) |
| `broadcastBadgeBg` | `#f0f4ff` | `#1e3a5f` | Broadcast badge background            |
| `chipBorder`       | `#e5e7eb` | `#374151` | Sport chip border                     |
| `shadow`           | `#000`    | `#000`    | Card shadows                          |
| `statusBar`        | `dark`    | `light`   | StatusBar style                       |

### Layout Constants (not theme-dependent)

| Token         | Value                             |
| ------------- | --------------------------------- |
| Border radius | `12` (cards), `20` (badges/pills) |

## Git Workflow

- **Main branch**: `main` (production)
- **Development branch**: `develop`
- **Feature branches**: `feature/<feature-name>`
- **Bugfix branches**: `bugfix/<bug-name>`
- Pre-commit hooks automatically run ESLint and Prettier on staged files
