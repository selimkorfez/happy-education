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
import {
  contactMethodLabel,
  educationLevelLabel,
  interestLabel,
  startWindowLabel,
} from '@/lib/leads/labels'
import {
  CONTACT_METHODS,
  EDUCATION_LEVELS,
  INTEREST_OPTIONS,
  START_WINDOWS,
} from '@/lib/leads/types'
import { ErrorSummary, PrivacyNote, StatusRegion, SuccessPanel } from './FormFeedback'
import {
  CheckboxField,
  FormTextProvider,
  HoneypotField,
  RadioGroupField,
  SelectField,
  TextAreaField,
  TextField,
} from './fields'
import { TurnstileWidget } from './TurnstileWidget'
import { fieldErrorKey, useLeadForm } from './useLeadForm'

/**
 * The full enquiry and consultation form.
 *
 * Only a name and an email address are required. Everything else is optional, and
 * that is a commercial decision as much as a data-protection one: a family that is
 * not yet sure what they want will abandon a form that insists they already know,
 * and an adviser would rather have a short enquiry to answer than none at all.
 *
 * The consent tick is separated from the enquiry by a divider and its own
 * explanation, and it is never a condition of sending. Bundling the two would make
 * the consent invalid under UK GDPR Art. 7(4) as well as unfair.
 *
 * There is no field here for a passport, an identity document, a bank detail or a
 * medical condition, and the server rejects a submission that invents one.
 */

const SUCCESS_VALUES = ['sent'] as const

const FIELDSET = 'border-t border-border pt-6'
const LEGEND = 'font-display text-lg font-semibold text-fg'

export function EnquiryForm({
  locale,
  kind = 'enquiry',
  sourcePath,
  className = '',
}: {
  locale: Locale
  kind?: 'enquiry' | 'consultation'
  /**
   * The page the enquiry came from. Passed in by a server component where it is
   * known at render time, which is what makes the no-JavaScript redirect land back
   * on the right page; otherwise it is filled in on mount.
   */
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

  const [path, setPath] = useState(sourcePath ?? '/')
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
    country: t(locale, 'form.country'),
    interest: t(locale, 'form.interest'),
    destination: t(locale, 'form.destination'),
    educationLevel: t(locale, 'form.educationLevel'),
    startDate: t(locale, 'form.startDate'),
    preferredContact: t(locale, 'form.contactMethod'),
    message: t(locale, 'form.message'),
  }

  /** The server's code for a field, resolved to the sentence shown under it. */
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
        className={`space-y-6 ${className}`}
      >
        <ErrorSummary
          locale={locale}
          summaryRef={summaryRef}
          formErrorKey={formErrorKey}
          fieldErrors={fieldErrors}
          fieldLabels={fieldLabels}
          idFor={idFor}
        />

        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="sourcePath" value={path} />
        <HoneypotField name={HONEYPOT_FIELD} />

        <fieldset className="space-y-5">
          <legend className={LEGEND}>{t(locale, 'form.legend.aboutYou')}</legend>

          <TextField
            id={idFor('name')}
            name="name"
            label={t(locale, 'form.name')}
            hint={t(locale, 'form.hint.name')}
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
            hint={t(locale, 'form.hint.email')}
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

          <TextField
            id={idFor('country')}
            name="country"
            label={t(locale, 'form.country')}
            hint={t(locale, 'form.hint.country')}
            error={errorFor('country')}
            autoComplete="country-name"
            maxLength={FIELD_LIMITS.country}
          />

          <div id={idFor('preferredContact')}>
            <RadioGroupField
              name="preferredContact"
              idPrefix={idFor('preferredContact')}
              legend={t(locale, 'form.contactMethod')}
              error={errorFor('preferredContact')}
              options={CONTACT_METHODS.map((value) => ({
                value,
                label: contactMethodLabel(locale, value),
              }))}
            />
          </div>
        </fieldset>

        <fieldset className={`${FIELDSET} space-y-5`}>
          <legend className={LEGEND}>{t(locale, 'form.legend.plans')}</legend>

          <SelectField
            id={idFor('interest')}
            name="interest"
            label={t(locale, 'form.interest')}
            placeholder={t(locale, 'form.choose')}
            error={errorFor('interest')}
            options={INTEREST_OPTIONS.map((value) => ({
              value,
              label: interestLabel(locale, value),
            }))}
          />

          <TextField
            id={idFor('destination')}
            name="destination"
            label={t(locale, 'form.destination')}
            hint={t(locale, 'form.hint.destination')}
            error={errorFor('destination')}
            maxLength={FIELD_LIMITS.destination}
          />

          <SelectField
            id={idFor('educationLevel')}
            name="educationLevel"
            label={t(locale, 'form.educationLevel')}
            placeholder={t(locale, 'form.choose')}
            error={errorFor('educationLevel')}
            options={EDUCATION_LEVELS.map((value) => ({
              value,
              label: educationLevelLabel(locale, value),
            }))}
          />

          <SelectField
            id={idFor('startDate')}
            name="startDate"
            label={t(locale, 'form.startDate')}
            placeholder={t(locale, 'form.choose')}
            error={errorFor('startDate')}
            options={START_WINDOWS.map((value) => ({
              value,
              label: startWindowLabel(locale, value),
            }))}
          />
        </fieldset>

        <fieldset className={`${FIELDSET} space-y-5`}>
          <legend className={LEGEND}>{t(locale, 'form.legend.message')}</legend>

          <TextAreaField
            id={idFor('message')}
            name="message"
            label={t(locale, 'form.message')}
            hint={t(locale, 'form.hint.message')}
            error={errorFor('message')}
            maxLength={FIELD_LIMITS.message}
          />

          <p className="text-sm leading-snug text-fg-muted">{t(locale, 'form.hint.noDocuments')}</p>
        </fieldset>

        <fieldset className={`${FIELDSET} space-y-4`}>
          <legend className={LEGEND}>{t(locale, 'form.legend.consent')}</legend>

          <CheckboxField
            id={idFor('marketingConsent')}
            name="marketingConsent"
            label={t(locale, 'form.marketingConsent')}
            error={errorFor('marketingConsent')}
            explanation={t(locale, 'form.consent.explainer')}
          />
        </fieldset>

        {siteKey ? (
          <div>
            <TurnstileWidget
              siteKey={siteKey}
              locale={locale}
              label={t(locale, 'form.security.label')}
              action="enquiry"
              onToken={setTurnstileToken}
            />
            {turnstileToken === null ? (
              <p className="mt-2 text-sm text-fg-muted">{t(locale, 'form.security.pending')}</p>
            ) : null}
          </div>
        ) : null}

        <PrivacyNote locale={locale} />

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={phase === 'submitting'}>
            {phase === 'submitting'
              ? t(locale, 'form.submitting')
              : kind === 'consultation'
                ? t(locale, 'form.submitConsultation')
                : t(locale, 'form.submit')}
          </Button>
        </div>

        <StatusRegion locale={locale} phase={phase} />
      </form>
    </FormTextProvider>
  )
}
