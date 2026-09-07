import type { Metadata } from 'next'
import { siteUrl } from '@/lib/env'
import { t } from '@/lib/i18n/dictionary'
import {
  HREFLANG,
  LOCALES,
  sectionSegment,
  type Locale,
  type SectionKey,
} from '@/lib/i18n/config'
import {
  routePath,
  socialContentSlug,
  studentStoriesSlug,
  type ResolvedRoute,
} from '@/lib/routing'

interface SectionCopy {
  title: Record<Locale, string>
  description: Record<Locale, string>
}

export const SECTION_COPY: Partial<Record<SectionKey, SectionCopy>> = {
  universities: {
    title: { en: 'Universities abroad', tr: 'Yurt dışında üniversiteler' },
    description: {
      en: 'Country guides, entry requirements, costs and the application timeline for studying at university abroad.',
      tr: 'Yurt dışında üniversite eğitimi için ülke rehberleri, kabul koşulları, maliyetler ve başvuru takvimi.',
    },
  },
  languageSchools: {
    title: { en: 'Language schools', tr: 'Dil okulları' },
    description: {
      en: 'Accredited English language schools by country and city, with course types, accommodation and start dates.',
      tr: 'Ülke ve şehir bazında İngilizce dil okulları; kurs türleri, konaklama ve başlangıç tarihleri.',
    },
  },
  summerSchools: {
    title: { en: 'Summer schools', tr: 'Yaz okulları' },
    description: {
      en: 'Supervised summer programmes for younger students, individually or in a group, with accommodation and activities included.',
      tr: 'Küçük yaş grupları için gözetimli yaz programları; bireysel ya da grup, konaklama ve aktiviteler dâhil.',
    },
  },
  boardingSchools: {
    title: { en: 'Boarding schools', tr: 'Yatılı okullar' },
    description: {
      en: 'UK boarding schools, curriculum routes, age guidance and how the admissions process works.',
      tr: "İngiltere'de yatılı okullar, müfredat seçenekleri, yaş rehberi ve başvuru süreci.",
    },
  },
  tours: {
    title: { en: 'Educational tours', tr: 'Eğitim turları' },
    description: {
      en: 'Organised educational tours for schools and groups, with itineraries, inclusions and supervision arrangements.',
      tr: 'Okullar ve gruplar için eğitim turları; program, dâhil olan hizmetler ve refakat düzenlemeleri.',
    },
  },
  insights: {
    title: { en: 'Insights', tr: 'Blog' },
    description: {
      en: 'Practical guidance on studying abroad from the Happy Education advisory team.',
      tr: 'Happy Education danışman ekibinden yurt dışı eğitim üzerine pratik rehberler.',
    },
  },
  guides: {
    title: { en: 'Student guide', tr: 'Öğrenci rehberi' },
    description: {
      en: 'How applications, accommodation, costs and preparation actually work, explained step by step.',
      tr: 'Başvuru, konaklama, maliyet ve hazırlık süreçleri adım adım anlatılıyor.',
    },
  },
  services: {
    title: { en: 'Our services', tr: 'Hizmetlerimiz' },
    description: {
      en: 'How Happy Education supports students from first conversation through to arrival.',
      tr: 'Happy Education, ilk görüşmeden varışa kadar öğrencilere nasıl destek oluyor?',
    },
  },
  legal: {
    title: { en: 'Legal information', tr: 'Yasal bilgiler' },
    description: {
      en: 'Privacy, cookies, terms, payments, refunds, accessibility, complaints and safeguarding.',
      tr: 'Gizlilik, çerezler, kullanım koşulları, ödemeler, iade, erişilebilirlik, şikâyet ve çocuk koruma.',
    },
  },
}

