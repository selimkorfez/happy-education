import type { ArticleDoc, ProseDoc, TourDoc } from '@/lib/sanity/queries/content'
import type { Locale } from '@/lib/i18n/config'

function blocks(paragraphs: string[]) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `starter-editorial-${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `text-${index}`, text, marks: [] }],
  }))
}

type ProseEntry = {
  type: 'guide' | 'service'
  slug: string
  title: string
  summary: string
  paragraphs: string[]
}

const EN_PROSE: ProseEntry[] = [
  {
    type: 'guide',
    slug: 'choose-a-university',
    title: 'How to choose a university abroad',
    summary: 'A practical way to build a shortlist around academic fit, location, budget and realistic entry requirements.',
    paragraphs: [
      'Start with the course, not the logo. Compare the modules, assessment style, practical opportunities and progression routes that matter for the subject you actually want to study.',
      'Then narrow by realistic entry requirements, location, total study cost and the kind of day-to-day environment you would be comfortable living in. A strong shortlist normally includes more than one level of competitiveness.',
      'Rankings can be one input, but they should not replace course fit or current entry information. Always check the university’s own published requirements before submitting an application.',
    ],
  },
  {
    type: 'guide',
    slug: 'university-application-timeline',
    title: 'University application timeline',
    summary: 'Plan course research, documents, applications, offers and pre-departure work without leaving everything to the final weeks.',
    paragraphs: [
      'Work backwards from the intended course start date. Give yourself a research phase, a document-preparation phase and enough time to respond to any requests from the institutions you apply to.',
      'Prepare core documents early: identification, academic records, any required English-language evidence and programme-specific material. Exact requirements differ by institution and course, so use the current official application instructions as the final checklist.',
      'After offers arrive, compare the conditions carefully before making payments or commitments. Accommodation, travel and any separate government processes should be planned as their own workstreams rather than treated as one final task.',
    ],
  },
  {
    type: 'guide',
    slug: 'language-school-guide',
    title: 'How to compare language schools',
    summary: 'Compare course intensity, location, class format, accommodation and study goals before choosing a language programme.',
    paragraphs: [
      'Define the outcome first. General English, exam preparation, academic English and intensive programmes solve different problems, so the right school depends on what you want to improve and how quickly.',
      'Compare the timetable, class structure, school location, accommodation options and what is included in the quoted price. Ask for current written terms before paying a deposit.',
      'A cheaper course is not automatically better value if the timetable, location or accommodation does not suit you. Compare the complete study plan rather than only the headline weekly price.',
    ],
  },
  {
    type: 'guide',
    slug: 'summer-school-guide',
    title: 'Summer school guide for families',
    summary: 'What to compare across supervised summer programmes, from lessons and activities to accommodation and safeguarding.',
    paragraphs: [
      'For younger students, compare the full programme rather than only the campus name. Lessons, accommodation, meals, supervision, activities, excursions and the age mix all shape the experience.',
      'Ask who is responsible for supervision at each stage, what the emergency process is and what parents need to provide. These arrangements should be available in writing before a booking is confirmed.',
      'Check the current cancellation terms and exactly what the programme fee includes. Travel, transfers, deposits and optional activities can be handled differently by different providers.',
    ],
  },
  {
    type: 'guide',
    slug: 'boarding-school-guide',
    title: 'Boarding school shortlist guide',
    summary: 'Build a shortlist around academics, pastoral support, boarding life, safeguarding and the student’s readiness for independence.',
    paragraphs: [
      'Academic fit matters, but boarding is also a living arrangement. Compare the curriculum, school culture, pastoral structure, weekend arrangements, boarding-house routine and the support available when a student needs help.',
      'Visit or speak with the school where possible and ask direct questions about supervision, communication with parents and how concerns are handled. Current admissions and safeguarding information should come from the school itself.',
      'The best option is the one that fits the student’s maturity and goals, not simply the most recognisable name.',
    ],
  },
  {
    type: 'guide',
    slug: 'study-abroad-budget',
    title: 'Planning a study-abroad budget',
    summary: 'Separate tuition, accommodation, everyday living, travel and one-off setup costs so the plan is realistic before you commit.',
    paragraphs: [
      'Start with the costs that are unavoidable: tuition or course fees, accommodation and the main travel required to begin the programme. Then add food, local transport, study materials, phone costs and a sensible contingency.',
      'Use current figures from the institution or provider for any fee you intend to rely on. Avoid building a plan around old blog posts or a single headline price that excludes compulsory extras.',
      'Keep a buffer for changes in exchange rates, deposits and unexpected travel. A realistic budget should show both the first-month setup cost and the normal monthly cost after arrival.',
    ],
  },
  {
    type: 'guide',
    slug: 'accommodation-guide',
    title: 'Student accommodation guide',
    summary: 'Questions to ask before choosing halls, residence, homestay or private accommodation abroad.',
    paragraphs: [
      'Compare the total arrangement, not just the weekly figure. Location, transport, contract length, meals, utilities, deposits and what happens during holidays can materially change the real cost.',
      'For younger students or homestays, clarify supervision and house rules in advance. For private accommodation, read the contract and understand payment and cancellation obligations before signing.',
      'Where an institution offers accommodation, use its current official information as the primary source for availability and conditions.',
    ],
  },
  {
    type: 'service',
    slug: 'university-application-support',
    title: 'University application support',
    summary: 'Course shortlisting, application planning and document organisation from first conversation to offer stage.',
    paragraphs: [
      'We help students turn a broad idea into a workable application plan: identifying suitable courses, organising the information each application needs and keeping track of the timeline.',
      'We can help review whether the application pack is complete and clearly presented, but the institution sets its own entry requirements and makes every admission decision.',
      'Where information changes, the university’s current published guidance is the final source of truth.',
    ],
  },
  {
    type: 'service',
    slug: 'language-school-placement',
    title: 'Language school placement',
    summary: 'Compare suitable language programmes and organise the school booking around your level, goals, dates and location preferences.',
    paragraphs: [
      'We help you compare course formats and locations, then organise the education-booking side once you have chosen a suitable option.',
      'Before payment, current course dates, accommodation, fees and cancellation terms should be confirmed with the provider. We do not treat an old price or timetable as current unless it has been re-verified.',
    ],
  },
  {
    type: 'service',
    slug: 'summer-school-placement',
    title: 'Summer school placement',
    summary: 'Programme comparison and booking support for individual and group summer-school options.',
    paragraphs: [
      'We help families compare age suitability, programme structure, accommodation, activities and the practical booking requirements across available options.',
      'The programme provider remains responsible for its on-site supervision, welfare and safeguarding arrangements. We encourage families to review those arrangements in writing before confirming a place.',
    ],
  },
  {
    type: 'service',
    slug: 'boarding-school-application-support',
    title: 'Boarding school application support',
    summary: 'Shortlisting and application organisation for families considering boarding education.',
    paragraphs: [
      'We help families structure the shortlist around academic fit, age, location and the student’s readiness for boarding, then organise the application information required by the schools selected.',
      'Schools control admissions, fees, availability, pastoral arrangements and safeguarding policies. Those details should be confirmed against current school information before commitment.',
    ],
  },
  {
    type: 'service',
    slug: 'application-document-review',
    title: 'Application document review',
    summary: 'A structured completeness check for the education-application documents you are preparing to submit.',
    paragraphs: [
      'We can help organise application documents, identify obvious gaps and make sure the pack follows the institution’s published instructions.',
      'This is an administrative and education-application support service. It does not replace professional advice where a separate regulated matter is involved.',
    ],
  },
  {
    type: 'service',
    slug: 'pre-departure-support',
    title: 'Pre-departure support',
    summary: 'A practical handover from confirmed study plans to accommodation, travel preparation and arrival organisation.',
    paragraphs: [
      'Once the education placement is confirmed, we help students organise the practical checklist around accommodation, provider communications, travel planning and the documents they should keep accessible for arrival.',
      'Government entry requirements are separate from the education placement and can change. Always use the current official government guidance for those requirements.',
    ],
  },
]

export function listEditorialProse(locale: Locale, type: 'guide' | 'service') {
  if (locale !== 'en') return []
  return EN_PROSE.filter((entry) => entry.type === type).map(({ title, slug, summary }) => ({ title, slug, summary }))
}

export function getEditorialProse(locale: Locale, type: 'guide' | 'service', slug: string): ProseDoc | null {
  if (locale !== 'en') return null
  const entry = EN_PROSE.find((item) => item.type === type && item.slug === slug)
  if (!entry) return null
  return {
    _id: `starter-${type}-en-${slug}`,
    title: entry.title,
    slug: entry.slug,
    locale: 'en',
    summary: entry.summary,
    body: blocks(entry.paragraphs),
    review: { lastReviewed: '2026-08-28', timeSensitive: false },
  }
}

type ArticleEntry = {
  slug: string
  title: string
  excerpt: string
  category: string
  paragraphs: string[]
}

const EN_ARTICLES: ArticleEntry[] = [
  {
    slug: 'course-fit-before-university-ranking',
    title: 'Choose course fit before chasing a university ranking',
    excerpt: 'A strong shortlist starts with what you will actually study, how you will be assessed and whether the course fits your goals.',
    category: 'University applications',
    paragraphs: [
      'University rankings are easy to compare because they reduce complicated institutions to a number. Your degree experience is not a number. The modules, teaching structure, assessment style and opportunities attached to the course will usually matter more to you day to day.',
      'Use rankings as one signal if they are relevant to your priorities, but check the course itself first. Read the module list, look at how optional subjects work and understand whether practical work, placements or research opportunities are built into the programme.',
      'Then test the shortlist against realistic entry requirements, location and total cost. A balanced application plan is more useful than a list built around prestige alone.',
    ],
  },
  {
    slug: 'university-application-checklist',
    title: 'A simple university application checklist',
    excerpt: 'The documents and decisions worth organising early so applications do not become a last-minute scramble.',
    category: 'University applications',
    paragraphs: [
      'Begin with the institution’s current requirements for the exact course you want. Requirements can vary across programmes at the same university, so a generic checklist is only a starting point.',
      'Organise identification, academic records, any required language evidence and programme-specific supporting material in a single working folder. Keep clear file names and track which version was submitted where.',
      'Before submitting, check names, dates, course choice and contact details carefully. After submission, monitor the email address used for the application so requests for additional information are not missed.',
    ],
  },
  {
    slug: 'how-to-compare-language-courses',
    title: 'How to compare language courses without looking only at price',
    excerpt: 'Course intensity, timetable, location and accommodation can matter as much as the headline weekly fee.',
    category: 'Language schools',
    paragraphs: [
      'Two courses with similar names can deliver very different study weeks. Compare lesson hours, timetable, class structure and whether the programme is designed for general improvement, an exam or an academic goal.',
      'Location affects both cost and experience. A cheaper school may require a longer commute or different accommodation arrangement, so compare the whole package rather than one number.',
      'Ask for current written prices and terms before booking. The useful comparison is the total cost of the study plan you actually intend to follow.',
    ],
  },
  {
    slug: 'summer-school-questions-for-parents',
    title: 'Questions parents should ask before booking a summer school',
    excerpt: 'Supervision, accommodation, activities and emergency arrangements deserve the same attention as the classroom programme.',
    category: 'Summer schools',
    paragraphs: [
      'Start by asking who is responsible for the student during lessons, free time, activities, excursions and overnight accommodation. The answer may involve different teams, so the arrangement should be clear in writing.',
      'Check the age range, room arrangements, meals, activity schedule and what happens if a student is unwell or needs support. Ask how parents are contacted in an emergency.',
      'Finally, review what is included in the fee and the cancellation terms. A good decision is based on the complete welfare and programme picture, not only the destination or campus name.',
    ],
  },
  {
    slug: 'boarding-school-shortlist',
    title: 'What belongs on a boarding-school shortlist?',
    excerpt: 'Academics are only one part of the decision when school and home become the same place.',
    category: 'Boarding schools',
    paragraphs: [
      'A boarding-school shortlist should consider curriculum and academic support alongside pastoral care, boarding-house life, weekend routines and the student’s independence.',
      'Ask how the school communicates with parents, what support is available outside lessons and how safeguarding responsibilities are structured. Current answers should come from the school, not from assumptions based on reputation.',
      'The most suitable school is the one where the student can realistically live and learn well, not automatically the one with the best-known name.',
    ],
  },
  {
    slug: 'realistic-study-abroad-budget',
    title: 'Build a realistic study-abroad budget before you commit',
    excerpt: 'Separate tuition, housing, monthly living costs and one-off setup expenses to see the real financial picture.',
    category: 'Planning',
    paragraphs: [
      'Start by separating one-off costs from recurring costs. Deposits, initial travel and setup purchases can make the first month much more expensive than a normal month later in the year.',
      'Use current institution or provider figures for tuition and accommodation, then add food, local transport, study materials, phone costs and a contingency. If a figure is uncertain, show it as a range rather than pretending it is exact.',
      'A good budget is a decision tool. It should help you compare options before you sign contracts or make non-refundable payments.',
    ],
  },
]

export function listEditorialArticles(locale: Locale) {
  if (locale !== 'en') return []
  return EN_ARTICLES.map((entry) => ({
    title: entry.title,
    slug: entry.slug,
    excerpt: entry.excerpt,
    category: entry.category,
    publishedAt: '2026-08-28',
    updatedAt: '2026-08-28',
    readingMinutes: 3,
  }))
}

export function getEditorialArticle(locale: Locale, slug: string): ArticleDoc | null {
  if (locale !== 'en') return null
  const entry = EN_ARTICLES.find((item) => item.slug === slug)
  if (!entry) return null
  return {
    _id: `starter-article-en-${slug}`,
    title: entry.title,
    slug: entry.slug,
    locale: 'en',
    excerpt: entry.excerpt,
    body: blocks(entry.paragraphs),
    category: { title: entry.category, slug: entry.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
    publishedAt: '2026-08-28',
    updatedAt: '2026-08-28',
    readingMinutes: 3,
    review: { lastReviewed: '2026-08-28', timeSensitive: false },
  }
}

const EN_TOUR = {
  slug: 'educational-group-tours',
  title: 'Educational group tours',
}

export function listEditorialTours(locale: Locale) {
  return locale === 'en' ? [{ ...EN_TOUR, availability: 'open' }] : []
}

export function getEditorialTour(locale: Locale, slug: string): TourDoc | null {
  if (locale !== 'en' || slug !== EN_TOUR.slug) return null
  return {
    _id: 'starter-tour-en-educational-group-tours',
    title: EN_TOUR.title,
    slug: EN_TOUR.slug,
    locale: 'en',
    overview: blocks([
      'Happy Education can help schools and organised groups plan education-focused travel around an agreed destination and learning objective. The exact itinerary, dates, operator and inclusions are confirmed for each proposed trip rather than advertised as permanently available.',
      'Tell us the group size, approximate ages, preferred dates and what you want the trip to achieve. We can then discuss whether a suitable programme can be developed and what information needs to be confirmed before anyone commits.',
    ]),
    availability: 'open',
    safeguardingNote: blocks([
      'Where participants are under 18, supervision responsibilities, parental consent, emergency arrangements and the responsibilities of any third-party operator must be agreed in writing before booking.',
    ]),
    review: { lastReviewed: '2026-08-28', timeSensitive: false },
  }
}
