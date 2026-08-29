import { expect, test } from '@playwright/test'

async function titles(page: import('@playwright/test').Page) {
  return page.locator('main h3').evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? '').filter(Boolean))
}

function sortedEnglish(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b, 'en-GB', { sensitivity: 'base' }))
}

test.describe('browse sorting', () => {
  test('institution catalogues default to Popular and can switch to A-Z', async ({ page }) => {
    await page.goto('/en/universities/united-kingdom')

    const popular = page.getByRole('button', { name: 'Popular' }).first()
    const az = page.getByRole('button', { name: 'A–Z' }).first()
    await expect(popular).toHaveAttribute('aria-pressed', 'true')
    await expect(az).toHaveAttribute('aria-pressed', 'false')

    await az.click()
    await expect(az).toHaveAttribute('aria-pressed', 'true')
    const alphabetic = await titles(page)
    expect(alphabetic.length).toBeGreaterThan(2)
    expect(alphabetic).toEqual(sortedEnglish(alphabetic))
  })

  test('editorial browse pages use the same sorting control', async ({ page }) => {
    await page.goto('/en/insights')

    const popular = page.getByRole('button', { name: 'Popular' }).first()
    const az = page.getByRole('button', { name: 'A–Z' }).first()
    await expect(popular).toHaveAttribute('aria-pressed', 'true')

    await az.click()
    const alphabetic = await titles(page)
    expect(alphabetic.length).toBeGreaterThan(2)
    expect(alphabetic).toEqual(sortedEnglish(alphabetic))
  })
})
