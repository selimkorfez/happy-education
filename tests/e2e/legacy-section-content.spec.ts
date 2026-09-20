import { expect, test } from '@playwright/test'

test.describe('restored legacy section content', () => {
  test('presents the three original tour routes and a usable brochure detail page', async ({ page }) => {
    await page.goto('/tr/turlar')

    for (const title of ['İngiltere Turu', 'Avrupa Turu', 'İtalya Turu']) {
      await expect(page.getByRole('link', { name: new RegExp(title) }).first()).toBeVisible()
    }
    await expect(page.locator('main a[href="/tr/turlar/turlar"]')).toHaveCount(0)

    await page.goto('/tr/turlar/ingiltere-turu')
    await expect(page.locator('h1')).toContainText('İngiltere Turu')
    await expect(page.getByText(/Manchester, Leeds, Liverpool/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Özgün broşürü görüntüle' })).toHaveAttribute('href', /england-tour\.pdf$/)
  })

  test('restores boarding-school guidance before the school catalogue', async ({ page }) => {
    await page.goto('/tr/yatili-okullar')
    await expect(page.getByRole('heading', { name: 'Neden İngiltere’de yatılı okul?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Yatılı okullarda sunulan olanaklar' })).toBeVisible()
    await expect(page.getByText('A Level, GCSE ve IB gibi uluslararası tanınırlığı olan programlar')).toBeVisible()
  })

  test('restores individual and group summer-school guidance and group campuses', async ({ page }) => {
    await page.goto('/tr/yaz-okullari/bireysel')
    await expect(page.getByRole('heading', { name: 'Neden İngiltere yaz okulu?' })).toBeVisible()
    await expect(page.getByText('Ailelerle düzenli iletişim ve bilgilendirme')).toBeVisible()

    await page.goto('/tr/yaz-okullari/grup')
    await expect(page.getByRole('heading', { name: 'İngiltere grup yaz okulları' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Amerika grup yaz okulları' })).toBeVisible()
    await expect(page.getByRole('link', { name: /North London Grammar School/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Barry University/ })).toBeVisible()
  })

  test('has no horizontal overflow or framework errors on a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const frameworkErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() !== 'error') return

      const text = message.text()
      // Remote licensed photographs are allowed to fail independently of the
      // application (Wikimedia can rate-limit Next's image proxy in CI). The
      // browser reports those resource responses as generic console errors, so
      // only retain messages that can identify a React/Next runtime failure.
      if (!text.startsWith('Failed to load resource:')) frameworkErrors.push(text)
    })
    page.on('pageerror', (error) => frameworkErrors.push(error.message))

    for (const path of ['/tr/turlar', '/tr/yatili-okullar', '/tr/yaz-okullari/bireysel', '/tr/yaz-okullari/grup']) {
      await page.goto(path)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0)
    }
    expect(frameworkErrors).toEqual([])
  })
})
