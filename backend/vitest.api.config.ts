import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./e2e-api/setup.ts'],
    include: ['e2e-api/**/*.spec.ts'],
    testTimeout: 15_000,
  },
});
