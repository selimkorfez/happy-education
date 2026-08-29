import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'

interface Choice {
  section: SectionKey
  slug?: { en: string; tr: string }
  tone: string
  mark: string
  en: { title: string; body: string; tag: string }
  tr: { title: string; body: string; tag: string }
}

const CHOICES: Choice[] = [
  {
    section: 'universities',
    tone: 'bg-brand-soft',
    mark: 'UNI',
    en: { title: 'University study', body: 'Build a degree shortlist around your course, location, budget and application profile.', tag: 'Bachelor’s + Master’s' },
    tr: { title: 'Üniversite eğitimi', body: 'Bölüm, şehir, bütçe ve akademik profiliniz etrafında gerçekçi bir üniversite listesi oluşturun.', tag: 'Lisans + Yüksek lisans' },
  },
  {
    section: 'languageSchools',
    tone: 'bg-sky-soft',
    mark: 'Aa',
    en: { title: 'Language education', body: 'Compare destinations and course formats for general English, exams or longer-term study.', tag: '2 weeks → academic year' },
    tr: { title: 'Dil eğitimi', body: 'Genel İngilizce, sınav hazırlığı veya uzun dönem eğitim için ülke ve kurs seçeneklerini karşılaştırın.', tag: '2 hafta → akademik yıl' },
  },
  {
    section: 'summerSchools',
    tone: 'bg-mint-soft',
    mark: 'SUM',
    en: { title: 'Summer programmes', body: 'Find supervised summer experiences that combine learning, activities and international student life.', tag: 'Younger students' },
    tr: { title: 'Yaz okulları', body: 'Eğitim, aktiviteler ve uluslararası öğrenci deneyimini bir araya getiren gözetimli yaz programlarını keşfedin.', tag: 'Genç öğrenciler' },
  },
  {
    section: 'boardingSchools',
    tone: 'bg-lilac-soft',
    mark: 'SCH',
    en: { title: 'Boarding school', body: 'Compare academic fit, boarding life, pastoral care and admissions routes for school-age students.', tag: 'GCSE + A Level routes' },
    tr: { title: 'Yatılı okul', body: 'Okul çağındaki öğrenciler için akademik uyum, yatılı yaşam, destek ve kabul yollarını karşılaştırın.', tag: 'GCSE + A Level yolları' },
  },
  {
    section: 'tours',
    tone: 'bg-[#fff7dd]',
    mark: 'GO',
    en: { title: 'Group travel', body: 'Educational group experiences with a structured itinerary, coordination and practical support.', tag: 'Schools + groups' },
    tr: { title: 'Grup seyahatleri', body: 'Planlı program, koordinasyon ve pratik destek içeren eğitim odaklı grup deneyimleri.', tag: 'Okullar + gruplar' },
  },
  {
    section: 'guides',
    slug: { en: 'applications', tr: 'basvuru-sureci' },
    tone: 'bg-[#f1f5f0]',
    mark: 'APP',
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

export function HelpMeChoose({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]

  return (
    <section className="border-b border-border/70 bg-white py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-strong">{heading.kicker}</p>
            <h2 className="mt-3 max-w-[13ch] text-[length:var(--text-4xl)] text-fg">{heading.title}</h2>
          </div>
          <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted lg:justify-self-end">{heading.body}</p>
        </div>

        <ul className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CHOICES.map((choice, index) => {
            const copy = choice[locale]
            const href = choice.slug
              ? docPath(locale, choice.section, choice.slug[locale])
              : sectionPath(locale, choice.section)

            return (
              <li key={copy.title}>
                <Link
                  href={href}
                  className="group relative flex min-h-[17rem] h-full flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-6 no-underline shadow-[0_10px_35px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1.5 hover:border-brand/25 hover:shadow-[0_22px_55px_rgba(35,35,38,0.10)]"
                >
                  <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full ${choice.tone} transition-transform duration-500 group-hover:scale-125`} />

                  <div className="relative flex items-start justify-between gap-4">
                    <span className={`grid h-12 min-w-12 place-items-center rounded-2xl ${choice.tone} px-3 text-xs font-black tracking-[0.06em] text-fg`}>
                      {choice.mark}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-fg-muted">0{index + 1}</span>
                  </div>

                  <div className="relative mt-auto pt-10">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-fg-muted">{copy.tag}</p>
                    <h3 className="mt-2 text-2xl font-bold text-fg">{copy.title}</h3>
                    <p className="mt-3 max-w-[43ch] text-sm leading-relaxed text-fg-muted">{copy.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
                      {heading.explore}
                      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
