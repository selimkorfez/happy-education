import { expect, test } from '@playwright/test'

/**
 * The two trees share no path segments, so the switcher goes through
 * `/api/locale`, which resolves the equivalent document server-side and degrades
 * in explicit steps: exact translation, then the section index, then the locale
 * home. The rule this spec protects is that a switch never silently dumps a
 * visitor on the homepage when a better destination exists.
 *
 * Code-backed English catalogue profiles are also exact counterparts while the
 * full English CMS migration is in progress. The switch must preserve the item,
 * country and summer-programme format instead of dropping to a section index.
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

  test('switches from the English home to the Turkish home', async ({ page }) => {
    await page.goto('/en')
    await page
      .getByRole('navigation', { name: 'Change language' })
      .first()
      .getByRole('link', { name: /TR/ })
      .click()

    await expect(page).toHaveURL(/\/tr$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
  })

  test('switches back from Turkish to English', async ({ page }) => {
    await page.goto('/tr')
    await page.locator('nav a[hreflang="en-GB"]').first().click()

    await expect(page).toHaveURL(/\/en$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  })

  test('switches from a deep page to the best available equivalent', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere/anglia-ruskin-university')
    // On a Turkish page the Turkish entry is the current locale and renders as a
    // span, not a link. The switch target is the English one.
    await page.locator('nav a[hreflang="en-GB"]').first().click()
    await expect(page).toHaveURL(/\/en\/universities\/united-kingdom\/anglia-ruskin-university$/)
    await expect(page.locator('h1')).toContainText(/Anglia Ruskin/i)
  })
})

test.describe('locale route (API)', () => {
  test('maps a section index onto the other tree', async ({ request }) => {
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

  test('preserves exact code-backed catalogue counterparts', async ({ request }) => {
    const cases: Array<[string, string, string]> = [
      ['en', '/tr/universiteler/ingiltere', '/en/universities/united-kingdom'],
      ['en', '/tr/dil-okullari/guney-afrika', '/en/language-schools/south-africa'],
      ['en', '/tr/dil-okullari/dubai', '/en/language-schools/united-arab-emirates'],
      ['en', '/tr/universiteler/ingiltere/anglia-ruskin-university', '/en/universities/united-kingdom/anglia-ruskin-university'],
      ['tr', '/en/universities/united-kingdom/anglia-ruskin-university', '/tr/universiteler/ingiltere/anglia-ruskin-university'],
      ['en', '/tr/yatili-okullar/cats-cambridge', '/en/boarding-schools/cats-cambridge'],
      ['en', '/tr/yaz-okullari/bireysel/sir-edward-cambridge', '/en/summer-schools/individual/sir-edward-cambridge'],
      ['tr', '/en/summer-schools/individual/sir-edward-cambridge', '/tr/yaz-okullari/bireysel/sir-edward-cambridge'],
      ['en', '/tr/turlar/ingiltere-turu', '/en/tours/england-tour'],
      ['tr', '/en/tours/italy-tour', '/tr/turlar/italya-turu'],
    ]

    for (const [to, from, expected] of cases) {
      const response = await request.get(`/api/locale?to=${to}&from=${encodeURIComponent(from)}`, {
        maxRedirects: 0,
      })
      expect(response.status(), `${from} -> ${to}`).toBe(307)
      expect(pathOf(response.headers()['location']), `${from} -> ${to}`).toBe(expected)
    }
  })

  test('every published Turkish catalogue route switches to a working English page', async ({ request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    const catalogue = /^\/tr\/(?:universiteler|dil-okullari|yatili-okullar|yaz-okullari|turlar)\/.+/
    const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => new URL(match[1]).pathname)
      .filter((path) => catalogue.test(path))

    for (let index = 0; index < paths.length; index += 10) {
      const batch = paths.slice(index, index + 10)
      const results = await Promise.all(batch.map(async (from) => {
        const switched = await request.get(
          `/api/locale?to=en&from=${encodeURIComponent(from)}`,
          { maxRedirects: 0 },
        )
        const target = pathOf(switched.headers()['location'])
        const targetResponse = await request.get(target, { maxRedirects: 0 })
        return { from, target, status: targetResponse.status() }
      }))

      for (const result of results) {
        expect(result.status, `${result.from} -> ${result.target}`).toBeLessThan(400)
      }
    }
  })

  test('falls back to the section index when no translation exists', async ({
    request,
  }) => {
    const response = await request.get(
      `/api/locale?to=tr&from=${encodeURIComponent('/en/insights/a-post-with-no-translation')}`,
      { maxRedirects: 0 },
    )
    expect(response.status()).toBe(307)
    expect(pathOf(response.headers()['location'])).toBe('/tr/blog')
  })

  test('never becomes an open redirect', async ({ request }) => {
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

  test('rejects an unknown target locale', async ({ request }) => {
    const response = await request.get('/api/locale?to=de&from=%2Fen', { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(pathOf(response.headers()['location'])).toBe('/en')
  })

  test('is never cached', async ({ request }) => {
    const response = await request.get('/api/locale?to=tr&from=%2Fen', { maxRedirects: 0 })
    expect(response.headers()['cache-control']).toContain('no-store')
  })

  /**
   * Regression guard: preview deployments use a different host from local tests,
   * but the redirect must always remain on the configured test origin.
   */
  test('reaches the locale route without leaving the site', async ({ request }) => {
    const response = await request.get('/api/locale?to=tr&from=%2Fen', { maxRedirects: 0 })
    const location = new URL(response.headers()['location'] ?? '/', 'http://localhost')
    const expectedOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000').origin
    expect([200, 307, 308]).toContain(response.status())
    expect(location.origin).toBe(expectedOrigin)
  })
})

function pathOf(location: string | undefined): string {
  return new URL(location ?? '', 'http://localhost').pathname
}
