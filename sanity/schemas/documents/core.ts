import { defineField, defineType } from 'sanity'
import {
  CONTENT_GROUPS,
  localeField,
  reviewField,
  seoField,
  slugField,
  translationGroupField,
} from '../shared'

/**
 * Joins the locale variants of one logical page. Holds no content itself — it is
 * purely the identity that two language versions share.
 */
export const translationGroup = defineType({
  name: 'translationGroup',
  title: 'Translation group',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal name',
      type: 'string',
      description: 'Only visible to editors. e.g. "Destination — United Kingdom".',
      validation: (rule) => rule.required(),
    }),
  ],
})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'social', title: 'Social' },
    { name: 'seo', title: 'Default SEO' },
  ],
  fields: [
    defineField({ name: 'tradingName', type: 'string', group: 'identity', initialValue: 'Happy Education' }),
    defineField({
      name: 'legalName',
      type: 'string',
      group: 'identity',
      description: 'Must match the Companies House register exactly.',
    }),
    defineField({ name: 'companyNumber', type: 'string', group: 'identity' }),
    defineField({
      name: 'registeredOffice',
      type: 'text',
      rows: 3,
      group: 'identity',
      description:
        'The registered office as filed at Companies House. This is a serviced address and must never be described as a staffed office.',
    }),
    defineField({ name: 'logo', type: 'imageWithMeta', group: 'identity' }),
    defineField({ name: 'phone', type: 'string', group: 'contact' }),
    defineField({
      name: 'whatsapp',
      type: 'string',
      group: 'contact',
      description: 'Digits only, including country code, e.g. 447735826785.',
    }),
    defineField({ name: 'email', type: 'string', group: 'contact' }),
    defineField({
      name: 'workingHours',
      type: 'array',
      of: [{ type: 'sourcedFact' }],
      group: 'contact',
      description: 'Label = day range, Value = hours.',
    }),
    defineField({
      name: 'offices',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'office' }] }],
      group: 'contact',
    }),
    defineField({
      name: 'social',
      type: 'array',
      group: 'social',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              type: 'string',
              options: {
                list: ['Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok', 'X'],
              },
            }),
            defineField({
              name: 'url',
              type: 'url',
              validation: (rule) => rule.uri({ scheme: ['https'] }),
            }),
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        },
      ],
      description:
        'Only Happy Education accounts. Partner-school profiles must never be listed here.',
    }),
    defineField({ name: 'defaultSeo', type: 'seo', group: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})

/** Editorial category, used for the blog hub's topic clusters. */
export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    localeField,
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    slugField(),
    defineField({ name: 'description', type: 'text', rows: 2 }),
    translationGroupField,
  ],
  preview: {
    select: { title: 'title', locale: 'locale' },
    prepare: ({ title, locale }) => ({ title, subtitle: (locale ?? '').toUpperCase() }),
  },
})

/**
 * Authors are real Happy Education people. There is no facility for inventing an
 * expert byline, and the reviewer credit on an article references this type.
 */
export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    slugField('name'),
    defineField({
      name: 'role',
      type: 'string',
      description: 'Their actual role, e.g. "University applications adviser".',
    }),
    defineField({ name: 'bio', type: 'richText' }),
    defineField({ name: 'photo', type: 'imageWithMeta' }),
    defineField({
      name: 'consentOnFile',
      title: 'Consent on file',
      type: 'boolean',
      initialValue: false,
      description:
        'Tick only when this person has agreed to appear on the public site. Required under UK GDPR before their name or photograph is published.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
})

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team member',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'role', type: 'string' }),
    defineField({ name: 'locale', type: 'string', options: { list: ['en', 'tr'] } }),
    defineField({ name: 'bio', type: 'richText' }),
    defineField({ name: 'photo', type: 'imageWithMeta' }),
    defineField({ name: 'order', type: 'number' }),
    defineField({
      name: 'consentOnFile',
      type: 'boolean',
      initialValue: false,
      description: 'Required before publication.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'photo' } },
})

export const office = defineType({
  name: 'office',
  title: 'Office',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'kind',
      type: 'string',
      options: {
        list: [
          { title: 'Registered office (not staffed)', value: 'registered' },
          { title: 'Staffed office visitors can attend', value: 'staffed' },
          { title: 'Correspondence only', value: 'correspondence' },
        ],
        layout: 'radio',
      },
      description:
        'This distinction is published. Describing a serviced address as a staffed office would be a misleading claim.',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'address', type: 'text', rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: 'country', type: 'string' }),
    defineField({ name: 'phone', type: 'string' }),
    defineField({ name: 'email', type: 'string' }),
    defineField({ name: 'mapUrl', type: 'url' }),
    defineField({
      name: 'verified',
      type: 'boolean',
      initialValue: false,
      description: 'Tick when the address has been confirmed by the business.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'kind' } },
})

