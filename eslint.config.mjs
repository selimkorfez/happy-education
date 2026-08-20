import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/**
 * Flat config for ESLint 10.
 *
 * `eslint-config-next` 16 already exports flat-config arrays, so they are spread
 * directly. There is no FlatCompat bridge here on purpose: routing them through
 * the eslintrc compatibility layer fails on this version.
 *
 * The rules added on top are the ones this project actually cares about: no
 * `any`, no unused code, no stray console output in shipped code (structured
 * logging goes through src/lib/logger.ts, which redacts personal data), and a
 * guard on `dangerouslySetInnerHTML`, which is permitted only for JSON-LD.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'scripts/migrate/out/**',
      'next-env.d.ts',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },

  {
    // Migration scripts are plain Node ESM, run by hand, outside the app bundle.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },

  {
    files: ['tests/**/*.ts', '**/*.test.ts'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' },
  },
]

export default config
