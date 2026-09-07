import { MediaFrame } from '@/components/ui/MediaFrame'
import { licensedMediaForPlace } from '@/lib/media/licensed-media'
import type { Locale } from '@/lib/i18n/config'

interface CityPreview {
  title: string
  slug: string
}

const COPY = {
  en: {
    label: 'Student city',
    location: 'Location preview',
    unavailable: 'Photo being verified',
  },
  tr: {
    label: 'Öğrenci şehri',
    location: 'Konum önizlemesi',
    unavailable: 'Fotoğraf doğrulanıyor',
  },
} as const

/**
 * Visual city overview for destination pages.
 *
 * These cards are intentionally not links. The current information architecture
 * does not have standalone city routes, and the previous implementation produced
 * dead /country/city URLs that looked interactive but could 404. A city becomes a
 * link only when a genuine city route exists.
 */
export function CityPreviewGrid({ locale, cities }: { locale: Locale; cities: CityPreview[] }) {
  const copy = COPY[locale]

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cities.map((city) => {
        const image = licensedMediaForPlace(city.title)
        return (
          <li key={city.slug}>
            <article className="group flex h-full min-h-[15rem] flex-col overflow-hidden rounded-[1.4rem] border border-border/70 bg-white shadow-[0_10px_30px_rgba(35,35,38,0.055)]">
              {image ? (
                <MediaFrame
                  external={image}
                  alt={image.alt}
                  width={760}
                  height={520}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="aspect-[3/2] w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.035]"
                />
              ) : (
                <div className="grid aspect-[3/2] place-items-center bg-paper-sunk px-5 text-center text-xs font-bold uppercase tracking-[0.08em] text-fg-muted">
                  {copy.unavailable}
                </div>
              )}
              <div className="mt-auto p-5">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-brand-strong">
                  {copy.label}
                </p>
                <h3 className="mt-1.5 text-xl font-bold text-fg">{city.title}</h3>
                <p className="mt-2 text-sm font-medium text-fg-muted">{copy.location}</p>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
