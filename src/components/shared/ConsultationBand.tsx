import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'

const COPY = {
  en: {
    kicker: 'Not sure where to start?',
    title: 'Bring us the messy version of the plan.',
    body: 'You do not need a perfect shortlist before you speak to us. Tell us what you are considering and we will help turn it into practical next steps.',
    primary: 'Book a free conversation',
    secondary: 'Send a question',
    or: 'Prefer to call?',
    note: 'No pressure · No commitment · Clear next steps',
  },
  tr: {
    kicker: 'Nereden başlayacağınız net değil mi?',
    title: 'Planınız henüz dağınık olabilir.',
    body: 'Bizimle konuşmadan önce kusursuz bir kısa listeniz olması gerekmiyor. Ne düşündüğünüzü anlatın, birlikte uygulanabilir sonraki adımlara dönüştürelim.',
    primary: 'Ücretsiz görüşme planla',
    secondary: 'Soru gönder',
    or: 'Aramayı mı tercih edersiniz?',
    note: 'Baskı yok · Taahhüt yok · Net sonraki adımlar',
  },
} as const

export function ConsultationBand({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const phone = publicValue(BUSINESS.phone)

  return (
    <section className="bg-paper py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="on-ink relative overflow-hidden rounded-[2rem] bg-ink-surface px-6 py-10 text-fg-on-ink shadow-[0_28px_70px_rgba(35,35,38,0.18)] sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div aria-hidden="true" className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative grid gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-14">
            <div>
              <span className="inline-flex rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-brand-on-ink">
                {copy.kicker}
              </span>
              <h2 className="mt-5 max-w-[13ch] text-[length:var(--text-4xl)] font-bold text-fg-on-ink">{copy.title}</h2>
              <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-fg-muted-on-ink">{copy.body}</p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-white/55">{copy.note}</p>
            </div>

            <div className="lg:justify-self-end">
              <div className="flex flex-wrap gap-3">
                <Link
                  href={sectionPath(locale, 'consultation')}
                  className="inline-flex min-h-12 items-center rounded-full bg-brand px-7 text-base font-bold text-fg no-underline shadow-[0_12px_28px_rgba(244,116,38,0.22)] transition hover:-translate-y-0.5 hover:bg-brand-on-ink"
                >
                  {copy.primary} <span aria-hidden="true" className="ml-2">↗</span>
                </Link>
                <Link
                  href={sectionPath(locale, 'contact')}
                  className="inline-flex min-h-12 items-center rounded-full border border-white/20 bg-white/5 px-7 text-base font-bold text-fg-on-ink no-underline transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  {copy.secondary}
                </Link>
              </div>
              {phone ? (
                <p className="mt-5 text-sm text-fg-muted-on-ink">
                  {copy.or}{' '}
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="font-bold text-brand-on-ink underline underline-offset-4">
                    {phone}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
