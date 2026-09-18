import type { StructureBuilder, StructureResolver } from 'sanity/structure'

/** Mirrors the website menu so non-technical editors know where every item appears. */
export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Happy Education website')
    .items([
      S.listItem()
        .title('Start here — brand, homepage & contact')
        .child(
          S.document()
            .title('Brand, homepage & global content')
            .schemaType('siteSettings')
            .documentId('siteSettings'),
        ),

      S.listItem()
        .title('Main website pages')
        .child(
          S.list()
            .title('Main website pages')
            .items([
              pageList(S, 'English pages', 'en'),
              pageList(S, 'Türkçe sayfalar', 'tr'),
            ]),
        ),

      S.divider(),
      sectionWorkspace(S, 'Universities', 'universities', 'institution', 'universities'),
      sectionWorkspace(S, 'Language schools', 'languageSchools', 'languageSchool', 'language schools'),
      boardingWorkspace(S),
      summerWorkspace(S),
      simpleWorkspace(S, 'Tours', 'tour'),

      S.divider(),
      S.listItem()
        .title('Articles, guides & services')
        .child(
          S.list()
            .title('Articles, guides & services')
            .items([
              fixedPageList(S, 'Articles landing page', 'insights'),
              localePair(S, 'Blog articles', 'article'),
              fixedPageList(S, 'Student guides landing page', 'guides'),
              localePair(S, 'Student guides', 'guide'),
              fixedPageList(S, 'Services landing page', 'services'),
              localePair(S, 'Services', 'service'),
              S.divider(),
              localePair(S, 'Article categories', 'category'),
              S.documentTypeListItem('author').title('Authors'),
            ]),
        ),

      S.listItem()
        .title('Social content & student stories')
        .child(
          S.list()
            .title('Social content & student stories')
            .items([
              localePair(S, 'Social stories', 'socialPost'),
              localePair(S, 'Student experiences', 'testimonial'),
            ]),
        ),

      S.listItem()
        .title('People, offices & partners')
        .child(
          S.list()
            .title('People, offices & partners')
            .items([
              S.documentTypeListItem('teamMember').title('Team members'),
              S.documentTypeListItem('office').title('Offices'),
              S.documentTypeListItem('partner').title('Partner institutions'),
            ]),
        ),

      S.listItem()
        .title('Bookings & payments')
        .child(
          S.list()
            .title('Bookings & payments')
            .items([
              S.documentTypeListItem('appointmentType').title('Appointment types'),
              S.documentTypeListItem('paymentService').title('Payable services'),
            ]),
        ),

      S.divider(),
      reviewWorkspace(S),
      S.listItem()
        .title('Technical & redirects')
        .child(
          S.list()
            .title('Technical & redirects')
            .items([
              S.documentTypeListItem('redirect').title('Redirects'),
              S.documentTypeListItem('translationGroup').title('Translation links'),
            ]),
        ),
    ])

function sectionWorkspace(
  S: StructureBuilder,
  title: string,
  section: string,
  documentType: string,
  documentLabel: string,
) {
  return S.listItem()
    .title(title)
    .child(
      S.list()
        .title(title)
        .items([
          fixedPageList(S, `${title} landing page`, section),
          destinationList(S, 'English country & city pages', section, 'en'),
          destinationList(S, 'Türkçe ülke ve şehir sayfaları', section, 'tr'),
          S.divider(),
          typedList(S, `English ${documentLabel}`, documentType, 'en'),
          typedList(S, `Türkçe ${documentLabel}`, documentType, 'tr'),
        ]),
    )
}

function boardingWorkspace(S: StructureBuilder) {
  return S.listItem()
    .title('Boarding schools')
    .child(
      S.list()
        .title('Boarding schools')
        .items([
          fixedPageList(S, 'Landing page copy', 'boardingSchools'),
          typedList(S, 'English boarding schools', 'boardingSchool', 'en'),
          typedList(S, 'Türkçe yatılı okullar', 'boardingSchool', 'tr'),
          S.divider(),
          destinationList(S, 'English country & city pages', 'boardingSchools', 'en'),
          destinationList(S, 'Türkçe ülke ve şehir sayfaları', 'boardingSchools', 'tr'),
        ]),
    )
}

function summerWorkspace(S: StructureBuilder) {
  return S.listItem()
    .title('Summer schools')
    .child(
      S.list()
        .title('Summer schools')
        .items([
          fixedPageList(S, 'Main summer-schools landing page', 'summerSchools'),
          fixedPageList(S, 'Individual landing pages', 'summerIndividual'),
          fixedPageList(S, 'Group landing pages', 'summerGroup'),
          S.divider(),
          summerList(S, 'English individual programmes', 'en', 'individual'),
          summerList(S, 'Türkçe bireysel programlar', 'tr', 'individual'),
          summerList(S, 'English group programmes', 'en', 'group'),
          summerList(S, 'Türkçe grup programları', 'tr', 'group'),
          S.divider(),
          destinationList(S, 'English country & city pages', 'summerSchools', 'en'),
          destinationList(S, 'Türkçe ülke ve şehir sayfaları', 'summerSchools', 'tr'),
        ]),
    )
}

