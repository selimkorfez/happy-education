import { defineField, defineType } from 'sanity'
import { CONTENT_GROUPS, localeField, reviewField } from '../shared'

/**
 * A public social-media item curated for the website.
 *
 * We link to the original post rather than scraping/rehosting a social platform's
 * media. That keeps the social account as the source of truth and lets the website
 * add useful editorial context without importing third-party trackers or assets.
 */
export const socialPost = defineType({
  name: 'socialPost',
  title: 'Social media story',
  type: 'document',
  groups: CONTENT_GROUPS,
  fields: [
    localeField,
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      description: 'A website-friendly title that explains the post at a glance.',
      validation: (rule) => rule.required().min(4),
    }),
    defineField({
      name: 'platform',
      type: 'string',
      group: 'content',
      options: {
        list: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn'],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'externalUrl',
      title: 'Original post URL',
      type: 'url',
      group: 'content',
      description: 'The original Happy Education post. Do not paste a repost or a third-party copy.',
      validation: (rule) => rule.required().uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'What the post contains, in plain language.',
      validation: (rule) => rule.required().min(20),
    }),
    defineField({
      name: 'whyItMatters',
      title: 'Why we made this / why it matters',
      type: 'text',
      rows: 4,
      group: 'content',
      description: 'The useful context the website adds around the social post.',
      validation: (rule) => rule.required().min(20),
    }),
    defineField({
      name: 'topic',
      type: 'string',
      group: 'content',
      options: {
        list: [
          'University applications',
          'Language schools',
          'Summer schools',
          'Boarding schools',
          'Destinations',
          'Student life',
          'Events and tours',
          'Team and behind the scenes',
          'Practical advice',
        ],
      },
    }),
    defineField({
      name: 'thumbnail',
      type: 'imageWithMeta',
      group: 'content',
      description:
        'Optional website thumbnail. Use only an image Happy Education owns/has permission to publish; otherwise the site uses a branded platform card.',
    }),
    defineField({ name: 'publishedAt', type: 'datetime', group: 'content' }),
    defineField({
      name: 'featured',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description: 'Featured posts appear first on the social-content page.',
    }),
    defineField({
      name: 'active',
      type: 'boolean',
      group: 'content',
      initialValue: false,
      description: 'Only active posts are shown publicly. Keep off until the URL and context have been reviewed.',
    }),
    reviewField,
  ],
  preview: {
    select: {
      title: 'title',
      platform: 'platform',
      active: 'active',
      media: 'thumbnail',
    },
    prepare: ({ title, platform, active, media }) => ({
      title,
      subtitle: `${platform ?? 'Social'}${active ? '' : ' · HIDDEN'}`,
      media,
    }),
  },
})
