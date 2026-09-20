import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const translationFile = process.argv[2]
if (!translationFile) throw new Error('Pass the audited translation JSON file as the first argument.')

const root = process.cwd()
const contentDir = path.join(root, 'content', 'migrated')
const sourceArticles = JSON.parse(readFileSync(path.join(contentDir, 'article.json'), 'utf8'))
const sourceCategories = JSON.parse(readFileSync(path.join(contentDir, 'category.json'), 'utf8'))
const { translations } = JSON.parse(readFileSync(translationFile, 'utf8'))

const categoryCopy = {
  'consultancy-and-process': ['Study abroad consultancy', 'study-abroad-consultancy'],
  'destination-comparison': ['Country comparisons', 'country-comparisons'],
  'language-study-value': ['Language study', 'language-study'],
  'parents-and-safeguarding': ['Advice for parents', 'advice-for-parents'],
  'pre-departure': ['Before departure', 'before-departure'],
  'summer-schools': ['Summer schools', 'summer-schools'],
  'university-admissions': ['University applications', 'university-applications'],
  'visa-and-immigration': ['Visas and applications', 'visas-and-applications'],
}

const excerpts = [
  'Planning to study abroad involves decisions about countries, schools, visas, accommodation and budgets. A specialist consultant helps students and families compare suitable options, avoid costly mistakes and manage each step with confidence.',
  'English is now essential across international business, academia and everyday communication. Studying it abroad builds practical fluency, cultural awareness and professional confidence while opening new academic and career opportunities.',
  'Studying abroad is both an academic experience and an opportunity for personal and professional growth. This guide compares the UK, Canada, Malta and Ireland to help students choose the destination that best fits their goals.',
  'Studying abroad can be an exciting and transformative experience. Careful preparation before departure helps students avoid unnecessary problems and begin their academic and personal journey with confidence.',
  'Studying a language abroad is a major investment in personal and professional development. This guide explains how to compare countries, cities, accreditation, teaching quality, accommodation and support before choosing a school.',
  'A successful study-abroad journey often begins with the right visa application. This guide explains the most common mistakes behind refusals and how careful preparation can help students avoid them.',
  'Studying abroad can transform a young person’s academic development, confidence and independence. This guide helps parents prepare their child emotionally and practically while choosing a safe, suitable school.',
  'The UK and Malta both offer strong English-language programmes, but their costs, climates, cultures and student experiences differ. This comparison helps students decide which destination suits them best.',
  'Real language development continues beyond the classroom. This guide explains how students can practise English through everyday conversations, activities, media and local life while studying abroad.',
  'In a globalised workplace, English is more than a communication tool: it can shape career opportunities. This guide compares British and American English, from accents and vocabulary to business culture and professional use.',
  'UK summer schools welcome thousands of international students each year. Strong academic standards, an established education system and cultural variety create programmes that combine language learning, activities and personal development.',
  'English opens academic, professional and social opportunities around the world. This guide compares course and living costs across popular destinations so students can find a suitable programme for their goals and budget.',
  'Choosing between a group and an individual summer school is a major decision for a student and their family. This guide compares supervision, independence, language immersion, flexibility and cost to help you choose.',
  'London combines historic landmarks, modern city life and internationally recognised education. This guide explains why it remains a leading summer-school destination and compares programme, accommodation and activity options.',
  'For families considering an overseas summer school, safety and accommodation matter as much as academic quality. This guide explains supervision, safeguarding, residential stays, homestays and emergency support.',
  'A UK summer school brings independence, cultural discovery and new friendships. This practical packing guide covers travel documents, clothing, footwear, electronics, medicines, spending money and study essentials.',
  'The world’s most prestigious universities can transform a student’s academic and professional future. This guide introduces leading institutions and the grades, tests, language results and application materials they expect.',
  'Working while studying abroad can help with living costs and provide international experience. This guide compares student work rights and post-study opportunities across the UK, USA, Canada, Ireland, Australia and New Zealand.',
]

