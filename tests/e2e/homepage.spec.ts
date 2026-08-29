import { expect, test } from '@playwright/test'

/**
 * The two locale homepages carry the checks that apply site-wide: document
 * language, a single h1, primary navigation paths, and the security headers the
 * proxy sets. Copy assertions follow the current approved homepage experience.
 */

test.describe('English homepage', () => {
  test('serves an English document with one h1', async ({ page }) => {
    await page.goto('/en')

    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Your next chapter starts somewhere new.')
    await expect(page).toHaveTitle(/Happy Education/)
  })

  test('shows only verifiable credentials in the hero', async ({ page }) => {
    await page.goto('/en')

    const hero = page.locator('main section').first()
    await expect(hero).toContainText('Company no. 11331426')

    // Nothing that cannot be evidenced may appear on the page.
    const body = (await page.locator('body').innerText()).toLowerCase()
    for (const claim of ['500+', '700+', '200+', '150+', 'british council', 'icef', 'success rate']) {
      expect(body, claim).not.toContain(claim)
    }
  })

  test('offers the primary calls to action', async ({ page }) => {
    await page.goto('/en')

    await expect(
      page.getByRole('link', { name: /Plan my next step/ }).first(),
    ).toHaveAttribute('href', '/en/free-consultation')
    await expect(
      page.getByRole('link', { name: 'Explore study options' }).first(),
    ).toHaveAttribute('href', '/en/universities')
  })

  test('exposes the skip link as the first tab stop', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('Tab')

    const focused = page.locator(':focus')
    await expect(focused).toHaveText('Skip to main content')
    await expect(focused).toHaveAttribute('href', '#main-content')
  })
})

test.describe('Turkish homepage', () => {
  test('serves a Turkish document with one h1', async ({ page }) => {
    await page.goto('/tr')

    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText('Yeni bölümünüz başka bir yerde başlasın.')
  })

  test('links into the Turkish tree, never the English one', async ({ page }) => {
    await page.goto('/tr')

    const hrefs = await page.locator('main a[href^="/"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    )
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href, href).not.toMatch(/^\/en(\/|$)/)
    }
  })
})

test.describe('locale negotiation', () => {
  test('sends a bare root to a locale root', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/en$/)
  })

  test('honours an explicit locale over the browser language', async ({ page }) => {
    await page.goto('/tr')
    await expect(page).toHaveURL(/\/tr$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
  })
})

test.describe('security headers', () => {
  test('sets a nonce-based CSP and the hardening headers', async ({ page }) => {
    const response = await page.goto('/en')
    const headers = response?.headers() ?? {}

    const csp = headers['content-security-policy'] ?? ''
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("form-action 'self'")
    expect(csp).toMatch(/script-src[^;]*'nonce-/)
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)

    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['x-frame-options']).toBe('DENY')
  })
})
