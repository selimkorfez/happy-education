import { EnquiryForm } from '@/components/forms/EnquiryForm'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import type { Locale } from '@/lib/i18n/config'

/**
 * The enquiry surface on the contact and consultation pages.
 *
 * Both use the same form. The difference is framing: "contact" is a general
 * question, "consultation" is a request for a first appointment. The form itself
 * collects the same minimal set either way, because there is no reason to ask a
 * student for more just because they clicked a different button.
 */
export function ContactPanel({
  locale,
  variant,
}: {
  locale: Locale
  variant: 'contact' | 'consultation'
}) {
  const copy = COPY[locale]
  const phone = publicValue(BUSINESS.phone)
  const whatsapp = publicValue(BUSINESS.whatsapp)
  const email = publicValue(BUSINESS.email)

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold text-fg">
          {variant === 'consultation' ? copy.consultationHeading : copy.contactHeading}
        </h2>
        <div className="mt-5">
          <EnquiryForm locale={locale} kind={variant === 'consultation' ? 'consultation' : 'enquiry'} />
        </div>
      </div>

      <div className="border border-border p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">{copy.otherWays}</h2>
        <ul className="mt-4 space-y-2.5 text-sm">
          {phone ? (
            <li>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="text-brand-strong underline underline-offset-4"
              >
                {phone}
              </a>
            </li>
          ) : null}
          {whatsapp ? (
            <li>
              {/*
               * A plain link, not a floating widget. It loads no third-party script,
               * so it cannot track anyone before consent.
               */}
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-strong underline underline-offset-4"
              >
                {copy.whatsapp}
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
        </ul>
        <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-fg-muted">
          {copy.dataMinimisation}
        </p>
      </div>
    </div>
  )
}

const COPY = {
  en: {
    contactHeading: 'Send us a message',
    consultationHeading: 'Request a consultation',
    otherWays: 'Other ways to reach us',
    whatsapp: 'Message us on WhatsApp',
    dataMinimisation:
      'We only ask for what we need to answer you. Please do not send passports, bank statements, medical information or other identity documents through this website. If documents are needed later, we will arrange a secure way to share them.',
  },
  tr: {
    contactHeading: 'Bize yazın',
    consultationHeading: 'Ön görüşme talep edin',
    otherWays: 'Diğer iletişim yolları',
    whatsapp: "WhatsApp'tan yazın",
    dataMinimisation:
      'Yalnızca size dönüş yapabilmek için gereken bilgileri istiyoruz. Lütfen pasaport, banka ekstresi, sağlık bilgisi veya diğer kimlik belgelerini bu web sitesi üzerinden göndermeyin. İleride belge gerekirse güvenli bir paylaşım yöntemi ayarlarız.',
  },
} as const
