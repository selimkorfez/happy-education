import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'
import { footerNav } from '@/lib/navigation'
import { legalLinks } from '@/lib/legal'
import { t } from '@/lib/i18n/dictionary'
import { homePath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, SOCIAL, publicValue } from '@/lib/business-facts'

/**
 * Site footer.
 *
 * On a warm light surface rather than a dark slab, for a concrete reason: the
 * Happy Education wordmark is charcoal and no reversed variant exists. Rather than
 * recolouring the client's logo without permission, the surface adapts to the logo.
 *
 * Company registration details render only once verified against Companies House.
 * Until then they are absent rather than guessed — an incorrect registered name is
 * a disclosure defect, and a plausible-looking placeholder is worse than a gap.
 */
export function SiteFooter({ locale }: { locale: Locale }) {
  const nav = footerNav(locale)
  const legal = legalLinks(locale)

  const legalName = publicValue(BUSINESS.legalName)
  const companyNumber = publicValue(BUSINESS.companyNumber)
  const registeredOffice = publicValue(BUSINESS.registeredOffice)
  const phone = publicValue(BUSINESS.phone)
  const email = publicValue(BUSINESS.email)
  const year = new Date().getUTCFullYear()

  return (
    <footer className="mt-24 border-t border-border bg-paper-sunk">
      <Container>
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Identity */}
          <div className="lg:col-span-4">
            <Link href={homePath(locale)} className="inline-flex no-underline">
              <Logo title={t(locale, 'brand.name')} className="h-10 w-auto" />
            </Link>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-fg-muted">
              {locale === 'tr'
                ? 'Londra merkezli yurt dışı eğitim danışmanlığı. Üniversite, dil okulu, yaz okulu ve yatılı okul süreçlerinde öğrencilere ve ailelere rehberlik ediyoruz.'
                : 'Study abroad advisers based in London. We guide students and families through university, language school, summer programme and boarding school decisions.'}
            </p>

            <ul className="mt-6 space-y-2 text-sm">
              {phone ? (
                <li>
                  <a
                    href={`tel:${phone.replace(/\s/g, '')}`}
                    className="text-fg no-underline hover:underline"
                  >
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className="text-fg no-underline hover:underline">
                    {email}
                  </a>
                </li>
              ) : null}
              {registeredOffice ? (
                <li className="pt-1">
                  {/*
                   * Labelled explicitly as the registered office. It is a serviced
                   * address, so presenting it as "our London office" would be a
                   * misleading claim rather than a helpful one.
                   */}
                  <span className="block text-xs uppercase tracking-wide text-fg-muted">
                    {locale === 'tr' ? 'Tescilli adres' : 'Registered office'}
                  </span>
                  <address className="mt-1 not-italic text-fg-muted">{registeredOffice}</address>
                </li>
              ) : null}
            </ul>
          </div>

          {/* Explore */}
          <nav aria-labelledby="footer-explore" className="lg:col-span-3">
            <h2 id="footer-explore" className="text-sm font-semibold tracking-wide text-fg">
              {t(locale, 'footer.services')}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.explore.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-fg-muted no-underline hover:text-fg hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-labelledby="footer-company" className="lg:col-span-2">
            <h2 id="footer-company" className="text-sm font-semibold tracking-wide text-fg">
              {t(locale, 'footer.company')}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {nav.company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-fg-muted no-underline hover:text-fg hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {SOCIAL.length > 0 ? (
              <>
                <h2 className="mt-8 text-sm font-semibold tracking-wide text-fg">
                  {t(locale, 'footer.followUs')}
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {SOCIAL.map((account) => (
                    <li key={account.platform}>
                      <a
                        href={account.url}
                        target="_blank"
                        rel="noopener noreferrer me"
                        className="text-fg-muted no-underline hover:text-fg hover:underline"
                      >
                        {account.platform}
                        <span className="sr-only"> ({t(locale, 'a11y.opensInNewTab')})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </nav>

          {/* Legal */}
          <nav aria-labelledby="footer-legal" className="lg:col-span-3">
            <h2 id="footer-legal" className="text-sm font-semibold tracking-wide text-fg">
              {t(locale, 'footer.legal')}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {legal.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="text-fg-muted no-underline hover:text-fg hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookiePreferencesButton locale={locale} />
              </li>
            </ul>
          </nav>
        </div>

        {/* Statutory strip */}
        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-fg-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {legalName ?? t(locale, 'brand.name')}.
            {legalName && companyNumber ? (
              <>
                {' '}
                {t(locale, 'footer.registeredIn')}. {t(locale, 'footer.companyNumber')}{' '}
                {companyNumber}.
              </>
            ) : null}
          </p>
          <p>
            {locale === 'tr'
              ? 'Vize kararları ilgili ülkenin resmî makamlarına aittir.'
              : 'Visa decisions are made by the relevant government authority.'}
          </p>
        </div>
      </Container>
    </footer>
  )
}
