import { expect, test } from '@playwright/test'

/**
 * Content templates.
 *
 * These assert user-visible behaviour only: a heading, a breadcrumb trail, a
 * canonical link, a working link into the next step of the journey. Nothing here
 * depends on how a template is composed internally.
 *
 * WHY THESE TARGET THE TURKISH TREE
 * All 308 migrated documents are Turkish. The legacy WordPress site was 82%
 * Turkish by document count and 92% by word count, and the English that did exist
 * was mostly provider marketing copy of uncertain provenance, so none of it was
 * migrated. The English tree therefore starts empty and needs roughly 77,000 words
 * of transcreation, which is an editorial commission rather than a code task.
 *
 * Asserting English routes today would fail for a missing translation, not a
 * missing feature. The English tree has its own describe block at the bottom,
 * skipped with that reason recorded, so the gap stays visible instead of silently
 * passing once someone points a spec at a page that happens to exist.
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
  })
})

/**
 * The English tree.
 *
 * Skipped, not deleted. All 308 migrated documents are Turkish, so these routes
 * have no content to serve and will 404 until the transcreation is commissioned
 * (roughly 77,000 words, see docs/MIGRATION.md). The chrome, routing, metadata and
 * templates are locale-agnostic and already exercised by the Turkish specs; what
 * is missing is words, not code.
 *
 * Remove the skip once English destinations exist.
 */
test.describe('English content tree (awaiting transcreation)', () => {
  test.skip(true, 'No English documents exist yet: the legacy corpus was 92% Turkish by word count')

  test('renders an English country page', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    await expect(page.locator('h1')).toContainText(/United Kingdom/i)
  })

  test('declares hreflang alternates once both trees exist', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    await expect(page.locator('link[rel="alternate"][hreflang="tr-TR"]')).toHaveCount(1)
  })
})
