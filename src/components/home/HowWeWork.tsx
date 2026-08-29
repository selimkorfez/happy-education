import { Container } from '@/components/ui/Container'
import type { Locale } from '@/lib/i18n/config'

const STEPS = {
  en: [
    { title: 'Tell us what matters', body: 'Course, country, timing, budget and what you actually want from the experience.', short: 'Talk' },
    { title: 'Build a shortlist', body: 'Compare realistic institutions and routes side by side instead of drowning in endless options.', short: 'Compare' },
    { title: 'Get application-ready', body: 'Documents, requirements and deadlines organised into a clear plan you can follow.', short: 'Prepare' },
    { title: 'Submit and track', body: 'Applications go in properly and the important updates, offers and conditions stay visible.', short: 'Apply' },
    { title: 'Handle the practical bits', body: 'Deposits, enrolment steps, travel paperwork and official guidance brought into one timeline.', short: 'Plan' },
    { title: 'Arrive knowing what’s next', body: 'Accommodation, transfers, registration and the practical questions around your first weeks.', short: 'Go' },
  ],
  tr: [
    { title: 'Önceliklerinizi anlatın', body: 'Bölüm, ülke, zamanlama, bütçe ve bu deneyimden gerçekten ne beklediğinizi konuşalım.', short: 'Konuş' },
    { title: 'Kısa liste oluşturun', body: 'Sonsuz seçenekler arasında kaybolmak yerine gerçekçi kurumları ve yolları yan yana karşılaştırın.', short: 'Karşılaştır' },
    { title: 'Başvuruya hazırlanın', body: 'Belgeler, koşullar ve tarihler takip edebileceğiniz net bir plana dönüşsün.', short: 'Hazırla' },
    { title: 'Başvurun ve takip edin', body: 'Başvurular doğru şekilde gönderilsin; önemli güncellemeler, kabuller ve koşullar görünür kalsın.', short: 'Başvur' },
    { title: 'Pratik işleri planlayın', body: 'Depozito, kayıt, seyahat evrakları ve resmî yönlendirmeler tek bir takvimde toplansın.', short: 'Planla' },
    { title: 'Sonraki adımı bilerek varın', body: 'Konaklama, transfer, kayıt ve ilk haftalardaki pratik sorular önceden netleşsin.', short: 'Git' },
  ],
} as const

const HEADING = {
  en: {
    kicker: 'How it works',
    title: 'Less guesswork. More momentum.',
    body: 'The process becomes much easier when every decision has a clear next step. We keep the moving parts organised without pretending there is one perfect route for everyone.',
  },
  tr: {
    kicker: 'Nasıl ilerliyor',
    title: 'Daha az belirsizlik. Daha fazla ilerleme.',
    body: 'Her kararın net bir sonraki adımı olduğunda süreç çok daha kolay ilerler. Herkes için tek bir doğru yol varmış gibi davranmadan tüm parçaları düzenli tutuyoruz.',
  },
} as const

export function HowWeWork({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]
  const steps = STEPS[locale]

  return (
    <section className="border-b border-border/70 bg-white py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-strong">{heading.kicker}</p>
            <h2 className="mt-3 max-w-[12ch] text-[length:var(--text-4xl)] text-fg">{heading.title}</h2>
          </div>
          <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted lg:justify-self-end">{heading.body}</p>
        </div>

        <div className="relative mt-14">
          <div aria-hidden="true" className="absolute left-6 top-5 hidden h-[calc(100%-2.5rem)] w-px bg-border md:block lg:left-0 lg:top-7 lg:h-px lg:w-full" />

          <ol className="relative grid gap-4 md:gap-5 lg:grid-cols-6">
            {steps.map((step, index) => (
              <li key={step.title} className="group relative">
                <div className="h-full rounded-[1.35rem] border border-border/70 bg-paper p-5 transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:bg-white hover:shadow-[0_16px_38px_rgba(35,35,38,0.08)] lg:pt-7">
                  <div className="flex items-center gap-3 lg:block">
                    <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-surface text-sm font-black tabular-nums text-white shadow-[0_0_0_6px_var(--color-paper)] transition-colors group-hover:bg-brand">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.1em] text-brand-strong lg:mt-5 lg:block">{step.short}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-fg">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
