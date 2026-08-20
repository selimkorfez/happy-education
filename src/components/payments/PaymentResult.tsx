import Link from 'next/link'
import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { formatMoney } from '@/lib/format'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import type { VerifiedPayment } from '@/lib/payments/verify-session'

/**
 * Payment result states.
 *
 * These are server components and they take a VERIFIED payment, not a URL
 * parameter. The page that renders `PaymentOutcome` must first call
 * `verifyCheckoutSession()` with the `session_id` Stripe appended to the return
 * URL; passing `null` renders the "we could not confirm this" state, which is the
 * correct answer for someone who typed the success URL by hand.
 *
 * Concretely: there is no prop on any of these components that means "assume it
 * worked". A `?success=true` in the address bar changes nothing on this page.
 */

/**
 * Tone is carried by a decorative rule above the heading, never by colour alone:
 * the heading itself already says which state this is, so the bar is `aria-hidden`
 * and adds nothing a screen reader or a colour-blind visitor needs.
 */
const TONE = {
  positive: 'bg-success',
  neutral: 'bg-border',
  negative: 'bg-error',
} as const

function ResultPanel({
  tone,
  title,
  children,
}: {
  tone: keyof typeof TONE
  title: string
  children: ReactNode
}) {
  return (
    <section className="border border-border bg-card px-5 py-6 sm:px-7">
      <span aria-hidden="true" className={`block h-1 w-12 ${TONE[tone]}`} />
      <h1 className="mt-4 font-display text-[length:var(--text-3xl)] font-semibold text-fg">
        {title}
      </h1>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ContactLink({ locale }: { locale: Locale }) {
  return (
    <Link
      href={sectionPath(locale, 'contact')}
      className="text-brand-strong underline underline-offset-4"
    >
      {t(locale, 'footer.contactUs')}
    </Link>
  )
}

/** Reference, amount and receipt address, straight from the verified session. */
function VerifiedDetails({ locale, payment }: { locale: Locale; payment: VerifiedPayment }) {
  return (
    <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-[12rem_1fr]">
      {payment.internalReference ? (
        <>
          <dt className="text-fg-muted">{t(locale, 'pay.reference')}</dt>
          <dd className="font-medium text-fg">{payment.internalReference}</dd>
        </>
      ) : null}

      <dt className="text-fg-muted">{t(locale, 'pay.amountPaid')}</dt>
      <dd className="font-medium text-fg">
        {formatMoney(payment.amountMinor, payment.currency, locale)} {payment.currency}
      </dd>

      {payment.customerEmail ? (
        <>
          <dt className="text-fg-muted">{t(locale, 'pay.receiptTo')}</dt>
          <dd className="font-medium text-fg">{payment.customerEmail}</dd>
        </>
      ) : null}
    </dl>
  )
}

/**
 * Renders whichever state the VERIFIED session is actually in.
 * `payment` is null when verification failed or was never possible.
 */
export function PaymentOutcome({
  locale,
  payment,
  retryHref,
}: {
  locale: Locale
  payment: VerifiedPayment | null
  /** Where "try again" should go. Falls back to a contact link. */
  retryHref?: string
}) {
  if (!payment) return <PaymentUnverified locale={locale} />

  switch (payment.status) {
    case 'paid':
      return <PaymentSuccess locale={locale} payment={payment} />
    case 'pending':
      return <PaymentPending locale={locale} payment={payment} />
    case 'expired':
    case 'unpaid':
      return <PaymentFailed locale={locale} retryHref={retryHref} />
    default:
      return <PaymentUnverified locale={locale} />
  }
}

export function PaymentSuccess({
  locale,
  payment,
}: {
  locale: Locale
  payment: VerifiedPayment
}) {
  return (
    <ResultPanel tone="positive" title={t(locale, 'pay.success.title')}>
      <p className="max-w-[60ch] text-fg">{t(locale, 'pay.success.body')}</p>
      <p className="mt-2 max-w-[60ch] text-fg-muted">{t(locale, 'pay.success.next')}</p>
      <VerifiedDetails locale={locale} payment={payment} />
    </ResultPanel>
  )
}

/** Delayed payment methods settle after the visitor leaves Checkout. */
export function PaymentPending({
  locale,
  payment,
}: {
  locale: Locale
  payment: VerifiedPayment
}) {
  return (
    <ResultPanel tone="neutral" title={t(locale, 'pay.pending.title')}>
      <p className="max-w-[60ch] text-fg">{t(locale, 'pay.pending.body')}</p>
      <VerifiedDetails locale={locale} payment={payment} />
    </ResultPanel>
  )
}

export function PaymentCancelled({
  locale,
  retryHref,
}: {
  locale: Locale
  retryHref?: string
}) {
  return (
    <ResultPanel tone="neutral" title={t(locale, 'pay.cancelled.title')}>
      <p className="max-w-[60ch] text-fg">{t(locale, 'pay.cancelled.body')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {retryHref ? (
          <ButtonLink href={retryHref} variant="secondary">
            {t(locale, 'pay.tryAgain')}
          </ButtonLink>
        ) : null}
        <ContactLink locale={locale} />
      </div>
    </ResultPanel>
  )
}

export function PaymentFailed({ locale, retryHref }: { locale: Locale; retryHref?: string }) {
  return (
    <ResultPanel tone="negative" title={t(locale, 'pay.failed.title')}>
      <p className="max-w-[60ch] text-fg">{t(locale, 'pay.failed.body')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {retryHref ? (
          <ButtonLink href={retryHref} variant="secondary">
            {t(locale, 'pay.tryAgain')}
          </ButtonLink>
        ) : null}
        <ContactLink locale={locale} />
      </div>
    </ResultPanel>
  )
}

/**
 * Shown when there is no session id, the id is malformed, Stripe cannot be
 * reached, or the id belongs to nothing. It never says "payment received", because
 * at this point nobody knows whether one was made.
 */
export function PaymentUnverified({ locale }: { locale: Locale }) {
  return (
    <ResultPanel tone="neutral" title={t(locale, 'pay.unverified.title')}>
      <p className="max-w-[60ch] text-fg">{t(locale, 'pay.unverified.body')}</p>
      <p className="mt-5">
        <ContactLink locale={locale} />
      </p>
    </ResultPanel>
  )
}
