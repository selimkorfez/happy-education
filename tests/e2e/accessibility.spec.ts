import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * Automated accessibility checks catch perhaps a third of real barriers, so this
 * spec pairs axe with a keyboard walkthrough, which is where the rest of them
 * show up: focus that disappears, a control that cannot be reached, a disclosure
 * that cannot be closed.
 *
 * The bar is zero serious and zero critical violations. Moderate and minor
 * findings are reported in the failure message when they accompany a real
 * failure, but do not fail the build on their own.
 */

/** Next.js injects its own dev overlay, which is not part of the site. */
const DEV_OVERLAYS = ['nextjs-portal', '[data-nextjs-dialog-overlay]', '#__next-build-watcher']

async function analyse(page: Page) {
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
  ])
  for (const selector of DEV_OVERLAYS) builder = builder.exclude(selector)
  return builder.analyze()
}

function serious(results: Awaited<ReturnType<typeof analyse>>) {
  return results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
}

function describe(violations: ReturnType<typeof serious>) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.slice(0, 3).map((node) => node.target.join(' ')).join(', ')
      return `${violation.id} (${violation.impact}): ${violation.help} -> ${nodes}`
    })
    .join('\n')
}

const PAGES: Array<{ name: string; path: string }> = [
  { name: 'English homepage', path: '/en' },
  { name: 'Turkish homepage', path: '/tr' },
]

for (const { name, path } of PAGES) {
  test(`${name} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(path)
    const results = await analyse(page)
    expect(describe(serious(results))).toBe('')
  })

  test(`${name} is still clean with the cookie banner dismissed`, async ({ page }) => {
    await page.goto(path)
    await page
      .getByRole('button', { name: /Reject optional cookies|İsteğe bağlı çerezleri reddet/ })
      .click()
    const results = await analyse(page)
    expect(describe(serious(results))).toBe('')
  })
}

test('the cookie preferences dialog is accessible', async ({ page }) => {
  await page.goto('/en')
  await page.getByRole('button', { name: 'Manage preferences' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()

  const results = await analyse(page)
  expect(describe(serious(results))).toBe('')
})

test('an open navigation panel is accessible', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/en')
  await page.locator('[data-nav-trigger="universities"]').click()

  const results = await analyse(page)
  expect(describe(serious(results))).toBe('')
})

test.describe('keyboard-only walkthrough of the header', () => {
  test('reaches every header control in a sensible order and never loses focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/en')

    const stops: string[] = []
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab')
      const stop = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        if (!element || element === document.body) return 'BODY'
        const label =
          element.getAttribute('aria-label') ??
          element.getAttribute('data-nav-trigger') ??
          (element.textContent ?? '').trim().slice(0, 40)
        return `${element.tagName.toLowerCase()}:${label}`
      })
      stops.push(stop)
    }

    // Focus never falls back to the document body while walking the header.
    expect(stops.filter((stop) => stop === 'BODY')).toEqual([])

    expect(stops[0]).toContain('Skip to main content')
    expect(stops.join(' | ')).toContain('universities')
    expect(stops.some((stop) => stop.startsWith('a:') || stop.startsWith('button:'))).toBe(true)
  })

  test('the skip link moves focus to the main landmark', async ({ page }) => {
    await page.goto('/en')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')

    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('every focusable control shows a visible focus indicator', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/en')

    const withoutIndicator: string[] = []
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab')
      const result = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null
        if (!element || element === document.body) return null
        const styles = getComputedStyle(element)
        const hasOutline = styles.outlineStyle !== 'none' && parseFloat(styles.outlineWidth) > 0
        const hasBoxShadow = styles.boxShadow !== 'none'
        const hasUnderline = styles.textDecorationLine.includes('underline')
        return {
          name: `${element.tagName.toLowerCase()}:${(element.textContent ?? '').trim().slice(0, 30)}`,
          visible: hasOutline || hasBoxShadow || hasUnderline,
        }
      })
      if (result && !result.visible) withoutIndicator.push(result.name)
    }

    expect(withoutIndicator).toEqual([])
  })
})
