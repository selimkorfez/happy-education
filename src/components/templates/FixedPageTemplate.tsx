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

/**
 * About, Contact and Consultation.
 *
 * These have fixed positions in the information architecture but editable bodies,
 * so the template supplies the structure and the form while the CMS supplies the
 * prose. Each renders sensible content even before a CMS document exists, because
 * a contact page that 404s during content entry is worse than one with defaults.
 */
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
        title={doc?.title ?? copy.title}
        intro={doc?.intro ?? copy.intro}
        {...(pageKey === 'about' ? { image: doc?.heroImage ?? null } : {})}
      />

      <Container>
        <div className="grid gap-12 py-12 lg:grid-cols-12">
          <div className={showForm ? 'lg:col-span-7' : 'lg:col-span-8'}>
            {doc?.body ? (
              <PortableText value={doc.body} locale={locale} />
            ) : pageKey === 'about' ? (
              <AboutFallback locale={locale} />
            ) : null}
          </div>

          {showForm ? (
            <div className="lg:col-span-5">
              <ContactPanel locale={locale} variant={pageKey} />
            </div>
          ) : (
            <aside className="lg:col-span-4">
              <ContactSummary locale={locale} />
            </aside>
          )}
        </div>
      </Container>

      <FaqSection locale={locale} faqs={doc?.faqs ?? []} />
      {pageKey === 'about' ? <ConsultationBand locale={locale} /> : null}
    </>
  )
}

/**
 * Default About copy, used only until an editor writes the page.
 * Every statement here is independently verifiable at Companies House. No student
 * numbers, no institution counts, no accreditation claims.
 */
function AboutFallback({ locale }: { locale: Locale }) {
  const founded = publicValue(BUSINESS.foundedYear)
  const director = publicValue(BUSINESS.director)
  const nature = publicValue(BUSINESS.natureOfBusiness)

  const en = (
    <>
      <p>
        Happy Education is an education consultancy registered in England and Wales. We advise students
        and families on studying abroad: choosing a course and a country, preparing and submitting
        applications, and handling the administration that follows an offer.
      </p>
      {founded ? (
        <p>
          The company has been registered in the United Kingdom since {founded}
          {director ? `, and ${director} has been its director since incorporation` : ''}.
          {nature ? ` Its registered activity is ${nature.toLowerCase()}.` : ''}
        </p>
      ) : null}
      <p>
        We are not a school and we are not a government body. We do not decide admissions and we do not
        decide visas. What we do is help you understand the options honestly, and make sure the
        paperwork that is within your control is done properly and on time.
      </p>
    </>
  )

  const tr = (
    <>
      <p>
        Happy Education, İngiltere ve Galler&apos;de tescilli bir eğitim danışmanlığı şirketidir.
        Öğrencilere ve ailelere yurt dışı eğitim konusunda danışmanlık veriyoruz: bölüm ve ülke
        seçiminden başvuruların hazırlanıp gönderilmesine, kabul sonrası işlemlere kadar.
      </p>
      {founded ? (
        <p>
          Şirket {founded} yılından bu yana Birleşik Krallık&apos;ta tescillidir
          {director ? ` ve kuruluşundan itibaren şirket müdürü ${director}'dır` : ''}.
          {nature ? ' Tescilli faaliyet alanı eğitim destek hizmetleridir.' : ''}
        </p>
      ) : null}
      <p>
        Bir okul ya da resmî kurum değiliz. Kabul kararlarını da vize kararlarını da biz vermiyoruz.
        Yaptığımız iş, seçenekleri açık açık anlamanıza yardımcı olmak ve kontrolünüzdeki evrak
        sürecinin eksiksiz ve zamanında tamamlanmasını sağlamaktır.
      </p>
    </>
  )

  return <div className="prose-he">{locale === 'tr' ? tr : en}</div>
}

function ContactSummary({ locale }: { locale: Locale }) {
  const phone = publicValue(BUSINESS.phone)
  const email = publicValue(BUSINESS.email)
  const office = publicValue(BUSINESS.registeredOffice)
  const copy = COPY[locale].contact

  return (
    <div className="sticky top-32 border border-border bg-paper-sunk p-5">
      <h2 className="font-display text-lg font-semibold text-fg">{copy.title}</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {phone ? (
          <li>
            <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-brand-strong underline underline-offset-4">
              {phone}
            </a>
          </li>
        ) : null}
        {email ? (
          <li>
            <a href={`mailto:${email}`} className="text-brand-strong underline underline-offset-4">
              {email}
            </a>
          </li>
        ) : null}
        {office ? (
          <li className="pt-2 text-fg-muted">
            <span className="block text-xs uppercase tracking-wide">
              {locale === 'tr' ? 'Tescilli adres' : 'Registered office'}
            </span>
            <address className="mt-1 not-italic">{office}</address>
          </li>
        ) : null}
      </ul>
      <a
        href={sectionPath(locale, 'contact')}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-[3px] bg-brand-strong px-5 text-[0.9375rem] font-semibold text-white no-underline hover:bg-brand-pressed"
      >
        {locale === 'tr' ? 'Bize yazın' : 'Send us a message'}
      </a>
    </div>
  )
}

const COPY = {
  en: {
    about: {
      title: 'About Happy Education',
      intro: 'A London-registered education consultancy advising students and families on studying abroad.',
    },
    contact: {
      title: 'Contact us',
      intro:
        'Tell us what you are considering and we will come back to you within one working day. There is no charge for an initial conversation.',
    },
    consultation: {
      title: 'Book a consultation',
      intro:
        'A first conversation covers what you want to study, where it is realistic to apply, what it will cost and what the timeline looks like.',
    },
  },
  tr: {
    about: {
      title: 'Happy Education hakkında',
      intro:
        "Öğrencilere ve ailelere yurt dışı eğitim danışmanlığı veren, Londra'da tescilli bir eğitim danışmanlığı.",
    },
    contact: {
      title: 'İletişim',
      intro:
        'Ne düşündüğünüzü yazın, en geç bir iş günü içinde size dönelim. İlk görüşme için ücret alınmaz.',
    },
    consultation: {
      title: 'Ön görüşme planlayın',
      intro:
        'İlk görüşmede ne okumak istediğinizi, hangi başvuruların gerçekçi olduğunu, maliyeti ve takvimi konuşuyoruz.',
    },
  },
} as const
