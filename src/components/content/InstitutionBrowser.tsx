'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'

export interface InstitutionBrowserItem {
  href: string
  title: string
  city?: string
  country?: string
}

type SortMode = 'popular' | 'az'

const COPY = {
  en: {
    search: 'Search institutions',
    placeholder: 'Try a university, city or country',
    count: 'options',
    empty: 'No institutions match that search yet.',
    clear: 'Clear search',
    preview: 'Quick preview',
    open: 'Open profile',
    sort: 'Sort by',
    popular: 'Popular',
    az: 'A–Z',
    popularNote: 'Curated starting order — not a live ranking.',
  },
  tr: {
    search: 'Kurumlarda ara',
    placeholder: 'Üniversite, şehir veya ülke arayın',
    count: 'seçenek',
    empty: 'Bu aramayla eşleşen kurum bulunamadı.',
    clear: 'Aramayı temizle',
    preview: 'Hızlı önizleme',
    open: 'Profili aç',
    sort: 'Sırala',
    popular: 'Popüler',
    az: 'A–Z',
    popularNote: 'Editoryal başlangıç sırası — canlı bir sıralama değildir.',
  },
} as const

export function InstitutionBrowser({
  locale,
  items,
}: {
  locale: Locale
  items: InstitutionBrowserItem[]
}) {
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const copy = COPY[locale]
  const language = locale === 'tr' ? 'tr-TR' : 'en-GB'

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(language)
    const matches = needle
      ? items.filter((item) =>
          [item.title, item.city, item.country]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(language)
            .includes(needle),
        )
      : [...items]

    // “Popular” deliberately preserves the curated/source order. We do not imply
    // that we have live popularity analytics until real behavioural data exists.
    if (sortMode === 'az') {
      matches.sort((a, b) => a.title.localeCompare(b.title, language, { sensitivity: 'base' }))
    }

    return matches
  }, [items, language, query, sortMode])

  return (
    <div>
      <div className="mb-7 flex flex-col gap-4 rounded-[1.35rem] border border-border/70 bg-paper-sunk/65 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-fg-muted">{copy.sort}</span>
          <div className="inline-flex rounded-full border border-border/80 bg-white p-1 shadow-[0_5px_16px_rgba(35,35,38,0.04)]" role="group" aria-label={copy.sort}>
            <button
              type="button"
              aria-pressed={sortMode === 'popular'}
              onClick={() => setSortMode('popular')}
              className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${sortMode === 'popular' ? 'bg-ink-surface text-fg-on-ink shadow-sm' : 'text-fg-muted hover:bg-paper hover:text-fg'}`}
            >
              {copy.popular}
            </button>
            <button
              type="button"
              aria-pressed={sortMode === 'az'}
              onClick={() => setSortMode('az')}
              className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${sortMode === 'az' ? 'bg-ink-surface text-fg-on-ink shadow-sm' : 'text-fg-muted hover:bg-paper hover:text-fg'}`}
            >
              {copy.az}
            </button>
          </div>
          {sortMode === 'popular' ? <span className="text-xs font-medium text-fg-muted">{copy.popularNote}</span> : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {items.length > 8 ? (
            <label className="relative block flex-1 sm:max-w-[30rem]">
              <span className="sr-only">{copy.search}</span>
              <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m11.5 11.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.placeholder}
                className="min-h-12 w-full rounded-full border border-border-input bg-white py-3 pl-11 pr-4 text-sm text-fg shadow-[0_5px_16px_rgba(35,35,38,0.04)] placeholder:text-fg-muted/75"
              />
            </label>
          ) : null}
          <p className="shrink-0 text-sm font-bold tabular-nums text-fg-muted">
            {filtered.length} {copy.count}
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => {
            const location = [item.city, item.country].filter(Boolean).join(', ')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group relative flex min-h-[10.5rem] h-full flex-col overflow-visible rounded-[1.3rem] border border-border/70 bg-white p-5 no-underline shadow-[0_8px_26px_rgba(35,35,38,0.05)] transition duration-250 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_18px_42px_rgba(35,35,38,0.09)] focus-visible:z-20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-xs font-black tabular-nums text-brand-strong">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true" className="text-brand-strong transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </div>
                  <div className="mt-auto pt-6">
                    {location ? <p className="text-xs font-bold uppercase tracking-[0.07em] text-fg-muted">{location}</p> : null}
                    <h3 className="mt-1.5 text-lg font-bold leading-snug text-fg">{item.title}</h3>
                  </div>

                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-2 top-12 z-20 hidden w-[11.5rem] translate-y-1 rounded-[1rem] border border-border/70 bg-ink-surface px-4 py-3 text-left text-fg-on-ink opacity-0 shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 lg:block"
                  >
                    <span className="block text-[0.68rem] font-bold uppercase tracking-[0.09em] text-brand-on-ink">{copy.preview}</span>
                    {location ? <span className="mt-1 block text-xs leading-relaxed text-fg-muted-on-ink">{location}</span> : null}
                    <span className="mt-2 block text-xs font-bold text-fg-on-ink">{copy.open} →</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-[1.3rem] border border-border/70 bg-white p-7 text-center">
          <p className="text-base font-semibold text-fg">{copy.empty}</p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 min-h-11 rounded-full border border-border bg-paper px-5 text-sm font-bold text-fg transition hover:bg-brand-soft"
          >
            {copy.clear}
          </button>
        </div>
      )}
    </div>
  )
}
