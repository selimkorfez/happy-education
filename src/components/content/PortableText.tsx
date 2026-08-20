import { PortableText as PortableTextBase, type PortableTextComponents } from 'next-sanity'
import Link from 'next/link'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import { resolveInternalHref, safeExternalHref } from '@/lib/links'
import type { Locale } from '@/lib/i18n/config'

/**
 * Renders CMS rich text.
 *
 * There is no `dangerouslySetInnerHTML` anywhere in this file, and the schema has
 * no HTML or embed block, so no editor-supplied string is ever parsed as markup.
 * External hrefs still go through `safeExternalHref`, which drops anything that is
 * not http/https/mailto/tel — defence in depth against a value that predates the
 * schema validation, such as anything carried over from the WordPress import.
 *
 * Headings render as h2/h3/h4 only. The page template owns the single h1, so the
 * document outline cannot be broken from the CMS.
 */

interface Props {
  value: unknown
  locale: Locale
  /** Applies the constrained editorial measure. Turn off inside narrow columns. */
  constrained?: boolean
  className?: string
}

export function PortableText({ value, locale, constrained = true, className = '' }: Props) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null

  return (
    <div className={`${constrained ? 'prose-he' : ''} ${className}`}>
      <PortableTextBase value={value as never} components={components(locale)} />
    </div>
  )
}

function components(locale: Locale): PortableTextComponents {
  return {
    block: {
      // `id` lets the table of contents link to a heading.
      h2: ({ children, value }) => (
        <h2 id={headingId(value)} className="scroll-mt-28">
          {children}
        </h2>
      ),
      h3: ({ children, value }) => (
        <h3 id={headingId(value)} className="scroll-mt-28">
          {children}
        </h3>
      ),
      h4: ({ children }) => <h4 className="text-lg font-semibold">{children}</h4>,
      blockquote: ({ children }) => <blockquote>{children}</blockquote>,
      normal: ({ children }) => <p>{children}</p>,
    },

    marks: {
      internalLink: ({ children, value }) => {
        const href = resolveInternalHref(locale, value as { reference?: unknown })
        if (!href) return <>{children}</>
        return <Link href={href}>{children}</Link>
      },
      externalLink: ({ children, value }) => {
        const href = safeExternalHref((value as { href?: string })?.href)
        if (!href) return <>{children}</>
        return (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        )
      },
    },

    types: {
      imageWithMeta: ({ value }) => {
        const image = value as MediaSource & { alt?: string; decorative?: boolean }
        return (
          <MediaFrame
            image={image}
            alt={image.alt ?? ''}
            decorative={image.decorative ?? false}
            width={1000}
            height={640}
            sizes="(max-width: 768px) 100vw, 68ch"
            className="my-8 aspect-[16/10] w-full"
          />
        )
      },

      table: ({ value }) => {
        const table = value as {
          caption?: string
          headers?: string[]
          rows?: Array<{ cells?: string[] }>
          source?: { label?: string; url?: string; accessed?: string }
        }
        if (!table.headers?.length) return null

        return (
          <figure className="my-8">
            {/* Wide tables scroll inside their own container so the page body never does. */}
            <div className="scroll-x border border-border" tabIndex={0} role="group">
              <table>
                {table.caption ? (
                  <caption className="px-3 py-2 text-left text-sm text-fg-muted">
                    {table.caption}
                  </caption>
                ) : null}
                <thead>
                  <tr>
                    {table.headers.map((header, i) => (
                      <th key={i} scope="col">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(table.rows ?? []).map((row, r) => (
                    <tr key={r}>
                      {(row.cells ?? []).map((cell, c) =>
                        // First cell of each row acts as the row header.
                        c === 0 ? (
                          <th key={c} scope="row" className="font-medium">
                            {cell}
                          </th>
                        ) : (
                          <td key={c}>{cell}</td>
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {table.source?.url ? (
              <figcaption className="mt-2 text-xs text-fg-muted">
                {locale === 'tr' ? 'Kaynak' : 'Source'}:{' '}
                <a
                  href={safeExternalHref(table.source.url) ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {table.source.label ?? table.source.url}
                </a>
                {table.source.accessed ? ` (${table.source.accessed})` : null}
              </figcaption>
            ) : null}
          </figure>
        )
      },

      callout: ({ value }) => {
        const callout = value as { tone?: string; body?: unknown }
        const tone = callout.tone ?? 'note'
        const styles: Record<string, string> = {
          note: 'border-border bg-paper-sunk',
          important: 'border-warning bg-paper-sunk',
          official: 'border-focus bg-paper-sunk',
        }
        const labels: Record<string, Record<Locale, string>> = {
          note: { en: 'Note', tr: 'Not' },
          important: { en: 'Important', tr: 'Önemli' },
          official: { en: 'Official guidance', tr: 'Resmî kaynak' },
        }
        return (
          <aside className={`my-7 border-l-2 p-4 ${styles[tone] ?? styles.note}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-fg-muted">
              {labels[tone]?.[locale] ?? labels.note?.[locale]}
            </p>
            <div className="mt-1.5">
              <PortableText value={callout.body} locale={locale} constrained={false} />
            </div>
          </aside>
        )
      },
    },
  }
}

/** Stable anchor id derived from the heading text. */
export function headingId(value: unknown): string {
  const block = value as { children?: Array<{ text?: string }> }
  const text = (block?.children ?? []).map((c) => c.text ?? '').join(' ')
  return slugifyHeading(text)
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Extracts H2s for a table of contents. */
export function extractHeadings(value: unknown): Array<{ id: string; text: string }> {
  if (!Array.isArray(value)) return []
  return value
    .filter((block: unknown) => {
      const b = block as { _type?: string; style?: string }
      return b?._type === 'block' && b?.style === 'h2'
    })
    .map((block: unknown) => {
      const b = block as { children?: Array<{ text?: string }> }
      const text = (b.children ?? []).map((c) => c.text ?? '').join(' ').trim()
      return { id: slugifyHeading(text), text }
    })
    .filter((h) => h.text.length > 0)
}
