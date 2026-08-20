import 'server-only'
import type { Locale } from '@/lib/i18n/config'

/**
 * Payment records.
 *
 * WHAT IS NEVER STORED HERE
 * -------------------------
 * No card number, no expiry, no CVV, no cardholder name taken from a card, no raw
 * payment credential of any kind, ever. Those values never reach this application:
 * the visitor enters them on Stripe's own hosted Checkout page, on Stripe's domain.
 * All this application ever holds is Stripe's opaque identifiers (`cs_…`, `pi_…`),
 * an amount, a status, and the contact details the visitor typed into our own form.
 * Adding a card field to `PaymentRecord` would put this site in PCI DSS scope and
 * must not be done.
 *
 * WHY A RECORD EXISTS AT ALL
 * --------------------------
 * Stripe is the source of truth for money. This record is the source of truth for
 * "which of our services did this pay for, and what did we promise to do next" —
 * the link between a Stripe session and a consultation slot, an internal reference
 * the visitor can quote, and an audit trail for refunds.
 */

export type PaymentStatus =
  /** Session created, visitor has not yet been sent to Stripe or has not paid. */
  | 'created'
  /** Payment started but not settled — bank transfer and other delayed methods. */
  | 'pending'
  | 'paid'
  | 'failed'
  /** Visitor abandoned Checkout, or the session expired unpaid. */
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export interface PaymentRecord {
  /** Our own reference. Quoted to the visitor and used in correspondence. */
  internalReference: string
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  customerName: string
  customerEmail: string
  /** The catalogue reference of what was bought, e.g. "service:application-support". */
  serviceType: string
  amountMinor: number
  currency: string
  /** ISO 8601, UTC. */
  createdAt: string
  updatedAt: string
  status: PaymentStatus
  /** Set when the payment secures a specific appointment slot. */
  appointmentReference?: string
  /** Which language tree the visitor bought in, so follow-up email matches. */
  locale?: Locale
  /** Minor units actually refunded, when a refund has been processed. */
  amountRefundedMinor?: number
}

/** Everything needed to open a record. Timestamps and status are set by the store. */
export interface NewPaymentRecord {
  internalReference: string
  customerName: string
  customerEmail: string
  serviceType: string
  amountMinor: number
  currency: string
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
  appointmentReference?: string
  locale?: Locale
}

/** Fields a later event is allowed to change. Money and identity are immutable. */
export type PaymentPatch = Partial<
  Pick<
    PaymentRecord,
    | 'status'
    | 'stripeSessionId'
    | 'stripePaymentIntentId'
    | 'appointmentReference'
    | 'amountRefundedMinor'
  >
>

/**
 * Storage contract.
 *
 * PRODUCTION NOTE: implement this against a real database (Postgres, Sanity with a
 * write token, or the CRM) and register it with `setPaymentStore()` from a server
 * entry point. The in-memory implementation below is correct but per-process: on a
 * serverless platform each invocation may get a fresh instance, so records written
 * during Checkout will not be visible to the webhook. Until a durable store is
 * wired in, the Stripe dashboard remains the operational record of every payment,
 * which is why the webhook also logs its decisions.
 */
export interface PaymentStore {
  /**
   * Creates the record, or returns the existing one when `internalReference` is
   * already present. Upsert semantics are required: the checkout route derives the
   * reference deterministically from the request so that a double submission
   * reuses one record rather than opening a second.
   */
  create(record: NewPaymentRecord): Promise<PaymentRecord>
  findByInternalReference(reference: string): Promise<PaymentRecord | null>
  findByStripeSessionId(sessionId: string): Promise<PaymentRecord | null>
  findByPaymentIntentId(paymentIntentId: string): Promise<PaymentRecord | null>
  /** Returns null when there is nothing to patch, rather than throwing. */
  update(reference: string, patch: PaymentPatch): Promise<PaymentRecord | null>
}

function now(): string {
  return new Date().toISOString()
}

/** Development and test default. Not durable; see the note on `PaymentStore`. */
export class InMemoryPaymentStore implements PaymentStore {
  private readonly records = new Map<string, PaymentRecord>()

  async create(input: NewPaymentRecord): Promise<PaymentRecord> {
    const existing = this.records.get(input.internalReference)
    if (existing) return existing

    const record: PaymentRecord = {
      internalReference: input.internalReference,
      stripeSessionId: input.stripeSessionId ?? null,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      serviceType: input.serviceType,
      amountMinor: input.amountMinor,
      currency: input.currency,
      createdAt: now(),
      updatedAt: now(),
      status: 'created',
      ...(input.appointmentReference ? { appointmentReference: input.appointmentReference } : {}),
      ...(input.locale ? { locale: input.locale } : {}),
    }
    this.records.set(record.internalReference, record)
    return record
  }

  async findByInternalReference(reference: string): Promise<PaymentRecord | null> {
    return this.records.get(reference) ?? null
  }

  async findByStripeSessionId(sessionId: string): Promise<PaymentRecord | null> {
    for (const record of this.records.values()) {
      if (record.stripeSessionId === sessionId) return record
    }
    return null
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<PaymentRecord | null> {
    for (const record of this.records.values()) {
      if (record.stripePaymentIntentId === paymentIntentId) return record
    }
    return null
  }

  async update(reference: string, patch: PaymentPatch): Promise<PaymentRecord | null> {
    const existing = this.records.get(reference)
    if (!existing) return null
    const updated: PaymentRecord = { ...existing, ...patch, updatedAt: now() }
    this.records.set(reference, updated)
    return updated
  }
}

let store: PaymentStore = new InMemoryPaymentStore()

export function getPaymentStore(): PaymentStore {
  return store
}

/** Swap in the durable implementation at boot, or a fake in tests. */
export function setPaymentStore(next: PaymentStore): void {
  store = next
}

/**
 * A human-quotable reference: HE-YYYYMMDD-XXXXXX.
 *
 * The random part uses an alphabet without I, O, 0 or 1, because this string gets
 * read out over the phone and written down.
 */
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function formatInternalReference(seed: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '')
  // Reads two hex characters per output character, so a 64-character SHA-256 hex
  // digest contributes 48 bits rather than 6 low-entropy character codes.
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    const pair = seed.slice(i * 2, i * 2 + 2)
    const value = Number.parseInt(pair, 16)
    suffix += REFERENCE_ALPHABET[(Number.isNaN(value) ? i : value) % REFERENCE_ALPHABET.length]
  }
  return `HE-${day}-${suffix}`
}

/**
 * Statuses a visitor may be shown. Anything else is an internal detail; the UI maps
 * unknown values to a neutral "we are checking" state rather than guessing.
 */
export const VISIBLE_STATUSES: readonly PaymentStatus[] = [
  'paid',
  'pending',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
]
