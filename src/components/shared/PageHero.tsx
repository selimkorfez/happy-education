import type { StaticImageData } from 'next/image'
import { Container } from '@/components/ui/Container'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import { SectionVisual, type SectionVisualVariant } from './SectionVisual'
import { BRAND_IMAGES } from '@/lib/media/library'
import type { Locale } from '@/lib/i18n/config'

/** Shared interior hero with either cleared photography or a page-specific editorial visual. */
export function PageHero({
  locale,
  crumbs,
  eyebrow,
  title,
  intro,
  image,
  localImage,
  imageAlt,
  visualVariant,
}: {
  locale: Locale
  crumbs: Crumb[]
  eyebrow?: string
  title: string
  intro?: string
  image?: MediaSource | null
  localImage?: StaticImageData | null
  imageAlt?: string
  visualVariant?: SectionVisualVariant
}) {
  const hasExplicitMedia = image !== undefined || localImage !== undefined
  const hasVisual = hasExplicitMedia || Boolean(visualVariant)
  const shouldUseAiFallback = hasExplicitMedia && !image && !localImage && !visualVariant
  const resolvedLocalImage = localImage ?? (shouldUseAiFallback ? BRAND_IMAGES.libraryInterior.src : null)
  const resolvedAlt = imageAlt ?? (shouldUseAiFallback ? BRAND_IMAGES.libraryInterior.alt : title)

  return (
    <section className="he-gradient-wash relative overflow-hidden border-b border-border/70 pb-10 pt-2 sm:pb-14 lg:pb-16">
      <div aria-hidden="true" className="absolute -right-28 top-8 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <Container>
        <Breadcrumbs locale={locale} crumbs={crumbs} />
      </Container>

      <Container>
        <div className={`relative z-10 grid items-center gap-8 ${hasVisual ? 'lg:grid-cols-[0.95fr_1.05fr] lg:gap-14' : ''}`}>
          <div className="py-3 lg:py-8">
            {eyebrow ? (
              <span className="he-pill text-brand-strong">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
                {eyebrow}
              </span>
            ) : null}
            <h1 className="mt-5 max-w-[14ch] text-[length:var(--text-4xl)] font-bold text-fg lg:text-[length:var(--text-5xl)]">
              {title}
            </h1>
            {intro ? (
              <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-fg-muted">{intro}</p>
            ) : null}
          </div>

          {hasVisual ? (
            <div className="relative">
              <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white p-2 shadow-[0_24px_65px_rgba(35,35,38,0.13)] sm:p-3">
                {visualVariant && !image && !localImage ? (
                  <SectionVisual variant={visualVariant} label={imageAlt ?? `${title} illustration`} locale={locale} />
                ) : (
                  <MediaFrame
                    image={image ?? null}
                    local={resolvedLocalImage}
                    alt={resolvedAlt}
                    width={1100}
                    height={760}
                    priority
                    sizes="(max-width: 1024px) 100vw, 52vw"
                    className="aspect-[10/7] w-full overflow-hidden rounded-[1.35rem] [&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-[1.025]"
                    placeholderLabel={`Hero image: ${title}`}
                  />
                )}
              </div>
              <div aria-hidden="true" className="absolute -bottom-4 -left-4 -z-10 h-24 w-24 rounded-[1.5rem] bg-brand-soft sm:-left-6" />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
