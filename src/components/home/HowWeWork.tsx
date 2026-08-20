import { Container } from '@/components/ui/Container'
import type { Locale } from '@/lib/i18n/config'

/**
 * How the service actually works.
 *
 * A numbered journey rather than a row of icon cards. Each step says what happens
 * and, where it matters, what does not happen — which is more useful to a family
 * weighing up an agency than a list of adjectives.
 *
 * The visa step is written to describe administrative support only. Happy Education
 * has no confirmed IAA registration, so the wording must never imply regulated
 * immigration advice. See src/lib/business-facts.ts.
 */

const STEPS = {
  en: [
    {
      title: 'A first conversation',
      body: 'We ask what you want to study, where, when and what the budget realistically is. If we think a plan will not work, we say so at this stage rather than after you have paid a deposit.',
    },
    {
      title: 'A shortlist you can compare',
      body: 'You get a written shortlist of institutions and courses with entry requirements, tuition, living costs and intake dates side by side, so the comparison is yours to make.',
    },
    {
      title: 'Applications, prepared properly',
      body: 'We prepare and submit the applications, check documents against each institution’s requirements, and keep track of deadlines and conditional offers.',
    },
    {
      title: 'Offers, deposits and enrolment',
      body: 'We explain what each offer commits you to, what is refundable, and what has to happen by when to hold a place.',
    },
    {
      title: 'Visa and travel administration',
      body: 'We help you assemble and submit the paperwork and point you to the official government guidance. Immigration decisions are made by the relevant authority. We do not give regulated immigration advice and we cannot guarantee any outcome.',
    },
    {
      title: 'Arrival and the first weeks',
      body: 'Accommodation, airport transfer, registration and the practical questions that come up once you land.',
    },
  ],
  tr: [
    {
      title: 'İlk görüşme',
      body: 'Ne okumak istediğinizi, nerede, ne zaman ve bütçenizin gerçekte ne olduğunu konuşuruz. Bir planın yürümeyeceğini düşünüyorsak bunu depozito ödedikten sonra değil, bu aşamada söyleriz.',
    },
    {
      title: 'Karşılaştırabileceğiniz bir liste',
      body: 'Kabul koşulları, öğrenim ücreti, yaşam maliyeti ve dönem tarihleri yan yana olacak şekilde yazılı bir okul ve bölüm listesi hazırlarız. Karşılaştırmayı siz yaparsınız.',
    },
    {
      title: 'Başvuruların düzgün hazırlanması',
      body: 'Başvuruları hazırlar ve gönderiririz; belgeleri her kurumun kendi koşullarına göre kontrol eder, tarihleri ve şartlı kabulleri takip ederiz.',
    },
    {
      title: 'Kabul, depozito ve kayıt',
      body: 'Her kabulün sizi neye bağladığını, hangi ödemenin iade edilebilir olduğunu ve yeri tutmak için neyin ne zamana kadar yapılması gerektiğini anlatırız.',
    },
    {
      title: 'Vize ve seyahat işlemleri',
      body: 'Evrakların hazırlanmasında ve gönderilmesinde destek olur, resmî kaynaklara yönlendiririz. Vize kararı ilgili ülkenin yetkili makamına aittir. Düzenlemeye tabi göçmenlik danışmanlığı vermiyoruz ve hiçbir sonucu garanti edemeyiz.',
    },
    {
      title: 'Varış ve ilk haftalar',
      body: 'Konaklama, havalimanı transferi, kayıt işlemleri ve yerleştikten sonra ortaya çıkan pratik sorular.',
    },
  ],
} as const

const HEADING = {
  en: { kicker: 'How we work', title: 'From first question to first term' },
  tr: { kicker: 'Nasıl çalışıyoruz', title: 'İlk sorudan ilk döneme' },
} as const

export function HowWeWork({ locale }: { locale: Locale }) {
  const heading = HEADING[locale]
  const steps = STEPS[locale]

  return (
    <section className="border-b border-border py-16 sm:py-20">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
          {heading.kicker}
        </p>
        <h2 className="mt-3 max-w-[24ch] text-[length:var(--text-4xl)] font-semibold text-fg">
          {heading.title}
        </h2>

        <ol className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center bg-brand font-display text-sm font-semibold tabular-nums text-fg"
                >
                  {index + 1}
                </span>
                <h3 className="font-display text-lg font-semibold text-fg">{step.title}</h3>
              </div>
              <p className="mt-3 max-w-[46ch] text-base leading-relaxed text-fg-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
