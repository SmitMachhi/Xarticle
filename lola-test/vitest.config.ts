import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', 'frontend/**', 'services/**', 'tests/e2e/**'],
    include: ['src/**/*.test.ts'],
  },
});
