import { defineField, defineType } from 'sanity'
import {
  CONTENT_GROUPS,
  localeField,
  reviewField,
  seoField,
  slugField,
  translationGroupField,
} from '../shared'

/** Shared opening fields for the institution-like types. */
const identity = [
  localeField,
  defineField({ name: 'title', type: 'string', group: 'content', validation: (r) => r.required() }),
  slugField(),
]

const closing = [translationGroupField, reviewField, seoField]

/**
 * A country or city page. The editorial backbone of the site: this is what ranks
 * for "study in the UK" style queries and what links out to the institutions.
 */
export const destination = defineType({
  name: 'destination',
  title: 'Destination',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    defineField({
      name: 'kind',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Country', value: 'country' },
          { title: 'City', value: 'city' },
        ],
        layout: 'radio',
      },
      initialValue: 'country',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Parent country',
      type: 'reference',
      to: [{ type: 'destination' }],
      group: 'content',
      description: 'For city pages only.',
      hidden: ({ parent }) => (parent as { kind?: string })?.kind !== 'city',
    }),
    defineField({
      name: 'section',
      title: 'Appears under',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Universities', value: 'universities' },
          { title: 'Language schools', value: 'languageSchools' },
          { title: 'Boarding schools', value: 'boardingSchools' },
          { title: 'Summer schools', value: 'summerSchools' },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
    defineField({
      name: 'intro',
      type: 'text',
      rows: 4,
      group: 'content',
      description: 'A short standfirst. Two or three sentences.',
    }),
    defineField({ name: 'whyStudyHere', type: 'richText', group: 'content' }),
    defineField({ name: 'educationSystem', type: 'richText', group: 'content' }),
    defineField({ name: 'applicationJourney', type: 'richText', group: 'content' }),
    defineField({ name: 'entryRequirements', type: 'richText', group: 'details' }),
    defineField({
      name: 'englishRequirements',
      type: 'array',
      of: [{ type: 'sourcedFact' }],
      group: 'details',
    }),
    defineField({
      name: 'costs',
      title: 'Fees and living costs',
      type: 'array',
      of: [{ type: 'sourcedFact' }],
      group: 'details',
      description: 'Every figure needs a source and a date. These go stale quickly.',
    }),
    defineField({ name: 'scholarships', type: 'richText', group: 'details' }),
    defineField({ name: 'accommodation', type: 'richText', group: 'details' }),
    defineField({
      name: 'visaOverview',
      type: 'richText',
      group: 'details',
      description:
        'Describe the process and link to the official government source. Do not give personalised immigration advice, and never state or imply a guaranteed outcome.',
    }),
    defineField({
      name: 'keyCities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'destination' }] }],
      group: 'related',
    }),
    defineField({
      name: 'institutions',
      type: 'array',
      of: [
        { type: 'reference', to: [{ type: 'institution' }, { type: 'languageSchool' }, { type: 'boardingSchool' }] },
      ],
      group: 'related',
    }),
    defineField({
      name: 'relatedArticles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
      group: 'related',
    }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
    defineField({ name: 'cta', type: 'cta', group: 'content' }),
    ...closing,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', section: 'section', flag: 'review.editorialFlag' },
    prepare: ({ title, locale, section, flag }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()} · ${section ?? ''}${flag ? ' · NEEDS REVIEW' : ''}`,
    }),
  },
})

/** Shared fields across institution-shaped documents. */
const institutionFields = [
  defineField({
    name: 'destination',
    type: 'reference',
    to: [{ type: 'destination' }],
    group: 'content',
  }),
  defineField({ name: 'city', type: 'string', group: 'content' }),
  defineField({ name: 'country', type: 'string', group: 'content' }),
  defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
  defineField({
    name: 'logo',
    type: 'imageWithMeta',
    group: 'content',
    description: 'Only if permission to display the institution’s logo has been confirmed.',
  }),
  defineField({
    name: 'officialWebsite',
    type: 'url',
    group: 'content',
    description: 'The institution’s own site. None of the legacy pages carried this, so it must be sourced.',
  }),
  defineField({ name: 'overview', type: 'richText', group: 'content' }),
  defineField({ name: 'accommodation', type: 'richText', group: 'details' }),
  defineField({
    name: 'fees',
    type: 'array',
    of: [{ type: 'sourcedFact' }],
    group: 'details',
  }),
  defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
  defineField({
    name: 'relatedArticles',
    type: 'array',
    of: [{ type: 'reference', to: [{ type: 'article' }] }],
    group: 'related',
  }),
  defineField({ name: 'cta', type: 'cta', group: 'content' }),
]

export const institution = defineType({
  name: 'institution',
  title: 'University',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    ...institutionFields,
    defineField({ name: 'founded', type: 'string', group: 'details' }),
    defineField({
      name: 'subjectAreas',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'details',
    }),
    defineField({
      name: 'degreeLevels',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: ['Foundation', 'Bachelor', 'Master', 'Doctorate', 'Pre-sessional English'],
      },
      group: 'details',
    }),
    defineField({ name: 'intakes', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'entryGuidance', type: 'richText', group: 'details' }),
    defineField({
      name: 'englishRequirements',
      type: 'array',
      of: [{ type: 'sourcedFact' }],
      group: 'details',
    }),
    defineField({ name: 'scholarships', type: 'richText', group: 'details' }),
    defineField({
      name: 'rankings',
      type: 'array',
      group: 'details',
      description:
        'Only add a ranking if you will maintain it. Each needs the organisation, year, exact category and source.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'organisation', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'year', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'category', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'position', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'source', type: 'source', validation: (r) => r.required() }),
          ],
          preview: {
            select: { org: 'organisation', pos: 'position', year: 'year' },
            prepare: ({ org, pos, year }) => ({ title: `${org} ${year}`, subtitle: pos }),
          },
        },
      ],
    }),
    ...closing,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', city: 'city', flag: 'review.editorialFlag' },
    prepare: ({ title, locale, city, flag }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()} · ${city ?? ''}${flag ? ' · NEEDS REVIEW' : ''}`,
    }),
  },
})

