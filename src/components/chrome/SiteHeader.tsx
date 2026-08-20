import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { PrimaryNav } from './PrimaryNav'
import { MobileNav } from './MobileNav'
import { LanguageSwitcher } from './LanguageSwitcher'
import { primaryNav } from '@/lib/navigation'
import { homePath, sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { BUSINESS, publicValue } from '@/lib/business-facts'

/**
 * Site header.
 *
 * Two rows on desktop, which separates "who we are / how to reach us" from
 * "what we offer" instead of cramming nine items into one bar. The utility row is
 * a genuine convenience for a consultancy whose visitors often want to phone.
 *
 * The header is a Server Component. Only the two nav disclosures ship JavaScript.
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const groups = primaryNav(locale)
  const phone = publicValue(BUSINESS.phone)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur-none">
      {/* Utility row — hidden on mobile, where the same links live in the panel. */}
      <div className="hidden border-b border-border lg:block">
        <Container>
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="flex items-center gap-5">
              {phone ? (
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-fg-muted no-underline hover:text-fg hover:underline"
                >
                  {phone}
                </a>
              ) : null}
              <span aria-hidden="true" className="text-border-input">
                |
              </span>
              <span className="text-fg-muted">{t(locale, 'brand.tagline')}</span>
            </div>

            <div className="flex items-center gap-5">
              <Link
                href={sectionPath(locale, 'about')}
                className="text-fg-muted no-underline hover:text-fg hover:underline"
              >
                {t(locale, 'nav.about')}
              </Link>
              <Link
                href={sectionPath(locale, 'contact')}
                className="text-fg-muted no-underline hover:text-fg hover:underline"
              >
                {t(locale, 'nav.contact')}
              </Link>
              <LanguageSwitcher locale={locale} />
            </div>
          </div>
        </Container>
      </div>

      {/* Main row */}
      <Container>
        <div className="flex h-[4.5rem] items-center justify-between gap-6">
          <Link
            href={homePath(locale)}
            className="flex shrink-0 items-center no-underline"
            aria-label={`${t(locale, 'brand.name')} — ${t(locale, 'brand.tagline')}`}
          >
            <Logo
              title={t(locale, 'brand.name')}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <PrimaryNav groups={groups} locale={locale} />

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={sectionPath(locale, 'search')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-fg-muted no-underline hover:text-fg"
              aria-label={t(locale, 'search.label')}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.75" />
                <path d="m11.5 11.5 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </Link>

            <Link
              href={sectionPath(locale, 'consultation')}
              className="hidden min-h-11 items-center whitespace-nowrap rounded-[3px] bg-brand-strong px-5 text-[0.9375rem] font-semibold text-white no-underline transition-colors duration-150 hover:bg-brand-pressed sm:inline-flex"
            >
              {t(locale, 'nav.consultation')}
            </Link>

            <MobileNav groups={groups} locale={locale} />
          </div>
        </div>
      </Container>
    </header>
  )
}
