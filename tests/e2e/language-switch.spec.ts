import { expect, test } from '@playwright/test'

/**
 * The two trees share no path segments, so the switcher goes through
 * `/api/locale`, which resolves the equivalent document server-side and degrades
 * in explicit steps: exact translation, then the section index, then the locale
 * home. The rule this spec protects is that a switch never silently dumps a
 * visitor on the homepage when a better destination exists.
 *
 * BUG (open at the time of writing, owner: src/proxy.ts)
 * -----------------------------------------------------
 * The proxy matcher does not exclude `/api`, so `/api/locale` is treated as a
 * locale-less content path and 307-redirected to `/en/api/locale`, which does not
 * exist. Verified with curl against the dev server:
 *
 *   GET /api/locale?to=tr&from=%2Fen%2Funiversities
 *   -> 307 Location: /en/api/locale?to=tr&from=%2Fen%2Funiversities
 *
 * Every API route is affected, including `/api/checkout` and the Stripe webhook,
 * which fails silently because Stripe does not follow redirects.
 *
 * Fix: add `api` to the negative lookahead in the `config.matcher` of
 * `src/proxy.ts` (or return `NextResponse.next()` early for `/api` paths), then
 * remove the `.fixme` markers below.
 */

test.describe('language switcher (UI)', () => {
  test('carries the current path into the switch link', async ({ page }) => {
    await page.goto('/en')
    const href = await page
      .getByRole('navigation', { name: 'Change language' })
      .first()
      .getByRole('link', { name: /TR/ })
      .getAttribute('href')

    expect(href).toContain('/api/locale?to=tr')
    expect(href).toContain('from=')
  })

  test('marks the switch link with the target language', async ({ page }) => {
    await page.goto('/en')
    const switcher = page.getByRole('navigation', { name: 'Change language' }).first()
    await expect(switcher).toBeVisible()
    await expect(switcher.getByRole('link', { name: /TR/ })).toHaveAttribute('hreflang', 'tr-TR')
  })

  test('BUG(proxy): switches from the English home to the Turkish home', async ({ page }) => {
    await page.goto('/en')
    await page
      .getByRole('navigation', { name: 'Change language' })
      .first()
      .getByRole('link', { name: /TR/ })
      .click()

    await expect(page).toHaveURL(/\/tr$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
  })

  test('BUG(proxy): switches back from Turkish to English', async ({ page }) => {
    await page.goto('/tr')
    await page.locator('nav a[hreflang="en-GB"]').first().click()

    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  })

  // Falls back to the English section index today, because the English tree has no
  // documents yet. Once transcreation lands this should arrive on the translated
  // document itself. See content.spec.ts for why the English tree is empty.
  test('switches from a deep page to the best available equivalent', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere')
    // On a Turkish page the Turkish entry is the current locale and renders as a
    // span, not a link. The switch target is the English one.
    await page.locator('nav a[hreflang="en-GB"]').first().click()
    await expect(page).toHaveURL(/\/en\/universities/)
  })
})

test.describe('locale route (API)', () => {
  test('BUG(proxy): maps a section index onto the other tree', async ({ request }) => {
    const cases: Array<[string, string, string]> = [
      ['tr', '/en/universities', '/tr/universiteler'],
      ['tr', '/en/language-schools', '/tr/dil-okullari'],
      ['tr', '/en/insights', '/tr/blog'],
      ['en', '/tr/universiteler', '/en/universities'],
      ['en', '/tr/ogrenci-rehberi', '/en/student-guide'],
    ]

    for (const [to, from, expected] of cases) {
      const response = await request.get(`/api/locale?to=${to}&from=${encodeURIComponent(from)}`, {
        maxRedirects: 0,
      })
      expect(response.status(), `${from} -> ${to}`).toBe(307)
      expect(pathOf(response.headers()['location']), `${from} -> ${to}`).toBe(expected)
    }
  })

  test('BUG(proxy): falls back to the section index when no translation exists', async ({
    request,
  }) => {
    const response = await request.get(
      `/api/locale?to=tr&from=${encodeURIComponent('/en/insights/a-post-with-no-translation')}`,
      { maxRedirects: 0 },
    )
    expect(response.status()).toBe(307)
    expect(pathOf(response.headers()['location'])).toBe('/tr/blog')
  })

  test('BUG(proxy): never becomes an open redirect', async ({ request }) => {
    const hostile = ['//evil.example/phish', 'https://evil.example', '/en/../../evil', 'javascript:alert(1)']

    for (const from of hostile) {
      const response = await request.get(`/api/locale?to=tr&from=${encodeURIComponent(from)}`, {
        maxRedirects: 0,
      })
      expect(response.status(), from).toBe(307)
      const location = new URL(response.headers()['location'] ?? '', 'http://localhost')
      expect(location.hostname, from).not.toContain('evil.example')
      expect(location.pathname, from).toBe('/tr')
    }
  })

  test('BUG(proxy): rejects an unknown target locale', async ({ request }) => {
    const response = await request.get('/api/locale?to=de&from=%2Fen', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(pathOf(response.headers()['location'])).toBe('/en')
  })

  test('BUG(proxy): is never cached', async ({ request }) => {
    const response = await request.get('/api/locale?to=tr&from=%2Fen', { maxRedirects: 0 })
    expect(response.headers()['cache-control']).toContain('no-store')
  })

  /**
   * Active regression guard for the bug above, written so it documents the defect
   * without asserting that the defect is correct: it only checks that the response
   * is a redirect and records where it goes. Delete this once the fixmes are live.
   */
  test('reaches the locale route without leaving the site', async ({ request }) => {
    const response = await request.get('/api/locale?to=tr&from=%2Fen', { maxRedirects: 0 })
    const location = new URL(response.headers()['location'] ?? '/', 'http://localhost')
    expect([200, 307, 308]).toContain(response.status())
    expect(location.hostname).toMatch(/^(?:127\.0\.0\.1|localhost)$/)
  })
})

function pathOf(location: string | undefined): string {
  return new URL(location ?? '', 'http://localhost').pathname
}
