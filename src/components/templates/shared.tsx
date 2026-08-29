import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import { PortableText } from '@/components/content/PortableText'
import { safeExternalHref } from '@/lib/links'
import type { SourcedFact } from '@/lib/sanity/queries/content'
import type { Locale } from '@/lib/i18n/config'

export function ProseSection({
  id,
  title,
  body,
  locale,
}: {
  id?: string
  title: string
  body: unknown
  locale: Locale
}) {
  if (!body || (Array.isArray(body) && body.length === 0)) return null
  return (
    <section id={id} className="scroll-mt-28 border-t border-border/70 py-10 first:border-t-0 sm:py-12">
      <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr] lg:gap-12">
        <h2 className="text-[length:var(--text-2xl)] font-bold text-fg">{title}</h2>
        <div>
          <PortableText value={body} locale={locale} />
        </div>
      </div>
    </section>
  )
}

export function FactTable({
  title,
  facts,
  locale,
}: {
  title: string
  facts?: SourcedFact[] | null
  locale: Locale
}) {
  const rows = (facts ?? []).filter((f) => f.label && f.value)
  if (rows.length === 0) return null

  return (
    <section className="border-t border-border/70 py-10 sm:py-12">
      <h2 className="text-[length:var(--text-2xl)] font-bold text-fg">{title}</h2>
      <div className="scroll-x mt-6 overflow-hidden rounded-[1.25rem] border border-border/80 bg-white shadow-[0_12px_34px_rgba(35,35,38,0.055)]" tabIndex={0} role="group" aria-label={title}>
        <table className="text-sm">
          <tbody>
            {rows.map((fact, index) => (
              <tr key={index}>
                <th scope="row" className="w-[42%] bg-paper-sunk font-semibold">
                  {fact.label}
                </th>
                <td>
                  {fact.value}
                  {fact.note ? <span className="block text-fg-muted">{fact.note}</span> : null}
                  {fact.source?.url ? (
                    <a
                      href={safeExternalHref(fact.source.url) ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-xs font-semibold text-brand-strong underline underline-offset-2"
                    >
                      {fact.source.label ?? (locale === 'tr' ? 'Kaynak' : 'Source')}
                      {fact.source.accessed ? ` (${fact.source.accessed})` : ''}
                    </a>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function DetailList({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; value: string | string[] | number | undefined }>
}) {
  const rows = items.filter(
    (i) => i.value !== undefined && i.value !== '' && (!Array.isArray(i.value) || i.value.length > 0),
  )
  if (rows.length === 0) return null

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-white p-5 shadow-[0_12px_32px_rgba(35,35,38,0.055)]">
      <span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{title}</span>
      <dl className="mt-5 space-y-4 text-sm">
        {rows.map((item) => (
          <div key={item.label} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
            <dt className="text-fg-muted">{item.label}</dt>
            <dd className="mt-1 font-bold text-fg">
              {Array.isArray(item.value) ? item.value.join(', ') : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function IncludedExcluded({
  locale,
  included,
  excluded,
}: {
  locale: Locale
  included?: string[]
  excluded?: string[]
}) {
  const inc = included ?? []
  const exc = excluded ?? []
  if (inc.length === 0 && exc.length === 0) return null

  return (
    <section className="border-t border-border/70 py-10 sm:py-12">
      <div className="grid gap-5 sm:grid-cols-2">
        {inc.length > 0 ? (
          <div className="rounded-[1.3rem] border border-border/70 bg-mint-soft/70 p-6">
            <h2 className="text-xl font-bold text-fg">{locale === 'tr' ? 'Fiyata dâhil' : "What's included"}</h2>
            <ul className="mt-5 space-y-3 text-base text-fg-muted">
              {inc.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-success">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {exc.length > 0 ? (
          <div className="rounded-[1.3rem] border border-border/70 bg-paper-sunk p-6">
            <h2 className="text-xl font-bold text-fg">{locale === 'tr' ? 'Fiyata dâhil değil' : 'Not included'}</h2>
            <ul className="mt-5 space-y-3 text-base text-fg-muted">
              {exc.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-fg-muted">–</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function CardGrid({
  items,
}: {
  items: Array<{
    href: string
    title: string
    meta?: string
    excerpt?: string
    image?: MediaSource | null
    imageAlt?: string
  }>
}) {
  if (items.length === 0) return null
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-border/70 bg-white no-underline shadow-[0_10px_32px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_20px_48px_rgba(35,35,38,0.10)]"
          >
            {item.image !== undefined ? (
              <div className="overflow-hidden">
                <MediaFrame
                  image={item.image ?? null}
                  alt={item.imageAlt ?? item.title}
                  decorative
                  width={720}
                  height={480}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="aspect-[3/2] w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.045]"
                  placeholderLabel={item.title}
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              {item.meta ? (
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{item.meta}</p>
              ) : null}
              <h3 className="mt-1.5 text-xl font-bold text-fg">{item.title}</h3>
              {item.excerpt ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-muted">{item.excerpt}</p>
              ) : null}
              <span aria-hidden="true" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
                Explore <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function EmptySection({ locale, contactHref }: { locale: Locale; contactHref: string }) {
  return (
    <Container>
      <div className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-white p-8 shadow-[0_16px_45px_rgba(35,35,38,0.07)] sm:p-10">
        <div aria-hidden="true" className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-brand-soft" />
        <div className="relative max-w-[42rem]">
          <span className="inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">
            {locale === 'tr' ? 'Yakında' : 'Coming together'}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-fg">
            {locale === 'tr' ? 'Bu bölümü geliştiriyoruz' : 'We are building this section out'}
          </h2>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-fg-muted">
            {locale === 'tr'
              ? 'İçerik tamamlanırken aradığınız okul, program veya ülke hakkında doğrudan yardımcı olabiliriz.'
              : 'While the content is being expanded, we can still help you find the right school, programme or destination directly.'}
          </p>
          <Link
            href={contactHref}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-brand px-6 text-base font-bold text-fg no-underline shadow-[0_10px_24px_rgba(244,116,38,0.22)] transition hover:-translate-y-0.5"
          >
            {locale === 'tr' ? 'Bize ulaşın' : 'Ask us directly'} <span aria-hidden="true" className="ml-2">↗</span>
          </Link>
        </div>
      </div>
    </Container>
  )
}
