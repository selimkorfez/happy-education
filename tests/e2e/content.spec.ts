import { expect, test } from '@playwright/test'

/**
 * Content templates.
 *
 * Every test here is `fixme` until the route it describes renders real content:
 * the templates are being built in another track, and a spec that fails for a
 * missing route teaches nobody anything. They are written now so the intended
 * behaviour is agreed in advance, and switching one on is a one-word change.
 *
 * These assert user-visible behaviour only: a heading, a breadcrumb trail, a
 * canonical link, a working link into the next step of the journey. Nothing here
 * depends on how a template is composed internally.
 */

test.describe('destination page', () => {
  test('renders a country page with one h1 and a breadcrumb trail', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText(/United Kingdom/i)

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: 'Universities' })).toHaveAttribute(
      'href',
      '/en/universities',
    )
  })

  test('links to the institutions it lists', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    const links = page.locator('main a[href^="/en/universities/"]')
    expect(await links.count()).toBeGreaterThan(0)
  })

  test('serves the Turkish equivalent under the Turkish slug', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere')
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('declares a canonical URL and its hreflang alternates', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/en\/universities\/united-kingdom$/,
    )
    await expect(page.locator('link[rel="alternate"][hreflang="tr-TR"]')).toHaveCount(1)
  })
})

test.describe('institution page', () => {
  test('renders the institution with verifiable facts only', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom/university-of-leeds')

    await expect(page.locator('h1')).toHaveCount(1)
    const body = (await page.locator('body').innerText()).toLowerCase()
    for (const claim of ['success rate', 'guaranteed', 'british council', 'icef']) {
      expect(body, claim).not.toContain(claim)
    }
  })

  test('offers an enquiry route from the page', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom/university-of-leeds')
    await expect(page.getByRole('link', { name: /Speak to an adviser|Ask about/i }).first()).toBeVisible()
  })
})

test.describe('article page', () => {
  test('renders an article with its published date and reading time', async ({ page }) => {
    await page.goto('/en/insights')
    const firstArticle = page.locator('main a[href^="/en/insights/"]').first()
    await firstArticle.click()

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}/)
  })

  test('opens external references in a new tab, safely', async ({ page }) => {
    await page.goto('/en/insights')
    const external = page.locator('main a[target="_blank"]')
    const count = await external.count()
    for (let i = 0; i < count; i += 1) {
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/)
    }
  })

  test('never renders raw HTML from the CMS', async ({ page }) => {
    await page.goto('/en/insights')
    const html = await page.content()
    expect(html).not.toContain('&lt;script')
  })
})

test.describe('search', () => {
  test('finds a page by name and is not indexable', async ({ page }) => {
    const response = await page.goto('/en/search?q=leeds')
    expect(response?.headers()['x-robots-tag']).toContain('noindex')

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('searchbox')).toHaveValue('leeds')
  })

  test('states plainly when there are no results', async ({ page }) => {
    await page.goto('/en/search?q=zzzzzzzznotathing')
    await expect(page.getByText('No results found')).toBeVisible()
  })

  test('searches the Turkish tree from the Turkish route', async ({ page }) => {
    await page.goto('/tr/arama?q=ingiltere')
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
  })
})

test.describe('sitemap and feeds', () => {
  test('serves robots.txt without a locale prefix', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('User-Agent')
  })

  test('lists both locale trees in the sitemap', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    const xml = await response.text()
    expect(xml).toContain('/en')
    expect(xml).toContain('/tr')
  })
})
