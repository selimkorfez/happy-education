import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { brandImage } from '@/lib/media/library'

const COPY = {
  en: {
    eyebrow: 'International education · London',
    headingA: 'Your next chapter',
    headingB: 'starts somewhere new.',
    lead:
      'We help students and families turn a huge study-abroad decision into a clear plan, from choosing the right route to getting the application over the line.',
    primary: 'Plan my next step',
    secondary: 'Explore study options',
    trusted: 'Straight-talking guidance',
    personal: 'Personal shortlist',
    supported: 'Application support',
    panelKicker: 'Start with the right questions',
    panelBody: 'Course, city, budget and goals first. The shortlist comes after.',
    imageLabel: 'Study abroad, made clearer',
  },
  tr: {
    eyebrow: 'Uluslararası eğitim · Londra',
    headingA: 'Yeni bölümünüz',
    headingB: 'başka bir yerde başlasın.',
    lead:
      'Yurt dışı eğitim kararını karmaşık bir süreç olmaktan çıkarıp net bir plana dönüştürüyoruz, doğru seçeneği bulmaktan başvuruyu tamamlamaya kadar.',
    primary: 'Sonraki adımımı planla',
    secondary: 'Eğitim seçeneklerini keşfet',
    trusted: 'Açık ve dürüst danışmanlık',
    personal: 'Kişisel kısa liste',
    supported: 'Başvuru desteği',
    panelKicker: 'Doğru sorularla başlayın',
    panelBody: 'Önce bölüm, şehir, bütçe ve hedefler. Kısa liste daha sonra.',
    imageLabel: 'Yurt dışı eğitimi daha anlaşılır hâle getirin',
  },
} as const

export function HomeHero({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const hero = brandImage('heroLondon')
  const founded = publicValue(BUSINESS.foundedYear)
  const companyNumber = publicValue(BUSINESS.companyNumber)

  return (
    <section className="relative overflow-hidden border-b border-border bg-white py-9 sm:py-12 lg:py-18">
      <div aria-hidden="true" className="absolute right-0 top-0 hidden h-full w-[42%] bg-brand-soft/70 lg:block" />
      <div aria-hidden="true" className="absolute -left-32 top-12 h-72 w-72 rounded-full bg-brand/7 blur-3xl" />

      <Container width="wide">
        <div className="relative grid items-center gap-11 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="relative z-10 py-3 lg:py-8">
            <div className="he-enter">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink-surface px-4 text-sm font-bold text-white">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-on-ink" />
                {copy.eyebrow}
              </span>
            </div>

            <h1 className="he-enter he-enter-delay-1 mt-7 max-w-[11ch] text-[length:var(--text-5xl)] font-bold text-fg">
              {copy.headingA}{' '}
              <span className="text-brand-strong">{copy.headingB}</span>
            </h1>

            <p className="he-enter he-enter-delay-2 mt-7 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
              {copy.lead}
            </p>

            <div className="he-enter he-enter-delay-3 mt-9 flex flex-wrap gap-3">
              <Link
                href={sectionPath(locale, 'consultation')}
                className="he-brand-shadow inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-7 text-base font-bold text-white no-underline transition duration-200 hover:-translate-y-0.5 hover:bg-brand-strong"
              >
                {copy.primary}
                <span aria-hidden="true" className="ml-2">↗</span>
              </Link>
              <Link
                href={sectionPath(locale, 'universities')}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border-input/55 bg-white px-7 text-base font-bold text-fg no-underline transition duration-200 hover:-translate-y-0.5 hover:border-fg hover:bg-paper-sunk"
              >
                {copy.secondary}
              </Link>
            </div>

            <ul className="mt-9 grid max-w-[37rem] gap-3 text-sm font-semibold text-fg-muted sm:grid-cols-3">
              {[copy.trusted, copy.personal, copy.supported].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[0.65rem] font-black text-brand-strong">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {founded && companyNumber ? (
              <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-fg-muted">
                {locale === 'tr' ? (
                  <>{founded} yılından beri Birleşik Krallık&apos;ta tescilli · Şirket no. {companyNumber}</>
                ) : (
                  <>UK-registered since {founded} · Company no. {companyNumber}</>
                )}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[50rem] lg:mx-0">
            <div aria-hidden="true" className="absolute -right-7 -top-7 h-40 w-40 rounded-[2rem] border border-brand/20 bg-white" />
            <div className="he-dark-grid he-card-shadow relative overflow-hidden rounded-[2rem] p-2.5 sm:p-3.5">
              <div className="flex items-center justify-between px-3 pb-3 pt-1 text-xs font-bold uppercase tracking-[0.11em] text-fg-muted-on-ink sm:px-4">
                <span>{copy.imageLabel}</span>
                <span className="text-brand-on-ink">HE / 01</span>
              </div>

              <MediaFrame
                local={hero.src}
                alt={hero.alt}
                width={1800}
                height={1200}
                priority
                sizes="(max-width: 1024px) 100vw, 54vw"
                className="aspect-[4/3] w-full overflow-hidden rounded-[1.45rem] lg:aspect-[1.08/1] [&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-[1.025]"
              />

              <div className="absolute bottom-7 left-7 right-7 rounded-[1.2rem] border border-white/15 bg-ink-surface/92 p-4 text-white shadow-[0_16px_42px_rgba(6,11,22,0.28)] backdrop-blur-md sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-[21rem] sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-on-ink">{copy.panelKicker}</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-white">{copy.panelBody}</p>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-5 hidden rounded-[1.15rem] border border-border bg-white px-4 py-3 shadow-[0_16px_36px_rgba(6,11,22,0.12)] sm:block lg:-left-8">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">01 · {locale === 'tr' ? 'Keşfet' : 'Explore'}</p>
              <p className="mt-1 text-sm font-bold text-fg">{locale === 'tr' ? 'Ülke + program' : 'Country + course'}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