// Editorial corrections for headings where a literal machine rendering would
// sound unnatural, change the meaning, or use the wrong education term.
const copyEdits = {
  'a0.b0': 'What Is Study Abroad Consultancy?',
  'a0.b20': '6. Budget Management and Language School Fees',
  'a0.b22': '7. Save Time Through Coordinated Support',
  'a0.b31': 'Reach Your Goals with Study Abroad Consultancy',
  'a1.b2': '1. Gain an Internationally Recognised Language Qualification',
  'a1.b5': '2. Gain a Competitive Advantage in the Workplace',
  'a1.b8': '3. Expand Your Academic Opportunities',
  'a1.b10': '4. Build a Global Network',
  'a1.b13': '5. Develop Cultural Awareness and Adaptability',
  'a1.b15': '6. Use English in Real Life',
  'a1.b17': '7. Build Confidence and Communication Skills',
  'a1.b19': '8. Stand Out with International Qualifications',
  'a1.b24': '9. Develop Problem-Solving and Adaptability Skills',
  'a1.b26': '10. Make a Lasting Investment in Your Future',
  'a1.b29': 'Take a Confident Step Towards Your Future',
  'a2.b27': '8. Which Country Is Right for You?',
  'a3.b2': '1. Define Your Goals and Study Plan',
  'a3.b6': '2. Research Your Budget and Language School Fees',
  'a3.b9': '3. Complete Your Visa Application and Documents',
  'a3.b12': '4. Plan Your Accommodation',
  'a3.b18': '6. Prepare for the Language and Culture',
  'a3.b21': '7. Plan Your Journey and Local Transport',
  'a3.b29': 'Key Points for Preparing to Study Abroad',
  'a4.b1': 'Define Your Goals: Why Do You Want to Study Abroad?',
  'a4.b3': 'Choose a Country: Which Destination Suits You?',
  'a4.b19': 'Choose a Programme That Matches Your Language Level',
  'a4.b21': 'Compare Accommodation Options',
  'a4.b27': 'Compare Language School Fees with Your Budget',
  'a4.b39': 'Visa, Travel and Consultancy Support',
  'a5.b1': 'Why Do Study-Abroad and Visa Applications Matter?',
  'a5.b4': 'Submitting Incomplete or Incorrect Documents',
  'a5.b11': 'Applying for the Wrong Visa Type',
  'a5.b19': 'Inconsistent Financial Evidence',
  'a5.b26': 'Errors in Your Motivation or Statement of Intent',
  'a5.b49': 'What to Do After a Visa Refusal',
  'a5.b56': 'Reduce Risk with Professional Study-Abroad Support',
  'a5.b60': 'Final Tips for a Strong Visa Application',
  'a5.b66': 'Careful Preparation Builds a Strong Application',
  'a6.b2': 'Why Study Abroad? Is It Right for Your Family?',
  'a6.b24': 'Manage Visas, Travel and Documents',
  'a6.b35': 'Safety, Health and Pastoral Support',
  'a6.b37': 'Prepare for Cultural Differences',
  'a6.b39': 'Keep Communication Strong Throughout the Programme',
  'a7.b1': 'Which Offers the Better Study Experience: the UK or Malta?',
  'a7.b5': 'Language School Fees: UK vs Malta',
  'a7.b12': 'Language Levels and Course Options',
  'a7.b29': 'Which Destination Suits Which Student?',
  'a7.b31': 'Choose Between the UK and Malta with Happy Education',
  'a8.b3': 'Why Is Daily English Practice So Important?',
  'a8.b8': 'Make English Part of Your Daily Life',
  'a8.b10': 'Combine Classroom Learning with Social Life',
  'a8.b12': 'English Practice in Different Countries',
  'a8.b19': 'Improve Your Listening and Pronunciation',
  'a8.b23': 'Be Open to Meeting New People',
  'a8.b25': 'Do Not Fear Mistakes: Learn Through Practice',
  'a8.b28': 'Learn English by Living It',
  'a9.b11': 'Choosing the US for English-Language Study',
  'a9.b16': 'Industry Differences and How to Choose',
  'a9.b22': 'Pronunciation and Clarity',
  'a9.b27': 'International Study and Language Levels',
  'a10.b3': 'How a UK Summer School Supports Your Future',
  'a10.b7': 'Cultural Experience and Language Practice',
  'a10.b11': 'Summer School Fees and Accommodation Options',
  'a10.b16': 'A Global Education Experience at a UK Summer School',
  'a11.b8': 'Malta Language Schools: Affordable and Effective Options',
  'a11.b14': 'US and Australian Language Schools: High Quality at a Higher Cost',
  'a11.b17': 'Where Can You Find the Most Affordable English Course?',
  'a12.b2': 'What Is a Group Summer School and Who Is It For?',
  'a12.b12': 'What Is an Individual Summer School and Who Is It For?',
  'a12.b22': 'Group and Individual Programmes Compared',
  'a12.b25': 'Make the Right Choice with Happy Education',
  'a13.b1': 'Why London Leads the World in Summer Schools',
  'a13.b15': 'Accommodation in London: Residential or Homestay?',
  'a13.b19': 'Beyond the Classroom: London’s Cultural and Social Programme',
  'a13.b25': 'UK Summer School Fees',
  'a13.b28': 'Plan Your Ideal London Summer School with Happy Education',
  'a14.b2': 'Summer School Safety Standards: How Are Schools Inspected?',
  'a14.b5': '24/7 Supervision and Support',
  'a14.b8': 'Summer School Accommodation: Residential or Homestay?',
  'a14.b16': 'Food and Health: Allergies, Hygiene and Insurance',
  'a14.b19': 'Emergency Procedures, Lost Students and ID Cards',
  'a15.b2': 'The Golden Rule: Keep Essential Documents Together',
  'a15.b11': 'Prepare for British Weather: Dress in Layers',
  'a15.b40': 'School and Study Supplies',
  'a15.b44': 'Five Essential Packing Tips',
  'a15.b50': 'Start Your Journey Smoothly with Happy Education',
  'a16.b18': 'The UK’s Leading Universities: Oxford, Cambridge and More',
  'a16.b38': 'Personal Statements and References',
  'a16.b42': 'Can You Get into Your Chosen University?',
  'a17.b3': 'Working as a Student in the UK: Rules and Limits',
  'a17.b21': 'Jobs for Students Abroad: What Can You Do?',
  'a17.b27': 'Choose the Right Country and Strategy with Happy Education',
}

