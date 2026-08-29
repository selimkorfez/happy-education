import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { CookiePreferencesButton } from '@/components/consent/CookiePreferencesButton'
import { footerNav } from '@/lib/navigation'
import { legalLinks } from '@/lib/legal'
import { t } from '@/lib/i18n/dictionary'
import { homePath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, SOCIAL, publicValue } from '@/lib/business-facts'

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
    <footer className="on-ink mt-14 overflow-hidden bg-ink-surface text-fg-on-ink sm:mt-20">
      <div className="relative border-b border-white/10 py-12 sm:py-14">
        <div aria-hidden="true" className="absolute -right-20 -top-36 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
        <Container>
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-on-ink">
                {locale === 'tr' ? 'Sonraki adımınız' : 'Your next move'}
              </p>
              <h2 className="mt-3 max-w-[17ch] text-[length:var(--text-3xl)] font-bold text-fg-on-ink">
                {locale === 'tr' ? 'Planınızı birlikte daha net hâle getirelim.' : 'Make the plan feel clearer from here.'}
              </h2>
            </div>
            <Link
              href={`/${locale}/${locale === 'tr' ? 'on-gorusme' : 'consultation'}`}
              className="inline-flex min-h-12 w-fit items-center rounded-full bg-brand px-7 text-base font-bold text-fg no-underline shadow-[0_12px_28px_rgba(244,116,38,0.2)] transition hover:-translate-y-0.5 hover:bg-brand-on-ink"
            >
              {locale === 'tr' ? 'Ücretsiz görüşme planla' : 'Book a free conversation'} <span aria-hidden="true" className="ml-2">↗</span>
            </Link>
          </div>
        </Container>
      </div>

      <Container>
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-14">
          <div className="lg:col-span-4">
            <Link href={homePath(locale)} className="inline-flex rounded-[1rem] bg-white px-4 py-3 no-underline">
              <Logo title={t(locale, 'brand.name')} className="h-9 w-auto" />
            </Link>
            <p className="mt-5 max-w-[37ch] text-sm leading-relaxed text-fg-muted-on-ink">
              {locale === 'tr'
                ? 'Londra merkezli yurt dışı eğitim danışmanlığı. Üniversite, dil okulu, yaz okulu ve yatılı okul süreçlerinde öğrencilere ve ailelere rehberlik ediyoruz.'
                : 'Study abroad advisers based in London, helping students and families navigate university, language school, summer programme and boarding school decisions.'}
            </p>

            <ul className="mt-6 space-y-2.5 text-sm">
              {phone ? <li><a href={`tel:${phone.replace(/\s/g, '')}`} className="font-bold text-brand-on-ink no-underline hover:underline">{phone}</a></li> : null}
              {email ? <li><a href={`mailto:${email}`} className="font-bold text-brand-on-ink no-underline hover:underline">{email}</a></li> : null}
              {registeredOffice ? (
                <li className="pt-3 text-fg-muted-on-ink">
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-white/55">{locale === 'tr' ? 'Tescilli adres' : 'Registered office'}</span>
                  <address className="mt-1.5 max-w-[32ch] not-italic leading-relaxed">{registeredOffice}</address>
                </li>
              ) : null}
            </ul>
          </div>

          <FooterColumn id="footer-explore" title={t(locale, 'footer.services')} className="lg:col-span-3">
            {nav.explore.map((item) => <li key={item.href}><Link href={item.href} className="text-fg-muted-on-ink no-underline transition hover:text-fg-on-ink">{item.label}</Link></li>)}
          </FooterColumn>

          <div className="lg:col-span-2">
            <FooterColumn id="footer-company" title={t(locale, 'footer.company')}>
              {nav.company.map((item) => <li key={item.href}><Link href={item.href} className="text-fg-muted-on-ink no-underline transition hover:text-fg-on-ink">{item.label}</Link></li>)}
            </FooterColumn>
            {SOCIAL.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-xs font-bold uppercase tracking-[0.09em] text-white/65">{t(locale, 'footer.followUs')}</h2>
                <ul className="mt-4 flex flex-wrap gap-2 text-sm">
                  {SOCIAL.map((account) => (
                    <li key={account.platform}>
                      <a href={account.url} target="_blank" rel="noopener noreferrer me" className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-3 text-fg-muted-on-ink no-underline transition hover:bg-white/8 hover:text-fg-on-ink">
                        {account.platform}<span className="sr-only"> ({t(locale, 'a11y.opensInNewTab')})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <FooterColumn id="footer-legal" title={t(locale, 'footer.legal')} className="lg:col-span-3">
            {legal.map((item) => <li key={item.key}><Link href={item.href} className="text-fg-muted-on-ink no-underline transition hover:text-fg-on-ink">{item.label}</Link></li>)}
            <li className="text-fg-muted-on-ink"><CookiePreferencesButton locale={locale} /></li>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-fg-muted-on-ink sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {legalName ?? t(locale, 'brand.name')}.
            {legalName && companyNumber ? <>{' '}{t(locale, 'footer.registeredIn')}. {t(locale, 'footer.companyNumber')} {companyNumber}.</> : null}
          </p>
          <p>{locale === 'tr' ? 'Vize kararları ilgili ülkenin resmî makamlarına aittir.' : 'Visa decisions are made by the relevant government authority.'}</p>
        </div>
      </Container>
    </footer>
  )
}

function FooterColumn({ id, title, className = '', children }: { id: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <nav aria-labelledby={id} className={className}>
      <h2 id={id} className="text-xs font-bold uppercase tracking-[0.09em] text-white/65">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">{children}</ul>
    </nav>
  )
}
