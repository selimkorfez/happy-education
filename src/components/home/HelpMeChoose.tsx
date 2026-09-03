import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'

interface Choice {
  section: SectionKey
  slug?: { en: string; tr: string }
  tone: string
  glow: string
  mark: string
  span: string
  en: { title: string; body: string; tag: string }
  tr: { title: string; body: string; tag: string }
}

const CHOICES: Choice[] = [
  {
    section: 'universities',
    tone: 'bg-brand-soft',
    glow: 'from-brand/22',
    mark: 'UNI',
    span: 'xl:col-span-7',
    en: { title: 'University study', body: 'Build a degree shortlist around your course, location, budget and application profile.', tag: 'Bachelor’s + Master’s' },
    tr: { title: 'Üniversite eğitimi', body: 'Bölüm, şehir, bütçe ve akademik profiliniz etrafında gerçekçi bir üniversite listesi oluşturun.', tag: 'Lisans + Yüksek lisans' },
  },
  {
    section: 'languageSchools',
    tone: 'bg-sky-soft',
    glow: 'from-blue-300/30',
    mark: 'Aa',
    span: 'xl:col-span-5',
    en: { title: 'Language education', body: 'Compare destinations and course formats for general English, exams or longer-term study.', tag: '2 weeks → academic year' },
    tr: { title: 'Dil eğitimi', body: 'Genel İngilizce, sınav hazırlığı veya uzun dönem eğitim için ülke ve kurs seçeneklerini karşılaştırın.', tag: '2 hafta → akademik yıl' },
  },
  {
    section: 'summerSchools',
    tone: 'bg-mint-soft',
    glow: 'from-emerald-200/30',
    mark: 'SUM',
    span: 'xl:col-span-4',
    en: { title: 'Summer programmes', body: 'Find supervised summer experiences that combine learning, activities and international student life.', tag: 'Younger students' },
    tr: { title: 'Yaz okulları', body: 'Eğitim, aktiviteler ve uluslararası öğrenci deneyimini bir araya getiren gözetimli yaz programlarını keşfedin.', tag: 'Genç öğrenciler' },
  },
  {
    section: 'boardingSchools',
    tone: 'bg-lilac-soft',
    glow: 'from-violet-200/30',
    mark: 'SCH',
    span: 'xl:col-span-4',
    en: { title: 'Boarding school', body: 'Compare academic fit, boarding life, pastoral care and admissions routes for school-age students.', tag: 'GCSE + A Level routes' },
    tr: { title: 'Yatılı okul', body: 'Okul çağındaki öğrenciler için akademik uyum, yatılı yaşam, destek ve kabul yollarını karşılaştırın.', tag: 'GCSE + A Level yolları' },
  },
  {
    section: 'tours',
    tone: 'bg-[#fff7dd]',
    glow: 'from-amber-200/35',
    mark: 'GO',
    span: 'xl:col-span-4',
    en: { title: 'Group travel', body: 'Educational group experiences with a structured itinerary, coordination and practical support.', tag: 'Schools + groups' },
    tr: { title: 'Grup seyahatleri', body: 'Planlı program, koordinasyon ve pratik destek içeren eğitim odaklı grup deneyimleri.', tag: 'Okullar + gruplar' },
  },
  {
    section: 'guides',
    slug: { en: 'applications', tr: 'basvuru-sureci' },
    tone: 'bg-[#f1f5f0]',
    glow: 'from-slate-200/45',
    mark: 'APP',
    span: 'xl:col-span-12',
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
    <section className="relative overflow-hidden border-b border-border/70 bg-white py-16 sm:py-20 lg:py-24">
      <div aria-hidden="true" className="absolute -right-32 top-16 h-72 w-72 rounded-full bg-sky-soft blur-3xl" />
      <Container>
        <Reveal>
          <div className="relative grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-brand-strong">{heading.kicker}</p>
              <h2 className="mt-3 max-w-[13ch] text-[length:var(--text-4xl)] text-fg">{heading.title}</h2>
            </div>
            <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted lg:justify-self-end">{heading.body}</p>
          </div>
        </Reveal>

        <ul className="relative mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          {CHOICES.map((choice, index) => {
            const copy = choice[locale]
            const href = choice.slug
              ? docPath(locale, choice.section, choice.slug[locale])
              : sectionPath(locale, choice.section)

            return (
              <li key={copy.title} className={choice.span}>
                <Reveal delay={Math.min(index * 70, 280)} className="h-full">
                  <Link
                    href={href}
                    className="he-shine-card group relative flex min-h-[17rem] h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/70 bg-card p-6 no-underline shadow-[0_10px_34px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1.5 hover:border-brand/24 hover:shadow-[0_24px_64px_rgba(35,35,38,0.11)] sm:p-7"
                  >
                    <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br ${choice.glow} via-transparent to-transparent opacity-40 transition-opacity duration-500 group-hover:opacity-75`} />
                    <div aria-hidden="true" className={`absolute -right-14 -top-14 h-44 w-44 rounded-full ${choice.tone} blur-[1px] transition duration-700 group-hover:scale-125 group-hover:-translate-x-2 group-hover:translate-y-2`} />
                    <div aria-hidden="true" className="absolute bottom-0 right-3 text-[clamp(4rem,9vw,8.5rem)] font-black leading-none tracking-[-0.08em] text-fg/[0.035] transition-transform duration-700 group-hover:-translate-x-2">
                      {choice.mark}
                    </div>

                    <div className="relative flex items-start justify-between gap-4">
                      <span className={`grid h-12 min-w-12 place-items-center rounded-2xl ${choice.tone} px-3 text-xs font-black tracking-[0.06em] text-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]`}>
                        {choice.mark}
                      </span>
                      <span className="rounded-full border border-border/70 bg-white/75 px-2.5 py-1 text-[0.68rem] font-black tabular-nums text-fg-muted backdrop-blur-sm">0{index + 1}</span>
                    </div>

                    <div className="relative mt-auto max-w-[44rem] pt-10">
                      <p className="text-xs font-black uppercase tracking-[0.1em] text-fg-muted">{copy.tag}</p>
                      <h3 className="mt-2 text-2xl font-bold text-fg sm:text-[1.65rem]">{copy.title}</h3>
                      <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-fg-muted">{copy.body}</p>
                      <span className="mt-5 inline-flex min-h-8 items-center gap-2 text-sm font-black text-brand-strong">
                        {heading.explore}
                        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
