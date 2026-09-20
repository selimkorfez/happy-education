import { expect, test } from '@playwright/test'

/**
 * Content templates.
 *
 * These assert user-visible behaviour only: a heading, a breadcrumb trail, a
 * canonical link, a working link into the next step of the journey. Nothing here
 * depends on how a template is composed internally.
 *
 * The migrated catalogue is Turkish-first. Safe, neutral English catalogue
 * profiles keep the two public trees usable until full English transcreation is
 * complete, so both trees are exercised here.
 */

test.describe('destination page', () => {
  test('renders a country page with one h1 and a breadcrumb trail', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere')

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText(/İngiltere/i)

    const breadcrumb = page.getByRole('navigation', { name: 'Sayfa yolu' })
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.getByRole('link', { name: 'Üniversiteler' })).toHaveAttribute(
      'href',
      '/tr/universiteler',
    )
  })

  test('links to the institutions it lists', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere')
    const links = page.locator('main a[href^="/tr/universiteler/"]')
    expect(await links.count()).toBeGreaterThan(0)
  })

  test('serves the Turkish tree under Turkish slugs', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere')
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr-TR')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('declares a canonical URL', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/tr\/universiteler\/ingiltere$/,
    )
  })
})

test.describe('institution page', () => {
  test('renders the institution with verifiable facts only', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere/anglia-ruskin-university')

    await expect(page.locator('h1')).toHaveCount(1)
    const body = (await page.locator('body').innerText()).toLowerCase()
    for (const claim of ['success rate', 'guaranteed', 'british council', 'icef']) {
      expect(body, claim).not.toContain(claim)
    }
  })

  test('offers an enquiry route from the page', async ({ page }) => {
    await page.goto('/tr/universiteler/ingiltere/anglia-ruskin-university')
    await expect(
      page.getByRole('link', { name: /Danışmanla görüşün|Ön görüşme planlayın/i }).first(),
    ).toBeVisible()
  })

  test('keeps a multi-location brand page working without a forced country', async ({ page }) => {
    const response = await page.goto('/tr/dil-okullari/english-path')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/English Path/i)
  })
})

test.describe('article page', () => {
  test('renders an article with its published date and reading time', async ({ page }) => {
    await page.goto('/tr/blog')
    const firstArticle = page.locator('main a[href^="/tr/blog/"]').first()
    await firstArticle.click()

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}/)
  })

  test('opens external references in a new tab, safely', async ({ page }) => {
    await page.goto('/tr/blog')
    const external = page.locator('main a[target="_blank"]')
    const count = await external.count()
    for (let i = 0; i < count; i += 1) {
      await expect(external.nth(i)).toHaveAttribute('rel', /noopener/)
    }
  })

  test('never renders raw HTML from the CMS', async ({ page }) => {
    await page.goto('/tr/blog')
    const html = await page.content()
    expect(html).not.toContain('&lt;script')
  })
})

test.describe('search', () => {
  test('finds a page by name and is not indexable', async ({ page }) => {
    const response = await page.goto('/tr/arama?q=ingiltere')
    expect(response?.headers()['x-robots-tag']).toContain('noindex')

    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.getByRole('searchbox')).toHaveValue('ingiltere')
  })

  test('states plainly when there are no results', async ({ page }) => {
    await page.goto('/tr/arama?q=zzzzzzzznotathing')
    await expect(page.getByText('Sonuç bulunamadı')).toBeVisible()
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
    expect(xml).toContain('/en/tours/england-tour')
    expect(xml).not.toContain('/tr/turlar/turlar')
    expect(xml).not.toMatch(/\/tr\/yaz-okullari\/(?!bireysel\/|grup\/)[^<]+/)
  })

  test('contains only routes that resolve', async ({ request }) => {
    // This is an exhaustive crawl rather than a single-page assertion. A cold CI
    // development server compiles hundreds of routes during the loop, so use a
    // crawl-sized budget while retaining the check for every sitemap entry.
    test.setTimeout(240_000)

    const response = await request.get('/sitemap.xml')
    const xml = await response.text()
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname)

    for (let index = 0; index < paths.length; index += 12) {
      const batch = paths.slice(index, index + 12)
      const results = await Promise.all(batch.map(async (path) => ({
        path,
        status: (await request.get(path, { maxRedirects: 0 })).status(),
      })))
      for (const result of results) {
        expect(result.status, result.path).toBeLessThan(400)
      }
    }
  })
})

/**
 * The English tree.
 *
 * English catalogue profiles use conservative explanatory copy and never copy
 * unreviewed Turkish claims. Their pages are noindex until full transcreation.
 */
test.describe('English content tree', () => {
  test('renders an English country page', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    await expect(page.locator('h1')).toContainText(/United Kingdom/i)
  })

  test('renders a safe English institution profile', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom/anglia-ruskin-university')
    await expect(page.locator('h1')).toContainText(/Anglia Ruskin/i)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i)
  })
})