/**
 * Testimonials.
 *
 * Two gates before anything appears publicly: the quote must be genuine, and the
 * student must have agreed to its publication. Both are recorded here rather than
 * assumed.
 */
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Student experience',
  type: 'document',
  fields: [
    localeField,
    defineField({
      name: 'studentName',
      type: 'string',
      description: 'As the student has agreed it should appear. Do not add a surname they did not give.',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'quote', type: 'text', rows: 5, validation: (rule) => rule.required() }),
    defineField({
      name: 'programme',
      type: 'string',
      description: 'The institution or programme, only if the student stated it.',
    }),
    defineField({ name: 'photo', type: 'imageWithMeta' }),
    defineField({
      name: 'permissionStatus',
      title: 'Publication permission',
      type: 'string',
      options: {
        list: [
          { title: 'Written permission on file', value: 'written' },
          { title: 'Verbal permission recorded', value: 'verbal' },
          { title: 'Not obtained', value: 'none' },
        ],
        layout: 'radio',
      },
      initialValue: 'none',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'verified',
      title: 'Verified genuine',
      type: 'boolean',
      initialValue: false,
      description:
        'Tick when a member of staff has confirmed this is a real student and a real quote. Unverified entries never appear on the site.',
    }),
  ],
  preview: {
    select: { title: 'studentName', subtitle: 'programme', verified: 'verified' },
    prepare: ({ title, subtitle, verified }) => ({
      title,
      subtitle: `${subtitle ?? ''}${verified ? '' : ' — NOT VERIFIED, hidden'}`,
    }),
  },
})

export const partner = defineType({
  name: 'partner',
  title: 'Partner institution',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'logo', type: 'imageWithMeta' }),
    defineField({ name: 'website', type: 'url' }),
    defineField({
      name: 'relationship',
      type: 'string',
      options: {
        list: [
          { title: 'Signed representation agreement', value: 'agreement' },
          { title: 'Students placed, no formal agreement', value: 'informal' },
          { title: 'No relationship — listed for information only', value: 'none' },
        ],
        layout: 'radio',
      },
      description:
        'Only institutions with a signed agreement may appear in a "partners" display. The others are informational listings.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logoUsagePermitted',
      type: 'boolean',
      initialValue: false,
      description:
        'Tick only if Happy Education has permission to display this institution’s logo. Trademarks are not usable by default.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'relationship', media: 'logo' } },
})

export const redirect = defineType({
  name: 'redirect',
  title: 'Redirect',
  type: 'document',
  description: 'Create one whenever a published URL changes, so the old address keeps working.',
  fields: [
    defineField({
      name: 'from',
      title: 'Old path',
      type: 'string',
      description: 'Path only, starting with a slash. e.g. /tr/universiteler/eski-slug',
      validation: (rule) =>
        rule.required().custom((v) => (v?.startsWith('/') ? true : 'Must start with /')),
    }),
    defineField({
      name: 'to',
      title: 'New path',
      type: 'string',
      validation: (rule) =>
        rule.required().custom((v) => (v?.startsWith('/') ? true : 'Must start with /')),
    }),
    defineField({
      name: 'permanent',
      type: 'boolean',
      initialValue: true,
      description: 'Permanent (301) unless the move is genuinely temporary.',
    }),
    defineField({ name: 'reason', type: 'string' }),
  ],
  preview: {
    select: { title: 'from', subtitle: 'to' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `→ ${subtitle}` }),
  },
})

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    localeField,
    defineField({ name: 'title', type: 'string', group: 'content', validation: (rule) => rule.required() }),
    slugField(),
    defineField({
      name: 'key',
      title: 'Document type',
      type: 'string',
      group: 'content',
      options: {
        list: [
          'privacy', 'cookies', 'terms', 'serviceTerms', 'paymentTerms', 'refunds',
          'appointments', 'disclaimer', 'accessibility', 'complaints', 'safeguarding',
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'body', type: 'richText', group: 'content' }),
    defineField({
      name: 'effectiveDate',
      type: 'date',
      group: 'content',
      description: 'The date this version took effect. Shown on the page.',
    }),
    defineField({
      name: 'solicitorApproved',
      type: 'boolean',
      group: 'editorial',
      initialValue: false,
      description:
        'Drafts generated during the rebuild are NOT legal advice. Tick only after a solicitor or privacy professional has approved this text.',
    }),
    translationGroupField,
    reviewField,
    seoField,
  ],
  preview: {
    select: { title: 'title', locale: 'locale', approved: 'solicitorApproved' },
    prepare: ({ title, locale, approved }) => ({
      title,
      subtitle: `${(locale ?? '').toUpperCase()}${approved ? '' : ' — DRAFT, not approved'}`,
    }),
  },
})
