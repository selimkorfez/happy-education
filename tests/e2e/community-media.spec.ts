import { expect, test, type Page } from '@playwright/test'

async function dismissConsent(page: Page) {
  const reject = page.getByRole('button', { name: /reject|reddet/i })
  if (await reject.isVisible().catch(() => false)) await reject.click()
}

test.describe('licensed documentary media', () => {
  test('UK destination uses a publicly licensed city image with a traceable credit', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')
    await dismissConsent(page)

    const hero = page.locator('main img').first()
    await expect(hero).toBeVisible()
    await expect(hero).toHaveAttribute('src', /_next\/image/)
    await expect(page.getByText(/CC0 1\.0|CC BY/i).first()).toBeVisible()
    await expect(page.locator('main img[src*="happyeducation.uk/wp-content"]')).toHaveCount(0)
  })

  test('a mapped university uses verified campus photography rather than legacy WordPress media', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom/anglia-ruskin-university')
    await dismissConsent(page)

    await expect(page.getByRole('img', { name: /Cambridge campus of Anglia Ruskin University/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /ARU/i }).first()).toBeVisible()
    await expect(page.locator('main img[src*="happyeducation.uk/wp-content"]')).toHaveCount(0)
  })

  test('every university in the main English browser receives real licensed photography', async ({ page }) => {
    await page.goto('/en/universities')
    await dismissConsent(page)

    await expect(page.getByText('Photo being verified')).toHaveCount(0)
    const cards = page.locator('article').filter({ has: page.locator('h3') })
    const cardCount = await cards.count()
    expect(cardCount).toBeGreaterThan(20)

    const images = page.locator('article img')
    expect(await images.count()).toBeGreaterThan(20)
  })

  test('country city previews are real photos and no longer dead internal links', async ({ page }) => {
    const cases = [
      ['/en/universities/united-kingdom', 8],
      ['/en/universities/united-states', 5],
      ['/en/universities/canada', 3],
      ['/en/universities/ireland', 3],
      ['/en/universities/australia', 4],
      ['/en/universities/new-zealand', 3],
      ['/en/language-schools/malta', 3],
    ] as const

    for (const [path, expectedImages] of cases) {
      await page.goto(path)
      await dismissConsent(page)
      const cities = page.locator('#cities')
      await expect(cities).toBeVisible()
      await expect(cities.getByText('Photo being verified')).toHaveCount(0)
      await expect(cities.locator('img')).toHaveCount(expectedImages)
      await expect(cities.locator(`a[href^="${path}/"]`)).toHaveCount(0)
    }
  })

  test('university browse cards label representative imagery honestly', async ({ page }) => {
    await page.goto('/en/universities')
    await dismissConsent(page)
    await expect(page.getByText(/Campus photo|Location photo/).first()).toBeVisible()
  })
})

test.describe('community content', () => {
  test('social-content page is useful even before social posts are entered', async ({ page }) => {
    await page.goto('/en/insights/from-our-socials')
    await dismissConsent(page)
    await expect(page.locator('h1')).toContainText('Social content')
    await expect(page.getByText('Applications, explained')).toBeVisible()
    await expect(page.getByText(/do not fill this space with invented examples/i)).toBeVisible()
  })

  test('student-stories page never invents legacy testimonials', async ({ page }) => {
    await page.goto('/en/insights/student-stories')
    await dismissConsent(page)
    await expect(page.locator('h1')).toContainText('Real stories')
    await expect(page.getByText(/Verified stories are being prepared/i)).toBeVisible()
    await expect(page.getByText(/publication permission/i).first()).toBeVisible()
  })

  test('community pages switch to their real Turkish equivalents without CMS data', async ({ request }) => {
    const social = await request.get('/api/locale?to=tr&from=%2Fen%2Finsights%2Ffrom-our-socials', { maxRedirects: 0 })
    expect(social.status()).toBe(307)
    expect(social.headers().location).toContain('/tr/blog/sosyal-medyadan')

    const stories = await request.get('/api/locale?to=tr&from=%2Fen%2Finsights%2Fstudent-stories', { maxRedirects: 0 })
    expect(stories.status()).toBe(307)
    expect(stories.headers().location).toContain('/tr/blog/ogrenci-hikayeleri')
  })
})
