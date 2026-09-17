import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { Reveal } from '@/components/ui/Reveal'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { EDITORIAL_PHOTOS } from '@/lib/media/editorial-photos'
import { localised, type RouteFinderItem, type SiteSettings } from '@/lib/sanity/queries/settings'

interface Choice {
  key: string
  section: SectionKey
  slug?: { en: string; tr: string }
  image: (typeof EDITORIAL_PHOTOS)[keyof typeof EDITORIAL_PHOTOS]
  en: { title: string; body: string; tag: string }
  tr: { title: string; body: string; tag: string }
}

const CHOICES: Choice[] = [
  {
    key: 'universities',
    section: 'universities',
    image: EDITORIAL_PHOTOS['bright-library'],
    en: { title: 'University study', body: 'Build a degree shortlist around your course, location, budget and application profile.', tag: 'Bachelor’s + Master’s' },
    tr: { title: 'Üniversite eğitimi', body: 'Bölüm, şehir, bütçe ve akademik profiliniz etrafında gerçekçi bir üniversite listesi oluşturun.', tag: 'Lisans + Yüksek lisans' },
  },
  {
    key: 'languageSchools',
    section: 'languageSchools',
    image: EDITORIAL_PHOTOS['course-books'],
    en: { title: 'Language education', body: 'Compare destinations and course formats for general English, exams or longer-term study.', tag: '2 weeks → academic year' },
    tr: { title: 'Dil eğitimi', body: 'Genel İngilizce, sınav hazırlığı veya uzun dönem eğitim için ülke ve kurs seçeneklerini karşılaştırın.', tag: '2 hafta → akademik yıl' },
  },
  {
    key: 'summerSchools',
    section: 'summerSchools',
    image: EDITORIAL_PHOTOS['reading-break'],
    en: { title: 'Summer programmes', body: 'Find supervised summer experiences that combine learning, activities and international student life.', tag: 'Younger students' },
    tr: { title: 'Yaz okulları', body: 'Eğitim, aktiviteler ve uluslararası öğrenci deneyimini bir araya getiren gözetimli yaz programlarını keşfedin.', tag: 'Genç öğrenciler' },
  },
  {
    key: 'boardingSchools',
    section: 'boardingSchools',
    image: EDITORIAL_PHOTOS['heritage-library'],
    en: { title: 'Boarding school', body: 'Compare academic fit, boarding life, pastoral care and admissions routes for school-age students.', tag: 'GCSE + A Level routes' },
    tr: { title: 'Yatılı okul', body: 'Okul çağındaki öğrenciler için akademik uyum, yatılı yaşam, destek ve kabul yollarını karşılaştırın.', tag: 'GCSE + A Level yolları' },
  },
  {
    key: 'tours',
    section: 'tours',
    image: EDITORIAL_PHOTOS['travel-planning'],
    en: { title: 'Group travel', body: 'Educational group experiences with a structured itinerary, coordination and practical support.', tag: 'Schools + groups' },
    tr: { title: 'Grup seyahatleri', body: 'Planlı program, koordinasyon ve pratik destek içeren eğitim odaklı grup deneyimleri.', tag: 'Okullar + gruplar' },
  },
  {
    key: 'applications',
    section: 'guides',
    slug: { en: 'applications', tr: 'basvuru-sureci' },
    image: EDITORIAL_PHOTOS['planning-desk'],
    en: { title: 'Application support', body: 'Understand the moving parts: documents, offers, deposits, deadlines and what happens next.', tag: 'Step-by-step' },
    tr: { title: 'Başvuru desteği', body: 'Belgeler, kabuller, depozitolar, tarihler ve sonraki adımların nasıl ilerlediğini netleştirin.', tag: 'Adım adım' },
  },
]

const HEADING = {
  en: {
    kicker: 'Find your route',
    title: 'Start with what you want to do.',
    body: 'You do not need to know the exact school or city yet. Pick the kind of experience you are considering and explore from there.',
    explore: 'Explore',
  },
  tr: {
    kicker: 'Yolunuzu bulun',
    title: 'Ne yapmak istediğinizle başlayın.',
    body: 'Henüz okul veya şehri netleştirmiş olmanız gerekmiyor. Düşündüğünüz eğitim türünü seçin ve oradan ilerleyin.',
    explore: 'Keşfet',
  },
} as const

