import { expect, test } from '@playwright/test'

/**
 * Regression coverage for the pre-Sanity English catalogue layer.
 *
 * The source migration is Turkish, so every value exposed on /en must be
 * deliberately translated/sanitised. These checks cover the major discovery
 * surfaces that reuse that data rather than testing only one screenshot route.
 */

const TURKISH_UI = /(?:İngiltere|İskoçya|Galler|İrlanda|Avustralya|Kanada|Londra|\bABD\b|\bBAE\b|Yaz Okulu|Dil Okulu|Üniversitesi|Universiteler|Üniversiteler|Bireysel|Programı)/iu

const ENGLISH_SURFACES = [
  '/en/universities/united-kingdom',
  '/en/universities/united-states',
  '/en/universities/australia',
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

    expect(text).toMatch(/Cambridge and Chelmsford, England/i)
    expect(text).toMatch(/Bangor, Wales/i)
    expect(text).toMatch(/Edinburgh, Scotland/i)
    expect(text).not.toMatch(/Cambridge ve Chelmsford/i)
  })

  test('institutions are not kept under a stale UK migration reference', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    const ukText = await page.locator('body').innerText()
    expect(ukText).not.toContain('Florida Atlantic University')
    expect(ukText).not.toContain('The University of Notre Dame')

    await page.goto('/en/universities/united-states')
    await expect(page.locator('body')).toContainText('Florida Atlantic University')

    await page.goto('/en/universities/australia')
    await expect(page.locator('body')).toContainText('The University of Notre Dame')
  })

  test('English institution detail remains English and uses a copyright-safe hero visual', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom/anglia-ruskin-university')
    await expect(page.locator('h1')).toContainText('Anglia Ruskin University')

    const text = await page.locator('body').innerText()
    expect(text).not.toMatch(TURKISH_UI)

    const localImage = page.locator('main img').first()
    const editorialVisual = page.getByRole('img', { name: /Anglia Ruskin University illustration/i }).first()
    const hasLocalImage = await localImage.count() > 0

    if (hasLocalImage) {
      await expect(localImage).toBeVisible()
      await expect(localImage).not.toHaveAttribute('src', /happyeducation\.uk\/wp-content/i)
    } else {
      await expect(editorialVisual).toBeVisible()
    }

    const wordpressImages = page.locator('main img[src*="happyeducation.uk/wp-content"]')
    await expect(wordpressImages).toHaveCount(0)
  })

  test('English destination hero uses a cleared local AI illustration', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    const heroImage = page.locator('main img').first()
    await expect(heroImage).toBeVisible()
    await expect(heroImage).not.toHaveAttribute('src', /happyeducation\.uk\/wp-content/i)
  })
})
