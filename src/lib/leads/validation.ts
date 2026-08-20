import { z } from 'zod'
import { LOCALES } from '@/lib/i18n/config'
import { FIELD_LIMITS } from './constraints'
import {
  CONTACT_METHODS,
  EDUCATION_LEVELS,
  INTEREST_OPTIONS,
  START_WINDOWS,
  type FieldErrorCode,
} from './types'

/**
 * Server-side validation.
 *
 * This is the authoritative check. The browser form repeats some of it for a
 * kinder experience, but every rule that matters is applied here, on input that is
 * assumed hostile: `maxLength` in HTML is a hint, `required` is a hint, and a
 * `<select>` constrains nothing once the request is crafted by hand.
 *
 * Three things this module refuses to do:
 *
 *   1. Accept a field it does not know. Unknown keys are stripped, so a caller
 *      cannot smuggle extra data through into the CRM or the notification email.
 *   2. Accept identity, financial or health data under ANY key. See
 *      `PROHIBITED_FIELD_PATTERNS`: a submission carrying one is rejected outright
 *      rather than quietly ignored, so the failure is visible rather than silent.
 *   3. Treat marketing consent as part of the enquiry. It defaults to false, it is
 *      never required, and an enquiry with consent withheld succeeds identically.
 */

/* -------------------------------------------------------------------------- */
/* Normalisation                                                               */
/* -------------------------------------------------------------------------- */

/** A flat form/JSON submission, as parsed off the wire. */
export interface RawSubmission {
  readonly [key: string]: string
}

/**
 * Control characters carry no meaning in a name or an address, and their presence
 * indicates either header injection or an encoding attack. They are grounds for
 * rejection rather than something to strip and hope.
 *
 * Tab, newline and carriage return are legitimate inside a message; nothing else
 * below U+0020 is.
 */
const ALLOWED_WHITESPACE = new Set([9, 10, 13])

/**
 * True when a value carries a C0 or C1 control character, DEL, or a Unicode
 * line/paragraph separator.
 *
 * Built from code points rather than a regexp literal so the source file itself
 * stays free of the characters it is testing for. Single-line fields have already
 * had their whitespace collapsed by the time this runs, so one rule serves both.
 */
function hasControlCharacter(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code === 0x2028 || code === 0x2029) return true
    if (code === 0x7f) return true
    if (code >= 0x80 && code <= 0x9f) return true
    if (code < 0x20 && !ALLOWED_WHITESPACE.has(code)) return true
  }
  return false
}

/** Fields where line breaks are meaningful and must survive normalisation. */
const MULTILINE_FIELDS = new Set(['message'])

/**
 * Field names that must never appear in a website enquiry. Matched as substrings
 * of the normalised key, so `passport_no`, `passportNumber` and `PASSPORT` all hit.
 *
 * The point is not that an attacker is blocked by this: it is that the site can
 * never become a channel for identity or payment documents, whether through a
 * copied form, a well-meaning future edit, or a crafted request. Those belong in a
 * secure client file, and the privacy notice says so.
 */
const PROHIBITED_FIELD_PATTERNS = [
  'passport',
  'nationalid',
  'nationalinsurance',
  'nino',
  'ssn',
  'identitydocument',
  'iddocument',
  'idnumber',
  'residencepermit',
  'brpnumber',
  'iban',
  'sortcode',
  'accountnumber',
  'cardnumber',
  'creditcard',
  'debitcard',
  'cvv',
  'cvc',
  'bankaccount',
  'bankdetails',
  'medical',
  'diagnosis',
  'disability',
  'healthcondition',
  'dateofbirth',
  'birthdate',
  'dob',
]

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * The first submitted key that names data this site must not collect, or null.
 * Returns the ORIGINAL key so the security log can record what was attempted
 * (a field name is not personal data; its value would be, and is never logged).
 */
export function findProhibitedField(raw: RawSubmission): string | null {
  for (const key of Object.keys(raw)) {
    const normalised = normaliseKey(key)
    if (PROHIBITED_FIELD_PATTERNS.some((pattern) => normalised.includes(pattern))) return key
  }
  return null
}

/**
 * Trim, collapse runs of whitespace in single-line fields, and drop empties so an
 * untouched optional input arrives as `undefined` rather than an empty string.
 */
function normalise(raw: RawSubmission): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value !== 'string') continue
    const collapsed = MULTILINE_FIELDS.has(key)
      ? value.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
      : value.replace(/\s+/g, ' ').trim()
    if (collapsed.length > 0) out[key] = collapsed
  }
  return out
}

/** Which normalised fields carry a control character. */
function controlCharacterFields(values: Record<string, string>): string[] {
  return Object.entries(values)
    .filter(([, value]) => hasControlCharacter(value))
    .map(([key]) => key)
}

/** Form encodings send `on` for a ticked box; JSON sends a real boolean. */
function toBoolean(value: string | undefined): boolean {
  if (value === undefined) return false
  const lowered = value.toLowerCase()
  return lowered === 'on' || lowered === 'true' || lowered === '1' || lowered === 'yes'
}

/* -------------------------------------------------------------------------- */
/* Reusable field schemas                                                      */
/* -------------------------------------------------------------------------- */

