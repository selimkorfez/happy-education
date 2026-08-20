import { isProduction } from '@/lib/env'
import { fingerprint, logAppEvent } from '@/lib/logger'
import type { LeadProvider } from '../types'

/**
 * Development fallback.
 *
 * Records that a lead arrived, with enough shape to debug the form and nothing a
 * person could be identified from. It is never available in production: if the
 * real channels are down there, the request must fail visibly so the visitor is
 * told to phone instead of being thanked for a message nobody will read.
 */
export const consoleLeadProvider: LeadProvider = {
  channel: 'console',

  isAvailable: () => !isProduction,

  async deliver(lead) {
    logAppEvent('info', 'lead.console', {
      kind: lead.kind,
      locale: lead.locale,
      sourcePath: lead.sourcePath,
      interest: lead.interest,
      destination: lead.destination,
      hasPhone: Boolean(lead.phone),
      hasMessage: Boolean(lead.message),
      marketingConsent: lead.marketingConsent,
      programmePath: lead.programmeRef?.path,
      // Correlation only. Not reversible to an address.
      contact: fingerprint(lead.email),
    })
    return { channel: 'console', ok: true }
  },
}
