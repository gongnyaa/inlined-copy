import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/out/**'],
    server: {
      deps: {
        external: ['vscode'],
      },
    },
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      exclude: ['vitest.setup.ts'],
    },
  },
});
