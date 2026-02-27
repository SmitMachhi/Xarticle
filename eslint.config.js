import js from '@eslint/js'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sonarjs from 'eslint-plugin-sonarjs'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const structuralRules = {
  'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true }],
  complexity: ['warn', 10],
  'max-depth': ['warn', 3],
}

const hygieneRules = {
  'no-console': 'error',
  'no-eval': 'error',
  'no-magic-numbers': [
    'warn',
    {
      ignore: [-1, 0, 1, 2],
      ignoreArrayIndexes: true,
      ignoreDefaultValues: true,
      ignoreClassFieldInitialValues: true,
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
  'simple-import-sort/exports': 'warn',
  'simple-import-sort/imports': 'warn',
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
      'sonarjs/no-identical-functions': 'warn',
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
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': ['warn', { checksVoidReturn: false }],
    },
  },
  {
    files: ['worker/**/*.js', 'services/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.worker,
      },
    },
  },
  {
    files: ['extension/**/*.js'],
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
      'src/App.tsx',
      'worker/index.js',
      'services/threadloom/src/worker.js',
      'playwright.config.ts',
      'eslint.config.js',
      'vite.config.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['worker/index.js'],
    rules: {
      'no-unused-vars': 'warn',
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
    files: ['src/features/**/*.{ts,tsx,js}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['src/features/*/*'],
              message: 'Import through feature public entrypoints to preserve feature boundaries.',
            },
          ],
        },
      ],
    },
  },
])
