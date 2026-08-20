import { siteUrl } from '@/lib/env'
import type { Locale } from '@/lib/i18n/config'
import { legalPath } from '@/lib/legal'
import { renderEmail, type EmailBlock } from '../layout'
import type { EmailMessage } from '../types'

/**
 * Double opt-in confirmation.
 *
 * Nothing is subscribed until this link is followed. That is the difference
 * between a mailing list and a spam complaint: a typed or mistyped address never
 * silently becomes a subscriber, and the click is the record of consent that UK
 * PECR expects.
 *
 * The email says plainly what to do if the recipient did not ask for it, because
 * the person most likely to receive an unwanted confirmation is the innocent owner
 * of a mistyped address.
 */

const COPY = {
  en: {
    subject: 'Confirm your email address',
    preheader: 'One link confirms it. Nothing is sent until you do.',
    title: 'Confirm your subscription',
    opening:
      'Someone asked to receive occasional guidance on studying abroad from Happy Education at this address. If that was you, confirm it below and we will start sending it.',
    action: 'Confirm my email address',
    fallback: 'If the link does not work, copy this address into your browser:',
    expiry: (hours: number) =>
      `This link works for ${hours} hours. If it expires, you can sign up again from the website.`,
    ignore:
      'If you did not ask for this, ignore this email. Nothing will be sent to you and the request is discarded.',
    frequency:
      'We write occasionally, not weekly, and every email carries a one-click unsubscribe link.',
    privacyLink: 'How we handle your details:',
  },
  tr: {
    subject: 'E-posta adresinizi doğrulayın',
    preheader: 'Tek bir bağlantı yeterli. Siz onaylamadan hiçbir e-posta göndermiyoruz.',
    title: 'Aboneliğinizi doğrulayın',
    opening:
      'Bu adrese, Happy Education tarafından yurt dışı eğitimle ilgili bilgilendirme gönderilmesi talep edildi. Bu talep sizden geldiyse aşağıdan doğrulayın; gönderime başlayalım.',
    action: 'E-posta adresimi doğrula',
    fallback: 'Bağlantı çalışmazsa bu adresi tarayıcınıza kopyalayabilirsiniz:',
    expiry: (hours: number) =>
      `Bu bağlantı ${hours} saat geçerlidir. Süresi dolarsa web sitesinden yeniden kayıt olabilirsiniz.`,
    ignore:
      'Böyle bir talepte bulunmadıysanız bu e-postayı yok sayabilirsiniz. Size hiçbir gönderim yapılmaz ve talep silinir.',
    frequency:
      'Her hafta değil, ara sıra yazıyoruz ve her e-postada tek tıkla çıkabileceğiniz bir bağlantı bulunuyor.',
    privacyLink: 'Bilgilerinizi nasıl işliyoruz:',
  },
} as const

export interface NewsletterConfirmationInput {
  to: string
  locale: Locale
  confirmUrl: string
  expiryHours: number
}

export function newsletterConfirmation(input: NewsletterConfirmationInput): EmailMessage {
  const copy = COPY[input.locale]

  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: copy.opening },
    { type: 'action', href: input.confirmUrl, label: copy.action },
    { type: 'note', text: copy.fallback },
    { type: 'plainUrl', href: input.confirmUrl },
    { type: 'note', text: copy.expiry(input.expiryHours) },
    { type: 'divider' },
    { type: 'note', text: copy.frequency },
    { type: 'note', text: copy.ignore },
    { type: 'note', text: copy.privacyLink },
    { type: 'plainUrl', href: `${siteUrl}${legalPath(input.locale, 'privacy')}` },
  ]

  const { html, text } = renderEmail({
    locale: input.locale,
    preheader: copy.preheader,
    title: copy.title,
    blocks,
  })

  return {
    to: input.to,
    subject: copy.subject,
    html,
    text,
    template: 'newsletter-confirmation',
    locale: input.locale,
  }
}
