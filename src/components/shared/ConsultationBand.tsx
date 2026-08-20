import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'

/**
 * Closing call to action.
 *
 * Concrete about what happens next rather than "ready to transform your future?".
 * It states what the conversation covers and what it costs, because the most
 * common reason a family does not enquire is not knowing either.
 */

const COPY = {
  en: {
    title: 'Talk it through with an adviser',
    body: 'A first conversation covers what you want to study, where it is realistic to apply, what it will cost and what the timeline looks like. It is free, and it does not commit you to anything.',
    primary: 'Book a consultation',
    secondary: 'Send us a question',
    or: 'Or call',
  },
  tr: {
    title: 'Bir danışmanla konuşun',
    body: 'İlk görüşmede ne okumak istediğinizi, hangi başvuruların gerçekçi olduğunu, maliyetin ne olacağını ve takvimin nasıl işlediğini konuşuruz. Ücretsizdir ve sizi hiçbir şeye bağlamaz.',
    primary: 'Ön görüşme planlayın',
    secondary: 'Sorunuzu iletin',
    or: 'Ya da arayın',
  },
} as const

export function ConsultationBand({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const phone = publicValue(BUSINESS.phone)

  return (
    <section className="on-ink bg-ink-surface py-16 text-fg-on-ink sm:py-20">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-[length:var(--text-4xl)] font-semibold text-fg-on-ink">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-fg-muted-on-ink">
              {copy.body}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="flex flex-wrap gap-3">
              <Link
                href={sectionPath(locale, 'consultation')}
                className="inline-flex min-h-12 items-center rounded-[3px] bg-brand px-7 text-base font-semibold text-fg no-underline transition-colors duration-150 hover:bg-brand-on-ink"
              >
                {copy.primary}
              </Link>
              <Link
                href={sectionPath(locale, 'contact')}
                className="inline-flex min-h-12 items-center rounded-[3px] border border-fg-muted-on-ink px-7 text-base font-semibold text-fg-on-ink no-underline transition-colors duration-150 hover:bg-ink-surface-soft"
              >
                {copy.secondary}
              </Link>
            </div>
            {phone ? (
              <p className="mt-5 text-sm text-fg-muted-on-ink">
                {copy.or}{' '}
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="text-brand-on-ink underline underline-offset-4"
                >
                  {phone}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
