# Where to Watch - Mobile Application

## Project Overview

A React Native (Expo) mobile application that helps users find which TV channels or streaming platforms are broadcasting the sports events they want to watch.

## Tech Stack

- **Framework**: React Native with Expo SDK 55
- **Language**: TypeScript (strict mode enabled)
- **Package Manager**: Yarn (do NOT use npm)
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint with TypeScript, React, React Native, and Prettier plugins
- **Formatting**: Prettier
- **Git Hooks**: Husky + lint-staged (runs ESLint + Prettier on pre-commit)

## Project Structure

```
.
├── src/
│   ├── components/      # Reusable UI components
│   ├── screens/         # Screen-level components (one per route)
│   ├── services/        # API calls, external integrations
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions and interfaces
│   ├── constants/       # App-wide constants (colors, API URLs, etc.)
│   ├── utils/           # Pure utility/helper functions
│   ├── __tests__/       # Global test files
│   └── App.tsx          # Root application component
├── assets/              # Images, fonts, static files
├── index.ts             # Expo entry point
├── app.json             # Expo configuration
├── tsconfig.json        # TypeScript config (strict: true)
├── jest.config.js       # Jest configuration
├── eslint.config.mjs    # ESLint flat config
├── .prettierrc          # Prettier config
└── .husky/              # Git hooks (pre-commit: lint-staged)
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

## Code Conventions

- **Always use TypeScript strict mode** - no `any` types unless absolutely necessary
- **Path aliases**: Use `@/` to import from `src/` (e.g., `import { Button } from '@/components/Button'`)
- **Component files**: PascalCase (e.g., `SportCard.tsx`)
- **Hook files**: camelCase with `use` prefix (e.g., `useSportEvents.ts`)
- **Utility files**: camelCase (e.g., `formatDate.ts`)
- **Test files**: Co-locate tests in `__tests__/` directories or use `.test.tsx` suffix
- **No inline styles**: Use `StyleSheet.create()` for all styles
- **Functional components only**: No class components
- **Named exports** for components; default export only for screen components

## Testing Guidelines

- Every new component/hook must have at least one test
- Use `@testing-library/react-native` for component tests
- Test behavior, not implementation details
- Run `yarn test` before committing (husky pre-commit runs lint-staged)

## Git Workflow

- **Main branch**: `main` (production)
- **Development branch**: `develop`
- **Feature branches**: `feature/<feature-name>`
- **Bugfix branches**: `bugfix/<bug-name>`
- Pre-commit hooks automatically run ESLint and Prettier on staged files
