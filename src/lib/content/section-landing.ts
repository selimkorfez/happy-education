import type { Locale } from '@/lib/i18n/config'

export interface LandingSection {
  title: string
  paragraphs?: string[]
  items?: string[]
}

export interface LandingContent {
  eyebrow: string
  title: string
  intro: string[]
  sections: LandingSection[]
}

export type LandingKey = 'boardingSchools' | 'summerIndividual' | 'summerGroup'

export function mergeLandingContent(
  fallback: LandingContent,
  editable?: {
    landingEyebrow?: string
    landingTitle?: string
    landingIntro?: string[]
    landingSections?: LandingSection[]
  } | null,
): LandingContent {
  return {
    eyebrow: editable?.landingEyebrow?.trim() || fallback.eyebrow,
    title: editable?.landingTitle?.trim() || fallback.title,
    intro: editable?.landingIntro?.filter(Boolean).length ? editable.landingIntro.filter(Boolean) : fallback.intro,
    sections: editable?.landingSections?.filter((section) => section.title?.trim()).length
      ? editable.landingSections.filter((section) => section.title?.trim())
      : fallback.sections,
  }
}

/**
 * Editorial fallback for the three legacy landing pages. The same shape is exposed
 * in Sanity, so editors can replace any of this copy without a code change.
 */
export function sectionLandingFallback(locale: Locale, key: LandingKey): LandingContent {
  return COPY[locale][key]
}

