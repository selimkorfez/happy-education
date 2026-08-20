import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration.
 *
 * The specs are written against routes and user-visible behaviour, never against
 * component internals, so they keep their meaning while the page templates are
 * still being built. Behaviour whose route does not exist yet is marked
 * `test.fixme()` rather than deleted: the suite then documents the intended
 * behaviour without failing the build, and the marker is the reminder to switch
 * it on.
 *
 * One Chromium project. Mobile behaviour is covered by specs that set their own
 * viewport, which keeps CI to a single browser download.
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3000)

/**
 * `localhost`, not `127.0.0.1`: Next.js 16's dev server rejects requests for
 * `/_next/static/*` whose origin it does not recognise, so an IP-literal base URL
 * gets 403s on every client chunk, the page never hydrates, and every interaction
 * test fails for a reason that has nothing to do with the code under test.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

// Set for the runner as well as the web server: specs read this to decide
// whether the rate-limiting spec applies.
process.env.E2E_DISABLE_RATE_LIMIT ??= '1'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Next.js compiles routes on demand in dev, so the first hit on a route can be
  // slow. These budgets are generous on purpose; they are not a performance test.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    // Locale negotiation is exercised explicitly; the default browser language is
    // pinned so the redirect from `/` is deterministic.
    locale: 'en-GB',
    timezoneId: 'Europe/London',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? 'npm run dev',
    /*
     * The limiter's counters are per-process and shared across the whole run, so
     * specs that post several times would exhaust the allowance and fail the
     * specs after them for the wrong reason. The flag is ignored in production
     * builds (see src/lib/rate-limit.ts). Rate limiting itself is covered by its
     * own spec, which sets the flag back off.
     */
    env: { ...process.env, E2E_DISABLE_RATE_LIMIT: '1' },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
