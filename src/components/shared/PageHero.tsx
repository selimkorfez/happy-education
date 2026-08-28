import type { StaticImageData } from 'next/image'
import { Container } from '@/components/ui/Container'
import { MediaFrame, type MediaSource } from '@/components/ui/MediaFrame'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import type { Locale } from '@/lib/i18n/config'

/** Standard hero for interior pages. */
export function PageHero({
  locale,
  crumbs,
  eyebrow,
  title,
  intro,
  image,
  localImage,
  imageAlt,
}: {
  locale: Locale
  crumbs: Crumb[]
  eyebrow?: string
  title: string
  intro?: string
  image?: MediaSource | null
  localImage?: StaticImageData | null
  imageAlt?: string
}) {
  const hasMedia = image !== undefined || localImage !== undefined

  return (
    <section className="border-b border-border">
      <Container>
        <Breadcrumbs locale={locale} crumbs={crumbs} />
      </Container>

      <Container>
        <div className="grid gap-8 pb-12 lg:grid-cols-12 lg:gap-12 lg:pb-16">
          <div className="lg:col-span-7">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-3 text-[length:var(--text-4xl)] font-semibold text-fg">{title}</h1>
            {intro ? (
              <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-fg-muted">{intro}</p>
            ) : null}
          </div>

          {hasMedia ? (
            <div className="lg:col-span-5">
              <MediaFrame
                image={image ?? null}
                local={localImage ?? null}
                alt={imageAlt ?? title}
                width={800}
                height={560}
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="aspect-[10/7] w-full"
                placeholderLabel={`Hero image: ${title}`}
              />
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}