const COPY: Record<Locale, Record<LandingKey, LandingContent>> = {
  tr: {
    boardingSchools: {
      eyebrow: 'Birleşik Krallık’ta eğitim',
      title: 'Nitelikli eğitim ve güvenli bir gelecek',
      intro: [
        'İngiltere’de yatılı okul eğitimi; güçlü akademik programları, öğrencinin bağımsızlığını geliştiren yaşam düzeni ve üniversiteye hazırlık desteğini bir araya getirir.',
        'Okul seçerken akademik uyumun yanında konaklama, gözetim, öğrenci desteği, sosyal ortam ve başvuru koşullarını birlikte değerlendirmek gerekir.',
      ],
      sections: [
        {
          title: 'Neden İngiltere’de yatılı okul?',
          items: [
            'A Level, GCSE ve IB gibi uluslararası tanınırlığı olan programlar',
            'Üniversite hazırlığı ve düzenli akademik destek',
            'Spor, sanat, liderlik ve girişimcilik etkinlikleri',
            'Günün her saatinde gözetim ve öğrenci desteği',
            'Farklı ülkelerden öğrencilerle çok kültürlü bir topluluk',
          ],
        },
        {
          title: 'Yatılı okullarda sunulan olanaklar',
          items: [
            'Modern ve düzenli konaklama seçenekleri',
            'Sosyal ve kültürel etkinlik programları',
            'Spor alanları ve fiziksel gelişim imkânları',
            'Akademik kaynaklar, etüt ve bireysel destek',
            'Sağlık ve psikolojik destek hizmetleri',
            'Uluslararası öğrenci toplulukları',
          ],
        },
      ],
    },
    summerIndividual: {
      eyebrow: 'Bireysel katılım',
      title: 'İngiltere’de yaz okulu deneyimi',
      intro: [
        'Bireysel yaz okulları, öğrencinin kendi yaş grubundaki uluslararası katılımcılarla İngilizce öğrenmesini; konaklama, aktivite ve gezileri okulun gözetiminde deneyimlemesini sağlar.',
        'Program seçerken yaş aralığı, tarih, konaklama düzeni, ders içeriği ve gözetim şartları birlikte değerlendirilmelidir.',
      ],
      sections: [
        {
          title: 'Neden İngiltere yaz okulu?',
          items: [
            'İngilizceyi günlük yaşam içinde kullanma fırsatı',
            'Tarihî ve kültürel açıdan zengin şehirleri keşfetme',
            'Gözetimli ve düzenli kampüs ortamı',
            'Yaşa uygun konaklama seçenekleri',
            'İngilizce dersleri ve akademik içerik',
            'Spor, gezi ve sosyal etkinlikler',
            'Uluslararası arkadaşlıklar kurma',
            'Günün her saatinde öğrenci desteği',
            'Ailelerle düzenli iletişim ve bilgilendirme',
          ],
        },
      ],
    },
    summerGroup: {
      eyebrow: 'Refakatli programlar',
      title: 'Birlikte öğrenin, birlikte keşfedin',
      intro: [
        'Grup yaz okulları; İngilizce derslerini, atölyeleri, spor ve sosyal etkinlikleri, şehir gezilerini ve uluslararası öğrenci ortamını önceden planlanmış bir programda birleştirir.',
        'Gruplar refakatçi eşliğinde seyahat eder. Kesin tarihler, kontenjan, kampüs, konaklama ve gezi programı grup büyüklüğüne göre teyit edilir.',
      ],
      sections: [
        {
          title: 'İngiltere grup yaz okulları',
          paragraphs: [
            'İngiltere programları, İngilizce eğitiminin yanında Londra, Oxford, Cambridge ve farklı üniversite şehirlerinde kültürel geziler sunabilir.',
            'Kampüs ve rota seçimi öğrencilerin yaşı, grubun hedefi, seyahat tarihleri ve müsaitliğe göre planlanır.',
          ],
        },
        {
          title: 'Amerika grup yaz okulları',
          paragraphs: [
            'Amerika programları dil eğitimi, kampüs yaşamı ve şehir deneyimini bir araya getiren grup seçenekleri sunabilir.',
            'New York, Boston, Miami veya Los Angeles gibi seçeneklerde içerik ve konaklama her grup için ayrıca doğrulanır.',
          ],
        },
      ],
    },
  },
  en: {
    boardingSchools: {
      eyebrow: 'Education in the United Kingdom',
      title: 'A strong education and a supported future',
      intro: [
        'British boarding schools bring together established academic programmes, a residential environment that builds independence, and structured preparation for university.',
        'A good shortlist considers accommodation, supervision, student support, community and admissions requirements alongside academic fit.',
      ],
      sections: [
        {
          title: 'Why choose a boarding school in the UK?',
          items: [
            'Internationally recognised A Level, GCSE and IB programmes',
            'University preparation and regular academic support',
            'Sport, arts, leadership and enterprise activities',
            'Round-the-clock supervision and student support',
            'A multicultural community of students from many countries',
          ],
        },
        {
          title: 'What boarding schools can provide',
          items: [
            'Modern residential accommodation',
            'Social and cultural activity programmes',
            'Sports facilities and physical activities',
            'Academic resources, supervised study and individual support',
            'Health and wellbeing support',
            'International student communities',
          ],
        },
      ],
    },
    summerIndividual: {
      eyebrow: 'Independent participation',
      title: 'A summer-school experience in the UK',
      intro: [
        'Individual summer schools let students learn English with international peers while the school arranges accommodation, activities, excursions and on-site supervision.',
        'Age range, dates, accommodation, teaching and supervision should all be checked together before choosing a programme.',
      ],
      sections: [
        {
          title: 'Why choose a UK summer school?',
          items: [
            'Use English in everyday situations',
            'Explore cities with a rich history and culture',
            'Study in a structured, supervised campus environment',
            'Choose age-appropriate accommodation',
            'Combine English lessons with academic content',
            'Join sports, excursions and social activities',
            'Make friends in an international community',
            'Receive round-the-clock student support',
            'Keep families informed throughout the programme',
          ],
        },
      ],
    },
    summerGroup: {
      eyebrow: 'Accompanied programmes',
      title: 'Learn and explore together',
      intro: [
        'Group summer schools combine English lessons, workshops, sport, social activities, excursions and an international student environment in a planned programme.',
        'Groups travel with a group leader. Exact dates, capacity, campus, accommodation and excursions are confirmed for the size and needs of each group.',
      ],
      sections: [
        {
          title: 'UK group summer schools',
          paragraphs: [
            'UK programmes can combine English teaching with cultural visits in London, Oxford, Cambridge and other university cities.',
            'The campus and itinerary are selected around student ages, the group’s objectives, travel dates and availability.',
          ],
        },
        {
          title: 'US group summer schools',
          paragraphs: [
            'US programmes can combine language learning, campus life and city experiences for organised groups.',
            'Content and accommodation for destinations such as New York, Boston, Miami or Los Angeles are confirmed separately for each group.',
          ],
        },
      ],
    },
  },
}

export const LEGACY_GROUP_CAMPUSES = [
  'North London Grammar School',
  'Queen Mary University of London',
  'London King’s College',
  'University College London',
  'Kingston University London',
  'Abbey College Cambridge',
  'University of Greenwich',
  'Brunel University London, Uxbridge',
  'University of Kent',
  'University of Westminster London',
  'Middlesex University London',
  'Tufts University',
  'Los Angeles',
  'New York – St Peter’s University',
  'Barry University',
] as const
