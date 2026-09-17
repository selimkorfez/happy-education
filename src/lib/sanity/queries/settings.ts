import 'server-only'
import { cache } from 'react'
import { sanityFetch } from '@/lib/sanity/client'
import type { MediaSource } from '@/components/ui/MediaFrame'

export interface LocalisedCopy {
  en?: string
  tr?: string
}

export interface BrandAssets {
  logoOnLight?: MediaSource
  logoOnDark?: MediaSource
  logoMark?: MediaSource
  chatIcon?: MediaSource
  favicon?: MediaSource
}

export interface RouteFinderItem {
  key?: string
  tag?: LocalisedCopy
  title?: LocalisedCopy
  body?: LocalisedCopy
  linkLabel?: LocalisedCopy
  href?: LocalisedCopy
  image?: MediaSource
}

export type NavigationCopy = Partial<Record<
  | 'universities'
  | 'languageSchools'
  | 'summerSchools'
  | 'boardingSchools'
  | 'tours'
  | 'insights'
  | 'about'
  | 'contact'
  | 'consultation',
  LocalisedCopy
>>

export interface SocialAccount {
  platform?: string
  url?: string
}

export interface SiteSettings {
  tradingName?: string
  legalName?: string
  companyNumber?: string
  registeredOffice?: string
  phone?: string
  whatsapp?: string
  email?: string
  social?: SocialAccount[]
  brand?: BrandAssets
  colours?: {
    navy?: string
    orange?: string
    accentOrange?: string
  }
  interfaceCopy?: {
    headerTagline?: LocalisedCopy
    consultationLabel?: LocalisedCopy
    chatLabel?: LocalisedCopy
    chatMessage?: LocalisedCopy
    footerDescription?: LocalisedCopy
    navigation?: NavigationCopy
    footerKicker?: LocalisedCopy
    footerHeading?: LocalisedCopy
    footerCtaLabel?: LocalisedCopy
    footerServicesTitle?: LocalisedCopy
    footerCompanyTitle?: LocalisedCopy
    footerLegalTitle?: LocalisedCopy
    footerFollowTitle?: LocalisedCopy
    registeredOfficeLabel?: LocalisedCopy
    visaDisclaimer?: LocalisedCopy
  }
  homeHero?: {
    eyebrow?: LocalisedCopy
    heading?: LocalisedCopy
    highlightedHeading?: LocalisedCopy
    lead?: LocalisedCopy
    primaryLabel?: LocalisedCopy
    primaryHref?: LocalisedCopy
    secondaryLabel?: LocalisedCopy
    secondaryHref?: LocalisedCopy
    image?: MediaSource
    imageLabel?: LocalisedCopy
    imageCaption?: LocalisedCopy
  }
  routeFinder?: {
    kicker?: LocalisedCopy
    title?: LocalisedCopy
    body?: LocalisedCopy
    items?: RouteFinderItem[]
  }
}

const SETTINGS_QUERY = /* groq */ `
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    tradingName, legalName, companyNumber, registeredOffice,
    phone, whatsapp, email, social,
    brand{ logoOnLight, logoOnDark, logoMark, chatIcon, favicon },
    colours,
    interfaceCopy,
    homeHero,
    routeFinder{ ..., items[]{ ..., image } }
  }
`

/** One cached settings read is shared by the layout and homepage in a request. */
export const getSiteSettings = cache(async (): Promise<SiteSettings | null> =>
  sanityFetch<SiteSettings | null>(
    SETTINGS_QUERY,
    {},
    { tags: ['siteSettings'], revalidate: 900 },
    null,
  ),
)

export function localised(value: LocalisedCopy | undefined, locale: 'en' | 'tr'): string | undefined {
  return value?.[locale]?.trim() || undefined
}

export function localisedNavigation(value: NavigationCopy | undefined, locale: 'en' | 'tr') {
  return Object.fromEntries(
    Object.entries(value ?? {}).flatMap(([key, copy]) => {
      const resolved = localised(copy, locale)
      return resolved ? [[key, resolved]] : []
    }),
  )
}

const HEX = /^#[0-9a-f]{6}$/i

/** Only valid six-digit colours reach CSS custom properties. */
export function brandThemeStyle(settings: SiteSettings | null): Record<`--${string}`, string> {
  const colours = settings?.colours
  return {
    ...(colours?.navy && HEX.test(colours.navy) ? { '--he-brand-navy': colours.navy } : {}),
    ...(colours?.orange && HEX.test(colours.orange) ? { '--he-brand-orange': colours.orange } : {}),
    ...(colours?.accentOrange && HEX.test(colours.accentOrange)
      ? { '--he-brand-accent': colours.accentOrange }
      : {}),
  }
}
