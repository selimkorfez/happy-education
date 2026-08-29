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

export function SiteHeader({ locale }: { locale: Locale }) {
  const groups = primaryNav(locale)
  const phone = publicValue(BUSINESS.phone)

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-paper/90 shadow-[0_6px_24px_rgba(35,35,38,0.035)] backdrop-blur-xl">
      <div className="hidden border-b border-border/60 bg-white/45 lg:block">
        <Container>
          <div className="flex h-9 items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-4 text-fg-muted">
              <span>{t(locale, 'brand.tagline')}</span>
              {phone ? (
                <>
                  <span aria-hidden="true" className="h-1 w-1 rounded-full bg-brand" />
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-fg-muted no-underline transition hover:text-brand-strong">
                    {phone}
                  </a>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-5">
              <Link href={sectionPath(locale, 'about')} className="text-fg-muted no-underline transition hover:text-fg">
                {t(locale, 'nav.about')}
              </Link>
              <Link href={sectionPath(locale, 'contact')} className="text-fg-muted no-underline transition hover:text-fg">
                {t(locale, 'nav.contact')}
              </Link>
              <LanguageSwitcher locale={locale} />
            </div>
          </div>
        </Container>
      </div>

      <Container width="wide">
        <div className="flex h-[4.7rem] items-center justify-between gap-5">
          <Link
            href={homePath(locale)}
            className="flex shrink-0 items-center no-underline"
            aria-label={`${t(locale, 'brand.name')} — ${t(locale, 'brand.tagline')}`}
          >
            <Logo title={t(locale, 'brand.name')} priority className="h-9 w-auto sm:h-10" />
          </Link>

          <PrimaryNav groups={groups} locale={locale} />

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link
              href={sectionPath(locale, 'search')}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-transparent text-fg-muted no-underline transition hover:border-border hover:bg-white hover:text-fg"
              aria-label={t(locale, 'search.label')}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.75" />
                <path d="m11.5 11.5 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </Link>

            <Link
              href={sectionPath(locale, 'consultation')}
              className="hidden min-h-11 items-center whitespace-nowrap rounded-full bg-brand px-5 text-[0.9375rem] font-bold text-fg no-underline shadow-[0_8px_20px_rgba(244,116,38,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f6813b] sm:inline-flex"
            >
              {t(locale, 'nav.consultation')}
              <span aria-hidden="true" className="ml-2">↗</span>
            </Link>

            <MobileNav groups={groups} locale={locale} />
          </div>
        </div>
      </Container>
    </header>
  )
}
