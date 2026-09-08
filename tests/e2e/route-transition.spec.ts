import { expect, test } from '@playwright/test'

test.describe('route cloud transition', () => {
  test('an ordinary internal click produces visible transition phases while navigating', async ({ page }) => {
    await page.goto('/en')

    await page.evaluate(() => {
      const overlay = document.querySelector('.he-route-cloud-transition')
      const state = window as Window & { __routeCloudPhases?: string[] }
      state.__routeCloudPhases = []

      if (!overlay) return

      const record = () => {
        state.__routeCloudPhases?.push(overlay.getAttribute('data-phase') ?? '')
      }

      record()
      new MutationObserver(record).observe(overlay, {
        attributes: true,
        attributeFilter: ['data-phase'],
      })
    })

    await page.getByRole('link', { name: 'Explore study options' }).first().click()
    await expect(page).toHaveURL(/\/en\/universities$/)

    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { __routeCloudPhases?: string[] }).__routeCloudPhases ?? []),
      )
      .toContain('covering')

    await expect
      .poll(() =>
        page.evaluate(() => (window as Window & { __routeCloudPhases?: string[] }).__routeCloudPhases ?? []),
      )
      .toContain('clearing')
  })
})
