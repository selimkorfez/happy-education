import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { PortableText } from '@/components/content/PortableText'
import { FaqSection } from '@/components/shared/FaqSection'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { ContactPanel } from './ContactPanel'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import type { ProseDoc } from '@/lib/sanity/queries/content'

export function FixedPageTemplate({
  locale,
  pageKey,
  doc,
}: {
  locale: Locale
  pageKey: 'about' | 'contact' | 'consultation'
  doc: ProseDoc | null
}) {
  const copy = COPY[locale][pageKey]
  const crumbs = [{ label: t(locale, 'brand.name'), href: `/${locale}` }, { label: doc?.title ?? copy.title }]
  const showForm = pageKey === 'contact' || pageKey === 'consultation'

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={copy.kicker}
        title={doc?.title ?? copy.title}
        intro={doc?.intro ?? copy.intro}
        image={doc?.heroImage ?? null}
      />

      <section className="bg-paper py-8 sm:py-12 lg:py-16">
        <Container>
          <div className={`grid gap-8 ${showForm ? 'lg:grid-cols-[0.78fr_1.22fr] lg:gap-12' : 'lg:grid-cols-[1fr_20rem] lg:gap-14'}`}>
            <div className="rounded-[1.5rem] border border-border/60 bg-white p-6 shadow-[0_12px_36px_rgba(35,35,38,0.045)] sm:p-8 lg:p-10">
              {doc?.body ? (
                <PortableText value={doc.body} locale={locale} />
              ) : pageKey === 'about' ? (
                <AboutFallback locale={locale} />
              ) : (
                <div className="space-y-5">
                  <span className="inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">
                    {pageKey === 'consultation' ? copy.formKicker : copy.formKicker}
                  </span>
                  <h2 className="max-w-[16ch] text-[length:var(--text-3xl)] font-bold text-fg">{copy.formTitle}</h2>
                  <p className="max-w-[58ch] text-base leading-relaxed text-fg-muted">{copy.formBody}</p>
                  <div className="grid gap-3 pt-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    {copy.steps.map((step, index) => (
                      <div key={step} className="rounded-[1rem] border border-border/60 bg-paper p-4">
                        <span className="text-xs font-black tabular-nums text-brand-strong">0{index + 1}</span>
                        <p className="mt-2 text-sm font-bold leading-snug text-fg">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {showForm ? (
              <div className="rounded-[1.5rem] border border-border/70 bg-white p-3 shadow-[0_18px_48px_rgba(35,35,38,0.07)] sm:p-5">
                <ContactPanel locale={locale} variant={pageKey} />
              </div>
            ) : (
              <aside>
                <ContactSummary locale={locale} />
              </aside>
            )}
          </div>
        </Container>
      </section>

      <FaqSection locale={locale} faqs={doc?.faqs ?? []} />
      {pageKey === 'about' ? <ConsultationBand locale={locale} /> : null}
    </>
  )
}

function AboutFallback({ locale }: { locale: Locale }) {
  const founded = publicValue(BUSINESS.foundedYear)
  const director = publicValue(BUSINESS.director)
  const nature = publicValue(BUSINESS.natureOfBusiness)

  const content = locale === 'tr'
    ? {
        kicker: 'Biz kimiz',
        title: 'Büyük bir kararı daha anlaşılır hâle getirmek için buradayız.',
        paragraphs: [
          'Happy Education, İngiltere ve Galler’de tescilli bir eğitim danışmanlığı şirketidir. Öğrencilere ve ailelere yurt dışı eğitim konusunda danışmanlık veriyoruz: bölüm ve ülke seçiminden başvuruların hazırlanıp gönderilmesine, kabul sonrası işlemlere kadar.',
          founded ? `Şirket ${founded} yılından bu yana Birleşik Krallık’ta tescillidir${director ? ` ve kuruluşundan itibaren şirket müdürü ${director}’dır` : ''}.${nature ? ' Tescilli faaliyet alanı eğitim destek hizmetleridir.' : ''}` : '',
          'Bir okul ya da resmî kurum değiliz. Kabul kararlarını da vize kararlarını da biz vermiyoruz. Yaptığımız iş, seçenekleri açıkça anlamanıza yardımcı olmak ve kontrolünüzdeki başvuru sürecini düzenli tutmaktır.',
        ].filter(Boolean),
      }
    : {
        kicker: 'Who we are',
        title: 'We are here to make a big decision feel more manageable.',
        paragraphs: [
          'Happy Education is an education consultancy registered in England and Wales. We advise students and families on studying abroad: choosing a course and country, preparing applications and handling the administration that follows an offer.',
          founded ? `The company has been registered in the United Kingdom since ${founded}${director ? `, and ${director} has been its director since incorporation` : ''}.${nature ? ` Its registered activity is ${nature.toLowerCase()}.` : ''}` : '',
          'We are not a school and we are not a government body. We do not decide admissions or visas. Our role is to help you understand the options clearly and keep the parts of the process within your control organised.',
        ].filter(Boolean),
      }

  return (
    <div>
      <span className="inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{content.kicker}</span>
      <h2 className="mt-5 max-w-[16ch] text-[length:var(--text-3xl)] font-bold text-fg">{content.title}</h2>
      <div className="prose-he mt-7">
        {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="mt-9 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1rem] bg-brand-soft p-4"><p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{locale === 'tr' ? 'Yaklaşım' : 'Approach'}</p><p className="mt-2 text-sm font-bold text-fg">{locale === 'tr' ? 'Açık ve gerçekçi' : 'Clear and realistic'}</p></div>
        <div className="rounded-[1rem] bg-sky-soft p-4"><p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{locale === 'tr' ? 'Odak' : 'Focus'}</p><p className="mt-2 text-sm font-bold text-fg">{locale === 'tr' ? 'Size uygun seçenekler' : 'Options that fit you'}</p></div>
        <div className="rounded-[1rem] bg-mint-soft p-4"><p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-strong">{locale === 'tr' ? 'Süreç' : 'Process'}</p><p className="mt-2 text-sm font-bold text-fg">{locale === 'tr' ? 'Düzenli sonraki adımlar' : 'Organised next steps'}</p></div>
      </div>
    </div>
  )
}

function ContactSummary({ locale }: { locale: Locale }) {
  const phone = publicValue(BUSINESS.phone)
  const email = publicValue(BUSINESS.email)
  const office = publicValue(BUSINESS.registeredOffice)

  return (
    <div className="sticky top-32 overflow-hidden rounded-[1.35rem] border border-border/70 bg-ink-surface p-6 text-fg-on-ink shadow-[0_18px_45px_rgba(35,35,38,0.11)]">
      <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-on-ink">{locale === 'tr' ? 'Bize ulaşın' : 'Get in touch'}</p>
      <h2 className="mt-2 text-xl font-bold text-fg-on-ink">{locale === 'tr' ? 'Bir soruyla başlayabilirsiniz.' : 'You can start with one question.'}</h2>
      <ul className="mt-6 space-y-4 text-sm">
        {phone ? <li><a href={`tel:${phone.replace(/\s/g, '')}`} className="font-bold text-brand-on-ink underline underline-offset-4">{phone}</a></li> : null}
        {email ? <li><a href={`mailto:${email}`} className="font-bold text-brand-on-ink underline underline-offset-4">{email}</a></li> : null}
        {office ? <li className="border-t border-white/10 pt-4 text-fg-muted-on-ink"><span className="block text-xs font-bold uppercase tracking-wide">{locale === 'tr' ? 'Tescilli adres' : 'Registered office'}</span><address className="mt-2 not-italic leading-relaxed">{office}</address></li> : null}
      </ul>
      <a href={sectionPath(locale, 'contact')} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand px-5 text-[0.9375rem] font-bold text-fg no-underline transition hover:-translate-y-0.5">
        {locale === 'tr' ? 'Bize yazın' : 'Send us a message'} <span aria-hidden="true" className="ml-2">↗</span>
      </a>
    </div>
  )
}

const COPY = {
  en: {
    about: { title: 'About Happy Education', kicker: 'About us', intro: 'A London-registered education consultancy helping students and families make clearer study-abroad decisions.', formKicker: '', formTitle: '', formBody: '', steps: [] },
    contact: { title: 'Contact us', kicker: 'Start a conversation', intro: 'Tell us what you are considering and give us a little context. An initial conversation is free.', formKicker: 'A simple first step', formTitle: 'Tell us what you are trying to work out.', formBody: 'You can be specific or you can be at the very beginning. A useful first message is simply what you want to study, when and where you are currently considering.', steps: ['Share the idea', 'Add the important details', 'Get a clear next step'] },
    consultation: { title: 'Book a consultation', kicker: 'Make the next move clearer', intro: 'A first conversation is a chance to organise your options, priorities and practical next steps.', formKicker: 'Your first conversation', formTitle: 'Come with questions, not a finished plan.', formBody: 'We can use the conversation to understand your goals, narrow the options and identify what should happen next.', steps: ['Tell us your goal', 'Compare realistic routes', 'Leave with next steps'] },
  },
  tr: {
    about: { title: 'Happy Education hakkında', kicker: 'Hakkımızda', intro: 'Öğrencilerin ve ailelerin yurt dışı eğitim kararlarını daha net vermelerine yardımcı olan, Londra’da tescilli bir eğitim danışmanlığı.', formKicker: '', formTitle: '', formBody: '', steps: [] },
    contact: { title: 'İletişim', kicker: 'Bir konuşmayla başlayın', intro: 'Ne düşündüğünüzü ve biraz bağlamı paylaşın. İlk görüşme ücretsizdir.', formKicker: 'Basit bir ilk adım', formTitle: 'Neyi netleştirmeye çalıştığınızı anlatın.', formBody: 'Çok net olabilirsiniz veya sürecin en başında olabilirsiniz. İlk mesajınızda ne okumak istediğinizi, ne zaman ve hangi ülkeleri düşündüğünüzü yazmanız yeterli.', steps: ['Fikri paylaşın', 'Önemli detayları ekleyin', 'Net bir sonraki adım alın'] },
    consultation: { title: 'Ön görüşme planlayın', kicker: 'Sonraki adımı netleştirin', intro: 'İlk görüşme seçeneklerinizi, önceliklerinizi ve pratik sonraki adımları düzenlemek için bir başlangıçtır.', formKicker: 'İlk görüşmeniz', formTitle: 'Bitmiş bir planla değil, sorularla gelin.', formBody: 'Görüşmede hedeflerinizi anlayabilir, seçenekleri daraltabilir ve sırada ne olması gerektiğini netleştirebiliriz.', steps: ['Hedefinizi anlatın', 'Gerçekçi yolları karşılaştırın', 'Sonraki adımlarla ayrılın'] },
  },
} as const
