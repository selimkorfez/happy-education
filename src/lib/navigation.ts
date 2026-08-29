import { docPath, sectionPath, type Locale } from '@/lib/i18n/config'
import { t, type MessageKey } from '@/lib/i18n/dictionary'

/** Navigation model. */

export interface NavLink {
  label: string
  href: string
  description?: string
}

export interface NavGroup {
  key: string
  label: string
  href: string
  children?: NavLink[]
}

const COUNTRY_SLUG = {
  uk: { en: 'united-kingdom', tr: 'ingiltere' },
  ireland: { en: 'ireland', tr: 'irlanda' },
  usa: { en: 'united-states', tr: 'amerika' },
  canada: { en: 'canada', tr: 'kanada' },
  australia: { en: 'australia', tr: 'avustralya' },
  newZealand: { en: 'new-zealand', tr: 'yeni-zelanda' },
  malta: { en: 'malta', tr: 'malta' },
} as const

export type CountryKey = keyof typeof COUNTRY_SLUG

export function countrySlug(locale: Locale, key: CountryKey): string {
  return COUNTRY_SLUG[key][locale]
}

const UNIVERSITY_COUNTRIES: CountryKey[] = ['uk', 'usa', 'canada', 'ireland', 'australia', 'newZealand']
const LANGUAGE_COUNTRIES: CountryKey[] = ['uk', 'ireland', 'usa', 'canada', 'malta', 'australia']

const COUNTRY_LABEL: Record<CountryKey, Record<Locale, string>> = {
  uk: { en: 'United Kingdom', tr: 'İngiltere' },
  ireland: { en: 'Ireland', tr: 'İrlanda' },
  usa: { en: 'United States', tr: 'Amerika' },
  canada: { en: 'Canada', tr: 'Kanada' },
  australia: { en: 'Australia', tr: 'Avustralya' },
  newZealand: { en: 'New Zealand', tr: 'Yeni Zelanda' },
  malta: { en: 'Malta', tr: 'Malta' },
}

export function countryLabel(locale: Locale, key: CountryKey): string {
  return COUNTRY_LABEL[key][locale]
}

function countryLinks(locale: Locale, section: 'universities' | 'languageSchools', keys: CountryKey[]): NavLink[] {
  return keys.map((key) => ({ label: countryLabel(locale, key), href: docPath(locale, section, countrySlug(locale, key)) }))
}

function insightsLinks(locale: Locale): NavLink[] {
  // The parent Insights item already links to the article index. Keeping the index
  // again as a child created a duplicate href and made keyboard/navigation tests
  // ambiguous, so the disclosure now contains only the two distinct community hubs.
  return [
    {
      label: locale === 'tr' ? 'Sosyal medyadan' : 'From our socials',
      href: docPath(locale, 'insights', locale === 'tr' ? 'sosyal-medyadan' : 'from-our-socials'),
      description: locale === 'tr' ? 'Seçili paylaşımlar ve arkalarındaki fikir.' : 'Selected posts with the thinking and context behind them.',
    },
    {
      label: locale === 'tr' ? 'Öğrenci hikâyeleri' : 'Student stories',
      href: docPath(locale, 'insights', locale === 'tr' ? 'ogrenci-hikayeleri' : 'student-stories'),
      description: locale === 'tr' ? 'İzin alınarak yayımlanan doğrulanmış deneyimler.' : 'Verified experiences published with the student’s permission.',
    },
  ]
}

export function primaryNav(locale: Locale): NavGroup[] {
  const label = (key: MessageKey) => t(locale, key)

  return [
    {
      key: 'universities',
      label: label('nav.universities'),
      href: sectionPath(locale, 'universities'),
      children: countryLinks(locale, 'universities', UNIVERSITY_COUNTRIES),
    },
    {
      key: 'languageSchools',
      label: label('nav.languageSchools'),
      href: sectionPath(locale, 'languageSchools'),
      children: countryLinks(locale, 'languageSchools', LANGUAGE_COUNTRIES),
    },
    {
      key: 'summerSchools',
      label: label('nav.summerSchools'),
      href: sectionPath(locale, 'summerSchools'),
      children: [
        { label: locale === 'tr' ? 'Bireysel yaz okulları' : 'Individual summer schools', href: docPath(locale, 'summerSchools', locale === 'tr' ? 'bireysel' : 'individual') },
        { label: locale === 'tr' ? 'Grup yaz okulları' : 'Group summer schools', href: docPath(locale, 'summerSchools', locale === 'tr' ? 'grup' : 'group') },
        { label: locale === 'tr' ? 'Veliler için rehber' : 'Guidance for parents', href: docPath(locale, 'guides', locale === 'tr' ? 'veli-rehberi' : 'parent-guide') },
      ],
    },
    { key: 'boardingSchools', label: label('nav.boardingSchools'), href: sectionPath(locale, 'boardingSchools') },
    { key: 'tours', label: label('nav.tours'), href: sectionPath(locale, 'tours') },
    { key: 'insights', label: label('nav.insights'), href: sectionPath(locale, 'insights'), children: insightsLinks(locale) },
    { key: 'about', label: label('nav.about'), href: sectionPath(locale, 'about') },
  ]
}

export function footerNav(locale: Locale) {
  return {
    explore: primaryNav(locale).map(({ label, href }) => ({ label, href })),
    company: [
      { label: t(locale, 'nav.about'), href: sectionPath(locale, 'about') },
      { label: t(locale, 'nav.contact'), href: sectionPath(locale, 'contact') },
      { label: t(locale, 'nav.consultation'), href: sectionPath(locale, 'consultation') },
      { label: t(locale, 'nav.insights'), href: sectionPath(locale, 'insights') },
      { label: locale === 'tr' ? 'Sosyal medyadan' : 'From our socials', href: docPath(locale, 'insights', locale === 'tr' ? 'sosyal-medyadan' : 'from-our-socials') },
      { label: locale === 'tr' ? 'Öğrenci hikâyeleri' : 'Student stories', href: docPath(locale, 'insights', locale === 'tr' ? 'ogrenci-hikayeleri' : 'student-stories') },
    ],
  }
}
