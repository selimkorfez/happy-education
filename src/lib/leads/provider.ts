import { logAppEvent, logSecurityEvent } from '@/lib/logger'
import { claimSubmission } from './dedupe'
import { createCrmLeadProvider } from './providers/crm'
import { createEmailLeadProvider } from './providers/email'
import { consoleLeadProvider } from './providers/console'
import type { EnquiryInput } from './validation'
import type { Lead, LeadDelivery, LeadResult } from './types'

/**
 * Lead delivery.
 *
 * The composition rule, and the reason for it:
 *
 *   CRM is attempted when configured, and the staff email ALWAYS runs. They run in
 *   parallel and neither waits for the other, so an unresponsive CRM cannot delay
 *   or suppress the notification an adviser is watching for. A lead is considered
 *   delivered if ANY channel accepted it.
 *
 * This is the opposite of the usual "write to the system of record, then notify"
 * ordering, and it is deliberate. The system of record here is a third party the
 * business does not operate; the inbox is not. When they disagree, the inbox wins,
 * because a lead sitting in a queue nobody watches is a lost client, and the CRM
 * can be reconciled afterwards from the reference in the email.
 *
 * Console delivery exists only for local development, and only when nothing else
 * is available, so a clean checkout still shows a working form end to end.
 */

export interface LeadContext {
  /** Where the submission came from, as a site-absolute path. */
  sourcePath: string
  /** Server clock. Never taken from the request. */
  submittedAt?: string
}

/**
 * Turn validated input into the delivered record.
 *
 * The timestamp and the consent timestamp are set here, on the server: a client
 * could otherwise backdate a consent record, which is exactly the field a
 * regulator would ask about.
 */
export function buildLead(input: EnquiryInput, context?: LeadContext): Lead {
  const submittedAt = context?.submittedAt ?? new Date().toISOString()
  const programmeRef =
    input.programmeTitle && input.programmePath
      ? { title: input.programmeTitle, path: input.programmePath }
      : undefined

  return {
    kind: input.kind,
    locale: input.locale,
    name: input.name,
    email: input.email,
    phone: input.phone,
    country: input.country,
    interest: input.interest,
    destination: input.destination,
    startDate: input.startDate,
    educationLevel: input.educationLevel,
    preferredContact: input.preferredContact,
    message: input.message,
    sourcePath: context?.sourcePath ?? input.sourcePath,
    submittedAt,
    marketingConsent: input.marketingConsent,
    consentAt: input.marketingConsent ? submittedAt : undefined,
    programmeRef,
  }
}

export async function deliverLead(lead: Lead): Promise<LeadDelivery> {
  const claim = claimSubmission(lead)

  if (claim.duplicate) {
    // Answer as though it succeeded, because for the visitor it did: their first
    // submission is already with an adviser under this same reference.
    logAppEvent('info', 'lead.duplicate', {
      kind: lead.kind,
      reference: claim.reference,
      sourcePath: lead.sourcePath,
    })
    return { ok: true, reference: claim.reference, duplicate: true, results: [] }
  }

  const candidates = [
    createCrmLeadProvider(claim.reference),
    createEmailLeadProvider(claim.reference),
  ].filter((provider) => provider.isAvailable())

  const providers = candidates.length > 0 ? candidates : [consoleLeadProvider].filter((p) => p.isAvailable())

  if (providers.length === 0) {
    logSecurityEvent('error', 'lead.noChannel', {
      kind: lead.kind,
      reference: claim.reference,
      sourcePath: lead.sourcePath,
    })
    return { ok: false, reference: claim.reference, duplicate: false, results: [] }
  }

  const settled = await Promise.allSettled(providers.map((provider) => provider.deliver(lead)))

  const results: LeadResult[] = settled.map((outcome, index) => {
    if (outcome.status === 'fulfilled') return outcome.value
    // A provider is contracted never to throw; if one does, treat the channel as
    // failed rather than letting it take the request down.
    const channel = providers[index]?.channel ?? 'console'
    logSecurityEvent('error', 'lead.provider.threw', {
      channel,
      reference: claim.reference,
      error: outcome.reason instanceof Error ? outcome.reason : undefined,
    })
    return { channel, ok: false, reason: 'exception' }
  })

  const ok = results.some((result) => result.ok)

  if (!ok) {
    logSecurityEvent('error', 'lead.deliveryFailed', {
      kind: lead.kind,
      reference: claim.reference,
      sourcePath: lead.sourcePath,
      channels: results.map((r) => `${r.channel}:${r.reason ?? 'failed'}`),
    })
  } else if (results.some((result) => !result.ok)) {
    // Partial success. The lead is safe, but a channel is broken and somebody
    // needs to know before the working one also fails.
    logSecurityEvent('warn', 'lead.partialDelivery', {
      kind: lead.kind,
      reference: claim.reference,
      channels: results.map((r) => `${r.channel}:${r.ok ? 'ok' : (r.reason ?? 'failed')}`),
    })
  }

  return { ok, reference: claim.reference, duplicate: false, results }
}