const FIXED_PAGE_COPY: Record<'about' | 'contact' | 'consultation', SectionCopy> = {
  about: {
    title: { en: 'About Happy Education', tr: 'Happy Education hakkında' },
    description: {
      en: 'A London-registered education consultancy advising students and families on studying abroad since 2018.',
      tr: "2018'den bu yana öğrencilere ve ailelere yurt dışı eğitim konusunda danışmanlık veren, Londra'da tescilli bir eğitim danışmanlığı.",
    },
  },
  contact: {
    title: { en: 'Contact us', tr: 'İletişim' },
    description: {
      en: 'Speak to an adviser about universities, language schools, summer programmes or boarding schools abroad.',
      tr: 'Yurt dışında üniversite, dil okulu, yaz okulu veya yatılı okul için bir danışmanla görüşün.',
    },
  },
  consultation: {
    title: { en: 'Book a consultation', tr: 'Ön görüşme planlayın' },
    description: {
      en: 'A free first conversation about what you want to study, where it is realistic to apply, and what it will cost.',
      tr: 'Ne okumak istediğinizi, hangi başvuruların gerçekçi olduğunu ve maliyeti konuşacağımız ücretsiz ilk görüşme.',
    },
  },
}

function absoluteUrl(locale: Locale, section: SectionKey, parts: string[]): string {
  const segments = [sectionSegment(locale, section), ...parts].filter(Boolean)
  return `${siteUrl}/${locale}/${segments.join('/')}`
}

