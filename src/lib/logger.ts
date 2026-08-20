import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Structured logging.
 *
 * One line of JSON per event, on stdout for debug/info and stderr for warn/error,
 * because that is what every host log sink (Vercel, Cloudflare, a plain systemd
 * unit) can parse without an agent. Nothing here writes to a file: audit report-1
 * found a debug log served over HTTP on the legacy WordPress host, and the simplest
 * way to never repeat that is to have no file sink at all.
 *
 * Two rules this module enforces rather than merely documents:
 *
 *   1. PERSONAL DATA NEVER REACHES THE LOG. Every field passes through `redact()`,
 *      which strips values by key name AND scrubs anything that still looks like an
 *      email address or a phone number wherever it appears in a string. A caller
 *      that forgets is corrected by the logger, not by code review.
 *
 *   2. NO WHOLE BODIES. `body`, `payload`, `html` and `text` are redacted keys, and
 *      every string is truncated. A lead enquiry is the most sensitive thing this
 *      site handles; the log records that one arrived, not what it said.
 *
 * Categories are separated at the call site (`logAppEvent` / `logSecurityEvent` /
 * `logPaymentEvent`) and carried on the record, so a downstream sink can route
 * security events to a different retention policy without parsing message text.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * `security` covers bot protection, rate limiting, origin rejection and delivery
 * failures that could hide an attack or lose a lead. `payment` is reserved for the
 * Stripe track. Everything else is `app`.
 */
export type LogCategory = 'app' | 'security' | 'payment'

export interface LogFields {
  readonly [key: string]: unknown
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function isLogLevel(value: string): value is LogLevel {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error'
}

function threshold(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase()
  if (raw && isLogLevel(raw)) return raw
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

/* -------------------------------------------------------------------------- */
/* Redaction                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Keys whose value is dropped outright. Compared after normalising the key to
 * lowercase alphanumerics, so `full_name`, `fullName` and `Full Name` all match.
 *
 * Exact matches rather than substrings, so `templateName` and `fieldName` survive
 * and stay useful while `name` does not.
 */
const REDACTED_KEYS = new Set([
  'name',
  'fullname',
  'firstname',
  'lastname',
  'surname',
  'username',
  'studentname',
  'contactname',
  'email',
  'emailaddress',
  'to',
  'from',
  'replyto',
  'recipient',
  'phone',
  'phonenumber',
  'telephone',
  'mobile',
  'whatsapp',
  'message',
  'notes',
  'comments',
  'address',
  'streetaddress',
  'postcode',
  'postalcode',
  'dob',
  'dateofbirth',
  // Whole-body guards. Logging one of these is always a mistake.
  'body',
  'payload',
  'html',
  'text',
  'raw',
  'request',
  'response',
])

/**
 * Substrings that make a key sensitive wherever they appear, because credentials
 * get named in too many ways to enumerate.
 */
const REDACTED_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'apikey',
  'credential',
  'card',
  'cvv',
  'cvc',
  'iban',
  'sortcode',
  'accountnumber',
  'passport',
  'nationalid',
  'nationalinsurance',
  'ssn',
  'signature',
  'bearer',
  'session',
]

const REDACTED = '[redacted]'
const MAX_STRING = 200
const MAX_DEPTH = 4
const MAX_ARRAY = 20
const MAX_KEYS = 40

function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function isSensitiveKey(key: string): boolean {
  const normalised = normaliseKey(key)
  if (REDACTED_KEYS.has(normalised)) return true
  return REDACTED_KEY_PATTERNS.some((pattern) => normalised.includes(pattern))
}

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const PHONE_PATTERN = /(?:\+|00)\d[\d\s().-]{6,}\d/g
const LONG_DIGITS_PATTERN = /\d{9,}/g

/**
 * Last line of defence: a string that reached the logger under an innocuous key
 * may still carry an address or a number. Scrub the shapes, then truncate, so a
 * pasted body cannot be reconstructed from the log even in fragments.
 */
function scrubString(value: string): string {
  const scrubbed = value
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(PHONE_PATTERN, '[redacted-phone]')
    .replace(LONG_DIGITS_PATTERN, '[redacted-number]')
  return scrubbed.length > MAX_STRING ? `${scrubbed.slice(0, MAX_STRING)}…[truncated]` : scrubbed
}

function redactError(error: Error): Record<string, unknown> {
  const out: Record<string, unknown> = {
    errorName: error.name,
    errorMessage: scrubString(error.message),
  }
  // Stack traces can carry query strings and file paths. They are useful locally
  // and are never needed in production, where the sink already has the trace ID.
  if (process.env.NODE_ENV !== 'production' && typeof error.stack === 'string') {
    out.errorStack = error.stack.split('\n').slice(0, 4).join(' | ')
  }
  return out
}

function redactValue(value: unknown, depth: number): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return scrubString(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (typeof value === 'function' || typeof value === 'symbol') return '[unloggable]'
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return redactError(value)

  if (depth >= MAX_DEPTH) return '[nested]'

  if (Array.isArray(value)) {
    const shown = value.slice(0, MAX_ARRAY).map((item) => redactValue(item, depth + 1))
    return value.length > MAX_ARRAY ? [...shown, `[+${value.length - MAX_ARRAY} more]`] : shown
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    let count = 0
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (count >= MAX_KEYS) {
        out['…'] = '[truncated]'
        break
      }
      out[key] = isSensitiveKey(key) ? REDACTED : redactValue(item, depth + 1)
      count += 1
    }
    return out
  }

