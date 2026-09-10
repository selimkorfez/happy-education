import { expect, test } from '@playwright/test'

for (const locale of ['en', 'tr']) {
  test(`${locale} homepage uses the dedicated loaded Cambridge hero on mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`/${locale}`)
    const hero = page.locator('main img[src*="home-cambridge"]')
    await expect(hero).toHaveCount(1)
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    await expect(hero).toHaveAttribute('alt', /River Cam/)
    await expect(page.getByRole('link', { name: 'Andrew Dunn', exact: true })).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('article listing has distinct photos that also appear on the linked articles', async ({ page }) => {
  await page.goto('/en/insights')
  const expected = ['bright-library', 'notebook', 'course-books', 'reading-break', 'heritage-library', 'planning-desk']
  for (const key of expected) {
    const img = page.locator(`main img[src*="${key}.webp"]`)
    await expect(img).toHaveCount(1)
    await img.scrollIntoViewIfNeeded()
    await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  }
  await page.getByRole('link').filter({ hasText: 'A simple university application checklist' }).first().click()
  await expect(page.locator('main img[src*="notebook.webp"]')).toBeVisible()
})

test('guide and service detail pages use relevant photos rather than a missing image block', async ({ page }) => {
  for (const [path, asset] of [
    ['/en/student-guide/study-abroad-budget', 'notebook'],
    ['/en/student-guide/accommodation-guide', 'shared-lounge'],
    ['/en/services/pre-departure-support', 'travel-planning'],
  ]) {
    await page.goto(path!)
    const img = page.locator(`main img[src*="${asset}.webp"]`).first()
    await expect(img).toBeVisible()
    await expect.poll(() => img.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    await expect(page.getByText('Photography placeholder', { exact: false })).toHaveCount(0)
  }
})
