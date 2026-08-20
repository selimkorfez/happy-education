import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'

/**
 * "What are you looking for?"
 *
 * An indexed editorial list, not three feature cards. Each row is a real
 * destination in the information architecture, so this doubles as the primary
 * wayfinding device for visitors who do not yet know the vocabulary.
 *
 * Hover changes colour and underlines. Nothing lifts or slides.
 */

interface Choice {
  section: SectionKey
  slug?: { en: string; tr: string }
  en: { title: string; body: string }
  tr: { title: string; body: string }
}

const CHOICES: Choice[] = [
  {
    section: 'universities',
    en: {
      title: 'University study',
      body: 'Bachelor’s and master’s degrees abroad, from shortlisting courses to submitting the application.',
    },
    tr: {
      title: 'Üniversite eğitimi',
      body: 'Yurt dışında lisans ve yüksek lisans: bölüm listesini çıkarmaktan başvuruyu göndermeye kadar.',
    },
  },
  {
    section: 'languageSchools',
    en: {
      title: 'Language education',
      body: 'General and exam-focused English courses, from two weeks to a full academic year.',
    },
    tr: {
      title: 'Dil eğitimi',
      body: 'Genel İngilizce ve sınav odaklı kurslar; iki haftadan bir akademik yıla kadar.',
    },
  },
  {
    section: 'summerSchools',
    en: {
      title: 'Summer programmes',
      body: 'Supervised summer schools for younger students, individually or as a group, with accommodation included.',
    },
    tr: {
      title: 'Yaz okulları',
      body: 'Küçük yaş grupları için gözetimli yaz okulları; bireysel ya da grup, konaklama dâhil.',
    },
  },
  {
    section: 'boardingSchools',
    en: {
      title: 'Boarding school',
      body: 'Secondary education in the UK, including GCSE and A Level routes and the admissions timeline.',
    },
    tr: {
      title: 'Yatılı okul',
      body: "İngiltere'de ortaöğretim: GCSE ve A Level yolları ile başvuru takvimi.",
    },
  },
  {
    section: 'tours',
    en: {
      title: 'Group travel',
      body: 'Organised educational tours for schools and groups, with itineraries and supervision arranged.',
    },
    tr: {
      title: 'Grup seyahatleri',
      body: 'Okullar ve gruplar için eğitim turları; program ve refakat düzenlemeleri dâhil.',
    },
  },
  {
    section: 'guides',
    slug: { en: 'applications', tr: 'basvuru-sureci' },
    en: {
      title: 'Application support',
      body: 'How applications, offers, deposits and enrolment actually work, step by step.',
    },
    tr: {
      title: 'Başvuru desteği',
      body: 'Başvuru, kabul, depozito ve kayıt süreçleri adım adım nasıl işliyor?',
    },
  },
]

const HEADING = {
  en: { kicker: 'Where to start', title: 'What are you looking for?' },
  tr: { kicker: 'Nereden başlamalı', title: 'Ne arıyorsunuz?' },
} as const

export function HelpMeChoose({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]

  return (
    <section className="border-b border-border py-16 sm:py-20">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
          {heading.kicker}
        </p>
        <h2 className="mt-3 max-w-[20ch] text-[length:var(--text-4xl)] font-semibold text-fg">
          {heading.title}
        </h2>

        <ul className="mt-10 border-t border-border">
          {CHOICES.map((choice, index) => {
            const copy = choice[locale]
            const href = choice.slug
              ? docPath(locale, choice.section, choice.slug[locale])
              : sectionPath(locale, choice.section)

            return (
              <li key={copy.title} className="border-b border-border">
                <Link
                  href={href}
                  className="group flex items-baseline gap-5 py-6 no-underline sm:gap-8"
                >
                  <span
                    aria-hidden="true"
                    className="w-8 shrink-0 font-display text-sm tabular-nums text-fg-muted"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xl font-semibold text-fg underline-offset-[6px] group-hover:underline group-hover:decoration-brand group-hover:decoration-2 sm:text-2xl">
                      {copy.title}
                    </span>
                    <span className="mt-1.5 block max-w-[62ch] text-base leading-relaxed text-fg-muted">
                      {copy.body}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 self-center text-fg-muted group-hover:text-brand-strong"
                  >
                    <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                      <path
                        d="M13.5 1 19 6l-5.5 5M19 6H1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="square"
                      />
                    </svg>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
