import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { countrySlug, countryLabel, type CountryKey } from '@/lib/navigation'
import { BRAND_IMAGES, DESTINATION_IMAGE } from '@/lib/media/library'

interface Destination {
  key: CountryKey
  section: Extract<SectionKey, 'universities' | 'languageSchools'>
  en: { note: string; cue: string }
  tr: { note: string; cue: string }
}

const DESTINATIONS: Destination[] = [
  {
    key: 'uk',
    section: 'universities',
    en: { note: 'Universities, language schools, boarding and summer programmes', cue: 'The widest mix' },
    tr: { note: 'Üniversite, dil okulu, yatılı okul ve yaz programları', cue: 'En geniş seçenek' },
  },
  {
    key: 'ireland',
    section: 'universities',
    en: { note: 'English-taught degrees and year-round language study', cue: 'Compact + welcoming' },
    tr: { note: 'İngilizce lisans programları ve yıl boyu dil eğitimi', cue: 'Kompakt + sıcak' },
  },
  {
    key: 'usa',
    section: 'universities',
    en: { note: 'Undergraduate and graduate study across a wide range of states', cue: 'Big-campus energy' },
    tr: { note: 'Farklı eyaletlerde lisans ve lisansüstü eğitim', cue: 'Büyük kampüs deneyimi' },
  },
  {
    key: 'canada',
    section: 'universities',
    en: { note: 'Degree programmes and language schools in major cities', cue: 'City + campus balance' },
    tr: { note: 'Büyük şehirlerde lisans programları ve dil okulları', cue: 'Şehir + kampüs dengesi' },
  },
  {
    key: 'malta',
    section: 'languageSchools',
    en: { note: 'English language study in a Mediterranean setting', cue: 'Learn by the sea' },
    tr: { note: 'Akdeniz ikliminde İngilizce dil eğitimi', cue: 'Deniz kenarında öğren' },
  },
  {
    key: 'australia',
    section: 'universities',
    en: { note: 'Universities and long-stay English courses', cue: 'Study further away' },
    tr: { note: 'Üniversiteler ve uzun süreli İngilizce kursları', cue: 'Daha uzağı keşfet' },
  },
]

const HEADING = {
  en: {
    kicker: 'Pick a place',
    title: 'Where could this take you?',
    body: 'Browse a few of the destinations students ask us about most. Each one opens into study options, cities and practical next steps.',
    all: 'Browse all options',
    open: 'Open destination',
  },
  tr: {
    kicker: 'Bir yer seçin',
    title: 'Bu yol sizi nereye götürebilir?',
    body: 'Öğrencilerin en sık sorduğu ülkelerden bazılarını keşfedin. Her sayfada eğitim seçenekleri, şehirler ve sonraki adımlar var.',
    all: 'Tüm seçeneklere bak',
    open: 'Ülkeyi aç',
  },
} as const

export function DestinationIndex({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-ink-surface py-16 text-fg-on-ink sm:py-20 lg:py-24">
      <div aria-hidden="true" className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <Container>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-on-ink">{heading.kicker}</p>
            <h2 className="mt-3 max-w-[14ch] text-[length:var(--text-4xl)] text-fg-on-ink">{heading.title}</h2>
            <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-fg-muted-on-ink">{heading.body}</p>
          </div>
          <Link
            href={docPath(locale, 'universities')}
            className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/8 px-5 text-sm font-bold text-fg-on-ink no-underline transition hover:bg-white/14"
          >
            {heading.all} <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>
      </Container>

      <div className="scroll-x relative z-10 mt-10 pb-2" tabIndex={0} role="group" aria-label={heading.title}>
        <ul className="flex w-max gap-4 px-5 sm:px-7 lg:px-10">
          {DESTINATIONS.map((destination) => {
            const label = countryLabel(locale, destination.key)
            const href = docPath(locale, destination.section, countrySlug(locale, destination.key))
            const imageKey = DESTINATION_IMAGE[destination.key]
            const image = imageKey ? BRAND_IMAGES[imageKey] : null
            const copy = destination[locale]

            return (
              <li key={destination.key} className="w-[18rem] shrink-0 sm:w-[21rem]">
                <Link
                  href={href}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[1.6rem] bg-ink-surface-soft no-underline shadow-[0_20px_55px_rgba(0,0,0,0.18)]"
                >
                  <MediaFrame
                    local={image?.src ?? null}
                    alt={image?.alt ?? label}
                    decorative
                    width={1350}
                    height={1800}
                    sizes="(max-width: 640px) 18rem, 21rem"
                    className="absolute inset-0 h-full w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.055]"
                    placeholderLabel={`Destination photograph: ${label}`}
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/12 to-black/5" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="inline-flex rounded-full bg-white/14 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">{copy.cue}</span>
                    <h3 className="mt-3 text-3xl font-bold text-white">{label}</h3>
                    <p className="mt-2 max-w-[30ch] text-sm leading-relaxed text-white/78">{copy.note}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">
                      {heading.open}
                      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1.5">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
