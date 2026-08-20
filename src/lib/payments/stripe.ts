import 'server-only'
import Stripe from 'stripe'
import { isConfigured, serverEnv, siteUrl } from '@/lib/env'

/**
 * Stripe client.
 *
 * Constructed lazily, on the server only, and never at module scope: importing this
 * file must not require a secret key to be present. A clean checkout with no Stripe
 * credentials builds and runs; the payment routes return an honest "unavailable"
 * response instead of crashing.
 *
 * `getStripe()` returns null when the key is missing. EVERY caller must handle null.
 * There is no throwing variant on purpose — a thrown error here would surface to a
 * visitor as a 500 on a page that could otherwise have shown a phone number.
 */

/**
 * Pinned to the version this code was written and tested against, matching the
 * version bundled with stripe-node 22.5.0. Pinning means a Stripe-side API release
 * cannot silently change the shape of a webhook payload we already handle; upgrading
 * is a deliberate change with its own review.
 */
export const STRIPE_API_VERSION = '2026-07-29.dahlia'

let cached: Stripe | null = null

export function getStripe(): Stripe | null {
  if (cached) return cached

  const key = serverEnv().STRIPE_SECRET_KEY
  if (!key) return null

  cached = new Stripe(key, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    // Retries are safe here because every write we make carries an idempotency key.
    maxNetworkRetries: 2,
    timeout: 20_000,
    appInfo: { name: 'Happy Education', url: siteUrl },
  })

  return cached
}

/**
 * Whether the site may take a payment at all.
 *
 * Deliberately stricter than "is there a secret key": it also requires the webhook
 * signing secret. Taking money without a verified webhook means the site cannot
 * reconcile what was actually paid, and the redirect back from Checkout is not
 * proof of payment. Half-configured is worse than off, so it counts as off.
 */
export function paymentsEnabled(): boolean {
  return isConfigured.stripe()
}

/** Narrow a thrown value to a Stripe error without reaching for `any`. */
export function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return error instanceof Stripe.errors.StripeError
}

/**
 * A message safe to log. Stripe errors can carry request-specific detail; the raw
 * error object is never returned to the browser and never logged wholesale.
 */
export function stripeErrorSummary(error: unknown): { type: string; message: string } {
  if (isStripeError(error)) {
    return { type: error.type ?? 'stripe_error', message: error.message }
  }
  return { type: 'unknown', message: error instanceof Error ? error.message : 'unknown error' }
}
