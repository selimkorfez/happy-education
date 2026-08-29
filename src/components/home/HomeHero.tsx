import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { brandImage } from '@/lib/media/library'

const COPY = {
  en: {
    eyebrow: 'London-based international education advisers',
    headingA: 'Your next chapter',
    headingB: 'starts somewhere new.',
    lead:
      'We help students and families turn a huge study-abroad decision into a clear plan — from choosing the right route to getting the application over the line.',
    primary: 'Plan my next step',
    secondary: 'Explore study options',
    trusted: 'Straight-talking guidance',
    personal: 'Personal shortlist',
    supported: 'Application support',
    imageAlt: 'Students walking through a London university campus',
  },
  tr: {
    eyebrow: 'Londra merkezli uluslararası eğitim danışmanlığı',
    headingA: 'Yeni bölümünüz',
    headingB: 'başka bir yerde başlasın.',
    lead:
      'Yurt dışı eğitim kararını karmaşık bir süreç olmaktan çıkarıp net bir plana dönüştürüyoruz — doğru seçeneği bulmaktan başvuruyu tamamlamaya kadar.',
    primary: 'Sonraki adımımı planla',
    secondary: 'Eğitim seçeneklerini keşfet',
    trusted: 'Açık ve dürüst danışmanlık',
    personal: 'Kişisel kısa liste',
    supported: 'Başvuru desteği',
    imageAlt: "Londra'da üniversite kampüsünde yürüyen öğrenciler",
  },
} as const

export function HomeHero({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const hero = brandImage('heroLondon')
  const founded = publicValue(BUSINESS.foundedYear)
  const companyNumber = publicValue(BUSINESS.companyNumber)

  return (
    <section className="he-gradient-wash relative overflow-hidden border-b border-border/70 py-8 sm:py-12 lg:py-16">
      <div aria-hidden="true" className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-16 top-8 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

      <Container width="wide">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div className="relative z-10 py-4 lg:py-8">
            <div className="he-enter">
              <span className="he-pill text-fg-muted">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
                {copy.eyebrow}
              </span>
            </div>

            <h1 className="he-enter he-enter-delay-1 mt-7 max-w-[11ch] text-[length:var(--text-5xl)] font-bold text-fg">
              {copy.headingA}{' '}
              <span className="relative inline-block text-brand-strong">
                {copy.headingB}
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 w-full text-brand/45"
                  viewBox="0 0 240 14"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M3 10C58 2 167 1 237 8" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="he-enter he-enter-delay-2 mt-7 max-w-[54ch] text-lg leading-relaxed text-fg-muted">
              {copy.lead}
            </p>

            <div className="he-enter he-enter-delay-3 mt-9 flex flex-wrap gap-3">
              <Link
                href={sectionPath(locale, 'consultation')}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-7 text-base font-bold text-fg no-underline shadow-[0_12px_28px_rgba(244,116,38,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f6813b]"
              >
                {copy.primary}
                <span aria-hidden="true" className="ml-2">↗</span>
              </Link>
              <Link
                href={sectionPath(locale, 'universities')}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white/80 px-7 text-base font-bold text-fg no-underline backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white"
              >
                {copy.secondary}
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-fg-muted">
              {[copy.trusted, copy.personal, copy.supported].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-mint-soft text-success">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            {founded && companyNumber ? (
              <p className="mt-8 text-xs leading-relaxed text-fg-muted">
                {locale === 'tr' ? (
                  <>{founded} yılından beri Birleşik Krallık&apos;ta tescilli · Şirket no. {companyNumber}</>
                ) : (
                  <>UK-registered since {founded} · Company no. {companyNumber}</>
                )}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[48rem] lg:mx-0">
            <div className="relative overflow-hidden rounded-[2rem] bg-card p-2 shadow-[0_30px_80px_rgba(35,35,38,0.14)] sm:p-3">
              <MediaFrame
                local={hero.src}
                alt={copy.imageAlt}
                width={1800}
                height={1200}
                priority
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="aspect-[4/3] w-full overflow-hidden rounded-[1.55rem] lg:aspect-[1.08/1] [&_img]:transition-transform [&_img]:duration-700 hover:[&_img]:scale-[1.025]"
              />

              <div className="absolute inset-x-7 bottom-7 rounded-[1.25rem] border border-white/50 bg-white/88 p-4 shadow-[0_16px_38px_rgba(0,0,0,0.12)] backdrop-blur-md sm:inset-x-auto sm:bottom-8 sm:left-8 sm:max-w-[19rem]">
                <p className="text-xs font-bold uppercase tracking-[0.11em] text-brand-strong">
                  {locale === 'tr' ? 'Başlangıç noktası' : 'Start with you'}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-fg">
                  {locale === 'tr'
                    ? 'Bölüm, şehir, bütçe ve hedeflerinize göre gerçekçi seçenekler oluşturun.'
                    : 'Build a shortlist around your course, city, budget and actual goals.'}
                </p>
              </div>
            </div>

            <div className="he-float absolute -left-4 top-10 hidden rounded-2xl border border-border/80 bg-sky-soft px-4 py-3 shadow-lg sm:block lg:-left-8">
              <p className="text-xs font-bold text-fg-muted">{locale === 'tr' ? '01 · KEŞFET' : '01 · EXPLORE'}</p>
              <p className="mt-0.5 text-sm font-bold text-fg">{locale === 'tr' ? 'Ülke + program' : 'Country + course'}</p>
            </div>

            <div className="he-float-delayed absolute -right-3 bottom-20 hidden rounded-2xl border border-border/80 bg-brand-soft px-4 py-3 shadow-lg sm:block lg:-right-6">
              <p className="text-xs font-bold text-fg-muted">{locale === 'tr' ? '02 · PLANLA' : '02 · PLAN'}</p>
              <p className="mt-0.5 text-sm font-bold text-fg">{locale === 'tr' ? 'Başvuruyu netleştir' : 'Make it actionable'}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
