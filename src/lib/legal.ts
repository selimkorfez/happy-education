import { docPath, type Locale } from '@/lib/i18n/config'

/**
 * Legal document registry.
 *
 * Every entry here must resolve to a real page. The footer renders this list
 * directly, so a missing document surfaces as a broken link in the link checker
 * rather than quietly disappearing.
 *
 * All of these are DRAFTS pending solicitor review — see docs/LEGAL_REVIEW.md.
 */

export const LEGAL_PAGES = [
  { key: 'privacy', en: 'privacy-policy', tr: 'gizlilik-politikasi' },
  { key: 'cookies', en: 'cookie-policy', tr: 'cerez-politikasi' },
  { key: 'terms', en: 'terms-of-use', tr: 'kullanim-kosullari' },
  { key: 'serviceTerms', en: 'service-terms', tr: 'hizmet-sartlari' },
  { key: 'paymentTerms', en: 'payment-terms', tr: 'odeme-kosullari' },
  { key: 'refunds', en: 'refund-and-cancellation', tr: 'iade-ve-iptal' },
  { key: 'appointments', en: 'appointment-policy', tr: 'randevu-politikasi' },
  { key: 'disclaimer', en: 'disclaimer', tr: 'yasal-uyari' },
  { key: 'accessibility', en: 'accessibility-statement', tr: 'erisilebilirlik' },
  { key: 'complaints', en: 'complaints-procedure', tr: 'sikayet-proseduru' },
  { key: 'safeguarding', en: 'safeguarding', tr: 'cocuk-koruma' },
] as const

export type LegalKey = (typeof LEGAL_PAGES)[number]['key']

const LABELS: Record<LegalKey, Record<Locale, string>> = {
  privacy: { en: 'Privacy Policy', tr: 'Gizlilik Politikası' },
  cookies: { en: 'Cookie Policy', tr: 'Çerez Politikası' },
  terms: { en: 'Terms of Use', tr: 'Kullanım Koşulları' },
  serviceTerms: { en: 'Service Terms', tr: 'Hizmet Şartları' },
  paymentTerms: { en: 'Payment Terms', tr: 'Ödeme Koşulları' },
  refunds: { en: 'Refunds and Cancellation', tr: 'İade ve İptal' },
  appointments: { en: 'Appointment Policy', tr: 'Randevu Politikası' },
  disclaimer: { en: 'Disclaimer', tr: 'Yasal Uyarı' },
  accessibility: { en: 'Accessibility', tr: 'Erişilebilirlik' },
  complaints: { en: 'Complaints', tr: 'Şikâyet Prosedürü' },
  safeguarding: { en: 'Safeguarding', tr: 'Çocuk Koruma' },
}

export function legalSlug(locale: Locale, key: LegalKey): string {
  const entry = LEGAL_PAGES.find((p) => p.key === key)
  if (!entry) throw new Error(`Unknown legal page: ${key}`)
  return entry[locale]
}

export function legalPath(locale: Locale, key: LegalKey): string {
  return docPath(locale, 'legal', legalSlug(locale, key))
}

export function legalLabel(locale: Locale, key: LegalKey): string {
  return LABELS[key][locale]
}

export function legalLinks(locale: Locale) {
  return LEGAL_PAGES.map(({ key }) => ({
    key,
    label: legalLabel(locale, key),
    href: legalPath(locale, key),
  }))
}
