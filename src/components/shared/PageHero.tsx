import type { StaticImageData } from 'next/image'
import { Container } from '@/components/ui/Container'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop'
import { Reveal } from '@/components/ui/Reveal'
import type { LicensedExternalImage } from '@/lib/media/licensed-media'
import { licensedMediaForEditorialVariant } from '@/lib/media/editorial-media'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import type { SectionVisualVariant } from './SectionVisual'
import type { Locale } from '@/lib/i18n/config'

/** Shared interior hero with cleared CMS, verified open-licence or editorial photography. */
export function PageHero({
  locale,
  crumbs,
  eyebrow,
  title,
  intro,
  image,
  externalImage,
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
  externalImage?: LicensedExternalImage | null
  localImage?: StaticImageData | null
  imageAlt?: string
  visualVariant?: SectionVisualVariant
}) {
  const clearedImage = image?.licence?.cleared === true ? image : null
  const clearedExternal = externalImage?.cleared === true ? externalImage : null
  const editorialImage = !clearedImage && !clearedExternal && !localImage && visualVariant
    ? licensedMediaForEditorialVariant(visualVariant, ...(crumbs.length > 2 ? [title] : []))
    : null
  const resolvedExternalImage = clearedImage ? null : clearedExternal ?? editorialImage
  const hasVisual = Boolean(clearedImage || resolvedExternalImage || localImage)
  const resolvedAlt = clearedImage ? imageAlt ?? clearedImage.alt ?? title : resolvedExternalImage?.alt ?? imageAlt ?? title

  return (
    <section className="relative isolate overflow-hidden border-b border-border/70 bg-[#fffefd] pb-11 pt-2 sm:pb-15 lg:pb-18">
      <AmbientBackdrop tone="light" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-paper/80 to-transparent" />

      <Container>
        <div className="relative z-10">
          <Breadcrumbs locale={locale} crumbs={crumbs} />
        </div>
      </Container>

      <Container>
        <div className={`relative z-10 grid items-center gap-9 ${hasVisual ? 'lg:grid-cols-[0.9fr_1.1fr] lg:gap-16' : ''}`}>
          <Reveal className="py-3 lg:py-8">
            {eyebrow ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/75 bg-white/78 px-4 py-2.5 text-sm font-black text-brand-strong shadow-[0_8px_24px_rgba(35,35,38,0.04)] backdrop-blur-md">
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
          </Reveal>

          {hasVisual ? (
            <Reveal delay={90} className="relative">
              <div aria-hidden="true" className="absolute -inset-4 rounded-[2.4rem] bg-gradient-to-br from-brand/12 via-white/10 to-blue-300/12 blur-2xl" />
              <div className="he-shine-card group relative overflow-hidden rounded-[1.9rem] border border-white/80 bg-white/76 p-2.5 shadow-[0_28px_75px_rgba(35,35,38,0.13)] backdrop-blur-xl sm:p-3">
                <MediaFrame
                  image={clearedImage}
                  external={resolvedExternalImage}
                  local={localImage ?? null}
                  alt={resolvedAlt}
                  width={1100}
                  height={760}
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="aspect-[10/7] w-full overflow-hidden rounded-[1.45rem] [&_img]:transition-transform [&_img]:duration-[1100ms] group-hover:[&_img]:scale-[1.04]"
                  placeholderLabel={`Hero image: ${title}`}
                />
              </div>
              <div aria-hidden="true" className="absolute -bottom-4 -left-4 -z-10 h-24 w-24 rounded-[1.5rem] bg-brand-soft sm:-left-6" />
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
