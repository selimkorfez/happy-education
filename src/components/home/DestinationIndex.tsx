import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { docPath, type Locale } from '@/lib/i18n/config'
import { countrySlug, countryLabel, type CountryKey } from '@/lib/navigation'
import { BRAND_IMAGES, DESTINATION_IMAGE } from '@/lib/media/library'

/**
 * Destinations.
 *
 * A horizontal editorial rail rather than a grid of six identical rounded cards.
 * Each panel is portrait, image-led, with the country set in the display serif
 * over the page ground rather than over the photograph.
 *
 * Only countries with genuine content on the legacy site appear here. Destinations
 * are not invented to fill the row out.
 */

interface Destination {
  key: CountryKey
  en: { note: string }
  tr: { note: string }
}

const DESTINATIONS: Destination[] = [
  {
    key: 'uk',
    en: { note: 'Universities, language schools, boarding and summer programmes' },
    tr: { note: 'Üniversite, dil okulu, yatılı okul ve yaz programları' },
  },
  {
    key: 'ireland',
    en: { note: 'English-taught degrees and year-round language study' },
    tr: { note: "İngilizce lisans programları ve yıl boyu dil eğitimi" },
  },
  {
    key: 'usa',
    en: { note: 'Undergraduate and graduate study across a wide range of states' },
    tr: { note: 'Farklı eyaletlerde lisans ve lisansüstü eğitim' },
  },
  {
    key: 'canada',
    en: { note: 'Degree programmes and language schools in major cities' },
    tr: { note: 'Büyük şehirlerde lisans programları ve dil okulları' },
  },
  {
    key: 'malta',
    en: { note: 'English language study in a Mediterranean setting' },
    tr: { note: 'Akdeniz ikliminde İngilizce dil eğitimi' },
  },
  {
    key: 'australia',
    en: { note: 'Universities and long-stay English courses' },
    tr: { note: 'Üniversiteler ve uzun süreli İngilizce kursları' },
  },
]

const HEADING = {
  en: {
    kicker: 'Destinations',
    title: 'Where our students go',
    body: 'Each destination page covers the education system, entry requirements, realistic costs, accommodation and the application timeline, with the date it was last reviewed.',
    all: 'All destinations',
  },
  tr: {
    kicker: 'Ülkeler',
    title: 'Öğrencilerimiz nereye gidiyor?',
    body: 'Her ülke sayfasında eğitim sistemi, kabul koşulları, gerçekçi maliyetler, konaklama ve başvuru takvimi yer alır; sayfanın en son ne zaman gözden geçirildiği de belirtilir.',
    all: 'Tüm ülkeler',
  },
} as const

export function DestinationIndex({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]

  return (
    <section className="border-b border-border bg-paper-sunk py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
              {heading.kicker}
            </p>
            <h2 className="mt-3 text-[length:var(--text-4xl)] font-semibold text-fg">
              {heading.title}
            </h2>
            <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-fg-muted">
              {heading.body}
            </p>
          </div>
          <Link
            href={docPath(locale, 'universities')}
            className="text-base font-semibold text-brand-strong underline underline-offset-4 hover:decoration-2"
          >
            {heading.all}
          </Link>
        </div>
      </Container>

      {/*
       * Scrolls horizontally on narrow screens instead of stacking six tall
       * panels. The container is focusable so it can be scrolled by keyboard.
       */}
      <div
        className="scroll-x mt-10"
        tabIndex={0}
        role="group"
        aria-label={heading.title}
      >
        <ul className="flex w-max gap-5 px-5 sm:px-7 lg:px-10">
          {DESTINATIONS.map((destination, index) => {
            const label = countryLabel(locale, destination.key)
            const href = docPath(locale, 'universities', countrySlug(locale, destination.key))
            const imageKey = DESTINATION_IMAGE[destination.key]
            const image = imageKey ? BRAND_IMAGES[imageKey] : null

            return (
              <li key={destination.key} className="w-[16rem] shrink-0 sm:w-[18rem]">
                <Link href={href} className="group block no-underline">
                  <MediaFrame
                    local={image?.src ?? null}
                    alt={image?.alt ?? label}
                    // The country name is announced by the heading directly below,
                    // so the image itself is decorative in this composition.
                    decorative
                    width={1350}
                    height={1800}
                    sizes="(max-width: 640px) 16rem, 18rem"
                    className="aspect-[3/4] w-full"
                    placeholderLabel={`Destination photograph: ${label}`}
                  />
                  <div className="mt-4 flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className="font-display text-sm tabular-nums text-fg-muted"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-fg underline-offset-[6px] group-hover:underline group-hover:decoration-brand group-hover:decoration-2">
                      {label}
                    </h3>
                  </div>
                  <p className="mt-1.5 pl-8 text-sm leading-relaxed text-fg-muted">
                    {destination[locale].note}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
