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
    <section className="on-ink relative isolate overflow-hidden border-b border-white/10 bg-ink-surface pb-12 pt-2 sm:pb-16 lg:pb-20">
      <AmbientBackdrop tone="dark" />
      <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[56%] bg-[radial-gradient(circle_at_26%_48%,rgba(244,116,38,0.18),transparent_58%)]" />

      <Container>
        <div className="relative z-10">
          <Breadcrumbs locale={locale} crumbs={crumbs} tone="dark" />
        </div>
      </Container>

      <Container>
        <div className="relative z-10">
          <Reveal className="grid gap-6 py-3 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:py-7">
            <div>
              {eyebrow ? (
                <span className="inline-flex items-center gap-2 border border-white/15 bg-white/7 px-4 py-2.5 text-sm font-black text-fg-on-ink backdrop-blur-md">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
                  {eyebrow}
                </span>
              ) : null}
              <h1 className="mt-5 max-w-[14ch] text-[clamp(3rem,6.2vw,5.8rem)] font-black leading-[0.94] text-fg-on-ink">
                {title}
              </h1>
            </div>
            {intro ? (
              <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted-on-ink lg:justify-self-end lg:pb-2 lg:text-xl">{intro}</p>
            ) : null}
          </Reveal>

          {hasVisual ? (
            <Reveal delay={90} className="relative mt-8 lg:mt-10">
              <div aria-hidden="true" className="absolute -inset-4 bg-gradient-to-br from-brand/16 via-white/8 to-blue-300/12 blur-2xl" />
              <div data-page-hero-banner className="he-shine-card group relative overflow-hidden border border-white/16 bg-white/8 p-2 shadow-[0_34px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-3">
                <MediaFrame
                  image={clearedImage}
                  external={resolvedExternalImage}
                  local={localImage ?? null}
                  alt={resolvedAlt}
                  width={1800}
                  height={720}
                  priority
                  sizes="(max-width: 1536px) 100vw, 1440px"
                  className="aspect-[4/3] min-h-[18rem] w-full overflow-hidden sm:aspect-[16/7] lg:aspect-[21/8] [&_img]:transition-transform [&_img]:duration-[1100ms] group-hover:[&_img]:scale-[1.035]"
                  placeholderLabel={`Hero image: ${title}`}
                />
              </div>
              <div aria-hidden="true" className="absolute -bottom-4 -left-4 -z-10 h-24 w-24 bg-brand/24 sm:-left-6" />
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
