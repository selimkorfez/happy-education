'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import type { Locale } from '@/lib/i18n/config'

export interface SortableCardItem {
  href: string
  title: string
  meta?: string
  excerpt?: string
  image?: MediaSource | null
  imageAlt?: string
}

type SortMode = 'popular' | 'az'

const COPY = {
  en: { sort: 'Sort by', popular: 'Popular', az: 'A–Z', note: 'Curated starting order, not a live ranking.', explore: 'Explore' },
  tr: { sort: 'Sırala', popular: 'Popüler', az: 'A–Z', note: 'Editoryal başlangıç sırası, canlı bir sıralama değildir.', explore: 'Keşfet' },
} as const

export function SortableCardGrid({ locale, items }: { locale: Locale; items: SortableCardItem[] }) {
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const copy = COPY[locale]
  const language = locale === 'tr' ? 'tr-TR' : 'en-GB'

  const sorted = useMemo(() => {
    const next = [...items]
    if (sortMode === 'az') next.sort((a, b) => a.title.localeCompare(b.title, language, { sensitivity: 'base' }))
    return next
  }, [items, language, sortMode])

  if (items.length === 0) return null

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-paper-sunk/65 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.08em] text-fg-muted">{copy.sort}</span>
          <div className="inline-flex rounded-full border border-border/80 bg-white p-1 shadow-[0_5px_16px_rgba(35,35,38,0.04)]" role="group" aria-label={copy.sort}>
            <button type="button" aria-pressed={sortMode === 'popular'} onClick={() => setSortMode('popular')} className={`min-h-11 rounded-full px-4 text-sm font-bold transition ${sortMode === 'popular' ? 'bg-ink-surface text-fg-on-ink shadow-sm' : 'text-fg-muted hover:bg-paper hover:text-fg'}`}>{copy.popular}</button>
            <button type="button" aria-pressed={sortMode === 'az'} onClick={() => setSortMode('az')} className={`min-h-11 rounded-full px-4 text-sm font-bold transition ${sortMode === 'az' ? 'bg-ink-surface text-fg-on-ink shadow-sm' : 'text-fg-muted hover:bg-paper hover:text-fg'}`}>{copy.az}</button>
          </div>
        </div>
        {sortMode === 'popular' ? <p className="text-xs font-medium text-fg-muted">{copy.note}</p> : null}
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-border/70 bg-white no-underline shadow-[0_10px_32px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_20px_48px_rgba(35,35,38,0.10)]">
              {item.image !== undefined ? (
                <div className="overflow-hidden"><MediaFrame image={item.image ?? null} alt={item.imageAlt ?? item.title} decorative width={720} height={480} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[3/2] w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.045]" placeholderLabel={item.title} /></div>
              ) : null}
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                {item.meta ? <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{item.meta}</p> : null}
                <h3 className="mt-1.5 text-xl font-bold text-fg">{item.title}</h3>
                {item.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-muted">{item.excerpt}</p> : null}
                <span aria-hidden="true" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">{copy.explore} <span className="transition-transform duration-200 group-hover:translate-x-1">→</span></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
