'use client'

import { usePathname } from 'next/navigation'
import { LOCALES, LOCALE_LABEL, HREFLANG, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'

/**
 * Language switcher.
 *
 * Renders a plain link to `/api/locale`, which resolves the equivalent document
 * in the target locale server-side from the translation reference in Sanity.
 */
export function LanguageSwitcher({
  locale,
  tone = 'light',
}: {
  locale: Locale
  tone?: 'light' | 'dark'
}) {
  const pathname = usePathname()
  const others = LOCALES.filter((l) => l !== locale)
  const currentClass = tone === 'dark' ? 'text-white' : 'text-fg'
  const dividerClass = tone === 'dark' ? 'text-white/35' : 'text-border-input'
  const linkClass = tone === 'dark'
    ? 'text-fg-muted-on-ink hover:text-white'
    : 'text-fg-muted hover:text-fg'

  return (
    <nav aria-label={t(locale, 'a11y.languageSwitcher')} className="flex items-center">
      <ul className="flex items-center gap-1">
        <li>
          <span
            aria-current="true"
            lang={HREFLANG[locale]}
            className={`px-2 py-1.5 text-sm font-semibold ${currentClass}`}
          >
            {locale.toUpperCase()}
            <span className="sr-only"> — {LOCALE_LABEL[locale]}</span>
          </span>
        </li>
        {others.map((target) => (
          <li key={target} className="flex items-center">
            <span aria-hidden="true" className={dividerClass}>
              /
            </span>
            <a
              href={`/api/locale?to=${target}&from=${encodeURIComponent(pathname)}`}
              hrefLang={HREFLANG[target]}
              lang={HREFLANG[target]}
              className={`px-2 py-1.5 text-sm font-medium underline-offset-4 hover:underline ${linkClass}`}
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
