import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import { PortableText } from '@/components/content/PortableText'
import { safeExternalHref } from '@/lib/links'
import type { SourcedFact } from '@/lib/sanity/queries/content'
import type { Locale } from '@/lib/i18n/config'

/**
 * Building blocks shared by the content templates.
 *
 * Kept here rather than duplicated per template so the destination, institution and
 * programme pages present the same information in the same way.
 */

/** A titled prose section. Renders nothing when the body is empty. */
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
    <section id={id} className="scroll-mt-28 border-t border-border py-10 first:border-t-0">
      <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">{title}</h2>
      <div className="mt-4">
        <PortableText value={body} locale={locale} />
      </div>
    </section>
  )
}

/**
 * A table of sourced facts.
 *
 * Every row can carry its own source, because a fees table where one figure is
 * current and another is three years old is worse than no table at all.
 */
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
    <section className="border-t border-border py-10">
      <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">{title}</h2>
      <div className="scroll-x mt-5 border border-border" tabIndex={0} role="group" aria-label={title}>
        <table className="text-sm">
          <tbody>
            {rows.map((fact, index) => (
              <tr key={index}>
                <th scope="row" className="w-[42%] bg-paper-sunk font-medium">
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
                      className="mt-1 block text-xs text-brand-strong underline underline-offset-2"
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

/** A short list of key/value details, used in institution and programme sidebars. */
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
    <div className="border border-border bg-paper-sunk p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">{title}</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((item) => (
          <div key={item.label}>
            <dt className="text-fg-muted">{item.label}</dt>
            <dd className="mt-0.5 font-medium text-fg">
              {Array.isArray(item.value) ? item.value.join(', ') : item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** A plain inclusion/exclusion pair. Not a checkmark-bullet wall. */
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
    <section className="border-t border-border py-10">
      <div className="grid gap-8 sm:grid-cols-2">
        {inc.length > 0 ? (
          <div>
            <h2 className="font-display text-xl font-semibold text-fg">
              {locale === 'tr' ? 'Fiyata dâhil' : "What's included"}
            </h2>
            <ul className="mt-4 space-y-2 text-base text-fg-muted">
              {inc.map((item) => (
                <li key={item} className="border-b border-border pb-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {exc.length > 0 ? (
          <div>
            <h2 className="font-display text-xl font-semibold text-fg">
              {locale === 'tr' ? 'Fiyata dâhil değil' : 'Not included'}
            </h2>
            <ul className="mt-4 space-y-2 text-base text-fg-muted">
              {exc.map((item) => (
                <li key={item} className="border-b border-border pb-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

/** Card list used by every index page. */
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
    <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="group block no-underline">
            {item.image !== undefined ? (
              <MediaFrame
                image={item.image ?? null}
                alt={item.imageAlt ?? item.title}
                decorative
                width={640}
                height={420}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="aspect-[3/2] w-full"
                placeholderLabel={item.title}
              />
            ) : null}
            {item.meta ? (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.06em] text-brand-strong">
                {item.meta}
              </p>
            ) : null}
            <h3 className="mt-1.5 font-display text-xl font-semibold text-fg underline-offset-[6px] group-hover:underline group-hover:decoration-brand group-hover:decoration-2">
              {item.title}
            </h3>
            {item.excerpt ? (
              <p className="mt-2 text-base leading-relaxed text-fg-muted">{item.excerpt}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** Shown when a section has no published content in this locale yet. */
export function EmptySection({ locale, contactHref }: { locale: Locale; contactHref: string }) {
  return (
    <Container>
      <div className="border border-border bg-paper-sunk p-8">
        <h2 className="font-display text-xl font-semibold text-fg">
          {locale === 'tr' ? 'Bu bölüm hazırlanıyor' : 'This section is being prepared'}
        </h2>
        <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-fg-muted">
          {locale === 'tr'
            ? 'Bu bölümdeki içerikleri yayına hazırlıyoruz. Bu sırada aradığınızı bulmanıza yardımcı olabiliriz.'
            : 'We are preparing the content for this section. In the meantime we can help you find what you are looking for.'}
        </p>
        <Link
          href={contactHref}
          className="mt-5 inline-flex min-h-11 items-center rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white no-underline hover:bg-brand-pressed"
        >
          {locale === 'tr' ? 'Bize ulaşın' : 'Get in touch'}
        </Link>
      </div>
    </Container>
  )
}
