import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Payable } from '@/lib/payments/catalogue'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { formatMoney } from '@/lib/format'
import { legalLabel, legalPath } from '@/lib/legal'
import { t } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'

/**
 * What the visitor is about to pay for, shown before they pay.
 *
 * Server component: the amount is rendered from the server-resolved catalogue
 * entry, so what is displayed is the same number that will be charged. The
 * component takes a resolved `Payable` rather than a reference precisely so that
 * there is only one place a price can come from.
 *
 * DELIBERATELY ABSENT: no countdown, no "only two places left", no "price rises
 * on Friday", no pre-ticked anything. Pressure tactics on a page where a family is
 * about to spend money are both an unfair commercial practice under the Consumer
 * Protection from Unfair Trading Regulations and a good way to be remembered
 * badly. The page states the amount, what it covers, whether it comes back, and
 * who is being paid.
 */
export function PaymentSummary({
  locale,
  payable,
  action,
}: {
  locale: Locale
  payable: Payable
  /** Slot for the checkout form or button. */
  action?: ReactNode
}) {
  const legalName = publicValue(BUSINESS.legalName)
  const companyNumber = publicValue(BUSINESS.companyNumber)
  const registeredOffice = publicValue(BUSINESS.registeredOffice)

  return (
    <section className="border border-border bg-card">
      <div className="border-b border-border px-5 py-5 sm:px-7">
        <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
          {t(locale, 'pay.summaryHeading')}
        </h2>
      </div>

      <dl className="divide-y divide-border">
        <Row label={t(locale, 'pay.serviceLabel')}>
          <span className="font-medium text-fg">{payable.title}</span>
          {payable.description ? (
            <p className="mt-1 max-w-[60ch] text-sm text-fg-muted">{payable.description}</p>
          ) : null}
          {payable.kind === 'appointment' && payable.durationMinutes ? (
            <p className="mt-1 text-sm text-fg-muted">
              {t(locale, 'booking.durationLabel')}: {payable.durationMinutes}{' '}
              {t(locale, 'booking.minutes')}
            </p>
          ) : null}
        </Row>

        <Row label={t(locale, 'pay.amountLabel')}>
          {/* Currency is always written out. A bare number is ambiguous to a
              visitor choosing between a UK and a Turkish price. */}
          <span className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
            {formatMoney(payable.amountMinor, payable.currency, locale)}
          </span>{' '}
          <span className="text-sm text-fg-muted">{payable.currency}</span>
        </Row>

        {payable.covers.length > 0 ? (
          <Row label={t(locale, 'pay.coversLabel')}>
            <ul className="max-w-[60ch] list-disc space-y-1 pl-5 text-fg">
              {payable.covers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Row>
        ) : null}

        <Row label={t(locale, 'pay.refundLabel')}>
          <p className="max-w-[60ch] text-fg">
            {payable.refundable ? t(locale, 'pay.refundable') : t(locale, 'pay.nonRefundable')}
          </p>
          <p className="mt-2 text-sm">
            <Link
              href={legalPath(locale, 'refunds')}
              className="text-brand-strong underline underline-offset-4"
            >
              {legalLabel(locale, 'refunds')}
            </Link>
          </p>
        </Row>

        <Row label={t(locale, 'pay.cancellationHeading')}>
          <p className="max-w-[60ch] text-fg">{t(locale, 'pay.cancellationBody')}</p>
          <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <Link
              href={legalPath(locale, 'appointments')}
              className="text-brand-strong underline underline-offset-4"
            >
              {legalLabel(locale, 'appointments')}
            </Link>
            <Link
              href={legalPath(locale, 'paymentTerms')}
              className="text-brand-strong underline underline-offset-4"
            >
              {legalLabel(locale, 'paymentTerms')}
            </Link>
          </p>
        </Row>

        {/* Who the money goes to. Required on a UK trading website, and the thing a
            careful visitor looks for before entering card details. The registered
            office is labelled as such: it is a serviced address, not a place where
            anyone is received. */}
        <Row label={t(locale, 'pay.paidToHeading')}>
          {legalName ? <p className="font-medium text-fg">{legalName}</p> : null}
          {companyNumber ? (
            <p className="text-sm text-fg-muted">
              {t(locale, 'footer.companyNumber')} {companyNumber} · {t(locale, 'footer.registeredIn')}
            </p>
          ) : null}
          {registeredOffice ? (
            <p className="mt-1 text-sm text-fg-muted">
              {t(locale, 'pay.registeredOffice')}: {registeredOffice}
            </p>
          ) : null}
        </Row>
      </dl>

      <div className="border-t border-border px-5 py-6 sm:px-7">
        {action}
        <p className="mt-4 max-w-[60ch] text-sm text-fg-muted">{t(locale, 'pay.processorNote')}</p>
        {/* Which wallets appear is decided by Stripe from the visitor's device,
            browser, card and country. The site never claims a specific one is
            available, because for many visitors it will not be. */}
        <p className="mt-2 max-w-[60ch] text-sm text-fg-muted">{t(locale, 'pay.methodsNote')}</p>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6 sm:px-7">
      <dt className="text-sm font-medium text-fg-muted">{label}</dt>
      <dd className="text-fg">{children}</dd>
    </div>
  )
}