const translatedTables = {
  '7.30': {
    headers: ['Student profile', 'Recommended country', 'Why'],
    rows: [
      ['Academically focused and planning for university', 'United Kingdom', 'Strong academic infrastructure and routes into university'],
      ['Looking for a budget-friendly option', 'Malta', 'Affordable language schools and lower living costs'],
      ['Seeking intensive exam preparation', 'United Kingdom', 'Specialist courses for examinations such as IELTS and TOEFL'],
      ['Focused on social life and speaking practice', 'Malta', 'Relaxed, friendly classroom environment'],
      ['Planning a short summer programme', 'Malta', 'Faster visa process and affordable pricing'],
    ],
  },
  '12.24': {
    headers: ['Feature', 'Group summer school', 'Individual summer school'],
    rows: [
      ['Student profile', 'Ages 12–17; suitable for a first overseas experience', 'Ages 16+; suitable for independent, confident students'],
      ['Group-leader support', 'Usually accompanied by a group leader travelling from Turkey', 'No group leader; the school’s international staff provide support'],
      ['Language immersion', 'Moderate, because students may speak Turkish within the group', 'High, because there is less opportunity to speak Turkish'],
      ['Programme and activities', 'Fixed, organised and planned in advance', 'Flexible and can be shaped around the student’s interests'],
      ['Destinations offered by Happy Education', 'United Kingdom and USA (Los Angeles, New York, Boston and Miami)', 'A wide choice of cities across the United Kingdom'],
    ],
  },
  '17.20': {
    headers: ['Country', 'Work during term', 'Work during holidays', 'Post-study work rights', 'Key advantage'],
    rows: [
      ['United Kingdom', '20 hours per week', 'Full time (40+ hours)', '2 years (Graduate visa)', 'A prestigious start at globally recognised institutions'],
      ['United States', '20 hours per week (on campus)', 'Full time (40+ hours)', '1–3 years (OPT/STEM)', 'Access to global technology and finance employers'],
      ['Canada', '20 hours per week', 'Full time (unlimited)', 'Up to 3 years (PGWP)', 'A strong route towards immigration and settlement'],
      ['Ireland', '20 hours per week', 'Full time (40+ hours)', '1–2 years (Third Level Graduate Programme)', 'A European centre for technology companies including Google and Meta'],
      ['Australia', '48 hours per fortnight', 'Full time (unlimited)', '2–4 years (Temporary Graduate visa)', 'Some of the world’s highest hourly minimum wages'],
      ['New Zealand', '20 hours per week', 'Full time (40+ hours)', '1–3 years (post-study work)', 'Safe living and a calm working environment'],
    ],
  },
}

