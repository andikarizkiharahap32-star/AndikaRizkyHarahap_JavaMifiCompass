import { defineWorkspace } from 'vitest/config';

/**
 * P23: Testing Strategy - Monorepo Vitest Workspace
 *
 * Requirements:
 * - Layered test pyramid across packages and applications.
 * - Coverage threshold gates: lines >= 75%, statements >= 75%, functions >= 75%, branches >= 70%.
 * - Prohibits sleep-based waiting and unisolated test state.
 */
export default defineWorkspace([
  {
    test: {
      name: 'shared',
      root: './packages/shared',
      environment: 'node',
      globals: true,
      include: ['tests/**/*.test.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        thresholds: {
          lines: 75,
          statements: 75,
          functions: 75,
          branches: 70,
        },
      },
    },
  },
  {
    test: {
      name: 'api',
      root: './apps/api',
      environment: 'node',
      globals: true,
      include: ['test/**/*.test.ts', 'src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        thresholds: {
          lines: 75,
          statements: 75,
          functions: 75,
          branches: 70,
        },
      },
    },
  },
]);
