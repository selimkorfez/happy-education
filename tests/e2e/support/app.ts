import { expect, type Page } from '@playwright/test'

/**
 * Shared helpers for specs that interact with the page rather than just read it.
 *
 * The important one is `waitForHydration`. Next.js streams server-rendered markup
 * before the client bundle attaches its handlers, so a key press or click sent too
 * early lands on inert markup and is simply lost. The test then fails ten seconds
 * later on an assertion that has nothing to do with the bug it was written for.
 *
 * The cookie banner is the reliable hydration signal on every page of this site:
 * it renders only after the consent provider has mounted and read the cookie.
 */

const CONSENT_REGION = /Cookie consent|Çerez onayı/
const REJECT_BUTTON = /Reject optional cookies|İsteğe bağlı çerezleri reddet/

export async function waitForHydration(page: Page): Promise<void> {
  await expect(page.getByRole('region', { name: CONSENT_REGION })).toBeVisible()
}

/**
 * Navigates, waits for the page to become interactive and clears the cookie
 * banner, which is fixed to the bottom of the viewport and would otherwise sit on
 * top of whatever the test is trying to click.
 */
export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await waitForHydration(page)
  await page.getByRole('button', { name: REJECT_BUTTON }).click()
  await expect(page.getByRole('region', { name: CONSENT_REGION })).toHaveCount(0)
}
