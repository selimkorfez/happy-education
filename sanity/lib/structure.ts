import type { StructureResolver } from 'sanity/structure'

/**
 * Studio navigation.
 *
 * Grouped the way the editorial team thinks about the site rather than as a flat
 * alphabetical list of document types. Publishing, university content and
 * programme content get first-class workspaces so routine editing never requires
 * hunting through the wider site tree.
 */
export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Happy Education')
    .items([
      S.listItem()
        .title('Site settings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      S.listItem()
        .title('Publishing')
        .child(
          S.list()
            .title('Publishing')
            .items([
              publishingLocale(S, 'English blog articles', 'article', 'en'),
              publishingLocale(S, 'Türkçe blog yazıları', 'article', 'tr'),
              S.divider(),
              publishingLocale(S, 'English social stories', 'socialPost', 'en'),
              publishingLocale(S, 'Türkçe sosyal hikâyeler', 'socialPost', 'tr'),
              S.divider(),
              publishingLocale(S, 'English student experiences', 'testimonial', 'en'),
              publishingLocale(S, 'Türkçe öğrenci deneyimleri', 'testimonial', 'tr'),
              S.divider(),
              S.documentTypeListItem('category').title('Article categories'),
              S.documentTypeListItem('author').title('Authors'),
            ]),
        ),

      S.listItem()
        .title('Universities & study content')
        .child(
          S.list()
            .title('Universities & study content')
            .items([
              publishingLocale(S, 'English universities', 'institution', 'en'),
              publishingLocale(S, 'Türkçe üniversiteler', 'institution', 'tr'),
              S.divider(),
              publishingLocale(S, 'English destination guides', 'destination', 'en'),
              publishingLocale(S, 'Türkçe destinasyon rehberleri', 'destination', 'tr'),
            ]),
        ),

      S.listItem()
        .title('Programmes & tours')
        .child(
          S.list()
            .title('Programmes & tours')
            .items([
              publishingLocale(S, 'English language schools', 'languageSchool', 'en'),
              publishingLocale(S, 'Türkçe dil okulları', 'languageSchool', 'tr'),
              S.divider(),
              publishingLocale(S, 'English boarding schools', 'boardingSchool', 'en'),
              publishingLocale(S, 'Türkçe yatılı okullar', 'boardingSchool', 'tr'),
              S.divider(),
              publishingLocale(S, 'English summer programmes', 'summerProgramme', 'en'),
              publishingLocale(S, 'Türkçe yaz programları', 'summerProgramme', 'tr'),
              S.divider(),
              publishingLocale(S, 'English tours', 'tour', 'en'),
              publishingLocale(S, 'Türkçe turlar', 'tour', 'tr'),
            ]),
        ),

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

      S.listItem()
        .title('Editorial review queues')
        .child(
          S.list()
            .title('Editorial review queues')
            .items([
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
            ]),
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
  ['socialPost', 'Social media stories'],
  ['testimonial', 'Student experiences'],
  ['guide', 'Student guides'],
  ['service', 'Services'],
  ['page', 'Pages'],
  ['legalPage', 'Legal pages'],
]

function publishingLocale(
  S: Parameters<StructureResolver>[0],
  title: string,
  type: string,
  locale: string,
) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .filter('_type == $type && locale == $locale')
        .params({ type, locale })
        .apiVersion('2026-08-01'),
    )
}

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
