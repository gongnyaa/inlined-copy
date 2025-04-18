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
      exclude: [
        'coverage/**',
        'dist/**',
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.mock.ts',
        'vitest.setup.ts',
        'vitest.config.ts',
        'eslint.config.js',
        '**/[.,-]*{test,spec,bench,benchmark}?([-.])*',
        '**/tests/**',
      ],
      include: ['src/**/*.ts'],
      reporter: ['text', 'json', 'html'],
      all: true,
    },
  },
});
