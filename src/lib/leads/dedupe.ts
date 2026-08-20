import { createHash } from 'node:crypto'
import type { Lead } from './types'

/**
 * Double-submit protection.
 *
 * The case this exists for is ordinary and constant: somebody presses Send, the
 * page seems to hesitate, and they press it again. Without this, an adviser opens
 * two identical emails and the CRM holds two identical records, and the second one
 * gets worked as though it were a separate family.
 *
 * The identity of a submission is (email, kind, programme, coarse time bucket).
 * The time bucket is what keeps this from blocking a legitimate second enquiry:
 * the same person asking about a different programme is a different lead
 * immediately, and asking about the same programme again tomorrow is a new lead
 * then. Only the same thing twice inside ten minutes collapses.
 *
 * A boundary case is handled explicitly: two submissions either side of a bucket
 * edge would otherwise hash differently, so the previous bucket is checked too.
 *
 * SCOPE: in-memory, per instance, like the rate limiter. It removes the common
 * accidental duplicate. It is not a distributed guarantee, so the CRM should still
 * deduplicate on its own side, and the reference is stable enough to match on.
 */

const BUCKET_MS = 10 * 60 * 1000
const MAX_ENTRIES = 5_000

/** Fingerprint to expiry time. */
const claimed = new Map<string, number>()

function prune(now: number): void {
  for (const [key, expiresAt] of claimed) {
    if (expiresAt <= now) claimed.delete(key)
  }
}

function hashFor(lead: Lead, bucket: number): string {
  return createHash('sha256')
    .update(
      [
        lead.email.trim().toLowerCase(),
        lead.kind,
        lead.programmeRef?.path ?? '',
        String(bucket),
      ].join('|'),
    )
    .digest('hex')
}

/**
 * A short reference a person can quote on the phone. Derived from the submission
 * fingerprint, so it is stable across a duplicate and reveals nothing: the input
 * includes a time bucket and cannot be reversed to an address.
 */
export function leadReference(fingerprint: string): string {
  return `HE-${fingerprint.slice(0, 6).toUpperCase()}`
}

export interface Claim {
  reference: string
  duplicate: boolean
  fingerprint: string
}

/**
 * Register a submission. Returns `duplicate: true` when the identical submission
 * was already accepted inside the window, along with the SAME reference, so the
 * visitor sees a consistent answer whichever request they were shown.
 */
export function claimSubmission(lead: Lead, now: number = Date.now()): Claim {
  prune(now)

  const bucket = Math.floor(now / BUCKET_MS)
  const current = hashFor(lead, bucket)
  const previous = hashFor(lead, bucket - 1)

  if (claimed.has(previous)) {
    return { reference: leadReference(previous), duplicate: true, fingerprint: previous }
  }
  if (claimed.has(current)) {
    return { reference: leadReference(current), duplicate: true, fingerprint: current }
  }

  if (claimed.size >= MAX_ENTRIES) {
    const oldest = claimed.keys().next()
    if (!oldest.done) claimed.delete(oldest.value)
  }
  claimed.set(current, now + BUCKET_MS * 2)

  return { reference: leadReference(current), duplicate: false, fingerprint: current }
}

/** Test helper. */
export function resetClaims(): void {
  claimed.clear()
}
