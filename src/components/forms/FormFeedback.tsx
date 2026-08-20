'use client'

import Link from 'next/link'
import { type RefObject } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { t, type MessageKey } from '@/lib/i18n/dictionary'
import { legalPath } from '@/lib/legal'
import type { FieldErrorCode } from '@/lib/leads/types'
import { fieldErrorKey, type FormPhase } from './useLeadForm'

/**
 * Feedback surfaces shared by the forms: the error summary, the live status
 * region, the success panel and the privacy note.
 *
 * The error summary is the important one. A visitor who submits and is told
 * nothing, or is told something at the bottom of a long form they cannot see, will
 * assume the site is broken and leave. This puts the problems at the top, takes
 * focus so a keyboard or screen-reader user arrives at them, and links each one to
 * the field it belongs to.
 */

export function ErrorSummary({
  locale,
  summaryRef,
  formErrorKey,
  fieldErrors,
  fieldLabels,
  idFor,
}: {
  locale: Locale
  summaryRef: RefObject<HTMLDivElement | null>
  formErrorKey: MessageKey | null
  fieldErrors: Record<string, FieldErrorCode>
  /** Field name to its visible label, so the summary reads the same as the form. */
  fieldLabels: Record<string, string>
  /** Field name to the DOM id of its control, for the in-page link. */
  idFor: (field: string) => string
}) {
  const entries = Object.entries(fieldErrors)
  if (entries.length === 0 && !formErrorKey) return null

  const heading = entries.length > 0 ? t(locale, 'form.errorSummary') : null

  /*
   * "Please check the following" with nothing following would be a dead end. It
   * happens when the server rejects a field the form does not render, so the
   * visitor gets the general message instead of an empty box.
   */
  const message: MessageKey | null =
    entries.length === 0 && formErrorKey === 'form.errorSummary' ? 'form.error.generic' : formErrorKey

  return (
    <div
      ref={summaryRef}
      tabIndex={-1}
      role="alert"
      className="rounded-[3px] border-2 border-error bg-card p-4"
    >
      {heading ? <p className="text-base font-semibold text-fg">{heading}</p> : null}

      {entries.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {entries.map(([field, code]) => {
            const label = fieldLabels[field]
            const message = t(locale, fieldErrorKey(code))
            return (
              <li key={field} className="text-base leading-snug">
                {label ? (
                  <a
                    href={`#${idFor(field)}`}
                    className="text-brand-strong underline underline-offset-4"
                  >
                    {label}: {message}
                  </a>
                ) : (
                  // A field the form does not render, e.g. one the server refused
                  // outright. Linking to it would send the visitor nowhere.
                  <span className="text-fg">{message}</span>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}

      {message && message !== 'form.errorSummary' ? (
        <p className={`text-base leading-snug text-fg ${heading ? 'mt-3' : ''}`}>
          {t(locale, message)}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Polite live region.
 *
 * Announces that the form is sending and that it has sent, without stealing focus
 * mid-sentence. Plain words rather than a spinner: a spinner tells a screen-reader
 * user nothing at all.
 */
export function StatusRegion({ locale, phase }: { locale: Locale; phase: FormPhase }) {
  return (
    <div aria-live="polite" className="sr-only">
      {phase === 'submitting' ? t(locale, 'form.status.sending') : null}
      {phase === 'success' ? t(locale, 'form.status.sent') : null}
    </div>
  )
}

/**
 * Replaces the form once the enquiry is with us. It says what has happened, what
 * happens next and by when, and gives the reference to quote.
 */
export function SuccessPanel({
  locale,
  reference,
  title,
  body,
  showEmailNote = true,
}: {
  locale: Locale
  reference: string | null
  title?: string
  body?: string
  /** Off for the newsletter, where no copy of anything has been emailed. */
  showEmailNote?: boolean
}) {
  return (
    <div role="status" className="rounded-[3px] border border-border bg-paper-sunk p-6">
      <p className="font-display text-xl font-semibold text-fg">
        {title ?? t(locale, 'form.success.title')}
      </p>
      <p className="mt-3 text-base leading-relaxed text-fg">
        {body ?? t(locale, 'form.success.body')}
      </p>
      {showEmailNote ? (
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          {t(locale, 'form.success.emailNote')}
        </p>
      ) : null}
      {reference ? (
        <p className="mt-4 border-t border-border pt-4 text-sm text-fg-muted">
          {t(locale, 'form.success.reference')}:{' '}
          <span className="font-semibold text-fg">{reference}</span>
        </p>
      ) : null}
    </div>
  )
}

/** Data-protection notice, linking to the policy rather than restating it. */
export function PrivacyNote({ locale }: { locale: Locale }) {
  return (
    <p className="text-sm leading-snug text-fg-muted">
      {t(locale, 'form.privacyNote')}{' '}
      <Link
        href={legalPath(locale, 'privacy')}
        className="text-brand-strong underline underline-offset-4"
      >
        {t(locale, 'form.privacyLinkLabel')}
      </Link>
      .
    </p>
  )
}