export const languageSchool = defineType({
  name: 'languageSchool',
  title: 'Language school',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    ...institutionFields,
    defineField({
      name: 'accreditations',
      type: 'array',
      group: 'details',
      description:
        'The SCHOOL’s accreditations, not Happy Education’s. Each must be verified against the accrediting body.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'body', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'verified', type: 'boolean', initialValue: false }),
            defineField({ name: 'source', type: 'source' }),
          ],
          preview: {
            select: { title: 'body', verified: 'verified' },
            prepare: ({ title, verified }) => ({
              title,
              subtitle: verified ? 'Verified' : 'NOT VERIFIED — hidden',
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'courseTypes',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'details',
      options: {
        list: [
          'General English', 'Intensive English', 'IELTS preparation', 'Business English',
          'Academic English', 'Cambridge exam preparation', 'One-to-one',
        ],
      },
    }),
    defineField({ name: 'lessonsPerWeek', type: 'string', group: 'details' }),
    defineField({ name: 'levels', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'minimumAge', type: 'number', group: 'details' }),
    defineField({ name: 'facilities', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'socialProgramme', type: 'richText', group: 'details' }),
    defineField({ name: 'startDates', type: 'richText', group: 'details' }),
    ...closing,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', city: 'city' },
    prepare: ({ title, locale, city }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()} · ${city ?? ''}`,
    }),
  },
})

export const boardingSchool = defineType({
  name: 'boardingSchool',
  title: 'Boarding school',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    ...institutionFields,
    defineField({ name: 'ageRange', type: 'string', group: 'details' }),
    defineField({
      name: 'curriculum',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: ['GCSE', 'A Level', 'IB', 'BTEC', 'Foundation', 'Pre-GCSE'] },
      group: 'details',
    }),
    defineField({ name: 'boardingOptions', type: 'richText', group: 'details' }),
    defineField({ name: 'admissions', type: 'richText', group: 'details' }),
    defineField({
      name: 'safeguardingNote',
      type: 'richText',
      group: 'details',
      description:
        'What the SCHOOL is responsible for. Do not make safety guarantees on the school’s behalf.',
    }),
    ...closing,
  ],
  preview: { select: { title: 'title', locale: 'locale', subtitle: 'city' } },
})

/**
 * Summer programmes involve minors, so the schema separates marketing from the
 * safeguarding and responsibility information a parent actually needs.
 */
export const summerProgramme = defineType({
  name: 'summerProgramme',
  title: 'Summer programme',
  type: 'document',
  groups: [...CONTENT_GROUPS, { name: 'safeguarding', title: 'Safeguarding' }],
  fields: [
    ...identity,
    defineField({
      name: 'format',
      type: 'string',
      group: 'content',
      options: {
        list: [
          { title: 'Individual', value: 'individual' },
          { title: 'Group', value: 'group' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'destination', type: 'reference', to: [{ type: 'destination' }], group: 'content' }),
    defineField({ name: 'city', type: 'string', group: 'content' }),
    defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
    defineField({ name: 'overview', type: 'richText', group: 'content' }),
    defineField({ name: 'ageRange', type: 'string', group: 'details' }),
    defineField({ name: 'dates', type: 'richText', group: 'details' }),
    defineField({ name: 'duration', type: 'string', group: 'details' }),
    defineField({ name: 'academicFocus', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'languageLevel', type: 'string', group: 'details' }),
    defineField({ name: 'lessonsPerWeek', type: 'string', group: 'details' }),
    defineField({ name: 'accommodation', type: 'richText', group: 'details' }),
    defineField({ name: 'meals', type: 'string', group: 'details' }),
    defineField({ name: 'activities', type: 'richText', group: 'details' }),
    defineField({ name: 'excursions', type: 'richText', group: 'details' }),
    defineField({ name: 'included', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'excluded', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({
      name: 'price',
      type: 'array',
      of: [{ type: 'sourcedFact' }],
      group: 'details',
      description: 'Publish only prices the business has confirmed for the current season.',
    }),
    defineField({
      name: 'providerResponsibilities',
      type: 'richText',
      group: 'safeguarding',
      description: 'What the school or provider is responsible for.',
    }),
    defineField({
      name: 'happyEducationResponsibilities',
      type: 'richText',
      group: 'safeguarding',
      description: 'What Happy Education is responsible for. Be precise and do not overstate.',
    }),
    defineField({
      name: 'parentalRequirements',
      type: 'richText',
      group: 'safeguarding',
      description: 'Consent, documentation and travel requirements for parents.',
    }),
    defineField({ name: 'cancellationPolicy', type: 'richText', group: 'safeguarding' }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
    defineField({ name: 'cta', type: 'cta', group: 'content' }),
    ...closing,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', format: 'format', city: 'city' },
    prepare: ({ title, locale, format, city }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()} · ${format ?? ''} · ${city ?? ''}`,
    }),
  },
})

