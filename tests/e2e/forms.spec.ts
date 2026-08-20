import { expect, test } from '@playwright/test'

/**
 * Enquiry and consultation forms.
 *
 * `fixme` until the routes render, because the forms are being built in another
 * track. The contract asserted here is deliberately about behaviour a visitor can
 * observe: an invalid submission must not navigate away, must say what is wrong in
 * words, and must move focus to the problem; a valid one must confirm in place.
 *
 * These specs must keep working whichever way the form is implemented, so they
 * address fields by their visible label and never by a class or a test id.
 */

test.describe('contact form validation', () => {
  test('refuses an empty submission and explains why', async ({ page }) => {
    await page.goto('/en/contact')

    await page.getByRole('button', { name: /Send enquiry/i }).click()

    // Still on the page, with an error summary that names the problems.
    await expect(page).toHaveURL(/\/en\/contact/)
    // Scoped to the form: Next's route announcer is also role="alert".
    const summary = page.locator('form').getByRole('alert').first()
    await expect(summary).toBeVisible()
    await expect(summary).toContainText(/check the following/i)
  })

  test('rejects a malformed email address', async ({ page }) => {
    await page.goto('/en/contact')

    await page.getByLabel(/Full name/i).fill('Test Person')
    await page.getByLabel(/Email address/i).fill('not-an-email')
    await page.getByLabel(/Anything else/i).fill('Please call me back.')
    await page.getByRole('button', { name: /Send enquiry/i }).click()

    const email = page.getByLabel(/Email address/i)
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    // Focus goes to the error summary rather than the first bad field, so a
    // screen-reader user hears every problem at once instead of one at a time.
    await expect(page.locator('form').getByRole('alert').first()).toBeFocused()
  })

  test('accepts a valid submission and confirms in place', async ({ page }) => {
    await page.goto('/en/contact')

    await page.getByLabel(/Full name/i).fill('Test Person')
    await page.getByLabel(/Email address/i).fill('test.person@example.com')
    await page.getByLabel(/Anything else/i).fill('I would like to study in Leeds.')
    await page.getByRole('button', { name: /Send enquiry/i }).click()

    await expect(page.getByText(/your enquiry has reached us/i)).toBeVisible()
  })

  test('never pre-ticks the marketing consent box', async ({ page }) => {
    await page.goto('/en/contact')
    await expect(page.getByRole('checkbox', { name: /Email me occasional guidance/i })).not.toBeChecked()
  })

  test('links to the privacy policy from the form', async ({ page }) => {
    await page.goto('/en/contact')
    await expect(page.locator('form').getByRole('link', { name: /Privacy Policy/i }).first()).toHaveAttribute(
      'href',
      '/en/legal/privacy-policy',
    )
  })

  test('shows the Turkish form on the Turkish route', async ({ page }) => {
    await page.goto('/tr/iletisim')
    await expect(page.getByRole('button', { name: /Mesajı gönderin/i })).toBeVisible()
  })
})

test.describe('consultation submission', () => {
  test('submits a consultation request and confirms it', async ({ page }) => {
    await page.goto('/en/free-consultation')

    await page.getByLabel(/Full name/i).fill('Test Person')
    await page.getByLabel(/Email address/i).fill('test.person@example.com')
    await page.getByLabel(/Telephone or WhatsApp/i).fill('+44 7700 900000')
    await page.getByRole('button', { name: /Send enquiry|Book|Request/i }).click()

    await expect(page.getByText(/Thank you/i)).toBeVisible()
  })

  test('degrades honestly when the email integration is not configured', async ({ page }) => {
    // With no RESEND_API_KEY the submission must still be acknowledged or must say
    // plainly that it could not be sent. It must never appear to succeed silently.
    await page.goto('/en/free-consultation')
    await page.getByLabel(/Full name/i).fill('Test Person')
    await page.getByLabel(/Email address/i).fill('test.person@example.com')
    await page.getByRole('button', { name: /Send enquiry|Book|Request/i }).click()

    await expect(page.locator('form').getByRole('status').or(page.locator('form').getByRole('alert')).first()).toBeVisible()
  })

  // The limiter is stood down for the rest of the run (see playwright.config.ts),
  // because its counters are shared per-process. Its behaviour is covered directly
  // by tests/unit/rate-limit.test.ts, which is the right level for it.
  test.skip(
    process.env.E2E_DISABLE_RATE_LIMIT === '1',
    'rate limiting is exercised in tests/unit/rate-limit.test.ts',
  )
  test('rate-limits repeated submissions rather than accepting them all', async ({ request }) => {
    const payload = { name: 'Test', email: 'test@example.com', message: 'hello' }
    const statuses: number[] = []
    for (let i = 0; i < 12; i += 1) {
      const response = await request.post('/api/enquiry', { data: payload })
      statuses.push(response.status())
    }
    expect(statuses).toContain(429)
  })
})

test.describe('form endpoints reject rubbish', () => {
  test('returns 400 for a malformed enquiry payload', async ({ request }) => {
    const response = await request.post('/api/enquiry', { data: { nope: true } })
    expect(response.status()).toBe(400)
  })

  test('does not accept an enquiry over GET', async ({ request }) => {
    const response = await request.get('/api/enquiry')
    expect([404, 405]).toContain(response.status())
  })
})
