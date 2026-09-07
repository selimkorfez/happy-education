import type { ReactElement } from 'react'
import type { Locale } from '@/lib/i18n/config'
import type { ResolvedRoute } from '@/lib/routing'
import { StarterAwareSectionIndexTemplate } from './StarterAwareSectionIndexTemplate'
import { StarterAwareDestinationTemplate } from './StarterAwareDestinationTemplate'
import { InstitutionTemplate } from './InstitutionTemplate'
import { StarterAwareSummerListingTemplate } from './StarterAwareSummerListingTemplate'
import { SummerProgrammeTemplate } from './SummerProgrammeTemplate'
import { TourTemplate } from './TourTemplate'
import { ArticleTemplate } from './ArticleTemplate'
import { SocialContentTemplate, StudentStoriesTemplate } from './CommunityTemplates'
import { ProseTemplate } from './ProseTemplate'
import { LegalTemplate } from './LegalTemplate'
import { FixedPageTemplate } from './FixedPageTemplate'

/** Maps a resolved route to its template. */
export function renderRoute(locale: Locale, route: ResolvedRoute): ReactElement {
  switch (route.kind) {
    case 'sectionIndex':
      return <StarterAwareSectionIndexTemplate locale={locale} section={route.section} />
    case 'destination':
      return <StarterAwareDestinationTemplate locale={locale} section={route.section} doc={route.doc} />
    case 'institution':
      return <InstitutionTemplate locale={locale} section={route.section} doc={route.doc} />
    case 'summerListing':
      return (
        <StarterAwareSummerListingTemplate
          locale={locale}
          format={route.format}
          formatSlug={route.formatSlug}
        />
      )
    case 'summerProgramme':
      return <SummerProgrammeTemplate locale={locale} doc={route.doc} formatSlug={route.formatSlug} />
    case 'tour':
      return <TourTemplate locale={locale} doc={route.doc} />
    case 'article':
      return <ArticleTemplate locale={locale} doc={route.doc} />
    case 'socialHub':
      return <SocialContentTemplate locale={locale} posts={route.posts} />
    case 'studentStories':
      return <StudentStoriesTemplate locale={locale} testimonials={route.testimonials} />
    case 'prose':
      return <ProseTemplate locale={locale} section={route.section} doc={route.doc} />
    case 'legal':
      return <LegalTemplate locale={locale} doc={route.doc} legalKey={route.legalKey} slug={route.slug} />
    case 'fixedPage':
      return <FixedPageTemplate locale={locale} pageKey={route.pageKey} doc={route.doc} />
  }
}
