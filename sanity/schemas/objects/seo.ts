import { defineField, defineType } from 'sanity'

/**
 * Per-document SEO overrides. Everything is optional: when a field is empty the
 * template falls back to the document's own title/excerpt, so an editor never has
 * to fill this in to get sensible metadata.
 */
export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Meta title',
      type: 'string',
      description: 'Overrides the page title in search results. Aim for 50-60 characters.',
      validation: (rule) => rule.max(70).warning('Titles over 70 characters are usually truncated.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Shown under the title in search results. Aim for 140-160 characters.',
      validation: (rule) =>
        rule.max(180).warning('Descriptions over 180 characters are usually truncated.'),
    }),
    defineField({
      name: 'image',
      title: 'Social sharing image',
      type: 'imageWithMeta',
      description: 'Used when the page is shared. Falls back to the page image if empty.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
      description: 'Only use for pages that genuinely should not be indexed.',
    }),
  ],
})
