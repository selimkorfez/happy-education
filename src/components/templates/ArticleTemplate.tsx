import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { PortableText, extractHeadings } from '@/components/content/PortableText'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { CardGrid } from './shared'
import { ArticleSchema } from '@/components/seo/ArticleSchema'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { formatDate } from '@/lib/format'
import type { ArticleDoc } from '@/lib/sanity/queries/content'

/**
 * Article page.
 *
 * Reads as a publication rather than a marketing page: a measured column, a real
 * byline where one exists, and dates and sources on show. The eighteen legacy
 * Turkish articles are the strongest content the business owns, so this template
 * exists to give them a proper home.
 *
 * The author byline appears only when the person has consent recorded. There is no
 * fallback to a generic "Happy Education Team" byline, because an invented author
 * is a fabricated E-E-A-T signal.
 */
export function ArticleTemplate({ locale, doc }: { locale: Locale; doc: ArticleDoc }) {
  const copy = COPY[locale]
  const headings = doc.showTableOfContents ? extractHeadings(doc.body) : []
  const showAuthor = Boolean(doc.author?.name && doc.author.consentOnFile)

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.insights'), href: sectionPath(locale, 'insights') },
    { label: doc.title },
  ]

  return (
    <>
      <ArticleSchema locale={locale} doc={doc} />

      <Container>
        <Breadcrumbs locale={locale} crumbs={crumbs} />
      </Container>

      <article>
        <Container>
          <header className="max-w-[46rem] pb-8">
            {doc.category ? (
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
                {doc.category.title}
              </p>
            ) : null}

            <h1 className="mt-3 font-display text-[length:var(--text-4xl)] font-semibold leading-tight text-fg">
              {doc.title}
            </h1>

            {doc.excerpt ? (
              <p className="mt-5 text-lg leading-relaxed text-fg-muted">{doc.excerpt}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5 text-sm text-fg-muted">
              {showAuthor ? (
                <span>
                  {doc.author?.name}
                  {doc.author?.role ? `, ${doc.author.role}` : ''}
                </span>
              ) : null}
              {doc.publishedAt ? (
                <time dateTime={doc.publishedAt}>{formatDate(doc.publishedAt, locale)}</time>
              ) : null}
              {doc.readingMinutes ? (
                <span>
                  {doc.readingMinutes} {t(locale, 'common.readingTime')}
                </span>
              ) : null}
            </div>
          </header>
        </Container>

        {doc.leadImage ? (
          <Container width="wide">
            <MediaFrame
              image={doc.leadImage}
              alt={doc.leadImage.alt ?? doc.title}
              width={1600}
              height={900}
              priority
              sizes="(max-width: 1024px) 100vw, 78rem"
              className="aspect-[16/9] w-full"
              placeholderLabel={`Article lead image: ${doc.title}`}
            />
          </Container>
        ) : null}

        <Container>
          <div className="grid gap-12 py-10 lg:grid-cols-12">
            {headings.length > 2 ? (
              <nav aria-labelledby="toc-heading" className="lg:order-2 lg:col-span-4">
                <div className="sticky top-32 border border-border p-5">
                  <h2
                    id="toc-heading"
                    className="text-sm font-semibold uppercase tracking-[0.06em] text-fg"
                  >
                    {copy.contents}
                  </h2>
                  <ol className="mt-4 space-y-2 text-sm">
                    {headings.map((heading) => (
                      <li key={heading.id}>
                        <a
                          href={`#${heading.id}`}
                          className="text-fg-muted underline-offset-4 hover:text-fg hover:underline"
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              </nav>
            ) : null}

            <div className={headings.length > 2 ? 'lg:order-1 lg:col-span-8' : 'lg:col-span-9'}>
              <PortableText value={doc.body} locale={locale} />

              {doc.tags && doc.tags.length > 0 ? (
                <ul className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
                  {doc.tags.map((tag) => (
                    <li key={tag} className="border border-border px-2.5 py-1 text-xs text-fg-muted">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}

              <ReviewMeta
                locale={locale}
                review={doc.review}
                published={doc.publishedAt}
                updated={doc.updatedAt}
                className="mt-10"
              />
            </div>
          </div>
        </Container>
      </article>

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />

      {doc.relatedDestinations && doc.relatedDestinations.length > 0 ? (
        <section className="border-t border-border py-10">
          <Container>
            <h2 className="font-display text-xl font-semibold text-fg">{copy.relatedDestinations}</h2>
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {doc.relatedDestinations.map((dest) => (
                <li key={dest.slug}>
                  <Link
                    href={docPath(locale, 'universities', dest.slug)}
                    className="border border-border px-3 py-1.5 text-brand-strong no-underline hover:bg-paper-sunk"
                  >
                    {dest.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border py-14">
          <Container>
            <h2 className="font-display text-[length:var(--text-3xl)] font-semibold text-fg">
              {copy.keepReading}
            </h2>
            <div className="mt-8">
              <CardGrid
                items={doc.relatedArticles.map((a) => ({
                  href: docPath(locale, 'insights', a.slug),
                  title: a.title,
                  excerpt: a.excerpt,
                  image: a.leadImage ?? null,
                }))}
              />
            </div>
          </Container>
        </section>
      ) : null}

      <ConsultationBand locale={locale} />
    </>
  )
}

const COPY = {
  en: { contents: 'On this page', keepReading: 'Keep reading', relatedDestinations: 'Related destinations' },
  tr: { contents: 'Bu sayfada', keepReading: 'Okumaya devam edin', relatedDestinations: 'İlgili ülkeler' },
} as const
