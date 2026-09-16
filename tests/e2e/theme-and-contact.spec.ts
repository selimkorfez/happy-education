import { expect, test } from '@playwright/test'

test.describe('theme and direct contact controls', () => {
  test('theme choice persists across navigation', async ({ page }) => {
    await page.goto('/en')
    const toggle = page.getByRole('button', { name: 'Use dark mode' })
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    await page.goto('/en/about')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: 'Use light mode' })).toBeVisible()
  })

  test('owl contact button opens the verified WhatsApp number', async ({ page }) => {
    await page.goto('/tr')
    const contact = page.getByRole('link', { name: 'Bize yazın: WhatsApp' })
    await expect(contact).toHaveAttribute('href', /^https:\/\/wa\.me\/447735826785\?text=/)
    await expect(contact.locator('img')).toBeVisible()
  })
})
