import type { Locale } from '@/lib/i18n/config'

/**
 * The lead domain model.
 *
 * Deliberately free of imports beyond the locale type: this module is shared by
 * the browser forms and by the server route, so it must stay pure. Anything that
 * touches `node:crypto`, `serverEnv()` or the network belongs in a sibling file.
 *
 * The shape is driven by what an adviser needs to answer an enquiry properly, and
 * nothing more. There is no field for a passport number, a bank detail, a medical
 * condition or an identity document, and `validation.ts` rejects any submission
 * that tries to introduce one. Those belong in a secure client file, never in a
 * website form and never in an email.
 */

export const LEAD_KINDS = ['enquiry', 'consultation', 'programme-enquiry', 'newsletter'] as const
export type LeadKind = (typeof LEAD_KINDS)[number]

/** Mirrors the site sections a visitor can be enquiring about, plus an escape hatch. */
export const INTEREST_OPTIONS = [
  'universities',
  'languageSchools',
  'summerSchools',
  'boardingSchools',
  'tours',
  'other',
] as const
export type Interest = (typeof INTEREST_OPTIONS)[number]

export const EDUCATION_LEVELS = [
  'secondary',
  'highSchool',
  'foundation',
  'undergraduate',
  'postgraduate',
  'adultLearner',
  'other',
] as const
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]

/**
 * A window rather than a date. Families think in "next September", not in
 * `2027-09-01`, and a free date field produces unparseable input in two locales.
 */
export const START_WINDOWS = [
  'asSoonAsPossible',
  'withinSixMonths',
  'nextAcademicYear',
  'undecided',
] as const
export type StartWindow = (typeof START_WINDOWS)[number]

export const CONTACT_METHODS = ['email', 'phone', 'whatsapp'] as const
export type ContactMethod = (typeof CONTACT_METHODS)[number]

/** The specific programme or institution page an enquiry came from. */
export interface ProgrammeRef {
  title: string
  /** Internal path, always starting with `/`. Never an external URL. */
  path: string
}

export interface Lead {
  kind: LeadKind
  locale: Locale
  name: string
  email: string
  phone?: string
  country?: string
  interest?: Interest
  destination?: string
  startDate?: StartWindow
  educationLevel?: EducationLevel
  preferredContact?: ContactMethod
  message?: string
  /** Page the enquiry was submitted from, for context in the staff notification. */
  sourcePath: string
  /** ISO 8601, set on the server. Never trusted from the client. */
  submittedAt: string
  /**
   * Separate, explicit, and always optional for an enquiry. UK PECR and GDPR
   * Art. 7 both require marketing consent to be freely given and unbundled, so
   * this is never a condition of the enquiry being answered.
   */
  marketingConsent: boolean
  /** ISO 8601 timestamp of the consent, recorded only when consent was given. */
  consentAt?: string
  programmeRef?: ProgrammeRef
}

/* -------------------------------------------------------------------------- */
/* Delivery                                                                    */
/* -------------------------------------------------------------------------- */

export type LeadChannel = 'crm' | 'email' | 'console'

export interface LeadResult {
  channel: LeadChannel
  ok: boolean
  /** Provider-side identifier, when one comes back. Must never contain personal data. */
  reference?: string
  /** Short machine-readable failure reason. Never a raw provider response body. */
  reason?: string
}

/**
 * A lead delivery target.
 *
 * `isAvailable()` is checked before `deliver()` so an unconfigured integration is
 * skipped quietly rather than throwing. `deliver()` must resolve, never reject:
 * a provider that throws would take the other channels down with it.
 */
export interface LeadProvider {
  readonly channel: LeadChannel
  isAvailable(): boolean
  deliver(lead: Lead): Promise<LeadResult>
}

export interface LeadDelivery {
  /** True when at least one channel accepted the lead. */
  ok: boolean
  /** Short reference shown to the visitor and quoted in the staff notification. */
  reference: string
  /** True when this exact submission was already accepted moments ago. */
  duplicate: boolean
  results: readonly LeadResult[]
}

/* -------------------------------------------------------------------------- */
/* API contracts                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Field-level failure codes. The API returns codes, not sentences: the browser
 * already knows the visitor's locale and owns the wording, and this keeps the
 * response free of anything that could echo submitted content back to a caller.
 */
export type FieldErrorCode = 'required' | 'invalid' | 'tooLong' | 'tooShort' | 'unsupported'

export type EnquiryErrorCode =
  | 'validation'
  | 'rateLimit'
  | 'captcha'
  | 'origin'
  | 'malformed'
  | 'delivery'
  | 'unavailable'

export type EnquiryApiResponse =
  | { ok: true; reference: string; duplicate: boolean }
  | {
      ok: false
      error: EnquiryErrorCode
      /** Present only for `validation`. */
      fields?: Partial<Record<string, FieldErrorCode>>
      /** Present only for `rateLimit`. */
      retryAfterSeconds?: number
    }

export type NewsletterApiResponse =
  | { ok: true; pending: true }
  | {
      ok: false
      error: EnquiryErrorCode
      fields?: Partial<Record<string, FieldErrorCode>>
      retryAfterSeconds?: number
    }

/** Outcome reported back on the confirmation landing page via a query parameter. */
export type NewsletterConfirmOutcome = 'confirmed' | 'expired' | 'invalid' | 'unavailable'
