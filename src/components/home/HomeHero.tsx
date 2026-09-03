import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { AmbientBackdrop } from '@/components/ui/AmbientBackdrop'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { brandImage } from '@/lib/media/library'

const COPY = {
  en: {
    eyebrow: 'London-based international education advisers',
    headingA: 'Your next chapter',
    headingB: 'starts somewhere new.',
    lead:
      'We help students and families turn a huge study-abroad decision into a clear plan, from choosing the right route to getting the application over the line.',
    primary: 'Plan my next step',
    secondary: 'Explore study options',
    trusted: 'Straight-talking guidance',
    personal: 'Personal shortlist',
    supported: 'Application support',
  },
  tr: {
    eyebrow: 'Londra merkezli uluslararası eğitim danışmanlığı',
    headingA: 'Yeni bölümünüz',
    headingB: 'başka bir yerde başlasın.',
    lead:
      'Yurt dışı eğitim kararını karmaşık bir süreç olmaktan çıkarıp net bir plana dönüştürüyoruz, doğru seçeneği bulmaktan başvuruyu tamamlamaya kadar.',
    primary: 'Sonraki adımımı planla',
    secondary: 'Eğitim seçeneklerini keşfet',
    trusted: 'Açık ve dürüst danışmanlık',
    personal: 'Kişisel kısa liste',
    supported: 'Başvuru desteği',
  },
} as const

export function HomeHero({ locale }: { locale: Locale }) {
  const copy = COPY[locale]
  const hero = brandImage('heroLondon')
  const founded = publicValue(BUSINESS.foundedYear)
  const companyNumber = publicValue(BUSINESS.companyNumber)

  return (
    <section className="on-ink relative isolate overflow-hidden border-b border-white/10 bg-ink-surface py-10 text-fg-on-ink sm:py-14 lg:min-h-[44rem] lg:py-20">
      <AmbientBackdrop tone="dark" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/24 to-transparent" />

      <Container width="wide">
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
          <div className="py-4 lg:py-8">
            <div className="he-enter">
              <span className="inline-flex min-h-10 items-center gap-2.5 rounded-full border border-white/14 bg-white/7 px-4 text-sm font-bold text-fg-on-ink backdrop-blur-md">
                <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
                </span>
                {copy.eyebrow}
              </span>
            </div>

            <h1 className="he-enter he-enter-delay-1 mt-7 max-w-[10.5ch] text-[length:var(--text-5xl)] font-bold text-white sm:text-[clamp(3.2rem,6vw,5.8rem)]">
              {copy.headingA}{' '}
              <span className="text-brand-on-ink">{copy.headingB}</span>
            </h1>

            <p className="he-enter he-enter-delay-2 mt-7 max-w-[55ch] text-lg leading-relaxed text-white/72 sm:text-xl">
              {copy.lead}
            </p>

            <div className="he-enter he-enter-delay-3 mt-9 flex flex-wrap gap-3">
              <Link
                href={sectionPath(locale, 'consultation')}
                className="group inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-7 text-base font-black text-fg no-underline shadow-[0_16px_45px_rgba(244,116,38,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-brand-on-ink hover:shadow-[0_22px_58px_rgba(244,116,38,0.34)]"
              >
                {copy.primary}
                <span aria-hidden="true" className="ml-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
              </Link>
              <Link
                href={sectionPath(locale, 'universities')}
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/7 px-7 text-base font-bold text-white no-underline backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-white/36 hover:bg-white/12"
              >
                {copy.secondary}
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-2.5 text-sm font-semibold text-white/74">
              {[copy.trusted, copy.personal, copy.supported].map((item) => (
                <li key={item} className="flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3.5 backdrop-blur-sm">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-on-ink" />
                  {item}
                </li>
              ))}
            </ul>

            {founded && companyNumber ? (
              <p className="mt-7 text-xs leading-relaxed text-white/48">
                {locale === 'tr' ? (
                  <>{founded} yılından beri Birleşik Krallık&apos;ta tescilli · Şirket no. {companyNumber}</>
                ) : (
                  <>UK-registered since {founded} · Company no. {companyNumber}</>
                )}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[50rem] lg:mx-0">
            <div className="he-enter he-enter-delay-2 relative">
              <div aria-hidden="true" className="absolute -inset-4 rounded-[2.6rem] bg-gradient-to-br from-brand/18 via-white/5 to-blue-400/10 blur-2xl" />
              <div className="he-shine-card group relative overflow-hidden rounded-[2.15rem] border border-white/14 bg-white/8 p-2.5 shadow-[0_40px_110px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-3">
                <MediaFrame
                  local={hero.src}
                  alt={hero.alt}
                  width={1800}
                  height={1200}
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="aspect-[4/3] w-full overflow-hidden rounded-[1.7rem] lg:aspect-[1.08/1] [&_img]:transition-transform [&_img]:duration-[1200ms] group-hover:[&_img]:scale-[1.035]"
                />

                <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.7rem] bg-gradient-to-t from-black/45 via-transparent to-white/5" />

                <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full border border-white/16 bg-black/28 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md sm:left-8 sm:top-8">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-on-ink" />
                  London · UK
                </div>

                <div className="absolute inset-x-7 bottom-7 rounded-[1.35rem] border border-white/18 bg-black/38 p-4 text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:inset-x-auto sm:bottom-8 sm:left-8 sm:max-w-[21rem] sm:p-5">
                  <p className="text-xs font-black uppercase tracking-[0.11em] text-brand-on-ink">
                    {locale === 'tr' ? 'Sizinle başlayalım' : 'Start with you'}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-white/88">
                    {locale === 'tr'
                      ? 'Bölüm, şehir, bütçe ve hedeflerinize göre gerçekçi seçenekler oluşturun.'
                      : 'Build a shortlist around your course, city, budget and actual goals.'}
                  </p>
                </div>
              </div>

              <div className="he-float absolute -left-5 top-[18%] hidden min-w-[9.5rem] rounded-2xl border border-white/14 bg-[#18181b]/82 px-4 py-3 text-white shadow-[0_18px_45px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:block lg:-left-8">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.11em] text-brand-on-ink">{locale === 'tr' ? '01 · KEŞFET' : '01 · EXPLORE'}</p>
                <p className="mt-1 text-sm font-bold">{locale === 'tr' ? 'Ülke + program' : 'Country + course'}</p>
              </div>

              <div className="he-float-delayed absolute -right-3 bottom-[19%] hidden min-w-[9.5rem] rounded-2xl border border-white/14 bg-white/92 px-4 py-3 text-fg shadow-[0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:block lg:-right-5">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.11em] text-brand-strong">{locale === 'tr' ? '02 · PLANLA' : '02 · PLAN'}</p>
                <p className="mt-1 text-sm font-bold">{locale === 'tr' ? 'Başvuruyu netleştir' : 'Make it actionable'}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
