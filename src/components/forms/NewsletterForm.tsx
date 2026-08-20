'use client'

import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import {
  FIELD_LIMITS,
  HONEYPOT_FIELD,
  NEWSLETTER_ENDPOINT,
  NEWSLETTER_STATUS_PARAM,
} from '@/lib/leads/constraints'
import { ErrorSummary, PrivacyNote, StatusRegion, SuccessPanel } from './FormFeedback'
import { CheckboxField, FormTextProvider, HoneypotField, TextField } from './fields'
import { TurnstileWidget } from './TurnstileWidget'
import { fieldErrorKey, useLeadForm } from './useLeadForm'

/**
 * Newsletter sign-up.
 *
 * Double opt-in, so success here means "we have sent you a link", not "you are
 * subscribed". The wording says exactly that, because a visitor told they are
 * subscribed who then receives nothing will decide the site is broken.
 *
 * The consent tick is required in THIS form and only in this form: here the
 * consent is the request. On the enquiry form it is optional and never blocks
 * sending. Keeping them in separate components is what makes that difference hard
 * to blur later.
 */

const SUCCESS_VALUES = ['pending'] as const

export function NewsletterForm({
  locale,
  sourcePath,
  className = '',
}: {
  locale: Locale
  sourcePath?: string
  className?: string
}) {
  const uid = useId()
  const idFor = (field: string) => `${uid}-${field}`

  const { phase, fieldErrors, formErrorKey, summaryRef, onSubmit } = useLeadForm({
    endpoint: NEWSLETTER_ENDPOINT,
    statusParam: NEWSLETTER_STATUS_PARAM,
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
    return (
      <SuccessPanel
        locale={locale}
        reference={null}
        title={t(locale, 'form.newsletter.success.title')}
        body={t(locale, 'form.newsletter.success.body')}
        showEmailNote={false}
      />
    )
  }

  const fieldLabels: Record<string, string> = {
    email: t(locale, 'form.email'),
    marketingConsent: t(locale, 'form.newsletter.consent'),
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
        id="newsletter-form"
        action={NEWSLETTER_ENDPOINT}
        method="post"
        onSubmit={onSubmit}
        /*
         * Native validation is suppressed so the accessible error summary runs
         * instead of one-at-a-time browser bubbles, which cannot be translated
         * and disappear on blur. `required` stays on the fields for semantics.
         */
        noValidate
        className={`space-y-4 ${className}`}
      >
        <ErrorSummary
          locale={locale}
          summaryRef={summaryRef}
          formErrorKey={formErrorKey}
          fieldErrors={fieldErrors}
          fieldLabels={fieldLabels}
          idFor={idFor}
        />

        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold text-fg">
            {t(locale, 'form.newsletter.legend')}
          </legend>

          <p className="text-sm leading-snug text-fg-muted">
            {t(locale, 'form.newsletter.explainer')}
          </p>

          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="sourcePath" value={path} />
          <HoneypotField name={HONEYPOT_FIELD} />

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

          <CheckboxField
            id={idFor('marketingConsent')}
            name="marketingConsent"
            label={t(locale, 'form.newsletter.consent')}
            error={errorFor('marketingConsent')}
          />
        </fieldset>

        {siteKey ? (
          <div>
            <TurnstileWidget
              siteKey={siteKey}
              locale={locale}
              label={t(locale, 'form.security.label')}
              action="newsletter"
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
            : t(locale, 'form.newsletter.submit')}
        </Button>

        <StatusRegion locale={locale} phase={phase} />
      </form>
    </FormTextProvider>
  )
}
