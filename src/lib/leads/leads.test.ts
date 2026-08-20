import { describe, expect, it } from 'vitest'
import { enquiryAcknowledgement } from '@/lib/email/templates/enquiry-acknowledgement'
import { enquiryNotification } from '@/lib/email/templates/enquiry-notification'
import { newsletterConfirmation } from '@/lib/email/templates/newsletter-confirmation'
import { redact } from '@/lib/logger'
import { checkRateLimit, resetRateLimits } from '@/lib/rate-limit'
import { claimSubmission, resetClaims } from './dedupe'
import { createConfirmationToken, verifyConfirmationToken } from './newsletter-token'
import { buildLead } from './provider'
import { parseEnquiry, parseNewsletter } from './validation'

/**
 * Lead capture guards.
 *
 * These cover the failures that are silent in review and expensive in production:
 * a validation rule that lets identity data through, a duplicate submission that
 * becomes two records, a template that puts a name in a subject line or renders a
 * submitted message as live markup, and a logger that writes an address to stdout.
 */

const base = {
  kind: 'enquiry',
  locale: 'en',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  sourcePath: '/en/contact',
}

describe('enquiry validation', () => {
  it('accepts a minimal enquiry and defaults marketing consent to false', () => {
    const result = parseEnquiry(base)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.marketingConsent).toBe(false)
  })

  it('accepts the phone formats real people type', () => {
    for (const phone of ['+44 7735 826785', '0532 000 00 00', '+90 (532) 000-0000']) {
      expect(parseEnquiry({ ...base, phone }).ok, phone).toBe(true)
    }
  })

  it('reports a bad email as a field-level code rather than a sentence', () => {
    const result = parseEnquiry({ ...base, email: 'not-an-address' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.fields.email).toBe('invalid')
  })

  it('refuses identity, financial and health fields outright', () => {
    for (const field of ['passportNumber', 'iban', 'medicalNotes', 'dateOfBirth']) {
      const result = parseEnquiry({ ...base, [field]: 'x' })
      expect(result.ok, field).toBe(false)
      if (!result.ok) expect(result.prohibitedField).toBe(field)
    }
  })

  it('refuses control characters', () => {
    const result = parseEnquiry({ ...base, name: `Ada${String.fromCharCode(7)}Lovelace` })
    expect(result.ok).toBe(false)
  })

  it('refuses a sourcePath that points off this site', () => {
    for (const sourcePath of ['https://evil.example/x', '//evil.example', '/en/../../etc']) {
      expect(parseEnquiry({ ...base, sourcePath }).ok, sourcePath).toBe(false)
    }
  })

  it('requires consent for the newsletter, and only for the newsletter', () => {
    expect(parseNewsletter({ locale: 'tr', email: 'a@b.co', sourcePath: '/tr' }).ok).toBe(false)
    expect(
      parseNewsletter({ locale: 'tr', email: 'a@b.co', sourcePath: '/tr', marketingConsent: 'on' })
        .ok,
    ).toBe(true)
  })

  it('records a consent timestamp only when consent was given', () => {
    const withConsent = parseEnquiry({ ...base, marketingConsent: 'on' })
    const without = parseEnquiry(base)
    if (!withConsent.ok || !without.ok) throw new Error('fixture invalid')
    expect(buildLead(withConsent.data).consentAt).toBeTypeOf('string')
    expect(buildLead(without.data).consentAt).toBeUndefined()
  })
})

describe('duplicate submissions', () => {
  it('collapses a double submit onto one stable reference', () => {
    resetClaims()
    const parsed = parseEnquiry(base)
    if (!parsed.ok) throw new Error('fixture invalid')
    const lead = buildLead(parsed.data)

    const first = claimSubmission(lead)
    const second = claimSubmission(lead)

    expect(first.duplicate).toBe(false)
    expect(second.duplicate).toBe(true)
    expect(second.reference).toBe(first.reference)
    expect(first.reference).toMatch(/^HE-[0-9A-F]{6}$/)
  })

  it('treats an enquiry about a different programme as a different lead', () => {
    resetClaims()
    const parsed = parseEnquiry(base)
    if (!parsed.ok) throw new Error('fixture invalid')
    const lead = buildLead(parsed.data)

    claimSubmission(lead)
    const other = claimSubmission({
      ...lead,
      programmeRef: { title: 'BSc Economics', path: '/en/universities/lse' },
    })
    expect(other.duplicate).toBe(false)
  })
})

