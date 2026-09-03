import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop'
import { Reveal } from '@/components/ui/Reveal'
import { docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { countrySlug, countryLabel, type CountryKey } from '@/lib/navigation'
import { licensedMediaForDestination } from '@/lib/media/licensed-media'

interface Destination {
  key: CountryKey
  section: Extract<SectionKey, 'universities' | 'languageSchools'>
  en: { note: string; cue: string }
  tr: { note: string; cue: string }
}

const DESTINATIONS: Destination[] = [
  { key: 'uk', section: 'universities', en: { note: 'Universities, language schools, boarding and summer programmes', cue: 'The widest mix' }, tr: { note: 'Üniversite, dil okulu, yatılı okul ve yaz programları', cue: 'En geniş seçenek' } },
  { key: 'ireland', section: 'universities', en: { note: 'English-taught degrees and year-round language study', cue: 'Compact + welcoming' }, tr: { note: 'İngilizce lisans programları ve yıl boyu dil eğitimi', cue: 'Kompakt + sıcak' } },
  { key: 'usa', section: 'universities', en: { note: 'Undergraduate and graduate study across a wide range of states', cue: 'Big-campus energy' }, tr: { note: 'Farklı eyaletlerde lisans ve lisansüstü eğitim', cue: 'Büyük kampüs deneyimi' } },
  { key: 'canada', section: 'universities', en: { note: 'Degree programmes and language schools in major cities', cue: 'City + campus balance' }, tr: { note: 'Büyük şehirlerde lisans programları ve dil okulları', cue: 'Şehir + kampüs dengesi' } },
  { key: 'malta', section: 'languageSchools', en: { note: 'English language study in a Mediterranean setting', cue: 'Learn by the sea' }, tr: { note: 'Akdeniz ikliminde İngilizce dil eğitimi', cue: 'Deniz kenarında öğren' } },
  { key: 'australia', section: 'universities', en: { note: 'Universities and long-stay English courses', cue: 'Study further away' }, tr: { note: 'Üniversiteler ve uzun süreli İngilizce kursları', cue: 'Daha uzağı keşfet' } },
]

const HEADING = {
  en: { kicker: 'Pick a place', title: 'Where could this take you?', body: 'Browse a few of the destinations students ask us about most. Each one opens into study options, cities and practical next steps.', all: 'Browse all options', open: 'Open destination' },
  tr: { kicker: 'Bir yer seçin', title: 'Bu yol sizi nereye götürebilir?', body: 'Öğrencilerin en sık sorduğu ülkelerden bazılarını keşfedin. Her sayfada eğitim seçenekleri, şehirler ve sonraki adımlar var.', all: 'Tüm seçeneklere bak', open: 'Ülkeyi aç' },
} as const

export function DestinationIndex({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]

  return (
    <section className="on-ink relative isolate overflow-hidden border-b border-white/10 bg-ink-surface py-16 text-fg-on-ink sm:py-20 lg:py-24">
      <AmbientBackdrop tone="dark" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/16 to-transparent" />

      <Container>
        <Reveal>
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-brand-on-ink">{heading.kicker}</p>
              <h2 className="mt-3 max-w-[14ch] text-[length:var(--text-4xl)] text-white">{heading.title}</h2>
              <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-white/62">{heading.body}</p>
            </div>
            <Link href={docPath(locale, 'universities')} className="inline-flex min-h-11 items-center rounded-full border border-white/16 bg-white/8 px-5 text-sm font-black text-white no-underline backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/14">
              {heading.all} <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </Reveal>
      </Container>

      <div className="scroll-x relative z-10 mt-11 pb-4" tabIndex={0} role="group" aria-label={heading.title}>
        <ul className="flex w-max gap-4 px-5 sm:px-7 lg:gap-5 lg:px-10">
          {DESTINATIONS.map((destination, index) => {
            const label = countryLabel(locale, destination.key)
            const slug = countrySlug(locale, destination.key)
            const href = docPath(locale, destination.section, slug)
            const image = licensedMediaForDestination(slug) ?? licensedMediaForDestination(label)
            const copy = destination[locale]

            return (
              <li key={destination.key} className="w-[18rem] shrink-0 sm:w-[21rem]">
                <Reveal delay={Math.min(index * 80, 320)} className="h-full py-1">
                  <article className="he-shine-card group relative aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-surface-soft shadow-[0_24px_70px_rgba(0,0,0,0.25)] transition duration-500 hover:-translate-y-2 hover:border-white/22 hover:shadow-[0_34px_90px_rgba(0,0,0,0.34)]">
                    <MediaFrame
                      external={image}
                      alt={image?.alt ?? label}
                      decorative
                      width={1350}
                      height={1800}
                      sizes="(max-width: 640px) 18rem, 21rem"
                      className="absolute inset-0 h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-[1100ms] group-hover:[&_img]:scale-[1.075]"
                      placeholderLabel={`Destination photograph: ${label}`}
                    />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-black/5" />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-5 top-5 flex items-center justify-between text-white/76">
                      <span className="rounded-full border border-white/16 bg-black/18 px-2.5 py-1 text-[0.68rem] font-black tabular-nums backdrop-blur-md">0{index + 1}</span>
                      <span className="text-xs font-black uppercase tracking-[0.1em]">{copy.cue}</span>
                    </div>

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-6">
                      <h3 className="text-3xl font-bold text-white">{label}</h3>
                      <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-white/74">{copy.note}</p>
                      <Link href={href} className="pointer-events-auto mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/16 bg-white/12 px-4 text-sm font-black text-white no-underline backdrop-blur-md transition duration-300 hover:bg-white hover:text-fg">
                        {heading.open}
                        <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                      </Link>
                    </div>
                  </article>
                </Reveal>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