function simpleWorkspace(S: StructureBuilder, title: string, type: string) {
  return S.listItem()
    .title(title)
    .child(
      S.list()
        .title(title)
        .items([
          ...(type === 'tour' ? [fixedPageList(S, 'Tours landing page', 'tours')] : []),
          typedList(S, `English ${title.toLowerCase()}`, type, 'en'),
          typedList(S, `Türkçe ${title.toLocaleLowerCase('tr-TR')}`, type, 'tr'),
        ]),
    )
}

function localePair(S: StructureBuilder, title: string, type: string) {
  return S.listItem()
    .title(title)
    .child(
      S.list()
        .title(title)
        .items([
          typedList(S, 'English', type, 'en'),
          typedList(S, 'Türkçe', type, 'tr'),
        ]),
    )
}

function typedList(S: StructureBuilder, title: string, type: string, locale: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType(type)
        .filter('_type == $type && locale == $locale')
        .params({ type, locale })
        .apiVersion('2026-08-01')
        .initialValueTemplates([S.initialValueTemplateItem(`${type}-${locale}`)]),
    )
}

function destinationList(S: StructureBuilder, title: string, section: string, locale: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType('destination')
        .filter('_type == "destination" && locale == $locale && section == $section')
        .params({ locale, section })
        .apiVersion('2026-08-01')
        .initialValueTemplates([
          S.initialValueTemplateItem(`destination-${section}-${locale}`),
        ]),
    )
}

function summerList(
  S: StructureBuilder,
  title: string,
  locale: string,
  format: 'individual' | 'group',
) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType('summerProgramme')
        .filter('_type == "summerProgramme" && locale == $locale && format == $format')
        .params({ locale, format })
        .apiVersion('2026-08-01')
        .initialValueTemplates([
          S.initialValueTemplateItem(`summerProgramme-${format}-${locale}`),
        ]),
    )
}

function pageList(S: StructureBuilder, title: string, locale: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType('page')
        .filter('_type == "page" && locale == $locale')
        .params({ locale })
        .apiVersion('2026-08-01'),
    )
}

function fixedPageList(S: StructureBuilder, title: string, pageKey: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType('page')
        .filter('_type == "page" && pageKey == $pageKey')
        .params({ pageKey })
        .apiVersion('2026-08-01')
        .initialValueTemplates([
          S.initialValueTemplateItem(`page-${pageKey}-en`),
          S.initialValueTemplateItem(`page-${pageKey}-tr`),
        ]),
    )
}

function reviewWorkspace(S: StructureBuilder) {
  return S.listItem()
    .title('Review & publishing checks')
    .child(
      S.list()
        .title('Review & publishing checks')
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
          S.listItem()
            .title('Time-sensitive content missing a source')
            .child(
              S.documentList()
                .title('Time-sensitive content missing a source')
                .filter('review.timeSensitive == true && count(review.sources) == 0')
                .apiVersion('2026-08-01'),
            ),
          S.listItem()
            .title('Images awaiting licence clearance')
            .child(
              S.documentList()
                .title('Images awaiting licence clearance')
                .filter(`
                  (defined(heroImage.asset) && heroImage.licence.cleared != true)
                  || (defined(leadImage.asset) && leadImage.licence.cleared != true)
                  || (defined(thumbnail.asset) && thumbnail.licence.cleared != true)
                  || (defined(photo.asset) && photo.licence.cleared != true)
                  || (
                    _type == "siteSettings"
                    && (
                      (defined(homeHero.image.asset) && homeHero.image.licence.cleared != true)
                      || count(routeFinder.items[defined(image.asset) && image.licence.cleared != true]) > 0
                    )
                  )
                `)
                .apiVersion('2026-08-01'),
            ),
          S.listItem()
            .title('Pages that can break a public URL')
            .child(
              S.documentList()
                .title('Fix before publishing')
                .filter(`
                  !defined(locale)
                  || !defined(slug.current)
                  || (_type == "page" && !defined(pageKey))
                  || (
                    _type in [
                      "destination", "institution", "languageSchool", "boardingSchool",
                      "summerProgramme", "tour", "article", "guide", "service", "page", "legalPage"
                    ]
                    && !defined(translationGroup._ref)
                  )
                `)
                .apiVersion('2026-08-01'),
            ),
          S.listItem()
            .title('Brand pages without a country')
            .child(
              S.documentList()
                .title('Check whether these are genuinely multi-location')
                .filter('_type in ["institution", "languageSchool"] && !defined(destination._ref)')
                .apiVersion('2026-08-01'),
            ),
          S.listItem()
            .title('Turkish content missing an English version')
            .child(
              S.documentList()
                .title('Missing English version')
                .filter(`
                  locale == "tr"
                  && defined(translationGroup._ref)
                  && !(translationGroup._ref in *[locale == "en" && defined(translationGroup._ref)].translationGroup._ref)
                `)
                .apiVersion('2026-08-01'),
            ),
          S.listItem()
            .title('English content missing a Turkish version')
            .child(
              S.documentList()
                .title('Missing Turkish version')
                .filter(`
                  locale == "en"
                  && defined(translationGroup._ref)
                  && !(translationGroup._ref in *[locale == "tr" && defined(translationGroup._ref)].translationGroup._ref)
                `)
                .apiVersion('2026-08-01'),
            ),
        ]),
    )
}
