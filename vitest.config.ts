import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Unit and integration test configuration.
 *
 * Node environment by default: everything under `tests/unit` exercises pure
 * modules or reads the repository as text. Browser behaviour is covered by
 * Playwright in `tests/e2e`, which is deliberately kept out of this run so a
 * `vitest` invocation stays fast enough to sit in a pre-commit loop.
 *
 * The `@/` alias mirrors `tsconfig.json` so tests import modules by exactly the
 * specifier the application uses.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
      { find: /^@sanity-schema\//, replacement: fileURLToPath(new URL('./sanity/', import.meta.url)) },
    ],
  },
  test: {
    // Tests live in `tests/unit`, but co-located suites under `src` are picked up
    // too: a test file that the runner never finds is worse than no test at all.
    include: ['tests/unit/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    environment: 'node',
    // No globals: every test imports `describe`/`it`/`expect` explicitly, so the
    // files type-check under the project's strict tsconfig without extra types.
    globals: false,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 20_000,
    // The design-system guard spawns `node scripts/check-contrast.mjs`.
    hookTimeout: 30_000,
  },
})
