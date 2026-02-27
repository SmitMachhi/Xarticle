import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sonarjs from 'eslint-plugin-sonarjs'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const structuralRules = {
  'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true }],
  complexity: ['error', 10],
  'max-depth': ['error', 3],
}

const hygieneRules = {
  'no-console': 'error',
  'no-eval': 'error',
  'no-magic-numbers': [
    'error',
    {
      ignore: [-1, 0, 1, 2],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreClassFieldInitialValues: true,
      ignoreNumericLiteralTypes: true,
      enforceConst: true,
      detectObjects: false,
    },
  ],
  'no-var': 'error',
  'prefer-const': 'error',
}

const importRules = {
  'import/no-cycle': 'error',
  'import/no-default-export': 'error',
  'import/no-duplicates': 'error',
  'simple-import-sort/exports': 'error',
  'simple-import-sort/imports': 'error',
}

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'output',
    '.playwright-cli',
    '.wrangler',
    'coverage',
  ]),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended],
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      sonarjs,
    },
    rules: {
      ...structuralRules,
      ...hygieneRules,
      ...importRules,
      'sonarjs/no-identical-functions': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    },
  },
  {
    files: ['worker/**/*.{js,ts}', 'services/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.worker,
      },
    },
  },
  {
    files: ['extension/**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.serviceworker,
      },
    },
  },
  {
    files: [
      'src/main.tsx',
      'src/app/App.tsx',
      'worker/src/index.ts',
      'playwright.config.ts',
      'eslint.config.js',
      'vite.config.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['eslint.config.js', 'vite.config.ts', 'playwright.config.ts'],
    rules: {
      'no-magic-numbers': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
    },
  },
  {
    files: ['**/constants.{js,ts}'],
    rules: {
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx,js}', 'tests/**/*.{ts,tsx,js}', 'src/lib/__tests__/**/*.{ts,tsx,js}'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['src/features/*/*'],
              message: 'Import via feature public entrypoints only.',
            },
          ],
        },
      ],
    },
  },
])
