# Where to Watch - Mobile Application

## Project Overview

A React Native (Expo) mobile application that helps users find which TV channels or streaming platforms are broadcasting sports events (football and volleyball). It consumes a crawler API backend that scrapes UOL Central de Jogos daily.

## Tech Stack

- **Framework**: React Native with Expo SDK 55
- **Language**: TypeScript (strict mode enabled)
- **Navigation**: Expo Router (file-based routing in `app/` directory)
- **Package Manager**: Yarn (do NOT use npm)
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint 9 (flat config) with TypeScript, React, React Native, and Prettier plugins
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged (runs ESLint + Prettier on pre-commit)
- **Icons**: `@expo/vector-icons` (MaterialCommunityIcons)

## Project Structure

```
.
├── app/                   # Expo Router file-based routes
│   ├── _layout.tsx        # Root Stack navigator
│   ├── index.tsx          # HomeScreen (sport selection with icons)
│   ├── championship/
│   │   └── [sport].tsx    # ChampionshipScreen (list of championships)
│   └── matches/
│       └── [sport].tsx    # MatchesScreen (match list with scores)
├── src/
│   ├── components/        # Reusable UI components (MatchCard)
│   ├── services/          # API calls (matchService)
│   ├── hooks/             # Custom React hooks (useTodayMatches)
│   ├── types/             # TypeScript type definitions (match.ts)
│   ├── constants/         # App-wide constants (api.ts)
│   ├── utils/             # Pure utility functions (championshipLabel)
│   └── __tests__/         # Test files
├── assets/                # Images, fonts, static files
├── app.json               # Expo configuration (scheme: where-to-watch)
├── tsconfig.json           # TypeScript config (strict: true)
├── jest.config.js          # Jest configuration
├── eslint.config.mjs       # ESLint flat config
├── .prettierrc             # Prettier config
└── .husky/                 # Git hooks (pre-commit: lint-staged)
```

## Navigation Flow

```
HomeScreen (/)
  → ChampionshipScreen (/championship/[sport])
    → MatchesScreen (/matches/[sport]?championship=slug)
```

- **HomeScreen**: Two large cards with sport icons (soccer/volleyball)
- **ChampionshipScreen**: Fetches matches for sport, derives championship list, includes "Todos os campeonatos"
- **MatchesScreen**: FlatList of MatchCard with pull-to-refresh, optional client-side championship filter

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
- **Path aliases**: Use `@/` to import from `src/` (e.g., `import { MatchCard } from '@/components/MatchCard'`)
- **Route files** in `app/` import from `../../src/` (relative paths, not aliases)
- **Component files**: PascalCase (e.g., `MatchCard.tsx`)
- **Hook files**: camelCase with `use` prefix (e.g., `useTodayMatches.ts`)
- **Utility files**: camelCase (e.g., `championshipLabel.ts`)
- **Test files**: Co-locate tests in `src/__tests__/` directory
- **No inline styles**: Use `StyleSheet.create()` for all styles
- **Functional components only**: No class components
- **Named exports** for components; default export for route/screen components
- **Expo Router hooks**: `useRouter()` for navigation, `useLocalSearchParams()` for route params, `<Stack.Screen options={...}/>` for dynamic headers

## Testing Guidelines

- Every new component/hook must have at least one test
- Use `@testing-library/react-native` for component tests
- Mock `expo-router` in tests: `jest.mock('expo-router', () => ({ useRouter, useLocalSearchParams, Stack: { Screen: () => null } }))`
- Mock `matchService` for screen tests: `jest.mock('../services/matchService')`
- Test behavior, not implementation details
- Run `yarn test` before committing (husky pre-commit runs lint-staged)

## Git Workflow

- **Main branch**: `main` (production)
- **Development branch**: `develop`
- **Feature branches**: `feature/<feature-name>`
- **Bugfix branches**: `bugfix/<bug-name>`
- Pre-commit hooks automatically run ESLint and Prettier on staged files