/**
 * International telephone numbers, accepted broadly on purpose. Turkish numbers
 * are written `0532 000 00 00`, `+90 532 000 00 00` and `90 532 000 00 00`
 * interchangeably; UK numbers carry spaces and sometimes brackets. Rejecting a
 * real number because of its punctuation loses a client, so the rule checks only
 * that the value is plausibly a phone number and nothing else.
 */
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]{5,30}$/

/** An absolute path on this site. Never an external URL, never a traversal. */
function isInternalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('..')
}

const internalPath = z.string().min(1).max(FIELD_LIMITS.path).refine(isInternalPath)

const nameField = z.string().min(2).max(FIELD_LIMITS.name)
const emailField = z.string().min(3).max(FIELD_LIMITS.email).email()
const phoneField = z.string().max(FIELD_LIMITS.phone).regex(PHONE_PATTERN)
const countryField = z.string().min(2).max(FIELD_LIMITS.country)
const destinationField = z.string().min(2).max(FIELD_LIMITS.destination)
const messageField = z.string().max(FIELD_LIMITS.message)

/* -------------------------------------------------------------------------- */
/* Schemas                                                                     */
/* -------------------------------------------------------------------------- */

export const enquirySchema = z.object({
  kind: z.enum(['enquiry', 'consultation', 'programme-enquiry']),
  locale: z.enum(LOCALES),
  name: nameField,
  email: emailField,
  phone: phoneField.optional(),
  country: countryField.optional(),
  interest: z.enum(INTEREST_OPTIONS).optional(),
  destination: destinationField.optional(),
  startDate: z.enum(START_WINDOWS).optional(),
  educationLevel: z.enum(EDUCATION_LEVELS).optional(),
  preferredContact: z.enum(CONTACT_METHODS).optional(),
  message: messageField.optional(),
  sourcePath: internalPath,
  // Never `.min(1)`, never required, and false unless explicitly ticked.
  marketingConsent: z.boolean(),
  programmeTitle: z.string().min(1).max(FIELD_LIMITS.programmeTitle).optional(),
  programmePath: internalPath.optional(),
})

export type EnquiryInput = z.infer<typeof enquirySchema>

export const newsletterSchema = z.object({
  locale: z.enum(LOCALES),
  email: emailField,
  name: nameField.optional(),
  sourcePath: internalPath,
  /**
   * For a newsletter the consent IS the request, so here it must be true. This is
   * the only schema in the codebase where that is the case.
   */
  marketingConsent: z.literal(true),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>

/* -------------------------------------------------------------------------- */
/* Parsing                                                                     */
/* -------------------------------------------------------------------------- */

export type FieldErrors = Record<string, FieldErrorCode>

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; fields: FieldErrors; prohibitedField?: string }

type Issue = z.ZodError['issues'][number]

function issueToCode(issue: Issue): FieldErrorCode {
  switch (issue.code) {
    case 'invalid_type':
      return 'required'
    case 'too_small':
      return Number(issue.minimum) <= 1 ? 'required' : 'tooShort'
    case 'too_big':
      return 'tooLong'
    case 'invalid_value':
      return 'unsupported'
    case 'invalid_format':
      return 'invalid'
    default:
      return 'invalid'
  }
}

function collectFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {}
  for (const issue of error.issues) {
    const first = issue.path[0]
    const key = typeof first === 'string' || typeof first === 'number' ? String(first) : 'form'
    // Keep the first issue per field: the visitor fixes one thing at a time.
    if (!(key in fields)) fields[key] = issueToCode(issue)
  }
  return fields
}

function preflight(raw: RawSubmission): ParseResult<Record<string, string>> {
  const prohibited = findProhibitedField(raw)
  if (prohibited) {
    return { ok: false, fields: { [prohibited]: 'unsupported' }, prohibitedField: prohibited }
  }

  const values = normalise(raw)
  const bad = controlCharacterFields(values)
  if (bad.length > 0) {
    const fields: FieldErrors = {}
    for (const key of bad) fields[key] = 'invalid'
    return { ok: false, fields }
  }

  return { ok: true, data: values }
}

/** Validate an enquiry, consultation or programme enquiry submission. */
export function parseEnquiry(raw: RawSubmission): ParseResult<EnquiryInput> {
  const pre = preflight(raw)
  if (!pre.ok) return pre

  const values = pre.data
  const parsed = enquirySchema.safeParse({
    ...values,
    sourcePath: values.sourcePath ?? '/',
    marketingConsent: toBoolean(values.marketingConsent),
  })

  if (!parsed.success) return { ok: false, fields: collectFieldErrors(parsed.error) }
  return { ok: true, data: parsed.data }
}

/** Validate a newsletter sign-up submission. */
export function parseNewsletter(raw: RawSubmission): ParseResult<NewsletterInput> {
  const pre = preflight(raw)
  if (!pre.ok) return pre

  const values = pre.data
  const parsed = newsletterSchema.safeParse({
    ...values,
    sourcePath: values.sourcePath ?? '/',
    marketingConsent: toBoolean(values.marketingConsent),
  })

  if (!parsed.success) {
    const fields = collectFieldErrors(parsed.error)
    // An unticked box is a missing answer, not an unsupported value: the literal
    // schema reports it as a value mismatch, which would be the wrong thing to say.
    if (fields.marketingConsent) fields.marketingConsent = 'required'
    return { ok: false, fields }
  }
  return { ok: true, data: parsed.data }
}
