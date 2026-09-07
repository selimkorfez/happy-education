import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { docPath, type Locale } from '@/lib/i18n/config'
import { listApprovedTestimonials } from '@/lib/sanity/queries/community'

/**
 * Homepage social proof. Returns nothing until real, permissioned testimonials exist;
 * there is no placeholder quote and no legacy testimonial is assumed reusable.
 */
export async function StudentVoices({ locale }: { locale: Locale }) {
  const stories = await listApprovedTestimonials(locale, 3)
  if (stories.length === 0) return null
  const copy = COPY[locale]

  return (
    <section className="border-y border-border/70 bg-white py-14 sm:py-18 lg:py-20">
      <Container>
        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{copy.eyebrow}</p>
            <h2 className="mt-2 max-w-[16ch] text-[length:var(--text-3xl)] font-bold text-fg">{copy.title}</h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-[58ch] text-base leading-relaxed text-fg-muted">{copy.intro}</p>
            <Link href={docPath(locale, 'insights', locale === 'tr' ? 'ogrenci-hikayeleri' : 'student-stories')} className="mt-4 inline-flex min-h-11 items-center font-bold text-brand-strong underline underline-offset-4">
              {copy.allStories} →
            </Link>
          </div>
        </div>

        <ul className="mt-9 grid gap-5 lg:grid-cols-3">
          {stories.map((story) => (
            <li key={story._id}>
              <article className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-border/70 bg-paper shadow-[0_10px_30px_rgba(35,35,38,0.05)]">
                {story.photo ? (
                  <MediaFrame image={story.photo} alt={story.photo.alt ?? story.studentName} width={700} height={520} sizes="(max-width: 1024px) 100vw, 33vw" className="aspect-[4/3] w-full" placeholderLabel={story.studentName} />
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  <span aria-hidden="true" className="text-4xl font-black leading-none text-brand/35">“</span>
                  <blockquote className="mt-2 text-base font-semibold leading-relaxed text-fg">{story.quote}</blockquote>
                  <div className="mt-auto pt-6">
                    <p className="font-bold text-fg">{story.studentName}</p>
                    {story.programme ? <p className="mt-1 text-sm text-fg-muted">{story.programme}</p> : null}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

const COPY = {
  en: {
    eyebrow: 'Student voices',
    title: 'What the experience felt like, in their words.',
    intro: 'Only verified student experiences with publication permission recorded in our CMS appear here.',
    allStories: 'Read student stories',
  },
  tr: {
    eyebrow: 'Öğrenci yorumları',
    title: 'Deneyimi kendi sözleriyle anlatıyorlar.',
    intro: 'Burada yalnızca doğrulanmış ve yayın izni içerik sistemimizde kayıtlı öğrenci deneyimleri görünür.',
    allStories: 'Öğrenci hikâyelerini okuyun',
  },
} as const
