import { expect, test } from '@playwright/test'

/**
 * Error states.
 *
 * A migrated site inherits a long tail of dead URLs, so the 404 page is a real
 * piece of navigation: it has to say what happened in plain words and offer a way
 * onwards in the visitor's own language.
 */

test.describe('404', () => {
  test('returns a 404 status for an unknown path', async ({ page }) => {
    const response = await page.goto('/en/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
  })

  test('explains the miss and offers a way onwards, in English', async ({ page }) => {
    await page.goto('/en/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: /could not find that page/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Universities/i }).first()).toBeVisible()
  })

  test('explains the miss in Turkish on the Turkish tree', async ({ page }) => {
    await page.goto('/tr/bu-sayfa-yok')
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
    await expect(page.getByRole('heading', { name: /bulamadık/i })).toBeVisible()
  })

  test('keeps the header and footer available on a 404', async ({ page }) => {
    await page.goto('/en/this-page-does-not-exist')
    await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })

  test('is not indexable', async ({ page }) => {
    const response = await page.goto('/en/this-page-does-not-exist')

    // The 404 status is the authoritative signal to a crawler; the meta tag is the
    // explicit belt-and-braces one. Read it from the DOM rather than through a
    // locator, because a <meta> in <head> is not a matchable element for
    // Playwright's auto-waiting locator API.
    expect(response?.status()).toBe(404)

    const robots = response?.headers()['x-robots-tag'] ?? ''
    const meta = await page.evaluate(
      () => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
    )
    expect(`${robots} ${meta}`).toContain('noindex')
  })
})

test.describe('legacy URL redirects', () => {
  // The migration carries 395 redirect rows. Once the redirect map is wired up,
  // these should assert a 301 to the new path rather than a 404.
  test('redirects a legacy WordPress path to its new home', async ({ request, page }) => {
    const response = await request.get('/anasayfa/iletisim/', { maxRedirects: 0 })
    // Two permanent hops: Next's 308 trailing-slash normalisation, then the 301
    // from redirects.csv. Both are permanent and crawlers follow them, so what
    // matters is where the chain lands.
    expect([301, 308]).toContain(response.status())
    const landed = await page.goto('/anasayfa/iletisim/')
    expect(landed?.status()).toBe(200)
    expect(page.url()).toContain('/tr/iletisim')
  })

  test('redirects a legacy blog path into the Turkish insights tree', async ({ request, page }) => {
    const response = await request.get('/blog/dunyanin-en-iyi-universiteleri/', { maxRedirects: 0 })
    expect([301, 308]).toContain(response.status())
    const landed = await page.goto('/dunyanin-en-iyi-universiteleri/')
    // The CMS is not yet populated, so the destination is a legitimate 404 until
    // the migration is committed. The redirect target is what this asserts.
    expect(page.url()).toContain('/tr/blog/')
    expect([200, 404]).toContain(landed?.status() ?? 0)
  })
})

test.describe('unknown locale prefixes', () => {
  test('sends a locale-less content path into a locale tree', async ({ page }) => {
    const response = await page.goto('/some-old-path')
    // The proxy redirects into the negotiated locale; what is served there is the
    // 404 template once it exists.
    expect(page.url()).toMatch(/\/(en|tr)\/some-old-path$/)
    expect(response?.status()).toBeLessThan(500)
  })
})
