'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { t, type MessageKey } from '@/lib/i18n/dictionary'

/**
 * Starts a Stripe Checkout session and sends the visitor to it.
 *
 * WHAT THIS FORM SENDS: a catalogue reference, the locale, and the contact details
 * the visitor typed. It does NOT send an amount, a currency or a discount, and the
 * API rejects the request if it finds one. The price is the server's business.
 *
 * WHAT THIS FORM NEVER TOUCHES: card details. There is no card field here and
 * there never will be one. The visitor types their card on Stripe's own pages, on
 * Stripe's domain, which is what keeps this site out of PCI scope.
 *
 * Double submission is guarded twice: the button disables while the request is in
 * flight, and the API derives an idempotency key from the request so two sessions
 * cannot be created even if the guard is bypassed.
 *
 * Without JavaScript this button does nothing, so a contact link sits underneath it
 * as the route through for anyone who cannot use it.
 */

export interface CheckoutFormProps {
  locale: Locale
  /** Catalogue reference, e.g. "service:application-support". */
  reference: string
  /** Optional context passed through to Stripe metadata. Never money. */
  metadata?: Record<string, string>
  /** Prefill when the visitor has already identified themselves. */
  defaultName?: string
  defaultEmail?: string
}

type ApiError =
  | 'forbidden_origin'
  | 'rate_limited'
  | 'invalid_request'
  | 'amount_not_accepted'
  | 'unknown_item'
  | 'no_payment_required'
  | 'payments_unavailable'
  | 'checkout_failed'

const ERROR_MESSAGE: Record<ApiError, MessageKey> = {
  forbidden_origin: 'pay.error.generic',
  rate_limited: 'pay.error.rateLimited',
  invalid_request: 'form.errorSummary',
  amount_not_accepted: 'pay.error.generic',
  unknown_item: 'pay.error.unknownItem',
  no_payment_required: 'pay.error.noPaymentNeeded',
  payments_unavailable: 'pay.error.unavailable',
  checkout_failed: 'pay.error.generic',
}

/**
 * Only ever navigate to Stripe. The URL comes from our own API over HTTPS, so this
 * is belt and braces rather than the primary control, but an open redirect through
 * a payment page is a phishing gift and the check costs nothing.
 */
function isStripeCheckoutUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return false
    return url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com')
  } catch {
    return false
  }
}

export function CheckoutForm({
  locale,
  reference,
  metadata,
  defaultName = '',
  defaultEmail = '',
}: CheckoutFormProps) {
  const nameId = useId()
  const emailId = useId()
  const errorId = useId()

  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<MessageKey | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Same-origin only: this must never be sent to another host.
        credentials: 'same-origin',
        body: JSON.stringify({
          reference,
          locale,
          customer: { name: name.trim(), email: email.trim() },
          ...(metadata ? { metadata } : {}),
        }),
      })

      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const code =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error: unknown }).error)
            : 'checkout_failed'
        setError(ERROR_MESSAGE[code as ApiError] ?? 'pay.error.generic')
        setPending(false)
        return
      }

      const url =
        payload && typeof payload === 'object' && 'url' in payload
          ? String((payload as { url: unknown }).url)
          : ''

      if (!isStripeCheckoutUrl(url)) {
        setError('pay.error.generic')
        setPending(false)
        return
      }

      // Leaving the site. `pending` stays true so the button cannot be pressed
      // again while the browser navigates.
      window.location.assign(url)
    } catch {
      // Network failure, or the visitor went offline mid-request.
      setError('pay.error.generic')
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium text-fg">
            {t(locale, 'form.name')}{' '}
            <span className="font-normal text-fg-muted">({t(locale, 'common.required')})</span>
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 block min-h-11 w-full rounded-[3px] border border-border-input bg-card px-3 text-fg"
          />
        </div>

        <div>
          <label htmlFor={emailId} className="block text-sm font-medium text-fg">
            {t(locale, 'form.email')}{' '}
            <span className="font-normal text-fg-muted">({t(locale, 'common.required')})</span>
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 block min-h-11 w-full rounded-[3px] border border-border-input bg-card px-3 text-fg"
          />
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-4 text-sm text-error">
          <strong className="font-semibold">{t(locale, 'pay.errorHeading')}.</strong>{' '}
          {t(locale, error)}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          aria-describedby={error ? errorId : undefined}
        >
          {pending ? t(locale, 'pay.opening') : t(locale, 'pay.continue')}
        </Button>

        <Link
          href={sectionPath(locale, 'contact')}
          className="text-sm text-brand-strong underline underline-offset-4"
        >
          {t(locale, 'footer.contactUs')}
        </Link>
      </div>
    </form>
  )
}
