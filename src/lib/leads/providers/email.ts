import { isConfigured, isProduction } from '@/lib/env'
import {
  enquiryAcknowledgement,
  enquiryNotification,
  sendEmail,
  staffRecipient,
} from '@/lib/email'
import { logAppEvent, logSecurityEvent } from '@/lib/logger'
import type { LeadProvider } from '../types'

/**
 * Email delivery of a lead.
 *
 * This is the channel that must not fail quietly, because it is the one an adviser
 * actually watches. Two messages go out and they are NOT equal in importance:
 *
 *   - the staff notification decides whether the lead is answered, so its result
 *     is the result of this channel;
 *   - the acknowledgement is a courtesy to the visitor, so a failure there is
 *     logged loudly but does not mark the lead undelivered. Telling somebody their
 *     enquiry failed, when it is sitting in the adviser's inbox, would cause a
 *     duplicate submission and a worse experience than a missing receipt.
 *
 * The acknowledgement is sent second for the same reason: if the process is going
 * to run out of time, it should run out after the important message.
 */
export function createEmailLeadProvider(reference: string): LeadProvider {
  return {
    channel: 'email',

    /**
     * Available in development even without credentials, where the sender logs
     * instead of sending. In production a missing configuration makes this channel
     * unavailable, so the route reports a delivery failure rather than thanking
     * somebody for a message that went nowhere.
     */
    isAvailable: () => isConfigured.email() || !isProduction,

    async deliver(lead) {
      const recipient = staffRecipient()
      if (!recipient) {
        logSecurityEvent('error', 'lead.email.noRecipient', { kind: lead.kind, reference })
        return { channel: 'email', ok: false, reason: 'no-recipient' }
      }

      const notification = await sendEmail(enquiryNotification(lead, reference, recipient))

      if (!notification.ok) {
        logSecurityEvent('error', 'lead.email.notificationFailed', {
          kind: lead.kind,
          reference,
          reason: notification.reason,
        })
        return { channel: 'email', ok: false, reason: notification.reason ?? 'send-failed' }
      }

      // A confirmed newsletter subscriber has already had two emails from us and
      // did not ask a question, so there is nothing to acknowledge.
      if (lead.kind === 'newsletter') {
        logAppEvent('info', 'lead.email.delivered', { kind: lead.kind, reference })
        return { channel: 'email', ok: true, reference: notification.id }
      }

      const acknowledgement = await sendEmail(enquiryAcknowledgement(lead, reference))
      if (!acknowledgement.ok) {
        // Worth an alert: the visitor now has no receipt and may well submit again.
        logSecurityEvent('warn', 'lead.email.acknowledgementFailed', {
          kind: lead.kind,
          reference,
          reason: acknowledgement.reason,
        })
      }

      logAppEvent('info', 'lead.email.delivered', {
        kind: lead.kind,
        reference,
        acknowledged: acknowledgement.ok,
        simulated: notification.skipped === true,
      })

      return { channel: 'email', ok: true, reference: notification.id }
    },
  }
}
