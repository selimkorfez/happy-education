/**
 * Transactional email, public surface.
 *
 * Import from here rather than reaching into the individual modules, so the
 * provider (`sender.ts`) can be swapped without a search-and-replace across the
 * codebase.
 */

export type { EmailMessage, EmailResult, EmailSender } from './types'
export { renderEmail, type EmailBlock, type EmailDocument, type RenderedEmail } from './layout'
export {
  getEmailSender,
  logOnlySender,
  resendSender,
  sendEmail,
  setEmailSender,
  staffRecipient,
} from './sender'
export { enquiryAcknowledgement } from './templates/enquiry-acknowledgement'
export { enquiryNotification } from './templates/enquiry-notification'
export {
  newsletterConfirmation,
  type NewsletterConfirmationInput,
} from './templates/newsletter-confirmation'
