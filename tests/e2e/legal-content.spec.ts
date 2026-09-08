import { expect, test } from '@playwright/test'

test.describe('legal content fallback', () => {
  test('English terms render the bundled legal draft instead of an empty placeholder', async ({ page }) => {
    await page.goto('/en/legal/terms-of-use')

    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Who runs this website' })).toBeVisible()
    await expect(page.getByText('HAPPY EDUCATION CONSULTANCY LTD')).toBeVisible()
    await expect(page.getByText('This document is being prepared.')).toHaveCount(0)
  })

  test('Turkish terms use the Turkish bundled draft', async ({ page }) => {
    await page.goto('/tr/yasal/kullanim-kosullari')

    await expect(page.getByRole('heading', { level: 1, name: 'Kullanım Koşulları' })).toBeVisible()
    await expect(page.getByText('Bu belge hazırlanıyor.')).toHaveCount(0)
  })
})
