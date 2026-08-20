import { BUSINESS, publicValue } from '@/lib/business-facts'
import { siteUrl } from '@/lib/env'
import { t } from '@/lib/i18n/dictionary'
import { legalPath } from '@/lib/legal'
import {
  contactMethodLabel,
  educationLevelLabel,
  interestLabel,
  startWindowLabel,
} from '@/lib/leads/labels'
import type { Lead } from '@/lib/leads/types'
import { renderEmail, type EmailBlock } from '../layout'
import type { EmailMessage } from '../types'

/**
 * Acknowledgement sent to the person who enquired.
 *
 * It exists to do three things and nothing else: confirm the message arrived, say
 * when a human will reply, and give the visitor a copy of what they sent so they
 * are not left wondering. It makes no promise about an admission, a visa or a
 * timeline beyond our own reply, and it offers no advice, because a templated
 * email is the worst possible place for either.
 */

const COPY = {
  en: {
    subject: {
      enquiry: 'We have received your enquiry',
      consultation: 'We have received your consultation request',
      'programme-enquiry': 'We have received your enquiry',
      newsletter: 'We have received your request',
    },
    preheader: 'An adviser will reply within one working day.',
    title: 'Thank you for getting in touch',
    greeting: (firstName: string) => `Hello ${firstName},`,
    opening:
      'Thank you for contacting Happy Education. Your message has reached our advisers, and there is a copy of what you sent further down this email.',
    nextHeading: 'What happens next',
    nextBody:
      'An adviser will read your enquiry and reply within one working day. If anything is unclear we will ask before suggesting options, because the right answer depends on your grades, your budget and your timing.',
    detailsHeading: 'What you sent us',
    referenceLabel: 'Your reference',
    programmeLabel: 'Your enquiry is about',
    soonerHeading: 'If you need us sooner',
    soonerBody: (phone: string) =>
      `You can reply to this email, or reach us on ${phone}. The same number takes WhatsApp messages.`,
    soonerBodyNoPhone: 'You can reply to this email and it will come straight back to us.',
    privacyNote:
      'You are receiving this because an enquiry was submitted on happyeducation.uk. We use your details to answer that enquiry and for nothing else.',
    privacyLink: 'Read our privacy policy:',
    consentNote:
      'You also asked to receive occasional guidance on studying abroad. You can stop that at any time by replying to this email and asking us to.',
  },
  tr: {
    subject: {
      enquiry: 'Mesajınızı aldık',
      consultation: 'Ön görüşme talebinizi aldık',
      'programme-enquiry': 'Mesajınızı aldık',
      newsletter: 'Talebinizi aldık',
    },
    preheader: 'Bir danışmanımız en geç bir iş günü içinde size dönecek.',
    title: 'Bize ulaştığınız için teşekkürler',
    greeting: (firstName: string) => `Merhaba ${firstName},`,
    opening:
      'Happy Education ile iletişime geçtiğiniz için teşekkür ederiz. Mesajınız danışmanlarımıza ulaştı; gönderdiğiniz bilgilerin bir kopyasını aşağıda bulabilirsiniz.',
    nextHeading: 'Bundan sonra ne olacak',
    nextBody:
      'Bir danışmanımız mesajınızı inceleyecek ve en geç bir iş günü içinde size dönecek. Eksik gördüğümüz bir nokta olursa seçenek önermeden önce size soracağız; çünkü doğru yanıt notlarınıza, bütçenize ve takviminize göre değişiyor.',
    detailsHeading: 'Bize ilettikleriniz',
    referenceLabel: 'Referans numaranız',
    programmeLabel: 'Talebiniz şu program hakkında',
    soonerHeading: 'Daha hızlı ulaşmak isterseniz',
    soonerBody: (phone: string) =>
      `Bu e-postayı yanıtlayabilir ya da ${phone} numarasından bize ulaşabilirsiniz. Aynı numaradan WhatsApp ile de yazabilirsiniz.`,
    soonerBodyNoPhone: 'Bu e-postayı yanıtlamanız yeterli; mesajınız doğrudan bize ulaşır.',
    privacyNote:
      'Bu e-postayı, happyeducation.uk üzerinden bir talep iletildiği için alıyorsunuz. Bilgilerinizi yalnızca bu talebi yanıtlamak için kullanırız.',
    privacyLink: 'Gizlilik politikamız:',
    consentNote:
      'Ayrıca yurt dışı eğitimle ilgili bilgilendirmeleri almak istediğinizi belirttiniz. Dilediğiniz zaman bu e-postayı yanıtlayarak listeden çıkmamızı isteyebilirsiniz.',
  },
} as const

function firstNameOf(name: string): string {
  return name.split(' ')[0] ?? name
}

/** Only the fields the visitor actually filled in are echoed back. */
function submittedDetails(lead: Lead): EmailBlock[] {
  const locale = lead.locale
  const blocks: EmailBlock[] = []

  if (lead.interest) {
    blocks.push({
      type: 'detail',
      label: t(locale, 'form.interest'),
      value: interestLabel(locale, lead.interest),
    })
  }
  if (lead.destination) {
    blocks.push({ type: 'detail', label: t(locale, 'form.destination'), value: lead.destination })
  }
  if (lead.educationLevel) {
    blocks.push({
      type: 'detail',
      label: t(locale, 'form.educationLevel'),
      value: educationLevelLabel(locale, lead.educationLevel),
    })
  }
  if (lead.startDate) {
    blocks.push({
      type: 'detail',
      label: t(locale, 'form.startDate'),
      value: startWindowLabel(locale, lead.startDate),
    })
  }
  if (lead.preferredContact) {
    blocks.push({
      type: 'detail',
      label: t(locale, 'form.contactMethod'),
      value: contactMethodLabel(locale, lead.preferredContact),
    })
  }
  if (lead.message) {
    blocks.push({ type: 'detail', label: t(locale, 'form.message'), value: lead.message })
  }

  return blocks
}

export function enquiryAcknowledgement(lead: Lead, reference: string): EmailMessage {
  const copy = COPY[lead.locale]
  const phone = publicValue(BUSINESS.phone)
  const details = submittedDetails(lead)

  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: copy.greeting(firstNameOf(lead.name)) },
    { type: 'paragraph', text: copy.opening },
    { type: 'detail', label: copy.referenceLabel, value: reference },
    { type: 'heading', text: copy.nextHeading },
    { type: 'paragraph', text: copy.nextBody },
  ]

  if (lead.programmeRef) {
    blocks.push({
      type: 'detail',
      label: copy.programmeLabel,
      value: lead.programmeRef.title,
    })
  }

  if (details.length > 0) {
    blocks.push({ type: 'heading', text: copy.detailsHeading }, ...details)
  }

  blocks.push(
    { type: 'heading', text: copy.soonerHeading },
    { type: 'paragraph', text: phone ? copy.soonerBody(phone) : copy.soonerBodyNoPhone },
    { type: 'divider' },
    { type: 'note', text: copy.privacyNote },
    { type: 'plainUrl', href: `${siteUrl}${legalPath(lead.locale, 'privacy')}` },
  )

  if (lead.marketingConsent) {
    blocks.push({ type: 'note', text: copy.consentNote })
  }

  const { html, text } = renderEmail({
    locale: lead.locale,
    preheader: copy.preheader,
    title: copy.title,
    blocks,
  })

  return {
    to: lead.email,
    // No personal data in the subject line: it travels through relays and shows up
    // in notification banners on locked phone screens.
    subject: copy.subject[lead.kind],
    html,
    text,
    template: 'enquiry-acknowledgement',
    locale: lead.locale,
  }
}