  return '[unloggable]'
}

/**
 * Public redaction helper. Exported so callers can sanitise a structure before it
 * crosses a boundary (a CRM payload preview, a test assertion) using exactly the
 * same rules the logger applies.
 */
export function redact(value: unknown): unknown {
  return redactValue(value, 0)
}

/* -------------------------------------------------------------------------- */
/* Correlation fingerprints                                                    */
/* -------------------------------------------------------------------------- */

let correlationKey: Buffer | null = null

/**
 * A plain hash of an email address is trivially reversible by dictionary attack,
 * so correlation uses a keyed HMAC. If no key is configured the process generates
 * an ephemeral one: fingerprints then correlate within a single instance's
 * lifetime and are worthless to anyone reading the log later, which is the
 * conservative default.
 */
function getCorrelationKey(): Buffer {
  if (correlationKey) return correlationKey
  const configured = process.env.LOG_FINGERPRINT_SECRET
  correlationKey =
    configured && configured.length >= 16 ? Buffer.from(configured, 'utf8') : randomBytes(32)
  return correlationKey
}

/**
 * Short, non-reversible identifier for a value that must never be logged in full.
 * Use it to answer "is this the same person as the previous enquiry?" without
 * putting the address in the record.
 */
export function fingerprint(value: string): string {
  return createHmac('sha256', getCorrelationKey())
    .update(value.trim().toLowerCase())
    .digest('hex')
    .slice(0, 12)
}

/** Constant-time comparison, kept here so signature checks share one implementation. */
export function safeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/* -------------------------------------------------------------------------- */
/* Emit                                                                        */
/* -------------------------------------------------------------------------- */

function stringify(record: Record<string, unknown>): string {
  try {
    return JSON.stringify(record)
  } catch {
    return JSON.stringify({
      ts: record.ts,
      level: record.level,
      category: record.category,
      event: record.event,
      note: 'log record could not be serialised',
    })
  }
}

function emit(category: LogCategory, level: LogLevel, event: string, fields?: LogFields): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[threshold()]) return

  const redacted = fields ? (redact(fields) as Record<string, unknown>) : {}
  const line = stringify({
    ts: new Date().toISOString(),
    level,
    category,
    event,
    ...redacted,
  })

  if (level === 'warn' || level === 'error') {
    console.error(line)
  } else {
    // eslint-disable-next-line no-console -- stdout is the log sink by design.
    console.log(line)
  }
}

/** Ordinary application events: a lead delivered, a template rendered, a cache miss. */
export function logAppEvent(level: LogLevel, event: string, fields?: LogFields): void {
  emit('app', level, event, fields)
}

/**
 * Abuse, bot protection, origin rejection, rate limiting, and any failure that
 * could silently lose a lead. Separated so these can be alerted on independently.
 */
export function logSecurityEvent(level: LogLevel, event: string, fields?: LogFields): void {
  emit('security', level, event, fields)
}

/** Reserved for the payments track: charges, webhooks, refunds. Never card data. */
export function logPaymentEvent(level: LogLevel, event: string, fields?: LogFields): void {
  emit('payment', level, event, fields)
}

/** Convenience wrapper for the `app` category. */
export const logger = {
  debug: (event: string, fields?: LogFields) => logAppEvent('debug', event, fields),
  info: (event: string, fields?: LogFields) => logAppEvent('info', event, fields),
  warn: (event: string, fields?: LogFields) => logAppEvent('warn', event, fields),
  error: (event: string, fields?: LogFields) => logAppEvent('error', event, fields),
} as const
