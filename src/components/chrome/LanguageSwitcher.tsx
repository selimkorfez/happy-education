'use client'

import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_LABEL, HREFLANG, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'

/**
 * Language switcher.
 *
 * Renders a plain link to `/api/locale`, which resolves the *equivalent* document
 * in the target locale server-side from the translation reference in Sanity, then
 * redirects. No fetch happens on click; the work is done by the route.
 *
 * That matters because the two trees use different slugs: /en/universities/united-kingdom
 * and /tr/universiteler/ingiltere are the same page but share no path segment. A
 * naive client-side segment swap would 404, and falling back to the homepage every
 * time is the behaviour the brief explicitly rules out.
 *
 * The route degrades in steps: exact translation, then the section index in the
 * target locale, then that locale's home.
 *
 * The current path comes from usePathname rather than a server header. Reading
 * headers() here would opt every page out of static generation for the sake of one
 * href, which is a bad trade on a content site.
 */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  const others = LOCALES.filter((l) => l !== locale)

  return (
    <nav aria-label={t(locale, 'a11y.languageSwitcher')} className="flex items-center">
      <ul className="flex items-center gap-1">
        <li>
          <span
            aria-current="true"
            lang={HREFLANG[locale]}
            className="px-2 py-1.5 text-sm font-semibold text-fg"
          >
            {locale.toUpperCase()}
            <span className="sr-only"> — {LOCALE_LABEL[locale]}</span>
          </span>
        </li>
        {others.map((target) => (
          <li key={target} className="flex items-center">
            <span aria-hidden="true" className="text-border-input">
              /
            </span>
            <a
              href={`/api/locale?to=${target}&from=${encodeURIComponent(pathname)}`}
              hrefLang={HREFLANG[target]}
              lang={HREFLANG[target]}
              className="px-2 py-1.5 text-sm font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline"
            >
              {target.toUpperCase()}
              <span className="sr-only"> — {LOCALE_LABEL[target]}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
