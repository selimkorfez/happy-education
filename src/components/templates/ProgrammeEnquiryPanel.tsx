import Link from 'next/link'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { BUSINESS, publicValue } from '@/lib/business-facts'

/**
 * Enquiry prompt on a programme page.
 *
 * Links to the contact route carrying the programme as a query parameter so the
 * enquiry form can pre-fill which programme is being asked about. It deliberately
 * does not embed a form in the sidebar: the initial enquiry should collect the
 * minimum, and a full form here would invite over-collection on a page about minors.
 */
export function ProgrammeEnquiryPanel({
  locale,
  programmeTitle,
  programmePath,
}: {
  locale: Locale
  programmeTitle: string
  programmePath: string
}) {
  const copy = COPY[locale]
  const phone = publicValue(BUSINESS.phone)
  const href = `${sectionPath(locale, 'contact')}?programme=${encodeURIComponent(programmeTitle)}&from=${encodeURIComponent(programmePath)}`

  return (
    <div className="border border-border bg-paper-sunk p-5">
      <h2 className="font-display text-lg font-semibold text-fg">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">{copy.body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[3px] bg-brand-strong px-5 text-[0.9375rem] font-semibold text-white no-underline hover:bg-brand-pressed"
      >
        {copy.cta}
      </Link>
      {phone ? (
        <p className="mt-3 text-center text-sm text-fg-muted">
          {copy.orCall}{' '}
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="text-brand-strong underline underline-offset-4">
            {phone}
          </a>
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-fg-muted">{copy.dataNote}</p>
    </div>
  )
}

const COPY = {
  en: {
    title: 'Ask about this programme',
    body: 'Tell us the student’s age and the dates you are considering, and we will confirm availability and the full cost.',
    cta: 'Ask about this programme',
    orCall: 'Or call',
    dataNote:
      'Please do not send passports, financial documents or medical information through this website.',
  },
  tr: {
    title: 'Bu program hakkında bilgi alın',
    body: 'Öğrencinin yaşını ve düşündüğünüz tarihleri iletin; uygunluk durumunu ve toplam ücreti teyit edelim.',
    cta: 'Bu program hakkında sorun',
    orCall: 'Ya da arayın',
    dataNote:
      'Lütfen pasaport, mali belge veya sağlık bilgilerinizi bu web sitesi üzerinden göndermeyin.',
  },
} as const
