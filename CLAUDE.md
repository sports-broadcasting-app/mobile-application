# Where to Watch - Mobile Application

## Project Overview

A React Native (Expo) mobile application that helps users find which TV channels or streaming platforms are broadcasting sports events (football and volleyball). It consumes a crawler API backend that scrapes UOL Central de Jogos daily.

## Tech Stack

- **Framework**: React Native with Expo SDK 55
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: Expo Router (file-based routing with tabs + stack-over-tabs)
- **Package Manager**: Yarn (do NOT use npm)
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint 9 (flat config) with TypeScript, React, React Native, and Prettier plugins
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged (runs ESLint + Prettier on pre-commit)
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons)

## Project Structure

```
.
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root Stack (wraps tabs + stack screens)
│   ├── (tabs)/                 # Bottom Tab Navigator group
│   │   ├── _layout.tsx         # Tab layout (Home + Campeonatos)
│   │   ├── index.tsx           # Home tab (highlights, search, sport chips)
│   │   └── campeonatos.tsx     # Campeonatos tab (sport picker)
│   ├── championship/
│   │   └── [sport].tsx         # Championship list (stack over tabs)
│   ├── matches/
│   │   └── [sport].tsx         # Match list (stack over tabs)
│   └── match/
│       └── [id].tsx            # Match detail (stack over tabs)
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── MatchCard.tsx       # Match card (time, teams, live badge, broadcast badges)
│   │   ├── SearchBar.tsx       # Search input with magnify icon
│   │   ├── TeamCircle.tsx      # Colored circle with team acronym
│   │   └── BroadcastCard.tsx   # Broadcast card ("Abrir no App" / "Assistir na TV")
│   ├── services/               # API calls (matchService)
│   ├── hooks/                  # Custom React hooks (useTodayMatches)
│   ├── types/                  # TypeScript type definitions (match.ts)
│   ├── contexts/               # React contexts
│   │   └── ThemeContext.tsx    # Theme provider, useTheme() hook, toggleTheme
│   ├── constants/              # App-wide constants (api.ts, theme.ts)
│   ├── utils/                  # Pure utility functions
│   │   ├── championshipLabel.ts # Slug to display label mapping
│   │   ├── teamColor.ts       # Deterministic color from team slug
│   │   └── dateFormat.ts      # Date/time formatting helpers
│   └── __tests__/              # Test files (6 suites, 43 tests)
├── assets/                     # Images, fonts, static files
├── app.json                    # Expo config (scheme: where-to-watch)
├── tsconfig.json               # TypeScript config (strict: true)
├── jest.config.js              # Jest configuration
├── eslint.config.mjs           # ESLint flat config
├── .prettierrc                 # Prettier config
└── .husky/                     # Git hooks (pre-commit: lint-staged)
```

## Navigation Flow

```
Bottom Tabs:
  Home tab (/) → highlights, search, sport chips
  Campeonatos tab (/campeonatos) → sport picker

Stack over tabs:
  ChampionshipScreen (/championship/[sport])
    → MatchesScreen (/matches/[sport]?championship=slug)
      → MatchDetailScreen (/match/[id]?sport=...)
```

- **Home tab**: Sport chips (Futebol/Volei), "Em Destaque Hoje" with search bar, highlighted matches (live first)
- **Campeonatos tab**: Sport picker cards, navigates to championship list
- **ChampionshipScreen**: Text list of championships for selected sport
- **MatchesScreen**: FlatList of MatchCard with pull-to-refresh, date label, "Tabela" header button
- **MatchDetailScreen**: Team circles with acronyms, match info, broadcast cards with "Abrir no App"/"Assistir na TV", related matches

## API Integration

The app consumes a crawler API backend (configured via `EXPO_PUBLIC_API_URL`, defaults to `http://localhost:3000`).

### Endpoints used:

- `GET /api/matches/today` — all matches today
- `GET /api/matches/today?sport=football` — football only
- `GET /api/matches/today?sport=volleyball` — volleyball only

### Key types:

- `Sport`: `'football' | 'volleyball'`
- `MatchScore`: discriminated union (`type: 'football'` with goals/penalties, `type: 'volleyball'` with sets/setScores)
- `Match`: includes `sport`, `championship`, teams, broadcast channels, score, status
- `DailySchedule`: `{ date, crawledAt, matches[] }`

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
- Mock `matchService` for screen tests: `jest.mock('../services/matchService')`
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
