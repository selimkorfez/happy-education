import type { StructureResolver } from 'sanity/structure'

/**
 * Studio navigation.
 *
 * Grouped the way the editorial team thinks about the site rather than as a flat
 * alphabetical list of twenty document types, and split by language at the top
 * level because the two trees are edited largely independently.
 */
export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Happy Education')
    .items([
      S.listItem()
        .title('Site settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      S.divider(),

      ...localeSection(S, 'Türkçe içerik', 'tr'),
      ...localeSection(S, 'English content', 'en'),

      S.divider(),

      S.listItem()
        .title('People and organisations')
        .child(
          S.list()
            .title('People and organisations')
            .items([
              S.documentTypeListItem('author').title('Authors'),
              S.documentTypeListItem('teamMember').title('Team members'),
              S.documentTypeListItem('office').title('Offices'),
              S.documentTypeListItem('partner').title('Partner institutions'),
              S.documentTypeListItem('testimonial').title('Student experiences'),
            ]),
        ),

      S.listItem()
        .title('Bookings and payments')
        .child(
          S.list()
            .title('Bookings and payments')
            .items([
              S.documentTypeListItem('appointmentType').title('Appointment types'),
              S.documentTypeListItem('paymentService').title('Payable services'),
            ]),
        ),

      S.listItem()
        .title('Technical')
        .child(
          S.list()
            .title('Technical')
            .items([
              S.documentTypeListItem('redirect').title('Redirects'),
              S.documentTypeListItem('translationGroup').title('Translation groups'),
            ]),
        ),

      S.divider(),

      // Editors need to find stale content without running a query.
      S.listItem()
        .title('Needs editorial review')
        .child(
          S.documentList()
            .title('Needs editorial review')
            .filter('defined(review.editorialFlag) && review.editorialFlag != ""')
            .apiVersion('2026-08-01'),
        ),

      S.listItem()
        .title('Review overdue')
        .child(
          S.documentList()
            .title('Review overdue')
            .filter('defined(review.nextReviewDue) && review.nextReviewDue < $today')
            .params({ today: new Date().toISOString().slice(0, 10) })
            .apiVersion('2026-08-01'),
        ),
    ])

const LOCALE_TYPES: Array<[string, string]> = [
  ['destination', 'Destinations'],
  ['institution', 'Universities'],
  ['languageSchool', 'Language schools'],
  ['boardingSchool', 'Boarding schools'],
  ['summerProgramme', 'Summer programmes'],
  ['tour', 'Tours'],
  ['article', 'Articles'],
  ['category', 'Categories'],
  ['guide', 'Student guides'],
  ['service', 'Services'],
  ['page', 'Pages'],
  ['legalPage', 'Legal pages'],
]

function localeSection(S: Parameters<StructureResolver>[0], title: string, locale: string) {
  return [
    S.listItem()
      .title(title)
      .child(
        S.list()
          .title(title)
          .items(
            LOCALE_TYPES.map(([type, label]) =>
              S.listItem()
                .title(label)
                .child(
                  S.documentList()
                    .title(`${label} — ${locale.toUpperCase()}`)
                    .filter('_type == $type && locale == $locale')
                    .params({ type, locale })
                    .apiVersion('2026-08-01')
                    .initialValueTemplates([]),
                ),
            ),
          ),
      ),
  ]
}
