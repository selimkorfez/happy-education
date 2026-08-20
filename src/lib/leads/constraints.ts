/**
 * Field limits and wire names shared by the browser form and the server route.
 *
 * Pure data with no imports, so the client bundle can carry it without dragging
 * Zod, the logger or anything server-only along with it. The browser uses these
 * for `maxLength` attributes, which is a courtesy; `validation.ts` applies the
 * same numbers server-side, which is the actual control.
 */

export const FIELD_LIMITS = {
  name: 80,
  /** RFC 5321 maximum length of an email address. */
  email: 254,
  phone: 32,
  country: 56,
  destination: 80,
  message: 2000,
  programmeTitle: 160,
  path: 300,
} as const

/**
 * Honeypot input name. Deliberately not `company`, `website` or `url`: browser
 * autofill knows those and would tick the trap for a real person. This name means
 * nothing to an autofill heuristic but reads as a field worth filling to a bot
 * that submits every input it finds.
 */
export const HONEYPOT_FIELD = 'contact-reference-url'

/** Cloudflare Turnstile writes its token into an input with this exact name. */
export const TURNSTILE_FIELD = 'cf-turnstile-response'

export const ENQUIRY_ENDPOINT = '/api/enquiry'
export const NEWSLETTER_ENDPOINT = '/api/newsletter'
export const NEWSLETTER_CONFIRM_ENDPOINT = '/api/newsletter/confirm'

/**
 * Query parameter the no-JavaScript path uses to report an outcome back on the
 * page the visitor came from, e.g. `/en/contact?enquiry=sent#enquiry-form`.
 */
export const ENQUIRY_STATUS_PARAM = 'enquiry'
export const NEWSLETTER_STATUS_PARAM = 'newsletter'
