import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { PortableText } from '@/components/content/PortableText'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { formatDate } from '@/lib/format'
import { legalLabel, legalLinks, type LegalKey } from '@/lib/legal'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { isProduction } from '@/lib/env'
import type { ProseDoc } from '@/lib/sanity/queries/content'

/**
 * Legal document page.
 *
 * Two things it does that a plain prose page does not:
 *
 * 1. Identifies the data controller from verified Companies House details, because
 *    a privacy policy that does not name the controller correctly is defective.
 * 2. Refuses to present an unreviewed draft as a live policy. Documents drafted
 *    during the rebuild carry `solicitorApproved: false`; those render a visible
 *    notice and are marked noindex until a professional has signed them off.
 */
export function LegalTemplate({
  locale,
  doc,
  legalKey,
  slug,
}: {
  locale: Locale
  doc: ProseDoc | null
  legalKey: LegalKey
  slug: string
}) {
  const copy = COPY[locale]
  const title = doc?.title ?? legalLabel(locale, legalKey)
  const legalName = publicValue(BUSINESS.legalName)
  const companyNumber = publicValue(BUSINESS.companyNumber)
  const registeredOffice = publicValue(BUSINESS.registeredOffice)

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'footer.legal'), href: sectionPath(locale, 'legal') },
    { label: title },
  ]

  return (
    <>
      <Container>
        <Breadcrumbs locale={locale} crumbs={crumbs} />
      </Container>

      <Container>
        <div className="grid gap-12 pb-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="font-display text-[length:var(--text-4xl)] font-semibold text-fg">{title}</h1>

            {doc?.effectiveDate ? (
              <p className="mt-4 text-sm text-fg-muted">
                {copy.effectiveFrom}{' '}
                <time dateTime={doc.effectiveDate}>{formatDate(doc.effectiveDate, locale)}</time>
              </p>
            ) : null}

            {doc && !doc.solicitorApproved ? (
              <p className="mt-6 border-l-2 border-warning bg-paper-sunk p-4 text-sm leading-relaxed text-fg-muted">
                <strong className="font-semibold text-fg">{copy.draftLabel}</strong> {copy.draftNotice}
              </p>
            ) : null}

            {doc?.body ? (
              <div className="mt-8">
                <PortableText value={doc.body} locale={locale} />
              </div>
            ) : (
              <div className="mt-8 max-w-[68ch]">
                <p className="text-base leading-relaxed text-fg-muted">{copy.notYetPublished}</p>
                {!isProduction ? (
                  <p className="mt-4 bg-fg px-3 py-2 text-xs text-paper">
                    No legalPage document with slug &quot;{slug}&quot; exists for locale {locale}. Draft
                    text lives in content/legal/ and is imported by scripts/seed-legal.mjs.
                  </p>
                ) : null}
              </div>
            )}

            {/* Controller identity, required for the privacy and cookie documents. */}
            {(legalKey === 'privacy' || legalKey === 'cookies') && legalName && companyNumber ? (
              <section className="mt-12 max-w-[68ch] border-t border-border pt-8">
                <h2 className="font-display text-xl font-semibold text-fg">{copy.controller}</h2>
                <address className="mt-3 not-italic text-base leading-relaxed text-fg-muted">
                  {legalName}
                  <br />
                  {copy.companyNumber} {companyNumber}
                  <br />
                  {registeredOffice ? (
                    <>
                      {copy.registeredOffice}: {registeredOffice}
                    </>
                  ) : null}
                </address>
              </section>
            ) : null}
          </div>

          <nav aria-labelledby="legal-nav" className="lg:col-span-4">
            <div className="sticky top-32 border border-border p-5">
              <h2 id="legal-nav" className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">
                {t(locale, 'footer.legal')}
              </h2>
              <ul className="mt-4 space-y-2 text-sm">
                {legalLinks(locale).map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      aria-current={link.key === legalKey ? 'page' : undefined}
                      className={
                        link.key === legalKey
                          ? 'font-medium text-fg no-underline'
                          : 'text-fg-muted no-underline hover:text-fg hover:underline'
                      }
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>
      </Container>
    </>
  )
}

const COPY = {
  en: {
    effectiveFrom: 'In effect from',
    draftLabel: 'Draft.',
    draftNotice:
      'This document has not yet been reviewed by a solicitor and does not constitute legal advice. It is published here for review and is not indexed by search engines.',
    notYetPublished:
      'This document is being prepared. If you need this information now, please contact us and we will provide it directly.',
    controller: 'Who is responsible for your data',
    companyNumber: 'Registered in England and Wales, company number',
    registeredOffice: 'Registered office',
  },
  tr: {
    effectiveFrom: 'Yürürlük tarihi',
    draftLabel: 'Taslak.',
    draftNotice:
      'Bu belge henüz bir hukuk danışmanı tarafından incelenmemiştir ve hukuki görüş niteliği taşımaz. İnceleme amacıyla yayımlanmıştır ve arama motorlarına kapalıdır.',
    notYetPublished:
      'Bu belge hazırlanıyor. Bilgiye şimdi ihtiyacınız varsa bizimle iletişime geçin, doğrudan paylaşalım.',
    controller: 'Verilerinizden kim sorumlu?',
    companyNumber: "İngiltere ve Galler'de tescillidir, şirket numarası",
    registeredOffice: 'Tescilli adres',
  },
} as const
