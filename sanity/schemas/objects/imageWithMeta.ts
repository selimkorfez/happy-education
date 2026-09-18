import { defineField, defineType } from 'sanity'
import { LicensedImageInput } from '../../components/LicensedImageInput'

/**
 * Every image on the site uses this type.
 *
 * Two fields are load-bearing:
 *   `alt`     required unless the image is marked decorative, so accessibility
 *             cannot be forgotten at the point of upload.
 *   `licence` the front end refuses to render an image whose licence is not
 *             cleared. The legacy library is full of stock and scraped logos of
 *             unknown provenance, and this stops that repeating.
 */
export const imageWithMeta = defineType({
  name: 'imageWithMeta',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  components: { input: LicensedImageInput },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe what the image shows, for people using a screen reader. Leave empty only if the image is purely decorative and marked as such below.',
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as { decorative?: boolean } | undefined
          if (parent?.decorative) return true
          if (!value || value.trim().length === 0) {
            return 'Alt text is required unless the image is marked decorative.'
          }
          if (/^(image|photo|picture|logo)( of)?$/i.test(value.trim())) {
            return 'Describe the actual content rather than using a generic word.'
          }
          return true
        }),
    }),
    defineField({
      name: 'decorative',
      title: 'Decorative only',
      type: 'boolean',
      initialValue: false,
      description:
        'Tick if the image adds nothing a screen reader user needs. It will be given an empty alt attribute.',
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({
      name: 'attribution',
      title: 'Public credit line',
      type: 'string',
      description:
        'Shown with the image when a public credit is required. The licensed-image assistant fills this automatically.',
    }),
    defineField({
      name: 'licence',
      title: 'Licence and provenance',
      type: 'object',
      description: 'Required before the image will appear on the public site.',
      fields: [
        defineField({
          name: 'holder',
          title: 'Copyright holder',
          type: 'string',
          description: 'Who owns this image, e.g. "Happy Education", "University of Sussex", "Getty".',
        }),
        defineField({
          name: 'terms',
          title: 'Licence terms',
          type: 'string',
          description: 'e.g. "Owned outright", "Supplied by the school for marketing use", "Stock licence #12345".',
        }),
        defineField({
          name: 'sourceUrl',
          title: 'Original source page',
          type: 'url',
          validation: (rule) => rule.uri({ scheme: ['https'] }),
          description:
            'The page where the image and its reuse terms can be checked. Filled automatically for Wikimedia imports.',
        }),
        defineField({
          name: 'licenceUrl',
          title: 'Licence deed',
          type: 'url',
          validation: (rule) => rule.uri({ scheme: ['https'] }),
          description: 'Direct link to the applicable licence when one exists.',
        }),
        defineField({
          name: 'reviewedAt',
          title: 'Source checked at',
          type: 'datetime',
          readOnly: true,
          description: 'Recorded automatically when the image assistant imports a suggestion.',
        }),
        defineField({
          name: 'cleared',
          title: 'Cleared for publication',
          type: 'boolean',
          initialValue: false,
          description:
            'Tick only when you are certain Happy Education has the right to publish this image. Unticked images are not shown on the site.',
        }),
      ],
    }),
  ],
  preview: {
    select: { media: 'asset', title: 'alt', cleared: 'licence.cleared' },
    prepare({ media, title, cleared }) {
      return {
        media,
        title: title || 'Untitled image',
        subtitle: cleared ? 'Licence cleared' : 'Not cleared — will not appear on the site',
      }
    },
  },
})
