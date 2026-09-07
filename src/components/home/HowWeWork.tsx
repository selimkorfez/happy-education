import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'
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
    <section className="relative overflow-hidden border-b border-border/70 bg-white py-16 sm:py-20 lg:py-24">
      <div aria-hidden="true" className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-soft/70 blur-3xl" />
      <Container>
        <Reveal>
          <div className="relative grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-brand-strong">{heading.kicker}</p>
              <h2 className="mt-3 max-w-[12ch] text-[length:var(--text-4xl)] text-fg">{heading.title}</h2>
            </div>
            <p className="max-w-[62ch] text-lg leading-relaxed text-fg-muted lg:justify-self-end">{heading.body}</p>
          </div>
        </Reveal>

        <div className="relative mt-14">
          <div aria-hidden="true" className="absolute left-[8%] right-[8%] top-8 hidden h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent lg:block" />

          <ol className="relative grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {steps.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={Math.min(index * 75, 300)} className="h-full">
                  <article className="he-shine-card group relative h-full overflow-hidden rounded-[1.55rem] border border-border/70 bg-paper/88 p-6 shadow-[0_10px_30px_rgba(35,35,38,0.045)] transition duration-400 hover:-translate-y-1.5 hover:border-brand/28 hover:bg-white hover:shadow-[0_22px_55px_rgba(35,35,38,0.09)] sm:p-7">
                    <div aria-hidden="true" className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-brand-soft opacity-0 blur-xl transition duration-500 group-hover:opacity-100" />
                    <div className="relative flex items-center justify-between gap-4">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink-surface text-sm font-black tabular-nums text-white shadow-[0_10px_25px_rgba(35,35,38,0.16)] transition duration-300 group-hover:-rotate-3 group-hover:bg-brand group-hover:text-fg">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="rounded-full border border-border/70 bg-white/80 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.1em] text-brand-strong backdrop-blur-sm">{step.short}</span>
                    </div>
                    <h3 className="relative mt-8 max-w-[19ch] text-xl font-bold text-fg">{step.title}</h3>
                    <p className="relative mt-3 max-w-[42ch] text-sm leading-relaxed text-fg-muted">{step.body}</p>
                    <div aria-hidden="true" className="relative mt-8 h-1 overflow-hidden rounded-full bg-border/60">
                      <span className="block h-full rounded-full bg-brand transition-[width] duration-700 group-hover:w-full" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
                    </div>
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
