import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { PaymentOutcome, PaymentCancelled, PaymentFailed } from '@/components/payments/PaymentResult'
import { PaymentSummary } from '@/components/payments/PaymentSummary'
import { CheckoutForm } from '@/components/payments/CheckoutForm'
import { isValidSessionId, verifyCheckoutSession } from '@/lib/payments/verify-session'
import { resolvePayable } from '@/lib/payments/catalogue'
import { PAYMENT_SEGMENT, type PaymentResultState } from '@/lib/payments/urls'
import { isLocale, sectionPath, LOCALES, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'

/**
 * Payment result pages: /en/payment/success and /tr/odeme/basarili, plus the
 * cancelled and failed states.
 *
 * THE URL IS NOT EVIDENCE. Landing on `/payment/success` proves only that Stripe
 * redirected the browser here; anyone can type the address. The page therefore
 * re-reads the session from Stripe server-side and renders what Stripe says. With
 * no session id, an invalid one, or an unverifiable one, it says plainly that the
 * payment could not be confirmed rather than congratulating the visitor.
 *
 * The webhook remains the authoritative record. This page is the receipt the
 * visitor sees, not the thing that marks an order paid.
 *
 * Dynamic by necessity: the outcome depends on a query parameter and a live API
 * call, so it must never be cached or prerendered.
 */
export const dynamic = 'force-dynamic'

const STATE_BY_SEGMENT: Record<Locale, Record<string, PaymentResultState>> = {
  en: { success: 'success', cancelled: 'cancelled', failed: 'failed' },
  tr: { basarili: 'success', iptal: 'cancelled', basarisiz: 'failed' },
}

/** Pre-registers the six valid paths so an unknown state 404s rather than rendering. */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    Object.keys(STATE_BY_SEGMENT[locale]).map((state) => ({ locale, state })),
  )
}

function resolveState(locale: Locale, segment: string): PaymentResultState | null {
  const table = STATE_BY_SEGMENT[locale]
  return Object.hasOwn(table, segment) ? (table[segment] ?? null) : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; state: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return {
    title: t(locale, 'pay.success.title'),
    // A transaction receipt is personal and has no business in an index.
    robots: { index: false, follow: false },
  }
}

export default async function PaymentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; state: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { locale, state: segment } = await params
  if (!isLocale(locale)) notFound()

  const state = resolveState(locale, segment)

  /*
   * A segment that is not a result state is treated as a payable service
   * reference, so /en/payment/application-service renders that service's checkout.
   *
   * There is no such page today because no `paymentService` or `appointmentType`
   * document exists: what Happy Education charges for, and how much, is a business
   * decision and the brief forbids inventing a price to fill a template. The route
   * is here so that creating one in the CMS is all it takes to open a checkout.
   */
  if (!state) {
    const payable = await resolvePayable(`service:${segment}`, locale)
    if (!payable) notFound()

    return (
      <>
        <Container>
          <Breadcrumbs
            locale={locale}
            crumbs={[
              { label: t(locale, 'brand.name'), href: `/${locale}` },
              { label: payable.title },
            ]}
          />
        </Container>
        <Container>
          <div className="grid max-w-[64rem] gap-10 pb-16 lg:grid-cols-2">
            <PaymentSummary locale={locale} payable={payable} />
            <CheckoutForm locale={locale} reference={payable.reference} />
          </div>
        </Container>
      </>
    )
  }

  const query = await searchParams
  const rawSessionId = typeof query.session_id === 'string' ? query.session_id : null

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: locale === 'tr' ? 'Ödeme' : 'Payment' },
  ]

  return (
    <>
      <Container>
        <Breadcrumbs locale={locale} crumbs={crumbs} />
      </Container>
      <Container>
        <div className="max-w-[46rem] pb-16">
          {state === 'cancelled' ? (
            <PaymentCancelled locale={locale} retryHref={sectionPath(locale, 'consultation')} />
          ) : state === 'failed' ? (
            <PaymentFailed locale={locale} retryHref={sectionPath(locale, 'consultation')} />
          ) : (
            <PaymentOutcome
              locale={locale}
              payment={
                rawSessionId && isValidSessionId(rawSessionId)
                  ? await verifyCheckoutSession(rawSessionId)
                  : null
              }
              retryHref={sectionPath(locale, 'consultation')}
            />
          )}
        </div>
      </Container>
    </>
  )
}

/** Referenced so a segment rename in the URL helper breaks the build here too. */
void PAYMENT_SEGMENT
