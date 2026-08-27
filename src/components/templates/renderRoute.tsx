import type { ReactElement } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { ResolvedRoute } from '@/lib/routing'
import { StarterAwareSectionIndexTemplate } from './StarterAwareSectionIndexTemplate'
import { DestinationTemplate } from './DestinationTemplate'
import { InstitutionTemplate } from './InstitutionTemplate'
import { SummerListingTemplate } from './SummerListingTemplate'
import { SummerProgrammeTemplate } from './SummerProgrammeTemplate'
import { TourTemplate } from './TourTemplate'
import { ArticleTemplate } from './ArticleTemplate'
import { ProseTemplate } from './ProseTemplate'
import { LegalTemplate } from './LegalTemplate'
import { FixedPageTemplate } from './FixedPageTemplate'

/**
 * Maps a resolved route to its template.
 *
 * The switch is exhaustive over `ResolvedRoute`, so adding a route kind without a
 * template is a compile error rather than a blank page.
 */
export function renderRoute(locale: Locale, route: ResolvedRoute): ReactElement {
  switch (route.kind) {
    case 'sectionIndex':
      return <StarterAwareSectionIndexTemplate locale={locale} section={route.section} />
    case 'destination':
      return <DestinationTemplate locale={locale} section={route.section} doc={route.doc} />
    case 'institution':
      return <InstitutionTemplate locale={locale} section={route.section} doc={route.doc} />
    case 'summerListing':
      return <SummerListingTemplate locale={locale} format={route.format} formatSlug={route.formatSlug} />
    case 'summerProgramme':
      return <SummerProgrammeTemplate locale={locale} doc={route.doc} formatSlug={route.formatSlug} />
    case 'tour':
      return <TourTemplate locale={locale} doc={route.doc} />
    case 'article':
      return <ArticleTemplate locale={locale} doc={route.doc} />
    case 'prose':
      return <ProseTemplate locale={locale} section={route.section} doc={route.doc} />
    case 'legal':
      return <LegalTemplate locale={locale} doc={route.doc} legalKey={route.legalKey} slug={route.slug} />
    case 'fixedPage':
      return <FixedPageTemplate locale={locale} pageKey={route.pageKey} doc={route.doc} />
  }
}
