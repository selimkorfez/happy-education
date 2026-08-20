import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { brandImage } from '@/lib/media/library'

/**
 * Homepage hero.
 *
 * An asymmetric editorial split rather than centred text on a plain ground: the
 * headline column carries the argument, the image column carries the place. The
 * text sits on the page background, not on the photograph, so legibility never
 * depends on a scrim and the composition holds even before photography lands.
 *
 * The credential line under the actions is the trust evidence, and every part of
 * it is independently verifiable at Companies House. No counters, no "500+",
 * nothing that animates.
 */

const COPY = {
  en: {
    eyebrow: 'Study abroad advisers, London',
    heading: 'Education beyond borders',
    lead: 'Choosing where to study abroad is a decision about money, time and the shape of the next few years. We help students and families work through the options honestly, then handle the applications properly.',
    primary: 'Speak to an adviser',
    secondary: 'Explore destinations',
    imageAlt:
      'Students walking through a London university campus, the kind of setting Happy Education places students into',
  },
  tr: {
    eyebrow: 'Londra merkezli yurt dışı eğitim danışmanlığı',
    heading: 'Sınırların ötesinde eğitim',
    lead: 'Yurt dışında nerede okuyacağınıza karar vermek; bütçe, zaman ve önünüzdeki birkaç yıl demek. Öğrencilerle ve ailelerle seçenekleri açık açık konuşuyor, ardından başvuru sürecini baştan sona yürütüyoruz.',
    primary: 'Danışmanla görüşün',
    secondary: 'Ülkeleri inceleyin',
    imageAlt:
      "Londra'da bir üniversite kampüsünde yürüyen öğrenciler",
  },
} as const

export function HomeHero({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const hero = brandImage('heroLondon')
  const founded = publicValue(BUSINESS.foundedYear)
  const companyNumber = publicValue(BUSINESS.companyNumber)

  return (
    <section className="border-b border-border bg-paper">
      <Container width="wide" className="lg:px-0">
        <div className="grid items-stretch gap-0 lg:grid-cols-12">
          {/* Argument column */}
          <div className="order-2 py-12 sm:py-16 lg:order-1 lg:col-span-7 lg:py-24 lg:pl-10 lg:pr-16 xl:col-span-6 xl:pr-20">
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
              {copy.eyebrow}
            </p>

            <h1 className="mt-4 text-[length:var(--text-5xl)] font-semibold leading-[1.08] tracking-[-0.02em] text-fg">
              {copy.heading}
            </h1>

            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-fg-muted">{copy.lead}</p>

            <div className="mt-9 flex flex-wrap gap-3 [&>a]:whitespace-nowrap">
              <Link
                href={sectionPath(locale, 'consultation')}
                className="inline-flex min-h-12 items-center rounded-[3px] bg-brand-strong px-7 text-base font-semibold text-white no-underline transition-colors duration-150 hover:bg-brand-pressed"
              >
                {copy.primary}
              </Link>
              <Link
                href={sectionPath(locale, 'universities')}
                className="inline-flex min-h-12 items-center rounded-[3px] border border-border-input px-7 text-base font-semibold text-fg no-underline transition-colors duration-150 hover:bg-paper-sunk"
              >
                {copy.secondary}
              </Link>
            </div>

            {/* Verifiable credentials only. */}
            {founded && companyNumber ? (
              <p className="mt-10 border-t border-border pt-5 text-sm text-fg-muted">
                {locale === 'tr' ? (
                  <>
                    {founded} yılından bu yana Birleşik Krallık&apos;ta tescilli.{' '}
                    <span className="whitespace-nowrap">Şirket no. {companyNumber}</span>.
                  </>
                ) : (
                  <>
                    A UK-registered company since {founded}.{' '}
                    <span className="whitespace-nowrap">Company no. {companyNumber}</span>.
                  </>
                )}
              </p>
            ) : null}
          </div>

          {/* Place column — bleeds to the viewport edge on large screens. */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-6">
            <MediaFrame
              local={hero.src}
              alt={hero.alt}
              width={1800}
              height={1200}
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="aspect-[16/10] h-full w-full lg:aspect-auto lg:min-h-[34rem]"
            />
          </div>
        </div>
      </Container>
    </section>
  )
}
