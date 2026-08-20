import { expect, test } from '@playwright/test'
import { gotoReady } from './support/app'

/**
 * The header is a disclosure pattern, not an ARIA menu, so the contract is:
 * Enter or Space opens, Escape closes and returns focus to the trigger, and Tab
 * is never trapped. A visitor using only a keyboard must be able to pass through
 * the header and reach the page.
 */

test.describe('primary navigation (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await gotoReady(page, '/en')
  })

  test('opens a panel with Enter and closes it with Escape', async ({ page }) => {
    const trigger = page.locator('[data-nav-trigger="universities"]')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const panelId = await trigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    await expect(page.locator(`#${panelId}`)).toBeVisible()
    await expect(page.locator(`#${panelId}`).getByRole('link').first()).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator(`#${panelId}`)).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('opens a panel with Space', async ({ page }) => {
    const trigger = page.locator('[data-nav-trigger="languageSchools"]')
    await trigger.focus()
    await page.keyboard.press('Space')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('toggles the same panel closed on a second activation', async ({ page }) => {
    const trigger = page.locator('[data-nav-trigger="universities"]')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('traps nothing: Tab walks out of the panel and closes it', async ({ page }) => {
    const trigger = page.locator('[data-nav-trigger="universities"]')
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    let escaped = false
    for (let i = 0; i < 25 && !escaped; i += 1) {
      await page.keyboard.press('Tab')
      escaped = await page.evaluate(() => {
        // The primary nav specifically: the header also contains the language
        // switcher nav, and matching that one would report success immediately.
        const nav = document.querySelector('nav[aria-label="Primary"]')
        const active = document.activeElement
        return !nav || !active || !nav.contains(active)
      })
    }

    expect(escaped, 'focus never left the navigation').toBe(true)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('navigates to a section from inside an open panel', async ({ page }) => {
    const trigger = page.locator('[data-nav-trigger="universities"]')
    await trigger.click()
    const panelId = await trigger.getAttribute('aria-controls')
    const firstLink = page.locator(`#${panelId}`).getByRole('link').first()
    await expect(firstLink).toHaveAttribute('href', /^\/en\/universities/)
  })

  test('closes an open panel when another trigger is used', async ({ page }) => {
    const first = page.locator('[data-nav-trigger="universities"]')
    const second = page.locator('[data-nav-trigger="languageSchools"]')

    await first.click()
    await expect(first).toHaveAttribute('aria-expanded', 'true')

    await second.click()
    await expect(first).toHaveAttribute('aria-expanded', 'false')
    await expect(second).toHaveAttribute('aria-expanded', 'true')
  })

  test('labels the navigation landmarks', async ({ page }) => {
    await expect(page.getByRole('navigation', { name: 'Primary' }).first()).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Change language' }).first()).toBeVisible()
  })
})

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('opens, and closes on Escape with focus restored to the trigger', async ({ page }) => {
    await gotoReady(page, '/en')

    const trigger = page.getByRole('button', { name: /menu/i }).first()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const panel = page.locator('#mobile-nav-panel')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('link').first()).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  /**
   * SKIPPED because it fails today, and the fix belongs to
   * `src/components/chrome/MobileNav.tsx`, which this track does not own.
   *
   * On open the panel runs `panelRef.current?.querySelector('a, button')?.focus()`.
   * The first `a` in the panel lives inside the first `<details>`, which is closed,
   * so the element is not rendered and `.focus()` is a no-op: focus stays on the
   * trigger and the stated behaviour ("move focus into the panel") never happens.
   *
   * Fix: include `summary` in the selector, or focus the panel container itself
   * with `tabindex="-1"`. Then unskip.
   */
  test('moves focus into the panel when it opens', async ({ page }) => {
    await gotoReady(page, '/en')
    await page.getByRole('button', { name: /menu/i }).first().click()
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const panelEl = document.querySelector('#mobile-nav-panel')
          return Boolean(panelEl && document.activeElement && panelEl.contains(document.activeElement))
        }),
      )
      .toBe(true)
  })

  test('traps focus inside the panel while it is open', async ({ page }) => {
    await gotoReady(page, '/en')
    await page.getByRole('button', { name: /menu/i }).first().click()
    await expect(page.locator('#mobile-nav-panel')).toBeVisible()

    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const panelEl = document.querySelector('#mobile-nav-panel')
        return Boolean(panelEl && document.activeElement && panelEl.contains(document.activeElement))
      })
      expect(inside, `focus escaped the mobile panel after ${i + 1} tabs`).toBe(true)
    }
  })

  test('locks the page behind the panel from scrolling', async ({ page }) => {
    await gotoReady(page, '/en')
    await page.getByRole('button', { name: /menu/i }).first().click()
    await expect(page.locator('#mobile-nav-panel')).toBeVisible()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

    await page.keyboard.press('Escape')
    await expect
      .poll(async () => page.evaluate(() => document.body.style.overflow))
      .not.toBe('hidden')
  })

  test('expands a section with native disclosure semantics', async ({ page }) => {
    await gotoReady(page, '/en')
    await page.getByRole('button', { name: /menu/i }).first().click()

    const summary = page.locator('#mobile-nav-panel summary').first()
    await summary.click()
    await expect(page.locator('#mobile-nav-panel details[open]')).toHaveCount(1)
  })

  test('keeps every touch target at least 44px tall', async ({ page }) => {
    await gotoReady(page, '/en')
    await page.getByRole('button', { name: /menu/i }).first().click()

    const boxes = await page.locator('#mobile-nav-panel a, #mobile-nav-panel summary').evaluateAll(
      (elements) => elements.map((element) => element.getBoundingClientRect().height),
    )
    expect(boxes.length).toBeGreaterThan(0)
    for (const height of boxes) {
      expect(height).toBeGreaterThanOrEqual(44)
    }
  })
})
