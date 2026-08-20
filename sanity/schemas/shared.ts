import { defineField } from 'sanity'

/**
 * Fields shared by every localisable document.
 *
 * The locale model: each language is a SEPARATE document. Two documents that are
 * the same page in different languages point at the same `translationGroup`. That
 * is what lets /en/universities/united-kingdom and /tr/universiteler/ingiltere —
 * which share no URL segment — resolve to each other.
 *
 * Nothing here is machine-translated. A Turkish document is written in Turkish.
 */

export const LOCALE_OPTIONS = [
  { title: 'English', value: 'en' },
  { title: 'Türkçe', value: 'tr' },
]

export const localeField = defineField({
  name: 'locale',
  title: 'Language',
  type: 'string',
  options: { list: LOCALE_OPTIONS, layout: 'radio' },
  initialValue: 'tr',
  validation: (rule) => rule.required(),
})

export const translationGroupField = defineField({
  name: 'translationGroup',
  title: 'Translation group',
  type: 'reference',
  to: [{ type: 'translationGroup' }],
  description:
    'Links this document to its equivalent in the other language, so the language switcher lands on the right page.',
  weak: false,
})

/** Slug scoped per locale — the Turkish and English slugs differ deliberately. */
export function slugField(source = 'title') {
  return defineField({
    name: 'slug',
    title: 'URL slug',
    type: 'slug',
    options: {
      source,
      maxLength: 96,
      slugify: (input: string) =>
        input
          .toLowerCase()
          // Turkish characters transliterate to their ASCII equivalents so URLs
          // stay portable. "İngiltere" -> "ingiltere", not "i̇ngiltere".
          .replace(/ı/g, 'i')
          .replace(/İ/g, 'i')
          .replace(/ğ/g, 'g')
          .replace(/Ğ/g, 'g')
          .replace(/ş/g, 's')
          .replace(/Ş/g, 's')
          .replace(/ç/g, 'c')
          .replace(/Ç/g, 'c')
          .replace(/ö/g, 'o')
          .replace(/Ö/g, 'o')
          .replace(/ü/g, 'u')
          .replace(/Ü/g, 'u')
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 96),
    },
    validation: (rule) => rule.required(),
  })
}

export const seoField = defineField({ name: 'seo', title: 'SEO', type: 'seo' })

export const reviewField = defineField({
  name: 'review',
  title: 'Editorial review',
  type: 'reviewMeta',
})

/** Standard grouping so long documents stay navigable in the Studio. */
export const CONTENT_GROUPS = [
  { name: 'content', title: 'Content', default: true },
  { name: 'details', title: 'Details' },
  { name: 'related', title: 'Related' },
  { name: 'editorial', title: 'Editorial' },
  { name: 'seo', title: 'SEO' },
]

/** Preview subtitle that surfaces the locale and any outstanding editorial flag. */
export function localePreview(extra?: string) {
  return (locale?: string, flag?: string) => {
    const parts = [locale ? locale.toUpperCase() : 'no locale']
    if (extra) parts.push(extra)
    if (flag) parts.push('NEEDS REVIEW')
    return parts.join(' · ')
  }
}
