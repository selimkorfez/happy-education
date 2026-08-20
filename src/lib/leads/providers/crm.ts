import { isConfigured, serverEnv, siteUrl } from '@/lib/env'
import { logAppEvent, logSecurityEvent } from '@/lib/logger'
import type { LeadProvider } from '../types'

/**
 * CRM delivery over a webhook.
 *
 * Audit report-1 (H4) found the current WordPress site POSTing student details
 * straight from the browser to a Salesforce Web-to-Lead endpoint, with no CAPTCHA
 * and no server in between. That is the pattern this replaces: the browser talks
 * only to this origin, and the server-to-server hop carries a scoped credential
 * the visitor never sees. Whatever sits behind `CRM_WEBHOOK_URL` (a Salesforce
 * proxy, HubSpot, a Zapier catch hook) is a deployment decision, not a code one.
 *
 * DELIBERATELY NO RETRY. The visitor is waiting on this request, and a second
 * eight-second attempt risks a platform timeout that would take the email channel
 * down with it. A CRM outage is recorded as an ops event and the email channel
 * still delivers the lead, which is the outcome that matters. Re-syncing the CRM
 * afterwards is a back-office job, not something to do while somebody waits.
 */

const TIMEOUT_MS = 8_000

export function createCrmLeadProvider(reference: string): LeadProvider {
  return {
    channel: 'crm',

    isAvailable: () => isConfigured.crm(),

    async deliver(lead) {
      const env = serverEnv()
      const url = env.CRM_WEBHOOK_URL
      const token = env.CRM_API_TOKEN
      if (!url || !token) return { channel: 'crm', ok: false, reason: 'not-configured' }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reference,
            kind: lead.kind,
            locale: lead.locale,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            country: lead.country,
            interest: lead.interest,
            destination: lead.destination,
            startDate: lead.startDate,
            educationLevel: lead.educationLevel,
            preferredContact: lead.preferredContact,
            message: lead.message,
            marketingConsent: lead.marketingConsent,
            consentAt: lead.consentAt,
            submittedAt: lead.submittedAt,
            sourceUrl: `${siteUrl}${lead.sourcePath}`,
            programme: lead.programmeRef
              ? { title: lead.programmeRef.title, url: `${siteUrl}${lead.programmeRef.path}` }
              : undefined,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: 'no-store',
        })

        if (!response.ok) {
          // Status only. The response body may echo the submitted record back.
          logSecurityEvent('error', 'lead.crm.rejected', {
            reference,
            kind: lead.kind,
            status: response.status,
          })
          return { channel: 'crm', ok: false, reason: `http_${response.status}` }
        }

        logAppEvent('info', 'lead.crm.delivered', { reference, kind: lead.kind })
        return { channel: 'crm', ok: true }
      } catch (error) {
        const reason =
          error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network'
        logSecurityEvent('error', 'lead.crm.failed', { reference, kind: lead.kind, reason, error })
        return { channel: 'crm', ok: false, reason }
      }
    },
  }
}
