import 'server-only'
import { getStripe, stripeErrorSummary } from '@/lib/payments/stripe'
import { getPaymentStore, type PaymentStatus } from '@/lib/payments/records'

/**
 * Server-side verification of a Checkout Session.
 *
 * The success page is reached by a redirect the visitor's browser performs, so
 * everything in that URL is visitor-controlled. `?session_id=…` is a lookup key
 * and nothing more: this function asks Stripe what actually happened, on the
 * server, using the secret key. A page that renders "payment received" without
 * calling something like this is showing a stranger whatever they typed.
 *
 * The Stripe object never leaves this module. Callers get a small, deliberate
 * shape with no payment-method detail in it.
 */

export type VerifiedStatus = 'paid' | 'pending' | 'unpaid' | 'expired'

export interface VerifiedPayment {
  status: VerifiedStatus
  /** Our reference, when the session carries one. Shown to the visitor. */
  internalReference: string | null
  /** Minor units, as Stripe recorded them — not as any page claimed. */
  amountMinor: number
  currency: string
  /** Where Stripe sends the receipt. Shown so the visitor knows where to look. */
  customerEmail: string | null
  /** The catalogue reference that was bought. */
  serviceReference: string | null
}

/**
 * Stripe session ids are opaque and always `cs_`-prefixed. Validating the shape
 * before the API call keeps obvious junk out of the logs and out of Stripe's
 * rate limit.
 */
const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]{8,240}$/

export function isValidSessionId(value: string): boolean {
  return SESSION_ID_PATTERN.test(value)
}

const RECONCILED_STATUS: Record<VerifiedStatus, PaymentStatus | null> = {
  paid: 'paid',
  pending: 'pending',
  unpaid: null,
  expired: 'cancelled',
}

export async function verifyCheckoutSession(sessionId: string): Promise<VerifiedPayment | null> {
  if (!isValidSessionId(sessionId)) return null

  const stripe = getStripe()
  if (!stripe) return null

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    let status: VerifiedStatus
    if (session.payment_status === 'paid') status = 'paid'
    else if (session.status === 'expired') status = 'expired'
    else if (session.status === 'complete') status = 'pending'
    else status = 'unpaid'

    const internalReference =
      typeof session.metadata?.internalReference === 'string'
        ? session.metadata.internalReference
        : (session.client_reference_id ?? null)

    const verified: VerifiedPayment = {
      status,
      internalReference,
      amountMinor: session.amount_total ?? 0,
      currency: (session.currency ?? 'gbp').toUpperCase(),
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      serviceReference:
        typeof session.metadata?.reference === 'string' ? session.metadata.reference : null,
    }

    // Reconciliation, not fulfilment. The webhook remains the trigger for anything
    // that has an effect in the world (confirmation email, booked slot). This only
    // stops the visitor's own page disagreeing with Stripe while a webhook
    // delivery is still in flight.
    const nextStatus = RECONCILED_STATUS[status]
    if (internalReference && nextStatus) {
      const record = await getPaymentStore().findByInternalReference(internalReference)
      if (record && record.status !== nextStatus && record.status !== 'refunded') {
        await getPaymentStore().update(internalReference, { status: nextStatus })
      }
    }

    return verified
  } catch (error) {
    console.error('[payments] session verification failed', stripeErrorSummary(error))
    return null
  }
}
