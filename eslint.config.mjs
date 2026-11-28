import typescriptParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import js from '@eslint/js';
import globals from 'globals';

/** Tests and their helpers: casts allowed, and they may cross layers. */
const TESTS = ['**/*.test.{ts,tsx}', 'src/test/**'];

const REACT_NATIVE_WRAPPERS = [
  {
    name: 'react-native',
    importNames: ['Switch'],
    message:
      'Use ThemedSwitch: a bare Switch shows the system teal thumb on Android.',
  },
  {
    name: 'react-native',
    importNames: ['Text'],
    message:
      'Use AppText: a variant and a tone instead of a style with fontSize, fontWeight and a theme color.',
  },
];

/** The imports a layer may not make (see Feature-Sliced Design below). */
function layerRule(forbidden, sealed = false, wrappers = true) {
  const patterns = [];
  if (forbidden.length > 0) {
    patterns.push({
      group: forbidden,
      message:
        'Feature-Sliced Design: import only from lower layers, never another slice of the same layer.',
    });
  }
  if (sealed) {
    patterns.push({
      // Images in the root assets/ folder are not code: they may climb.
      regex: '^\\.\\./\\.\\./(?!.*assets/)',
      message:
        'Leaves the slice: reach another slice by its @/ path (the layer rules check those).',
    });
  }
  return ['error', { paths: wrappers ? REACT_NATIVE_WRAPPERS : [], patterns }];
}

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'web-build/**',
      'ios/**',
      'android/**',
      'coverage/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        // `const { dropped, ...rest } = x` keeps `rest` without `dropped`.
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    // No casts outside tests: data from the network, SQLite or AsyncStorage
    // is checked (type guards, parsers) instead of asserted. `as const` and
    // `satisfies` stay allowed. Tests build partial objects and keep casts.
    files: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts', 'app/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    // Design system rules (CLAUDE.md, Theming), enforced here instead of only
    // in review. Colors come from useTheme(); a palette that is data (team
    // colors, the splash) lives in a .ts file (entities/team/lib, app/splash).
    files: ['src/**/*.tsx', 'app/**/*.tsx'],
    ignores: TESTS,
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}|rgba?\\(|hsla?\\()/]',
          message:
            'Hardcoded color: use a token from useTheme() (src/shared/theme/theme.ts).',
        },
      ],
      'react-native/no-inline-styles': 'error',
    },
  },
  // Feature-Sliced Design (CLAUDE.md, Architecture): app > pages > features >
  // entities > shared. A layer imports only from the layers below it, and a
  // slice never from another slice of its own layer. Another slice is reached
  // by its `@/` path, which these patterns check; `../../` would leave the
  // slice unchecked, so it is refused. The react-native wrappers ride along,
  // since a file has one `no-restricted-imports` setting.
  {
    files: ['src/**/*.tsx', 'app/**/*.tsx'],
    ignores: TESTS,
    rules: { 'no-restricted-imports': layerRule([]) },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: {
      'no-restricted-imports': layerRule([
        '@/app/**',
        '@/pages/**',
        '@/features/**',
        '@/entities/**',
      ]),
    },
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: {
      'no-restricted-imports': layerRule(
        ['@/app/**', '@/pages/**', '@/features/**', '@/entities/**'],
        true,
      ),
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: {
      'no-restricted-imports': layerRule(
        ['@/app/**', '@/pages/**', '@/features/**'],
        true,
      ),
    },
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    ignores: TESTS,
    rules: {
      'no-restricted-imports': layerRule(['@/app/**', '@/pages/**'], true),
    },
  },
  {
    // The two wrappers: the only places that use the bare Switch and Text.
    files: ['src/shared/ui/ThemedSwitch.tsx', 'src/shared/ui/AppText.tsx'],
    rules: {
      'no-restricted-imports': layerRule(
        ['@/app/**', '@/pages/**', '@/features/**', '@/entities/**'],
        false,
        false,
      ),
    },
  },
  {
    // The Cloudflare Worker, pasted in the dashboard as plain JavaScript.
    files: ['infra/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.serviceworker,
    },
    plugins: { prettier: prettierPlugin },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
    },
  },
];
