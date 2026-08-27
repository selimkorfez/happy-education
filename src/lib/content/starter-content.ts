import type { Locale, SectionKey } from '@/lib/i18n/config'
import type { DestinationDoc, ProseDoc } from '@/lib/sanity/queries/content'

/**
 * Safe starter content for routes that exist in the information architecture but
 * do not yet have an authored CMS/local document.
 *
 * These entries deliberately avoid fees, visa rules, rankings, partner claims,
 * application guarantees or other time-sensitive facts. They are a bridge for the
 * preview/authoring phase only; Sanity/local migrated content always wins first.
 */

function block(text: string) {
  return [
    {
      _type: 'block',
      _key: `starter-${text.slice(0, 18).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 'text', text, marks: [] }],
    },
  ]
}

type StarterDestination = {
  slug: string
  title: string
  intro: string
}

const EN_DESTINATIONS: Partial<Record<SectionKey, StarterDestination[]>> = {
  universities: [
    {
      slug: 'united-kingdom',
      title: 'Study in the United Kingdom',
      intro:
        'Explore university study in the UK and use this page as a starting point for choosing a course, location and application route that fits your plans.',
    },
    {
      slug: 'united-states',
      title: 'Study in the United States',
      intro:
        'Explore university study in the United States and the questions to consider when comparing institutions, locations and degree options.',
    },
    {
      slug: 'canada',
      title: 'Study in Canada',
      intro:
        'Explore university study in Canada and the practical decisions involved in comparing programmes, locations and application timelines.',
    },
    {
      slug: 'ireland',
      title: 'Study in Ireland',
      intro:
        'Explore university study in Ireland and the factors to compare when choosing a programme, institution and place to live.',
    },
    {
      slug: 'australia',
      title: 'Study in Australia',
      intro:
        'Explore university study in Australia and the main questions to work through when comparing courses, institutions and locations.',
    },
    {
      slug: 'new-zealand',
      title: 'Study in New Zealand',
      intro:
        'Explore university study in New Zealand and build a clear shortlist around your subject, preferred location and application plan.',
    },
  ],
  languageSchools: [
    {
      slug: 'united-kingdom',
      title: 'English courses in the United Kingdom',
      intro:
        'Compare English-language study options in the UK by city, course type, study length and the kind of experience you want outside the classroom.',
    },
    {
      slug: 'ireland',
      title: 'English courses in Ireland',
      intro:
        'Explore English-language study in Ireland and compare schools by location, course format, study length and your personal goals.',
    },
    {
      slug: 'united-states',
      title: 'English courses in the United States',
      intro:
        'Explore English-language study in the United States and compare options around your preferred city, course intensity and study goals.',
    },
    {
      slug: 'canada',
      title: 'English courses in Canada',
      intro:
        'Explore English-language study in Canada and compare locations, course formats and study lengths before building a shortlist.',
    },
    {
      slug: 'malta',
      title: 'English courses in Malta',
      intro:
        'Explore English-language study in Malta and compare course formats, school locations and the kind of study experience you are looking for.',
    },
    {
      slug: 'australia',
      title: 'English courses in Australia',
      intro:
        'Explore English-language study in Australia and compare schools by city, course type, study length and your longer-term plans.',
    },
  ],
}

export function listStarterDestinations(locale: Locale, section: SectionKey): DestinationDoc[] {
  if (locale !== 'en') return []
  return (EN_DESTINATIONS[section] ?? []).map((entry) => starterDestination(section, entry))
}

export function getStarterDestination(
  locale: Locale,
  section: SectionKey,
  slug: string,
): DestinationDoc | null {
  if (locale !== 'en') return null
  const entry = (EN_DESTINATIONS[section] ?? []).find((item) => item.slug === slug)
  return entry ? starterDestination(section, entry) : null
}

function starterDestination(section: SectionKey, entry: StarterDestination): DestinationDoc {
  const isUniversity = section === 'universities'
  return {
    _id: `starter-${section}-${entry.slug}`,
    title: entry.title,
    slug: entry.slug,
    locale: 'en',
    kind: 'country',
    section,
    intro: entry.intro,
    whyStudyHere: block(
      isUniversity
        ? 'The right destination depends on your subject, academic profile, preferred location, budget and longer-term plans. We can help you compare realistic options rather than start with a generic ranking list.'
        : 'The right language-school destination depends on your current level, study goals, preferred city, course intensity, accommodation preferences and how long you want to study.'
    ),
    applicationJourney: block(
      isUniversity
        ? 'A useful first step is to shortlist courses and institutions, check their current entry requirements directly, then plan documents and deadlines around the applications you decide to make.'
        : 'A useful first step is to decide what you want the course to achieve, compare suitable schools and dates, then confirm the current requirements and booking conditions before committing.'
    ),
    review: {
      lastReviewed: '2026-08-28',
      timeSensitive: false,
    },
  }
}

const STARTER_PROSE: Array<{
  locale: Locale
  type: 'guide' | 'service'
  slug: string
  title: string
  summary: string
  paragraphs: string[]
}> = [
  {
    locale: 'en',
    type: 'guide',
    slug: 'parent-guide',
    title: 'A parent’s guide to studying abroad',
    summary:
      'A practical starting point for families comparing overseas study options, costs, safeguarding, accommodation and the application process.',
    paragraphs: [
      'Start with the student rather than the destination. The most useful shortlist balances academic fit, independence, budget, preferred environment and the level of support the student is likely to need.',
      'Before paying a deposit, ask for the current programme details, accommodation arrangements, cancellation terms and the responsibilities of the school or provider. For younger students, safeguarding and supervision should be clear in writing.',
      'Build the timeline backwards from the intended start date. Leave enough time for applications, documents, payments, travel planning and any separate government requirements that may apply.',
      'Happy Education can help families organise the education and application side of the process. Where regulated immigration advice is required, use an appropriately regulated adviser and always check the relevant government guidance.',
    ],
  },
  {
    locale: 'tr',
    type: 'guide',
    slug: 'veli-rehberi',
    title: 'Veliler için yurt dışı eğitim rehberi',
    summary:
      'Yurt dışı eğitim seçeneklerini, bütçeyi, konaklamayı, güvenliği ve başvuru sürecini karşılaştıran aileler için pratik bir başlangıç rehberi.',
    paragraphs: [
      'Ülkeden önce öğrenciden başlayın. Sağlıklı bir kısa liste; akademik uyumu, öğrencinin bağımsızlık düzeyini, bütçeyi, tercih edilen yaşam ortamını ve ihtiyaç duyacağı desteği birlikte değerlendirir.',
      'Herhangi bir ödeme yapmadan önce programın güncel içeriğini, konaklama düzenini, iptal koşullarını ve okul ya da sağlayıcının sorumluluklarını yazılı olarak kontrol edin. Küçük yaştaki öğrenciler için gözetim ve güvenlik düzenlemeleri özellikle açık olmalıdır.',
      'Takvimi hedeflenen başlangıç tarihinden geriye doğru planlayın. Başvurular, belgeler, ödemeler, seyahat düzeni ve varsa ayrı resmî işlemler için yeterli süre bırakın.',
      'Happy Education eğitim ve başvuru sürecinin organizasyonunda yardımcı olabilir. Düzenlemeye tabi göçmenlik danışmanlığı gereken durumlarda yetkili bir danışmana başvurun ve ilgili devlet kurumunun güncel resmî bilgilerini kontrol edin.',
    ],
  },
]

export function getStarterProse(
  locale: Locale,
  slug: string,
  type: 'guide' | 'service',
): ProseDoc | null {
  const entry = STARTER_PROSE.find((item) => item.locale === locale && item.slug === slug && item.type === type)
  if (!entry) return null

  return {
    _id: `starter-${type}-${locale}-${slug}`,
    title: entry.title,
    slug: entry.slug,
    locale,
    summary: entry.summary,
    body: entry.paragraphs.flatMap((paragraph) => block(paragraph)),
    review: {
      lastReviewed: '2026-08-28',
      timeSensitive: false,
    },
  }
}

export function listStarterProse(locale: Locale, type: 'guide' | 'service') {
  return STARTER_PROSE
    .filter((item) => item.locale === locale && item.type === type)
    .map((item) => ({ title: item.title, slug: item.slug, summary: item.summary }))
}