export const tour = defineType({
  name: 'tour',
  title: 'Tour',
  type: 'document',
  groups: [...CONTENT_GROUPS, { name: 'safeguarding', title: 'Safeguarding' }],
  fields: [
    ...identity,
    defineField({ name: 'destination', type: 'reference', to: [{ type: 'destination' }], group: 'content' }),
    defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
    defineField({ name: 'overview', type: 'richText', group: 'content' }),
    defineField({ name: 'itinerary', type: 'richText', group: 'details' }),
    defineField({ name: 'dates', type: 'richText', group: 'details' }),
    defineField({ name: 'ageEligibility', type: 'string', group: 'details' }),
    defineField({ name: 'included', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'excluded', type: 'array', of: [{ type: 'string' }], group: 'details' }),
    defineField({ name: 'price', type: 'array', of: [{ type: 'sourcedFact' }], group: 'details' }),
    defineField({
      name: 'availability',
      type: 'string',
      group: 'details',
      options: {
        list: [
          { title: 'Open for enquiries', value: 'open' },
          { title: 'Waiting list', value: 'waitlist' },
          { title: 'Closed', value: 'closed' },
        ],
      },
      description: 'Never display a places-remaining count that is not generated from real availability.',
    }),
    defineField({ name: 'cancellationTerms', type: 'richText', group: 'safeguarding' }),
    defineField({
      name: 'safeguardingNote',
      type: 'richText',
      group: 'safeguarding',
      description: 'Required when minors travel.',
    }),
    defineField({ name: 'cta', type: 'cta', group: 'content' }),
    ...closing,
  ],
  preview: { select: { title: 'title', locale: 'locale' } },
})

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    defineField({ name: 'excerpt', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'leadImage', type: 'imageWithMeta', group: 'content' }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      description: 'A real member of staff. Never invent a byline.',
    }),
    defineField({ name: 'category', type: 'reference', to: [{ type: 'category' }], group: 'content' }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }], group: 'content' }),
    defineField({ name: 'body', type: 'richText', group: 'content' }),
    defineField({
      name: 'showTableOfContents',
      type: 'boolean',
      initialValue: false,
      group: 'content',
      description: 'Turn on for long articles. The contents list is built from the H2s.',
    }),
    defineField({ name: 'publishedAt', type: 'datetime', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'updatedAt', type: 'datetime', group: 'content' }),
    defineField({
      name: 'readingMinutes',
      type: 'number',
      group: 'content',
      description: 'Calculated on import. Leave empty to hide.',
    }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
    defineField({
      name: 'relatedArticles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
      group: 'related',
    }),
    defineField({
      name: 'relatedDestinations',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'destination' }] }],
      group: 'related',
    }),
    defineField({ name: 'cta', type: 'cta', group: 'content' }),
    ...closing,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', date: 'publishedAt', flag: 'review.editorialFlag' },
    prepare: ({ title, locale, date, flag }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()} · ${(date ?? '').slice(0, 10)}${flag ? ' · NEEDS REVIEW' : ''}`,
    }),
  },
})

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    defineField({ name: 'summary', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
    defineField({ name: 'body', type: 'richText', group: 'content' }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
    defineField({
      name: 'relatedServices',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'service' }] }],
      group: 'related',
    }),
    defineField({ name: 'cta', type: 'cta', group: 'content' }),
    ...closing,
  ],
  preview: { select: { title: 'title', locale: 'locale' } },
})

export const guide = defineType({
  name: 'guide',
  title: 'Student guide',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    defineField({ name: 'summary', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
    defineField({ name: 'body', type: 'richText', group: 'content' }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
    defineField({
      name: 'relatedArticles',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'article' }] }],
      group: 'related',
    }),
    defineField({ name: 'cta', type: 'cta', group: 'content' }),
    ...closing,
  ],
  preview: { select: { title: 'title', locale: 'locale' } },
})

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    ...identity,
    defineField({
      name: 'pageKey',
      type: 'string',
      group: 'content',
      description: 'Set for fixed pages the code routes to, e.g. about, contact, consultation.',
      options: { list: ['about', 'contact', 'consultation', 'search'] },
    }),
    defineField({ name: 'intro', type: 'text', rows: 3, group: 'content' }),
    defineField({ name: 'heroImage', type: 'imageWithMeta', group: 'content' }),
    defineField({ name: 'body', type: 'richText', group: 'content' }),
    defineField({ name: 'faqs', type: 'array', of: [{ type: 'faqItem' }], group: 'details' }),
    ...closing,
  ],
  preview: { select: { title: 'title', locale: 'locale' } },
})

/** Bookable appointment types. Prices live server-side; the browser never sets them. */
export const appointmentType = defineType({
  name: 'appointmentType',
  title: 'Appointment type',
  type: 'document',
  fields: [
    localeField,
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    slugField(),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'durationMinutes', type: 'number', validation: (r) => r.required().min(15) }),
    defineField({
      name: 'priceMinor',
      title: 'Price (in pence/kuruş)',
      type: 'number',
      description: 'Zero for a free consultation. Authoritative: the browser cannot change it.',
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: 'currency',
      type: 'string',
      options: { list: ['GBP', 'EUR', 'USD', 'TRY'] },
      initialValue: 'GBP',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'refundable', type: 'boolean', initialValue: true }),
    defineField({ name: 'cancellationPolicy', type: 'richText' }),
    defineField({ name: 'active', type: 'boolean', initialValue: true }),
    translationGroupField,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', price: 'priceMinor', currency: 'currency' },
    prepare: ({ title, locale, price, currency }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()} · ${price === 0 ? 'Free' : `${(price ?? 0) / 100} ${currency}`}`,
    }),
  },
})

/** A chargeable service. Same rule: the server is the only source of the amount. */
export const paymentService = defineType({
  name: 'paymentService',
  title: 'Payable service',
  type: 'document',
  fields: [
    localeField,
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    slugField(),
    defineField({
      name: 'reference',
      type: 'string',
      description: 'Stable internal code used by the checkout, e.g. "application-service".',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'description', type: 'richText' }),
    defineField({ name: 'whatItCovers', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'priceMinor', type: 'number', validation: (r) => r.required().min(0) }),
    defineField({
      name: 'currency',
      type: 'string',
      options: { list: ['GBP', 'EUR', 'USD', 'TRY'] },
      initialValue: 'GBP',
    }),
    defineField({ name: 'refundable', type: 'boolean', initialValue: true }),
    defineField({ name: 'refundPolicy', type: 'richText' }),
    defineField({ name: 'active', type: 'boolean', initialValue: false }),
    translationGroupField,
  ],
  preview: {
    select: { title: 'title', ref: 'reference', price: 'priceMinor', currency: 'currency' },
    prepare: ({ title, ref, price, currency }) => ({
      title,
      subtitle: `${ref} · ${(price ?? 0) / 100} ${currency}`,
    }),
  },
})