function categoryCluster(ref) {
  return ref.replace('category-tr-', '')
}

function englishSlug(article) {
  const proposed = article._migration?.proposedEnPath
  if (!proposed) throw new Error(`Missing proposed English path for ${article._id}`)
  return proposed.split('/').filter(Boolean).at(-1)
}

function translatedBlock(block, articleIndex, blockIndex) {
  if (block._type === 'table') {
    const copy = translatedTables[`${articleIndex}.${blockIndex}`]
    if (!copy) throw new Error(`Missing table translation for article ${articleIndex}, block ${blockIndex}`)
    return {
      ...block,
      headers: copy.headers,
      rows: block.rows.map((row, rowIndex) => ({ ...row, cells: copy.rows[rowIndex] })),
    }
  }
  const translationId = `a${articleIndex}.b${blockIndex}`
  const text = copyEdits[translationId] ?? translations[translationId]
  if (!text) throw new Error(`Missing translation a${articleIndex}.b${blockIndex}`)
  const retainStrong = block.children?.filter((child) => child.text?.trim()).every((child) => child.marks?.includes('strong'))
  return {
    ...block,
    markDefs: [],
    children: [{
      _type: 'span',
      _key: `${block._key}-en`,
      text,
      marks: retainStrong ? ['strong'] : [],
    }],
  }
}

const englishArticles = sourceArticles.map((article, articleIndex) => {
  const category = categoryCluster(article.category._ref)
  const body = article.body.map((block, blockIndex) => translatedBlock(block, articleIndex, blockIndex))
  const words = body.flatMap((block) => block._type === 'block' ? block.children.map((child) => child.text) : block.rows.flatMap((row) => row.cells)).join(' ').trim().split(/\s+/).length
  return {
    _id: article._id.replace('article-tr-', 'article-en-'),
    _type: 'article',
    locale: 'en',
    title: translations[`a${articleIndex}.title`],
    slug: { _type: 'slug', current: englishSlug(article) },
    translationGroup: article.translationGroup,
    publishedAt: article.publishedAt,
    updatedAt: '2026-09-19T00:00:00Z',
    excerpt: excerpts[articleIndex],
    readingMinutes: Math.max(1, Math.ceil(words / 225)),
    showTableOfContents: article.showTableOfContents,
    category: { _type: 'reference', _ref: `category-en-${category}` },
    tags: article.tags,
    body,
    seo: { noIndex: true },
    review: {
      timeSensitive: article.review?.timeSensitive ?? false,
      editorialFlag: 'English translation of the legacy Turkish article. Reverify time-sensitive claims against current official sources before removing the search-engine block.',
    },
    _migration: {
      ...article._migration,
      targetPath: `/en/insights/${englishSlug(article)}/`,
      sourceLanguage: 'TR',
      translationMethod: 'Private on-device translation with editorial completeness review',
      translatedAt: '2026-09-19',
    },
  }
})

const englishCategories = sourceCategories.map((category) => {
  const cluster = category._migration.cluster
  const [title, slug] = categoryCopy[cluster]
  return {
    _id: `category-en-${cluster}`,
    _type: 'category',
    locale: 'en',
    title,
    slug: { _type: 'slug', current: slug },
    translationGroup: { _type: 'reference', _ref: `tgroup-category-${cluster}` },
    _migration: { source: 'Translated from the legacy Turkish editorial taxonomy', cluster },
  }
})

const pairedTurkishCategories = sourceCategories.map((category) => ({
  ...category,
  translationGroup: { _type: 'reference', _ref: `tgroup-category-${category._migration.cluster}` },
}))

writeFileSync(path.join(contentDir, 'article.en.json'), `${JSON.stringify(englishArticles, null, 2)}\n`)
writeFileSync(path.join(contentDir, 'category.en.json'), `${JSON.stringify(englishCategories, null, 2)}\n`)
writeFileSync(path.join(contentDir, 'category.json'), `${JSON.stringify(pairedTurkishCategories, null, 2)}\n`)

console.info(`Wrote ${englishArticles.length} English articles and ${englishCategories.length} English categories.`)
