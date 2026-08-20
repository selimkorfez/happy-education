import { expect, test, type Page } from '@playwright/test'

/**
 * PECR and UK GDPR, expressed as behaviour:
 *   - nothing non-essential loads before a decision
 *   - refusing is one click from the first layer, and no harder than accepting
 *   - the decision persists, and can be reopened from any page
 *
 * The analytics assertions stay meaningful even with no GTM container configured:
 * they fail the moment a tag is added without a consent gate.
 */

const CONSENT_COOKIE = 'he_consent'
const ANALYTICS_HOSTS = /googletagmanager\.com|google-analytics\.com|facebook\.net|doubleclick\.net|hotjar|clarity\.ms/

function banner(page: Page) {
  return page.getByRole('region', { name: 'Cookie consent' })
}

test.describe('cookie banner', () => {
  test('appears on a first visit, with reject as prominent as accept', async ({ page }) => {
    await page.goto('/en')

    const region = banner(page)
    await expect(region).toBeVisible()
    await expect(region.getByRole('heading', { name: 'Cookies on this site' })).toBeVisible()

    const accept = region.getByRole('button', { name: 'Accept optional cookies' })
    const reject = region.getByRole('button', { name: 'Reject optional cookies' })
    await expect(accept).toBeVisible()
    await expect(reject).toBeVisible()
    await expect(region.getByRole('button', { name: 'Manage preferences' })).toBeVisible()

    // Not a dark pattern: both actions are the same size and on the same layer.
    const acceptBox = await accept.boundingBox()
    const rejectBox = await reject.boundingBox()
    expect(acceptBox?.height).toBeCloseTo(rejectBox?.height ?? 0, 0)

    await expect(region.getByRole('link', { name: /Cookie Policy/i })).toHaveAttribute(
      'href',
      '/en/legal/cookie-policy',
    )
  })

  test('makes no analytics or marketing request before a decision', async ({ page }) => {
    const thirdParty: string[] = []
    page.on('request', (request) => {
      if (ANALYTICS_HOSTS.test(request.url())) thirdParty.push(request.url())
    })

    await page.goto('/en')
    await expect(banner(page)).toBeVisible()
    await page.waitForTimeout(1000)

    expect(thirdParty).toEqual([])
  })

  test('records a refusal in a first-party cookie and dismisses the banner', async ({ page, context }) => {
    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Reject optional cookies' }).click()

    await expect(banner(page)).toHaveCount(0)

    const cookies = await context.cookies()
    const consent = cookies.find((cookie) => cookie.name === CONSENT_COOKIE)
    expect(consent, 'consent cookie was not written').toBeDefined()

    const record = JSON.parse(decodeURIComponent(consent?.value ?? '{}')) as Record<string, unknown>
    expect(record['analytics']).toBe(false)
    expect(record['marketing']).toBe(false)
    expect(record['essential']).toBe(true)
    expect(typeof record['at']).toBe('string')

    // SameSite=Lax, site-wide, and readable by the client that must gate the tags.
    expect(consent?.path).toBe('/')
    expect(consent?.sameSite).toBe('Lax')
    expect(consent?.httpOnly).toBe(false)
  })

  test('does not ask again after a decision', async ({ page }) => {
    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Reject optional cookies' }).click()
    await expect(banner(page)).toHaveCount(0)

    await page.reload()
    await expect(banner(page)).toHaveCount(0)

    await page.goto('/tr')
    await expect(page.getByRole('region', { name: 'Çerez onayı' })).toHaveCount(0)
  })

  test('records an acceptance', async ({ page, context }) => {
    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Accept optional cookies' }).click()
    await expect(banner(page)).toHaveCount(0)

    const consent = (await context.cookies()).find((cookie) => cookie.name === CONSENT_COOKIE)
    const record = JSON.parse(decodeURIComponent(consent?.value ?? '{}')) as Record<string, unknown>
    expect(record['analytics']).toBe(true)
    expect(record['marketing']).toBe(true)
  })

  test('shows the banner in Turkish on the Turkish tree', async ({ page }) => {
    await page.goto('/tr')
    const region = page.getByRole('region', { name: 'Çerez onayı' })
    await expect(region).toBeVisible()
    await expect(region.getByRole('button', { name: 'İsteğe bağlı çerezleri reddet' })).toBeVisible()
  })
})

test.describe('preferences dialog', () => {
  test('reopens from the footer after a decision', async ({ page }) => {
    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Reject optional cookies' }).click()
    await expect(banner(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'Cookie preferences' }).click()
    await expect(page.getByRole('heading', { name: 'Cookie preferences' })).toBeVisible()
  })

  test('pre-ticks nothing and lets a single category be granted', async ({ page, context }) => {
    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Manage preferences' }).click()

    const analytics = page.getByRole('checkbox', { name: /Analytics/i })
    const marketing = page.getByRole('checkbox', { name: /Marketing/i })
    await expect(analytics).not.toBeChecked()
    await expect(marketing).not.toBeChecked()

    await analytics.check()
    await page.getByRole('button', { name: 'Save preferences' }).click()

    const consent = (await context.cookies()).find((cookie) => cookie.name === CONSENT_COOKIE)
    const record = JSON.parse(decodeURIComponent(consent?.value ?? '{}')) as Record<string, unknown>
    expect(record['analytics']).toBe(true)
    expect(record['marketing']).toBe(false)
  })

  test('closes on Escape without recording a decision', async ({ page, context }) => {
    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Manage preferences' }).click()
    await expect(page.getByRole('heading', { name: 'Cookie preferences' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('heading', { name: 'Cookie preferences' })).toHaveCount(0)

    const consent = (await context.cookies()).find((cookie) => cookie.name === CONSENT_COOKIE)
    expect(consent).toBeUndefined()
  })
})

test.describe('after consent', () => {
  // Only meaningful once a container ID is configured; it stays in the suite so a
  // future tag cannot be added without a consent gate.
  test('loads analytics only once analytics consent is granted', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (request) => {
      if (ANALYTICS_HOSTS.test(request.url())) requests.push(request.url())
    })

    await page.goto('/en')
    await banner(page).getByRole('button', { name: 'Accept optional cookies' }).click()
    await page.waitForTimeout(1500)

    expect(requests.length).toBeGreaterThan(0)
  })
})
