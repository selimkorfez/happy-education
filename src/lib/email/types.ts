/**
 * Transactional email contracts.
 *
 * Every message this site sends is a direct response to something a person did:
 * an enquiry acknowledgement, a staff notification, a double opt-in confirmation.
 * There is no bulk sending path here and there must never be one, because the
 * sending domain's deliverability is the thing that gets an enquiry answered.
 */

export interface EmailMessage {
  to: string
  subject: string
  /** Inlined-style HTML. No remote images, no web fonts, no tracking pixel. */
  html: string
  /** Always supplied. A text/plain alternative is a deliverability requirement, not a nicety. */
  text: string
  /** Set on staff notifications so hitting reply answers the student directly. */
  replyTo?: string
  /**
   * Short, non-personal label identifying which template produced the message.
   * Used for logging, since the recipient and subject must not be logged.
   */
  template: string
  /** Locale the message was rendered in, for logging and for provider tagging. */
  locale: string
}

export interface EmailResult {
  ok: boolean
  /** Provider-side message id, when one is returned. */
  id?: string
  /** Short machine-readable failure reason. Never a raw provider response body. */
  reason?: string
  /** True when email is not configured and the message was logged instead of sent. */
  skipped?: boolean
}

/**
 * The swap seam. Resend is the default implementation; a different provider needs
 * only this method, and tests use an in-memory recorder.
 *
 * `send()` must resolve rather than reject: a failed notification is handled by
 * the caller (which still has other channels), and an exception here would take
 * the whole lead delivery down.
 */
export interface EmailSender {
  readonly name: string
  isAvailable(): boolean
  send(message: EmailMessage): Promise<EmailResult>
}
