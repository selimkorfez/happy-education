import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import { isProduction } from '@/lib/env'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'

/**
 * THE AUTHORITATIVE PRICE SOURCE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE BROWSER NEVER SUPPLIES AN AMOUNT.
 *
 * A checkout request carries a `reference` — a short, stable, opaque string — and
 * nothing else about money. The amount, the currency and whether the item is
 * refundable are read here, on the server, from the CMS. A client-submitted
 * amount is never trusted under any circumstance: not as a "hint", not as a
 * cross-check, not in metadata. `/api/checkout` rejects a request outright if the
 * body contains an amount-shaped field (see `CLIENT_AMOUNT_KEYS`), because the
 * only reason to send one is to try to change the price.
 *
 * This is the single most important rule in the payment code. If a future change
 * makes the amount travel through the browser in any form, that change is wrong.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * REFERENCE FORMAT
 *   service:<code>       a `paymentService` document whose `reference` is <code>
 *   appointment:<slug>   an `appointmentType` document with that slug in this locale
 *
 * The prefix is part of the reference so that a slug collision between the two
 * document types cannot resolve to the wrong price.
 */

export type PayableKind = 'service' | 'appointment'

export interface Payable {
  /** The reference exactly as it must be sent back to the checkout route. */
  reference: string
  kind: PayableKind
  title: string
  /** Minor units. 4900 = £49.00. Never a float, never a decimal string. */
  amountMinor: number
  /** ISO 4217, upper case. Always rendered next to the amount, never assumed. */
  currency: string
  refundable: boolean
  /** Plain text. Portable Text is flattened here so it can go in a meta line. */
  description: string
  /** Bullet points for "what this covers". Empty when the CMS has none. */
  covers: string[]
  /** Appointments only. */
  durationMinutes?: number
}

/**
 * Field names an attacker would try in order to set their own price. Any of these
 * appearing in a checkout request body is treated as tampering: the request is
 * refused and logged, rather than being quietly sanitised.
 */
export const CLIENT_AMOUNT_KEYS = [
  'amount',
  'amountMinor',
  'amount_minor',
  'price',
  'priceMinor',
  'price_minor',
  'currency',
  'total',
  'unit_amount',
  'discount',
  'coupon',
] as const

const REFERENCE_PATTERN = /^(service|appointment):[a-z0-9][a-z0-9-]{0,80}$/

export function isValidReference(reference: string): boolean {
  return REFERENCE_PATTERN.test(reference)
}

function splitReference(reference: string): { kind: PayableKind; id: string } | null {
  if (!isValidReference(reference)) return null
  const separator = reference.indexOf(':')
  const kind = reference.slice(0, separator)
  const id = reference.slice(separator + 1)
  if (kind !== 'service' && kind !== 'appointment') return null
  return { kind, id }
}

interface ServiceRow {
  title?: string
  reference?: string
  description?: string
  covers?: string[]
  priceMinor?: number
  currency?: string
  refundable?: boolean
}

interface AppointmentRow {
  title?: string
  slug?: string
  description?: string
  durationMinutes?: number
  priceMinor?: number
  currency?: string
  refundable?: boolean
}

const SERVICE_QUERY = /* groq */ `
  *[_type == "paymentService"
    && locale == $locale
    && reference == $id
    && active == true
    && !(_id in path("drafts.**"))][0]{
      title,
      reference,
      "description": pt::text(description),
      "covers": coalesce(whatItCovers, []),
      priceMinor,
      currency,
      refundable
    }
`

const APPOINTMENT_QUERY = /* groq */ `
  *[_type == "appointmentType"
    && locale == $locale
    && slug.current == $id
    && active == true
    && !(_id in path("drafts.**"))][0]{
      title,
      "slug": slug.current,
      description,
      durationMinutes,
      priceMinor,
      currency,
      refundable
    }
`

/**
 * Local-development catalogue.
 *
 * Everything with a non-zero amount is DEVELOPMENT ONLY. Real prices are a business
 * fact and belong to the client; publishing a number this code invented would be a
 * fabricated claim, so in production an unconfigured CMS resolves to null and the
 * checkout answers "unavailable" rather than charging a made-up figure.
 *
 * Zero-amount entries are exempt because "free" states no figure. The free first
 * consultation is already described as free in the site's own copy.
 */
