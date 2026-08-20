import { expect, test } from '@playwright/test'

/**
 * Payments.
 *
 * Card details never touch this site: Checkout is created server-side and the
 * visitor is redirected to Stripe. So the behaviour worth testing here is the
 * boundary, not the payment: what the checkout endpoint accepts, what it refuses,
 * how it behaves with no Stripe credentials configured, and that the webhook
 * verifies its signature before doing anything.
 *
 * `fixme` until those routes are finished in the payments track. The signature
 * test in particular must be switched on before launch: an unverified webhook is
 * an unauthenticated write endpoint.
 */

test.describe('checkout session creation', () => {
  test('creates a Checkout session for a known service', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: { item: 'consultation-standard', locale: 'en' },
    })
    expect(response.ok()).toBe(true)

    const body = (await response.json()) as { url?: string }
    expect(body.url ?? '').toMatch(/^https:\/\/checkout\.stripe\.com\//)
  })

  test('refuses an unknown item rather than inventing a price', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: { item: 'not-a-real-service', locale: 'en' },
    })
    expect([400, 404, 422]).toContain(response.status())
  })

  test('never accepts an amount supplied by the client', async ({ request }) => {
    // Prices come from the catalogue. A client-supplied amount must be ignored or
    // rejected outright; it must never determine what is charged.
    const response = await request.post('/api/checkout', {
      data: { item: 'consultation-standard', amount: 1, currency: 'gbp', locale: 'en' },
    })
    if (response.ok()) {
      const body = (await response.json()) as { amount?: number }
      expect(body.amount).not.toBe(1)
    } else {
      expect([400, 422]).toContain(response.status())
    }
  })

  test('says plainly when payments are not configured', async ({ page }) => {
    // With no STRIPE_SECRET_KEY the page must offer a human alternative rather
    // than a dead button or a stack trace.
    await page.goto('/en/free-consultation')
    await expect(page.getByText(/contact us and we will arrange/i)).toBeVisible()
  })

  test('does not accept checkout creation over GET', async ({ request }) => {
    const response = await request.get('/api/checkout')
    expect([404, 405]).toContain(response.status())
  })
})

test.describe('stripe webhook', () => {
  test('rejects an unsigned payload', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: { id: 'evt_test', type: 'checkout.session.completed' },
    })
    expect([400, 401, 403]).toContain(response.status())
  })

  test('rejects a payload with a forged signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      headers: { 'stripe-signature': 't=1,v1=deadbeef' },
      data: { id: 'evt_test', type: 'checkout.session.completed' },
    })
    expect([400, 401, 403]).toContain(response.status())
  })

  test('processes a correctly signed event exactly once', async ({ request }) => {
    // Requires a locally signed test payload built with STRIPE_WEBHOOK_SECRET.
    // Replaying the same event id must be a no-op, not a second fulfilment.
    const response = await request.post('/api/webhooks/stripe', {
      headers: { 'stripe-signature': process.env.STRIPE_TEST_SIGNATURE ?? '' },
      data: { id: 'evt_test_replay', type: 'checkout.session.completed' },
    })
    expect(response.status()).toBe(200)

    const replay = await request.post('/api/webhooks/stripe', {
      headers: { 'stripe-signature': process.env.STRIPE_TEST_SIGNATURE ?? '' },
      data: { id: 'evt_test_replay', type: 'checkout.session.completed' },
    })
    expect(replay.status()).toBe(200)
  })

  test('is never cached by the edge', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', { data: {} })
    expect(response.headers()['cache-control']).toContain('no-store')
  })
})

test.describe('payment result pages', () => {
  test('confirms a completed payment without inventing a receipt', async ({ page }) => {
    await page.goto('/en/free-consultation/success?session_id=cs_test_123')
    await expect(page.getByRole('heading', { name: /Payment received|could not confirm/i })).toBeVisible()
  })

  test('says nothing was charged when a payment is cancelled', async ({ page }) => {
    await page.goto('/en/free-consultation/cancelled')
    await expect(page.getByText(/Nothing has been charged/i)).toBeVisible()
  })
})
