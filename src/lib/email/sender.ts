import { BUSINESS, publicValue } from '@/lib/business-facts'
import { isConfigured, serverEnv } from '@/lib/env'
import { fingerprint, logAppEvent, logSecurityEvent } from '@/lib/logger'
import type { EmailMessage, EmailResult, EmailSender } from './types'

/**
 * Sender selection.
 *
 * Resend when it is configured, a logging stub when it is not. The stub reports
 * success on purpose: a developer running a clean checkout with no API keys must
 * be able to submit the enquiry form and see the whole flow work, including the
 * success state. Failing there would push people to comment the email step out,
 * which is how a broken send reaches production unnoticed.
 *
 * `setEmailSender()` is the swap seam for tests and for a future provider change.
 */

/** The recipient's domain is useful for diagnosing a bounce; the address is not ours to log. */
function recipientDomain(address: string): string {
  const at = address.lastIndexOf('@')
  return at === -1 ? 'unknown' : address.slice(at + 1).toLowerCase()
}

function describe(message: EmailMessage) {
  return {
    template: message.template,
    locale: message.locale,
    recipientDomain: recipientDomain(message.to),
    recipientFingerprint: fingerprint(message.to),
    // Subjects are written without personal data precisely so this line is safe.
    subjectLine: message.subject,
    htmlLength: message.html.length,
    textLength: message.text.length,
  }
}

/* -------------------------------------------------------------------------- */
/* Resend                                                                      */
/* -------------------------------------------------------------------------- */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const SEND_TIMEOUT_MS = 10_000

export const resendSender: EmailSender = {
  name: 'resend',

  isAvailable: () => isConfigured.email(),

  async send(message) {
    const env = serverEnv()
    const from = env.EMAIL_FROM
    const apiKey = env.RESEND_API_KEY
    if (!from || !apiKey) return { ok: false, reason: 'not-configured' }

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        cache: 'no-store',
      })

      if (!response.ok) {
        // The body may echo the recipient address back, so it is never logged.
        logSecurityEvent('error', 'email.send.rejected', {
          ...describe(message),
          status: response.status,
        })
        return { ok: false, reason: `http_${response.status}` }
      }

      const payload: unknown = await response.json().catch(() => null)
      const id =
        payload && typeof payload === 'object' && 'id' in payload && typeof payload.id === 'string'
          ? payload.id
          : undefined

      logAppEvent('info', 'email.send.ok', { ...describe(message), providerId: id })
      return { ok: true, id }
    } catch (error) {
      const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network'
      logSecurityEvent('error', 'email.send.failed', { ...describe(message), reason, error })
      return { ok: false, reason }
    }
  },
}

/* -------------------------------------------------------------------------- */
/* Log-only fallback                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Records what would have been sent. The message body is deliberately NOT logged,
 * even locally: a developer's terminal scrollback and their shell history are not
 * a place for a stranger's enquiry. The envelope is enough to confirm the pipeline
 * fired, and `renderEmail()` can be exercised directly in a unit test.
 */
export const logOnlySender: EmailSender = {
  name: 'log-only',
  isAvailable: () => true,
  async send(message) {
    logAppEvent('info', 'email.send.skipped', {
      ...describe(message),
      note: 'email is not configured; message was not sent',
    })
    return { ok: true, skipped: true }
  },
}

/* -------------------------------------------------------------------------- */
/* Selection                                                                   */
/* -------------------------------------------------------------------------- */

let override: EmailSender | null = null

/** Replace the active sender. Used by tests and by a future provider swap. */
export function setEmailSender(sender: EmailSender | null): void {
  override = sender
}

export function getEmailSender(): EmailSender {
  if (override) return override
  return resendSender.isAvailable() ? resendSender : logOnlySender
}

/** Send one message through the active sender. Never throws. */
export function sendEmail(message: EmailMessage): Promise<EmailResult> {
  return getEmailSender().send(message)
}

/**
 * Where staff notifications go. Falls back to the published business address so a
 * missing environment variable degrades to a working inbox rather than a lost lead.
 * `admin@happyeducation.uk` is a verified fact, not a guess: see `business-facts`.
 */
export function staffRecipient(): string | null {
  return serverEnv().EMAIL_ENQUIRY_RECIPIENT ?? publicValue(BUSINESS.email)
}
