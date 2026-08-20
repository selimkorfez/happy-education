import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { PortableText } from '@/components/content/PortableText'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { sectionPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import type { ProseDoc } from '@/lib/sanity/queries/content'

/** Student guides and service pages: a single measured column of editorial prose. */
export function ProseTemplate({
  locale,
  section,
  doc,
}: {
  locale: Locale
  section: SectionKey
  doc: ProseDoc
}) {
  const sectionCopy = SECTION_COPY[section]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: sectionCopy?.title[locale] ?? section, href: sectionPath(locale, section) },
    { label: doc.title },
  ]

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={sectionCopy?.title[locale]}
        title={doc.title}
        intro={doc.summary ?? doc.intro}
        image={doc.heroImage ?? null}
        imageAlt={doc.heroImage?.alt ?? doc.title}
      />
      <Container>
        <div className="py-12">
          <PortableText value={doc.body} locale={locale} />
          <ReviewMeta locale={locale} review={doc.review} className="mt-10 max-w-[68ch]" />
        </div>
      </Container>
      <FaqSection locale={locale} faqs={doc.faqs ?? []} />
      <ConsultationBand locale={locale} />
    </>
  )
}
