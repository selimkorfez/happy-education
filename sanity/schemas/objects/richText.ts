import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Portable Text.
 *
 * Deliberately constrained. Editors get headings, lists, links, tables, images,
 * quotes and callouts — and nothing that can inject markup. There is no HTML
 * block and no raw embed type, so no CMS value ever reaches
 * `dangerouslySetInnerHTML`. Legacy WordPress shortcodes and plugin markup are
 * stripped during migration rather than being given a home here.
 *
 * H1 is absent on purpose: the page template owns the single H1, so an editor
 * cannot accidentally create a second one and break the heading outline.
 */
export const richText = defineType({
  name: 'richText',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading 2', value: 'h2' },
        { title: 'Heading 3', value: 'h3' },
        { title: 'Heading 4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bulleted', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          defineArrayMember({
            name: 'internalLink',
            title: 'Link to a page on this site',
            type: 'object',
            fields: [
              defineField({
                name: 'reference',
                type: 'reference',
                to: [
                  { type: 'article' },
                  { type: 'destination' },
                  { type: 'institution' },
                  { type: 'languageSchool' },
                  { type: 'summerProgramme' },
                  { type: 'boardingSchool' },
                  { type: 'tour' },
                  { type: 'service' },
                  { type: 'guide' },
                  { type: 'page' },
                ],
                validation: (rule) => rule.required(),
              }),
            ],
          }),
          defineArrayMember({
            name: 'externalLink',
            title: 'Link to another site',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                type: 'url',
                // javascript: and data: are rejected at the schema level as well as
                // at render time.
                validation: (rule) =>
                  rule.required().uri({ scheme: ['http', 'https', 'mailto', 'tel'] }),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({ type: 'imageWithMeta' }),
    defineArrayMember({
      name: 'table',
      title: 'Comparison table',
      type: 'object',
      description: 'Use where a comparison genuinely helps. Do not turn prose into a table.',
      fields: [
        defineField({ name: 'caption', type: 'string' }),
        defineField({
          name: 'headers',
          type: 'array',
          of: [{ type: 'string' }],
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: 'rows',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'row',
              type: 'object',
              fields: [defineField({ name: 'cells', type: 'array', of: [{ type: 'string' }] })],
              preview: {
                select: { cells: 'cells' },
                prepare: ({ cells }) => ({ title: (cells ?? []).join(' | ') }),
              },
            }),
          ],
        }),
        defineField({ name: 'source', type: 'source' }),
      ],
      preview: {
        select: { title: 'caption' },
        prepare: ({ title }) => ({ title: title || 'Table' }),
      },
    }),
    defineArrayMember({
      name: 'callout',
      title: 'Callout',
      type: 'object',
      fields: [
        defineField({
          name: 'tone',
          type: 'string',
          initialValue: 'note',
          options: {
            list: [
              { title: 'Note', value: 'note' },
              { title: 'Important', value: 'important' },
              { title: 'Official guidance', value: 'official' },
            ],
            layout: 'radio',
          },
        }),
        defineField({ name: 'body', type: 'richText' }),
      ],
      preview: {
        select: { tone: 'tone' },
        prepare: ({ tone }) => ({ title: `Callout (${tone})` }),
      },
    }),
  ],
})
