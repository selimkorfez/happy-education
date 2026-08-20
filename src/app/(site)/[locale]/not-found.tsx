import Link from 'next/link'
import { headers } from 'next/headers'
import { Container } from '@/components/ui/Container'
import {
  sectionPath,
  homePath,
  isLocale,
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_LABEL,
  type Locale,
} from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { primaryNav } from '@/lib/navigation'

/**
 * 404.
 *
 * A rebuild that moves several hundred URLs will produce some misses, so this page
 * is built to recover the visit rather than apologise: a search box, the main
 * sections, and a route to a human. It exposes no technical detail.
 *
 * A not-found boundary receives no route params, so the locale is recovered from
 * the request path that the proxy records in `x-pathname`. Without that, a Turkish
 * visitor who mistypes a URL is answered in English, which is exactly the moment
 * they are least able to recover.
 */
export default async function NotFound() {
  const pathname = (await headers()).get('x-pathname') ?? ''
  const first = pathname.split('/')[1] ?? ''
  const locale: Locale = isLocale(first) ? first : DEFAULT_LOCALE
  const groups = primaryNav(locale)

  return (
    <Container>
      {/* Hoisted into <head> by React. not-found.tsx cannot export metadata. */}
      <meta name="robots" content="noindex, follow" />
      <div className="max-w-[60ch] py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">404</p>
        <h1 className="mt-3 font-display text-[length:var(--text-4xl)] font-semibold text-fg">
          {t(locale, 'error.404.title')}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-fg-muted">{t(locale, 'error.404.body')}</p>

        <form action={sectionPath(locale, 'search')} method="get" role="search" className="mt-8 flex gap-2">
          <label htmlFor="notfound-search" className="sr-only">
            {t(locale, 'search.label')}
          </label>
          <input
            id="notfound-search"
            type="search"
            name="q"
            placeholder={t(locale, 'search.placeholder')}
            className="min-h-12 flex-1 border border-border-input bg-card px-4 text-base text-fg placeholder:text-fg-muted"
          />
          <button
            type="submit"
            className="min-h-12 shrink-0 rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white hover:bg-brand-pressed"
          >
            {t(locale, 'search.submit')}
          </button>
        </form>

        <nav aria-labelledby="notfound-sections" className="mt-12">
          <h2 id="notfound-sections" className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">
            {locale === 'tr' ? 'Ana bölümler' : 'Main sections'}
          </h2>
          <ul className="mt-4 grid gap-x-8 sm:grid-cols-2">
            {groups.map((group) => (
              <li key={group.key} className="border-b border-border">
                <Link
                  href={group.href}
                  className="block py-3 text-base text-fg no-underline hover:text-brand-strong hover:underline"
                >
                  {group.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={sectionPath(locale, 'contact')}
            className="inline-flex min-h-12 items-center rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white no-underline hover:bg-brand-pressed"
          >
            {t(locale, 'nav.contact')}
          </Link>
          {LOCALES.filter((l) => l !== locale).map((other) => (
            <Link
              key={other}
              href={homePath(other)}
              hrefLang={other}
              lang={other}
              className="inline-flex min-h-12 items-center rounded-[3px] border border-border-input px-6 text-base font-semibold text-fg no-underline hover:bg-paper-sunk"
            >
              {LOCALE_LABEL[other]}
            </Link>
          ))}
        </div>
      </div>
    </Container>
  )
}
