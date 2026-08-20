'use client'

import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import {
  ENQUIRY_ENDPOINT,
  ENQUIRY_STATUS_PARAM,
  FIELD_LIMITS,
  HONEYPOT_FIELD,
} from '@/lib/leads/constraints'
import type { ProgrammeRef } from '@/lib/leads/types'
import { ErrorSummary, PrivacyNote, StatusRegion, SuccessPanel } from './FormFeedback'
import {
  CheckboxField,
  FormTextProvider,
  HoneypotField,
  TextAreaField,
  TextField,
} from './fields'
import { TurnstileWidget } from './TurnstileWidget'
import { fieldErrorKey, useLeadForm } from './useLeadForm'

/**
 * The short form that sits on an institution, programme or tour page.
 *
 * Four fields. Somebody reading about one specific course has already told us what
 * they are interested in by being on the page, so asking them to pick it again
 * from a dropdown is a tax on their patience and a reason to close the tab. The
 * programme travels with the enquiry as a hidden reference and appears at the top
 * of the adviser's notification, so the context is not lost.
 *
 * It posts to the same endpoint and through the same validation as the full form.
 * A shorter form is not a less careful one.
 */

const SUCCESS_VALUES = ['sent'] as const

export function ProgrammeEnquiryForm({
  locale,
  programme,
  sourcePath,
  className = '',
}: {
  locale: Locale
  /** The thing being asked about. Title is shown; path is stored with the lead. */
  programme: ProgrammeRef
  sourcePath?: string
  className?: string
}) {
  const uid = useId()
  const idFor = (field: string) => `${uid}-${field}`

  const { phase, fieldErrors, formErrorKey, reference, summaryRef, onSubmit } = useLeadForm({
    endpoint: ENQUIRY_ENDPOINT,
    statusParam: ENQUIRY_STATUS_PARAM,
    successValues: SUCCESS_VALUES,
  })

  const [path, setPath] = useState(sourcePath ?? programme.path)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronising local state with an external system (URL, cookie or DOM), which is the case the rule's own guidance permits but cannot detect.
    if (!sourcePath) setPath(window.location.pathname)
  }, [sourcePath])

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  if (phase === 'success') {
    return <SuccessPanel locale={locale} reference={reference} />
  }

  const fieldLabels: Record<string, string> = {
    name: t(locale, 'form.name'),
    email: t(locale, 'form.email'),
    phone: t(locale, 'form.phone'),
    message: t(locale, 'form.message'),
  }

  const errorFor = (field: string): string | undefined => {
    const code = fieldErrors[field]
    return code ? t(locale, fieldErrorKey(code)) : undefined
  }

  return (
    <FormTextProvider
      value={{
        requiredLabel: t(locale, 'common.required'),
        errorPrefix: t(locale, 'form.errorPrefix'),
      }}
    >
      <form
        id="enquiry-form"
        action={ENQUIRY_ENDPOINT}
        method="post"
        onSubmit={onSubmit}
        /*
         * Native validation is suppressed so the accessible error summary runs
         * instead of one-at-a-time browser bubbles, which cannot be translated
         * and disappear on blur. `required` stays on the fields for semantics.
         */
        noValidate
        className={`space-y-5 ${className}`}
      >
        <ErrorSummary
          locale={locale}
          summaryRef={summaryRef}
          formErrorKey={formErrorKey}
          fieldErrors={fieldErrors}
          fieldLabels={fieldLabels}
          idFor={idFor}
        />

        <div className="rounded-[3px] bg-paper-sunk p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-fg-muted">
            {t(locale, 'form.programme.label')}
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-fg">{programme.title}</p>
        </div>

        <input type="hidden" name="kind" value="programme-enquiry" />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="sourcePath" value={path} />
        <input type="hidden" name="programmeTitle" value={programme.title} />
        <input type="hidden" name="programmePath" value={programme.path} />
        <HoneypotField name={HONEYPOT_FIELD} />

        <TextField
          id={idFor('name')}
          name="name"
          label={t(locale, 'form.name')}
          error={errorFor('name')}
          required
          autoComplete="name"
          maxLength={FIELD_LIMITS.name}
        />

        <TextField
          id={idFor('email')}
          name="email"
          type="email"
          inputMode="email"
          label={t(locale, 'form.email')}
          error={errorFor('email')}
          required
          autoComplete="email"
          maxLength={FIELD_LIMITS.email}
        />

        <TextField
          id={idFor('phone')}
          name="phone"
          type="tel"
          inputMode="tel"
          label={t(locale, 'form.phone')}
          hint={t(locale, 'form.hint.phone')}
          error={errorFor('phone')}
          autoComplete="tel"
          maxLength={FIELD_LIMITS.phone}
        />

        <TextAreaField
          id={idFor('message')}
          name="message"
          rows={4}
          label={t(locale, 'form.message')}
          error={errorFor('message')}
          maxLength={FIELD_LIMITS.message}
        />

        <div className="border-t border-border pt-4">
          <CheckboxField
            id={idFor('marketingConsent')}
            name="marketingConsent"
            label={t(locale, 'form.marketingConsent')}
            explanation={t(locale, 'form.consent.explainer')}
            error={errorFor('marketingConsent')}
          />
        </div>

        {siteKey ? (
          <div>
            <TurnstileWidget
              siteKey={siteKey}
              locale={locale}
              label={t(locale, 'form.security.label')}
              action="programme-enquiry"
              onToken={setTurnstileToken}
            />
            {turnstileToken === null ? (
              <p className="mt-2 text-sm text-fg-muted">{t(locale, 'form.security.pending')}</p>
            ) : null}
          </div>
        ) : null}

        <PrivacyNote locale={locale} />

        <Button type="submit" disabled={phase === 'submitting'}>
          {phase === 'submitting'
            ? t(locale, 'form.submitting')
            : t(locale, 'cta.askAboutProgramme')}
        </Button>

        <StatusRegion locale={locale} phase={phase} />
      </form>
    </FormTextProvider>
  )
}
