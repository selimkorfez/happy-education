import { expect, test } from '@playwright/test'

/**
 * Regression coverage for the pre-Sanity English catalogue layer.
 *
 * The source migration is Turkish, so every value exposed on /en must be
 * deliberately translated/sanitised. These checks cover the major discovery
 * surfaces that reuse that data rather than testing only one screenshot route.
 */

const TURKISH_UI = /\b(?:İngiltere|İskoçya|Galler|İrlanda|Avustralya|Kanada|Londra|ABD|BAE|Yaz Okulu|Dil Okulu|Üniversitesi|Bireysel|Programı)\b/iu

const ENGLISH_SURFACES = [
  '/en/universities/united-kingdom',
  '/en/language-schools/united-kingdom',
  '/en/boarding-schools',
  '/en/summer-schools/individual',
  '/en/summer-schools/group',
  '/en/search?q=university',
]

test.describe('English interface language boundary', () => {
  for (const path of ENGLISH_SURFACES) {
    test(`${path} contains no Turkish catalogue labels`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.status(), path).toBeLessThan(400)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')

      const text = await page.locator('body').innerText()
      expect(text, `Turkish catalogue text leaked on ${path}`).not.toMatch(TURKISH_UI)
    })
  }

  test('UK university cards translate compound locations', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    const text = await page.locator('body').innerText()

    expect(text).toContain('Cambridge and Chelmsford, England')
    expect(text).toContain('Bangor, Wales')
    expect(text).toContain('Edinburgh, Scotland')
    expect(text).not.toContain('Cambridge ve Chelmsford')
  })

  test('English institution detail remains English and uses cleared local imagery', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom/anglia-ruskin-university')
    await expect(page.locator('h1')).toContainText('Anglia Ruskin University')

    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(TURKISH_UI)

    const heroImage = page.locator('main img').first()
    await expect(heroImage).toBeVisible()
    await expect(heroImage).not.toHaveAttribute('src', /happyeducation\.uk\/wp-content/i)
  })

  test('English destination hero uses a cleared local AI illustration', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    const heroImage = page.locator('main img').first()
    await expect(heroImage).toBeVisible()
    await expect(heroImage).not.toHaveAttribute('src', /happyeducation\.uk\/wp-content/i)
  })
})
