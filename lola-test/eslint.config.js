import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
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
  globalIgnores(['node_modules', 'dist', '.wrangler', 'coverage']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.worker,
      },
    },
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
      sonarjs,
    },
    rules: {
      ...structuralRules,
      ...hygieneRules,
      ...importRules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'sonarjs/no-identical-functions': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['eslint.config.js'],
    rules: {
      'import/no-default-export': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['src/index.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['src/constants.ts'],
    rules: {
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'no-magic-numbers': 'off',
    },
  },
  {
    files: ['supabase/functions/**/*.ts'],
    languageOptions: {
      globals: {
        Deno: 'readonly',
      },
    },
    rules: {
      complexity: 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'no-magic-numbers': 'off',
    },
  },
])
