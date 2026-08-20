import { defineField, defineType } from 'sanity'

/**
 * Editorial provenance.
 *
 * Study-abroad content drives decisions worth tens of thousands of pounds, and much
 * of it goes stale: visa routes, tuition, work rights, deadlines. These types make
 * the review state part of the content rather than an afterthought, and the
 * templates surface it to the reader.
 */

export const source = defineType({
  name: 'source',
  title: 'Source',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Source name',
      type: 'string',
      description: 'e.g. "UK Home Office — Student visa guidance"',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (rule) => rule.required().uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'accessed',
      title: 'Date accessed',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'url' },
  },
})

export const reviewMeta = defineType({
  name: 'reviewMeta',
  title: 'Editorial review',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  description:
    'Shown on the page so readers can judge how current the information is. Required for anything covering fees, visas, deadlines or entry requirements.',
  fields: [
    defineField({
      name: 'lastReviewed',
      title: 'Last reviewed',
      type: 'date',
      description: 'The date a person last checked this content against its sources.',
    }),
    defineField({
      name: 'reviewedBy',
      title: 'Reviewed by',
      type: 'reference',
      to: [{ type: 'author' }],
      description:
        'Only name someone who genuinely reviewed this. An unearned reviewer credit is a false trust signal.',
    }),
    defineField({
      name: 'nextReviewDue',
      title: 'Next review due',
      type: 'date',
      description: 'Content past this date is listed in the editorial review report.',
    }),
    defineField({
      name: 'timeSensitive',
      title: 'Contains time-sensitive facts',
      type: 'boolean',
      initialValue: false,
      description:
        'Tick for visa rules, fees, prices, work rights or deadlines. Requires at least one source.',
    }),
    defineField({
      name: 'sources',
      title: 'Sources',
      type: 'array',
      of: [{ type: 'source' }],
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { timeSensitive?: boolean } | undefined
          if (parent?.timeSensitive && (!value || value.length === 0)) {
            return 'Time-sensitive content needs at least one source.'
          }
          return true
        }),
    }),
    defineField({
      name: 'editorialFlag',
      title: 'Needs editorial attention',
      type: 'text',
      rows: 2,
      description:
        'Migration notes and unresolved questions. Anything written here appears in the QA report and blocks the pre-launch check.',
    }),
  ],
})

export const faqItem = defineType({
  name: 'faqItem',
  title: 'Question',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'answer',
      type: 'richText',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'question' } },
})

export const cta = defineType({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      description:
        'Say what happens, e.g. "Speak to a university adviser". Avoid "Get started" and "Learn more".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      title: 'Link',
      type: 'string',
      description: 'An internal path such as /en/contact, or a full URL for an external site.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'label', subtitle: 'href' } },
})

/** A fact that carries its own provenance, used in fee and requirement tables. */
export const sourcedFact = defineType({
  name: 'sourcedFact',
  title: 'Sourced fact',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'value', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'note',
      type: 'string',
      description: 'Optional qualifier, e.g. "per year, 2026/27 entry".',
    }),
    defineField({ name: 'source', type: 'source' }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'value' },
  },
})
