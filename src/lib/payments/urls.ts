import 'server-only'
import { siteUrl } from '@/lib/env'
import { LOCALES, type Locale } from '@/lib/i18n/config'

/**
 * Return URLs for Stripe Checkout.
 *
 * Every URL here is built on the server from configuration. Nothing the browser
 * sends contributes to them, which removes the open-redirect surface that a
 * caller-supplied `returnUrl` parameter would otherwise create.
 *
 * SEGMENT OWNERSHIP: `src/lib/i18n/config.ts` is the registry for URL segments and
 * this pair belongs there. It is defined locally because the payment result pages
 * are not part of the section registry yet. When the routing track adds them,
 * promote `PAYMENT_SEGMENT` into `SECTIONS` as a section key and delete this,
 * and add the old paths to the redirect map if any have been published.
 */
export const PAYMENT_SEGMENT: Record<Locale, string> = {
  en: 'payment',
  tr: 'odeme',
}

export type PaymentResultState = 'success' | 'cancelled' | 'failed'

const RESULT_SEGMENT: Record<Locale, Record<PaymentResultState, string>> = {
  en: { success: 'success', cancelled: 'cancelled', failed: 'failed' },
  tr: { success: 'basarili', cancelled: 'iptal', failed: 'basarisiz' },
}

/** Public path for a payment result page, e.g. /tr/odeme/basarili. */
export function paymentResultPath(locale: Locale, state: PaymentResultState): string {
  return `/${locale}/${PAYMENT_SEGMENT[locale]}/${RESULT_SEGMENT[locale][state]}`
}

/** Every payment result path, for the routing track and the link checker. */
export function allPaymentResultPaths(): string[] {
  const states: PaymentResultState[] = ['success', 'cancelled', 'failed']
  return LOCALES.flatMap((locale) => states.map((state) => paymentResultPath(locale, state)))
}

export interface CheckoutReturnUrls {
  successUrl: string
  cancelUrl: string
}

/**
 * `{CHECKOUT_SESSION_ID}` is substituted by Stripe on redirect. The success page
 * uses it to VERIFY the payment against the Stripe API — the presence of the
 * parameter is not itself evidence that anything was paid.
 */
export function checkoutReturnUrls(locale: Locale, internalReference: string): CheckoutReturnUrls {
  const success = new URL(paymentResultPath(locale, 'success'), siteUrl)
  success.searchParams.set('ref', internalReference)

  const cancel = new URL(paymentResultPath(locale, 'cancelled'), siteUrl)
  cancel.searchParams.set('ref', internalReference)

  // Appended raw: URL encoding would escape the braces Stripe looks for.
  return {
    successUrl: `${success.toString()}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: cancel.toString(),
  }
}
