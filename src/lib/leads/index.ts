/**
 * Lead capture, public surface.
 *
 * Server code should import from here. The browser must NOT: `provider.ts` and
 * everything below it reach `node:crypto`, `serverEnv()` and the network. Client
 * components import `./constraints`, `./types` and `./labels`, all of which are
 * pure by design.
 */

export type {
  ContactMethod,
  EducationLevel,
  EnquiryApiResponse,
  EnquiryErrorCode,
  FieldErrorCode,
  Interest,
  Lead,
  LeadChannel,
  LeadDelivery,
  LeadKind,
  LeadProvider,
  LeadResult,
  NewsletterApiResponse,
  NewsletterConfirmOutcome,
  ProgrammeRef,
  StartWindow,
} from './types'

export {
  CONTACT_METHODS,
  EDUCATION_LEVELS,
  INTEREST_OPTIONS,
  LEAD_KINDS,
  START_WINDOWS,
} from './types'

export {
  ENQUIRY_ENDPOINT,
  ENQUIRY_STATUS_PARAM,
  FIELD_LIMITS,
  HONEYPOT_FIELD,
  NEWSLETTER_CONFIRM_ENDPOINT,
  NEWSLETTER_ENDPOINT,
  NEWSLETTER_STATUS_PARAM,
  TURNSTILE_FIELD,
} from './constraints'

export {
  contactMethodLabel,
  educationLevelLabel,
  interestLabel,
  startWindowLabel,
} from './labels'

export {
  enquirySchema,
  findProhibitedField,
  newsletterSchema,
  parseEnquiry,
  parseNewsletter,
  type EnquiryInput,
  type FieldErrors,
  type NewsletterInput,
  type ParseResult,
  type RawSubmission,
} from './validation'

export { buildLead, deliverLead, type LeadContext } from './provider'
export { claimSubmission, leadReference, resetClaims } from './dedupe'
export { verifyTurnstile, type TurnstileOutcome } from './turnstile'
export {
  createConfirmationToken,
  isTokenSigningAvailable,
  verifyConfirmationToken,
  TOKEN_EXPIRY_HOURS,
  type NewsletterTokenPayload,
} from './newsletter-token'
export {
  isSameOrigin,
  prefersJson,
  readClientIp,
  readSubmission,
  statusRedirectUrl,
} from './http'
