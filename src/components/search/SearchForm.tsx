'use client'

import { useSearchParams } from 'next/navigation'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'

/**
 * Search input.
 *
 * A plain GET form posting to the search page, so it works without JavaScript and
 * produces a shareable URL. The only reason this is a client component is to
 * pre-fill the field from the current query.
 */
export function SearchForm({ locale }: { locale: Locale }) {
  const params = useSearchParams()
  const current = params.get('q') ?? ''

  return (
    <form action={sectionPath(locale, 'search')} method="get" role="search" className="flex gap-2">
      <div className="flex-1">
        <label htmlFor="site-search" className="sr-only">
          {t(locale, 'search.label')}
        </label>
        <input
          id="site-search"
          type="search"
          name="q"
          defaultValue={current}
          placeholder={t(locale, 'search.placeholder')}
          autoComplete="off"
          maxLength={80}
          className="min-h-12 w-full border border-border-input bg-card px-4 text-base text-fg placeholder:text-fg-muted"
        />
      </div>
      <button
        type="submit"
        className="min-h-12 shrink-0 rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white hover:bg-brand-pressed"
      >
        {t(locale, 'search.submit')}
      </button>
    </form>
  )
}