function base(locale: Locale, canonical: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_GB',
      url: canonical,
      siteName: t(locale, 'brand.name'),
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function buildRouteMetadata(locale: Locale, route: ResolvedRoute): Metadata {
  switch (route.kind) {
    case 'sectionIndex': {
      const copy = SECTION_COPY[route.section]
      const canonical = absoluteUrl(locale, route.section, [])
      const title = copy?.title[locale] ?? t(locale, 'brand.name')
      const description = copy?.description[locale] ?? t(locale, 'meta.defaultDescription')
      const languages: Record<string, string> = {}
      for (const other of LOCALES) languages[HREFLANG[other]] = absoluteUrl(other, route.section, [])
      languages['x-default'] = absoluteUrl('en', route.section, [])
      return { ...base(locale, canonical, title, description), alternates: { canonical, languages } }
    }

    case 'fixedPage': {
      const copy = FIXED_PAGE_COPY[route.pageKey]
      const section = route.pageKey as SectionKey
      const canonical = absoluteUrl(locale, section, [])
      const title = route.doc?.seo?.title ?? route.doc?.title ?? copy.title[locale]
      const description = route.doc?.seo?.description ?? route.doc?.intro ?? copy.description[locale]
      const languages: Record<string, string> = {}
      for (const other of LOCALES) languages[HREFLANG[other]] = absoluteUrl(other, section, [])
      languages['x-default'] = absoluteUrl('en', section, [])
      return { ...base(locale, canonical, title, description), alternates: { canonical, languages } }
    }

    case 'destination':
    case 'institution': {
      const doc = route.doc
      const canonical = absoluteUrl(locale, route.section, routePath(locale, route))
      const title = doc.seo?.title ?? doc.title
      const description = doc.seo?.description ?? ('intro' in doc && doc.intro ? doc.intro : `${doc.title} — ${t(locale, 'brand.name')}`)
      return { ...base(locale, canonical, title, description), robots: doc.seo?.noIndex ? { index: false, follow: true } : undefined }
    }

    case 'summerListing': {
      const canonical = absoluteUrl(locale, 'summerSchools', [route.formatSlug])
      const isGroup = route.format === 'group'
      const title = isGroup ? (locale === 'tr' ? 'Grup yaz okulları' : 'Group summer schools') : (locale === 'tr' ? 'Bireysel yaz okulları' : 'Individual summer schools')
      const description = locale === 'tr' ? 'Konaklama, dersler ve sosyal program dâhil gözetimli yaz okulu programları.' : 'Supervised summer school programmes including accommodation, lessons and a social programme.'
      return base(locale, canonical, title, description)
    }

    case 'summerProgramme': {
      const canonical = absoluteUrl(locale, 'summerSchools', [route.formatSlug, route.doc.slug])
      return {
        ...base(locale, canonical, route.doc.seo?.title ?? route.doc.title, route.doc.seo?.description ?? `${route.doc.title} — ${t(locale, 'brand.name')}`),
        robots: route.doc.seo?.noIndex ? { index: false, follow: true } : undefined,
      }
    }

    case 'tour': {
      const canonical = absoluteUrl(locale, 'tours', [route.doc.slug])
      return base(locale, canonical, route.doc.seo?.title ?? route.doc.title, route.doc.seo?.description ?? `${route.doc.title} — ${t(locale, 'brand.name')}`)
    }

    case 'article': {
      const doc = route.doc
      const canonical = absoluteUrl(locale, 'insights', [doc.slug])
      const title = doc.seo?.title ?? doc.title
      const description = doc.seo?.description ?? doc.excerpt ?? doc.title
      return {
        ...base(locale, canonical, title, description),
        openGraph: {
          type: 'article',
          locale: locale === 'tr' ? 'tr_TR' : 'en_GB',
          url: canonical,
          siteName: t(locale, 'brand.name'),
          title,
          description,
          publishedTime: doc.publishedAt,
          modifiedTime: doc.updatedAt ?? doc.publishedAt,
          authors: doc.author?.name ? [doc.author.name] : undefined,
        },
        robots: doc.seo?.noIndex ? { index: false, follow: true } : undefined,
      }
    }

    case 'socialHub': {
      const canonical = absoluteUrl(locale, 'insights', [route.slug])
      const title = locale === 'tr' ? 'Sosyal medyadan | Happy Education' : 'From our socials | Happy Education'
      const description = locale === 'tr'
        ? 'Happy Education sosyal medya içerikleri; her paylaşımın ne anlattığı ve neden hazırlandığına dair ek bağlamla birlikte.'
        : 'Selected Happy Education social content with extra context on what each post is about and why it was created.'
      const languages: Record<string, string> = {}
      for (const other of LOCALES) languages[HREFLANG[other]] = absoluteUrl(other, 'insights', [socialContentSlug(other)])
      languages['x-default'] = absoluteUrl('en', 'insights', [socialContentSlug('en')])
      return { ...base(locale, canonical, title, description), alternates: { canonical, languages } }
    }

    case 'studentStories': {
      const canonical = absoluteUrl(locale, 'insights', [route.slug])
      const title = locale === 'tr' ? 'Öğrenci hikâyeleri | Happy Education' : 'Student stories | Happy Education'
      const description = locale === 'tr'
        ? 'Doğrulanmış ve yayın izni kaydedilmiş Happy Education öğrenci deneyimleri.'
        : 'Verified Happy Education student experiences published only after publication permission has been recorded.'
      const languages: Record<string, string> = {}
      for (const other of LOCALES) languages[HREFLANG[other]] = absoluteUrl(other, 'insights', [studentStoriesSlug(other)])
      languages['x-default'] = absoluteUrl('en', 'insights', [studentStoriesSlug('en')])
      return { ...base(locale, canonical, title, description), alternates: { canonical, languages } }
    }

    case 'prose': {
      const canonical = absoluteUrl(locale, route.section, [route.doc.slug])
      return base(locale, canonical, route.doc.seo?.title ?? route.doc.title, route.doc.seo?.description ?? route.doc.summary ?? route.doc.title)
    }

    case 'legal': {
      const canonical = absoluteUrl(locale, 'legal', [route.slug])
      const title = route.doc?.seo?.title ?? route.doc?.title ?? route.legalKey
      return {
        ...base(
          locale,
          canonical,
          title,
          route.doc?.seo?.description ?? (locale === 'tr' ? `${title} — Happy Education yasal bilgilendirme.` : `${title} — Happy Education legal information.`),
        ),
        robots: route.doc?.solicitorApproved ? undefined : { index: false, follow: true },
      }
    }
  }
}
