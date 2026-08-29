import { expect, test } from '@playwright/test'

async function dismissConsent(page: Parameters<typeof test>[0]['page']) {
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

  test('university browse cards expose licensed photography where a verified mapping exists', async ({ page }) => {
    await page.goto('/en/universities')
    await dismissConsent(page)
    await expect(page.getByRole('img', { name: /Cambridge campus of Anglia Ruskin University/i })).toBeVisible()
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