export function HelpMeChoose({ locale, settings }: { locale: Locale; settings?: SiteSettings | null }) {
  const fallbackHeading = HEADING[locale]
  const configured = settings?.routeFinder
  const heading = {
    ...fallbackHeading,
    kicker: localised(configured?.kicker, locale) ?? fallbackHeading.kicker,
    title: localised(configured?.title, locale) ?? fallbackHeading.title,
    body: localised(configured?.body, locale) ?? fallbackHeading.body,
  }
  const configuredByKey = new Map(
    (configured?.items ?? []).filter((item): item is RouteFinderItem & { key: string } => Boolean(item.key)).map((item) => [item.key, item]),
  )

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-surface py-16 text-fg-on-ink sm:py-20 lg:py-24">
      <div aria-hidden="true" className="absolute -right-32 top-16 h-72 w-72 rounded-full bg-brand/12 blur-3xl" />
      <Container>
        <Reveal>
          <div className="relative grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-brand-on-ink">{heading.kicker}</p>
              <h2 className="mt-3 max-w-[13ch] text-[length:var(--text-4xl)] text-fg-on-ink">{heading.title}</h2>
            </div>
            <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted-on-ink lg:justify-self-end">{heading.body}</p>
          </div>
        </Reveal>

        <ul className="relative mt-12 grid gap-5 lg:grid-cols-2">
          {CHOICES.map((choice, index) => {
            const fallbackCopy = choice[locale]
            const item = configuredByKey.get(choice.key)
            const copy = {
              tag: localised(item?.tag, locale) ?? fallbackCopy.tag,
              title: localised(item?.title, locale) ?? fallbackCopy.title,
              body: localised(item?.body, locale) ?? fallbackCopy.body,
              link: localised(item?.linkLabel, locale) ?? heading.explore,
            }
            const defaultHref = choice.slug
              ? docPath(locale, choice.section, choice.slug[locale])
              : sectionPath(locale, choice.section)
            const href = safeInternalPath(localised(item?.href, locale)) ?? defaultHref
            const cmsImage = item?.image?.licence?.cleared === true ? item.image : null

            return (
              <li key={choice.key}>
                <Reveal delay={Math.min(index * 55, 275)} className="h-full">
                  <article data-route-card={choice.key} className="he-route-card group relative min-h-[20rem] h-full overflow-hidden border border-white/14 bg-ink-surface shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-[0_28px_68px_rgba(0,0,0,0.3)]">
                    <div className="absolute inset-0">
                      <MediaFrame
                        image={cmsImage}
                        external={cmsImage ? null : choice.image}
                        alt={cmsImage?.alt ?? choice.image.alt}
                        width={1100}
                        height={660}
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="h-full w-full [&_img]:transition-transform [&_img]:duration-[1000ms] group-hover:[&_img]:scale-[1.045]"
                      />
                    </div>
                    <div aria-hidden="true" className="he-route-image-gradient absolute inset-0" />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/12" />

                    <div className="relative z-10 flex min-h-[20rem] max-w-[78%] flex-col p-6 sm:max-w-[64%] sm:p-8">
                      <p className="text-xs font-black uppercase tracking-[0.11em] text-brand-on-ink">{copy.tag}</p>
                      <div className="mt-auto pt-12">
                        <h3 className="text-[1.75rem] font-black text-white sm:text-[2rem]">{copy.title}</h3>
                        <p className="mt-3 max-w-[34ch] text-sm font-semibold leading-relaxed text-white/78 sm:text-base">{copy.body}</p>
                        <Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-2 border-b-2 border-brand pb-1 text-sm font-black text-white no-underline">
                          {copy.link}
                          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}

function safeInternalPath(value?: string): string | null {
  return value?.startsWith('/') && !value.startsWith('//') ? value : null
}