describe('rate limiting', () => {
  it('blocks past the limit and reports a retry delay', async () => {
    resetRateLimits()
    const options = { limit: 2, windowMs: 1000 }
    expect((await checkRateLimit('enquiry:test', options)).allowed).toBe(true)
    expect((await checkRateLimit('enquiry:test', options)).allowed).toBe(true)

    const third = await checkRateLimit('enquiry:test', options)
    expect(third.allowed).toBe(false)
    expect(third.remaining).toBe(0)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keys separately per route, so one endpoint cannot starve another', async () => {
    resetRateLimits()
    const options = { limit: 1, windowMs: 1000 }
    await checkRateLimit('enquiry:same-ip', options)
    expect((await checkRateLimit('newsletter:same-ip', options)).allowed).toBe(true)
  })
})

describe('newsletter confirmation tokens', () => {
  it('round-trips a signed token', () => {
    const token = createConfirmationToken({
      email: 'ada@example.com',
      locale: 'en',
      sourcePath: '/en/insights',
    })
    expect(token).not.toBeNull()
    if (!token) return

    const result = verifyConfirmationToken(token)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.email).toBe('ada@example.com')
      expect(result.payload.sourcePath).toBe('/en/insights')
    }
  })

  it('refuses a payload swapped onto a valid signature', () => {
    const token = createConfirmationToken({
      email: 'ada@example.com',
      locale: 'en',
      sourcePath: '/en',
    })
    if (!token) return

    const signature = token.slice(token.lastIndexOf('.') + 1)
    const forgedBody = Buffer.from(
      JSON.stringify({
        email: 'mallory@example.com',
        locale: 'en',
        sourcePath: '/',
        issuedAt: Date.now(),
      }),
    ).toString('base64url')

    expect(verifyConfirmationToken(`${forgedBody}.${signature}`).ok).toBe(false)
  })

  it('expires', () => {
    const token = createConfirmationToken(
      { email: 'ada@example.com', locale: 'en', sourcePath: '/' },
      Date.now() - 48 * 60 * 60 * 1000,
    )
    if (!token) return

    const result = verifyConfirmationToken(token)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })
})

describe('email templates', () => {
  it('escape submitted content and keep personal data out of subject lines', () => {
    for (const locale of ['en', 'tr'] as const) {
      const parsed = parseEnquiry({
        ...base,
        locale,
        interest: 'universities',
        startDate: 'nextAcademicYear',
        educationLevel: 'undergraduate',
        preferredContact: 'whatsapp',
        message: 'Hello <b>there</b> & goodbye',
        marketingConsent: 'on',
      })
      if (!parsed.ok) throw new Error(`fixture invalid for ${locale}`)
      const lead = buildLead(parsed.data)

      const acknowledgement = enquiryAcknowledgement(lead, 'HE-ABC123')
      expect(acknowledgement.subject, locale).not.toContain('@')
      expect(acknowledgement.html).toContain('&lt;b&gt;')
      expect(acknowledgement.html).not.toContain('<b>there</b>')
      expect(acknowledgement.text).toContain('HE-ABC123')

      const notification = enquiryNotification(lead, 'HE-ABC123', 'admin@happyeducation.uk')
      expect(notification.replyTo).toBe('ada@example.com')
      expect(notification.subject).toContain('HE-ABC123')
      expect(notification.subject).not.toContain('Ada')

      const confirmation = newsletterConfirmation({
        to: 'ada@example.com',
        locale,
        confirmUrl: 'https://happyeducation.uk/api/newsletter/confirm?token=abc',
        expiryHours: 24,
      })
      expect(confirmation.html).toContain('happyeducation.uk/api/newsletter/confirm')
      expect(confirmation.text.length).toBeGreaterThan(0)
    }
  })

  it('renders no images and no remote assets', () => {
    const parsed = parseEnquiry(base)
    if (!parsed.ok) throw new Error('fixture invalid')
    const html = enquiryAcknowledgement(buildLead(parsed.data), 'HE-ABC123').html
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<table')
  })
})

describe('log redaction', () => {
  it('drops personal fields and scrubs addresses hiding in free text', () => {
    const output = redact({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      apiKey: 'sk_live_123',
      templateName: 'enquiry-notification',
      note: 'reach me at ada@example.com or +44 7735 826785',
      nested: { message: 'confidential plans' },
    }) as Record<string, unknown>

    expect(output.name).toBe('[redacted]')
    expect(output.email).toBe('[redacted]')
    expect(output.apiKey).toBe('[redacted]')
    // Not everything containing "name" is a person's name.
    expect(output.templateName).toBe('enquiry-notification')
    expect(String(output.note)).not.toContain('ada@example.com')
    expect(String(output.note)).not.toContain('826785')
    expect((output.nested as Record<string, unknown>).message).toBe('[redacted]')
  })

  it('never lets a whole request body through', () => {
    const output = redact({ body: 'name=Ada&email=ada@example.com' }) as Record<string, unknown>
    expect(output.body).toBe('[redacted]')
  })
})