interface FallbackEntry extends Payable {
  developmentOnly: boolean
}

const FALLBACK_CATALOGUE: readonly FallbackEntry[] = [
  {
    reference: 'appointment:initial-consultation',
    kind: 'appointment',
    title: 'Initial consultation',
    amountMinor: 0,
    currency: 'GBP',
    refundable: true,
    description:
      'A first conversation about what you want to study, where it is realistic to apply, and what the timeline looks like.',
    covers: [],
    durationMinutes: 30,
    developmentOnly: false,
  },
  {
    reference: 'appointment:ucretsiz-on-gorusme',
    kind: 'appointment',
    title: 'Ücretsiz ön görüşme',
    amountMinor: 0,
    currency: 'GBP',
    refundable: true,
    description:
      'Ne okumak istediğinizi, hangi başvuruların gerçekçi olduğunu ve takvimin nasıl işlediğini konuştuğumuz ilk görüşme.',
    covers: [],
    durationMinutes: 30,
    developmentOnly: false,
  },
  {
    // Placeholder figure for local development only. Never rendered in production.
    reference: 'service:example-development-service',
    kind: 'service',
    title: 'Example service (development fixture)',
    amountMinor: 1000,
    currency: 'GBP',
    refundable: true,
    description:
      'Fixture used to exercise the checkout locally. It is not a Happy Education service and never resolves in production.',
    covers: [],
    developmentOnly: true,
  },
]

function fromFallback(reference: string): Payable | null {
  const entry = FALLBACK_CATALOGUE.find((item) => item.reference === reference)
  if (!entry) return null
  if (entry.developmentOnly && isProduction) return null
  const { developmentOnly: _developmentOnly, ...payable } = entry
  return payable
}

function normaliseCurrency(value: string | undefined): string {
  const currency = (value ?? 'GBP').toUpperCase()
  return /^[A-Z]{3}$/.test(currency) ? currency : 'GBP'
}

/** Guards against a CMS typo (a float, a negative, or an implausible amount). */
function normaliseAmount(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (!Number.isInteger(value) || value < 0) return null
  // Ten thousand pounds. A consultancy fee above this is a data-entry error, and
  // refusing is far cheaper than taking it.
  if (value > 1_000_000) return null
  return value
}

/**
 * Resolves a payable item from its reference, server-side.
 *
 * Returns null when the reference is malformed, the document is missing, the item
 * is inactive, or the price fails validation. Callers must treat null as "this
 * cannot be sold right now" and show a contact route instead.
 */
export async function resolvePayable(
  reference: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<Payable | null> {
  const parts = splitReference(reference)
  if (!parts) return null

  if (parts.kind === 'service') {
    const row = await sanityFetch<ServiceRow | null>(
      SERVICE_QUERY,
      { locale, id: parts.id },
      { tags: ['paymentService'], revalidate: 300 },
      null,
    )
    if (!row?.title) return fromFallback(reference)

    const amountMinor = normaliseAmount(row.priceMinor)
    if (amountMinor === null) return null

    return {
      reference,
      kind: 'service',
      title: row.title,
      amountMinor,
      currency: normaliseCurrency(row.currency),
      refundable: row.refundable !== false,
      description: row.description ?? '',
      covers: (row.covers ?? []).filter((item): item is string => typeof item === 'string'),
    }
  }

  const row = await sanityFetch<AppointmentRow | null>(
    APPOINTMENT_QUERY,
    { locale, id: parts.id },
    { tags: ['appointmentType'], revalidate: 300 },
    null,
  )
  if (!row?.title) return fromFallback(reference)

  const amountMinor = normaliseAmount(row.priceMinor)
  if (amountMinor === null) return null

  return {
    reference,
    kind: 'appointment',
    title: row.title,
    amountMinor,
    currency: normaliseCurrency(row.currency),
    refundable: row.refundable !== false,
    description: row.description ?? '',
    covers: [],
    ...(typeof row.durationMinutes === 'number' ? { durationMinutes: row.durationMinutes } : {}),
  }
}

/** True when the item costs nothing, so no Stripe session should be created. */
export function isFree(payable: Payable): boolean {
  return payable.amountMinor === 0
}
