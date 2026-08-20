import { siteUrl } from '@/lib/env'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { IMMIGRATION_ADVICE_STATUS } from '@/lib/business-facts'
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
 * Notification sent to the advisers.
 *
 * Rendered in the enquiry's own locale so that whoever picks it up is already
 * reading the same words the student saw, and `Reply-To` is the student's address
 * so hitting reply answers them rather than the shared inbox.
 *
 * Marketing consent is stated explicitly, including when it was withheld, because
 * "no answer" and "declined" are the same thing in the record and an adviser must
 * not have to guess before adding somebody to a mailing list.
 */

const COPY = {
  en: {
    subjectPrefix: {
      enquiry: 'New enquiry',
      consultation: 'New consultation request',
      'programme-enquiry': 'New programme enquiry',
      newsletter: 'New newsletter sign-up',
    },
    preheader: 'A new enquiry has come in from the website.',
    title: 'New website enquiry',
    contactHeading: 'Who got in touch',
    planHeading: 'What they are planning',
    messageHeading: 'Their message',
    contextHeading: 'Where it came from',
    reference: 'Reference',
    submitted: 'Submitted',
    language: 'Language of the enquiry',
    page: 'Page',
    programme: 'Programme',
    consent: 'Marketing consent',
    consentGiven: 'Given. May be added to the mailing list.',
    consentWithheld: 'Not given. Do not add to any mailing list.',
    replyNote: 'Reply to this email to answer the sender directly.',
    complianceNote:
      'Answer with application and administrative support only. We do not give immigration advice, and any visa decision rests with the relevant government authority.',
  },
  tr: {
    subjectPrefix: {
      enquiry: 'Yeni bilgi talebi',
      consultation: 'Yeni ön görüşme talebi',
      'programme-enquiry': 'Yeni program talebi',
      newsletter: 'Yeni bülten kaydı',
    },
    preheader: 'Web sitesinden yeni bir talep geldi.',
    title: 'Web sitesinden yeni talep',
    contactHeading: 'Kim yazdı',
    planHeading: 'Ne planlıyor',
    messageHeading: 'Mesajı',
    contextHeading: 'Nereden geldi',
    reference: 'Referans',
    submitted: 'Gönderim zamanı',
    language: 'Talebin dili',
    page: 'Sayfa',
    programme: 'Program',
    consent: 'Pazarlama izni',
    consentGiven: 'Verildi. Bülten listesine eklenebilir.',
    consentWithheld: 'Verilmedi. Hiçbir listeye eklemeyin.',
    replyNote: 'Gönderene doğrudan yanıt vermek için bu e-postayı yanıtlamanız yeterli.',
    complianceNote:
      'Yalnızca başvuru ve idari destek kapsamında yanıt verin. Göçmenlik danışmanlığı vermiyoruz; vize kararı ilgili resmî makama aittir.',
  },
} as const

/**
 * Date and time, in London, for an adviser deciding how urgently to reply.
 * `formatDate` in `@/lib/format` is date-only and is the right tool for published
 * content; a notification needs the clock as well.
 */
function formatTimestamp(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const formatted = new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
  }).format(date)
  return `${formatted} (Europe/London)`
}

export function enquiryNotification(
  lead: Lead,
  reference: string,
  recipient: string,
): EmailMessage {
  const locale = lead.locale
  const copy = COPY[locale]

  const blocks: EmailBlock[] = [
    { type: 'detail', label: copy.reference, value: reference },
    { type: 'heading', text: copy.contactHeading },
    { type: 'detail', label: t(locale, 'form.name'), value: lead.name },
    { type: 'detail', label: t(locale, 'form.email'), value: lead.email },
  ]

  if (lead.phone) {
    blocks.push({ type: 'detail', label: t(locale, 'form.phone'), value: lead.phone })
  }
  if (lead.country) {
    blocks.push({ type: 'detail', label: t(locale, 'form.country'), value: lead.country })
  }
  if (lead.preferredContact) {
    blocks.push({
      type: 'detail',
      label: t(locale, 'form.contactMethod'),
      value: contactMethodLabel(locale, lead.preferredContact),
    })
  }

  const plan: EmailBlock[] = []
  if (lead.interest) {
    plan.push({
      type: 'detail',
      label: t(locale, 'form.interest'),
      value: interestLabel(locale, lead.interest),
    })
  }
  if (lead.destination) {
    plan.push({ type: 'detail', label: t(locale, 'form.destination'), value: lead.destination })
  }
  if (lead.educationLevel) {
    plan.push({
      type: 'detail',
      label: t(locale, 'form.educationLevel'),
      value: educationLevelLabel(locale, lead.educationLevel),
    })
  }
  if (lead.startDate) {
    plan.push({
      type: 'detail',
      label: t(locale, 'form.startDate'),
      value: startWindowLabel(locale, lead.startDate),
    })
  }
  if (lead.programmeRef) {
    plan.push({ type: 'detail', label: copy.programme, value: lead.programmeRef.title })
  }
  if (plan.length > 0) {
    blocks.push({ type: 'heading', text: copy.planHeading }, ...plan)
  }

  if (lead.message) {
    blocks.push({ type: 'heading', text: copy.messageHeading }, {
      type: 'paragraph',
      text: lead.message,
    })
  }

  const contextPath = lead.programmeRef?.path ?? lead.sourcePath

  blocks.push(
    { type: 'heading', text: copy.contextHeading },
    { type: 'detail', label: copy.submitted, value: formatTimestamp(lead.submittedAt, locale) },
    { type: 'detail', label: copy.language, value: locale },
    { type: 'detail', label: copy.page, value: `${siteUrl}${contextPath}` },
    {
      type: 'detail',
      label: copy.consent,
      value: lead.marketingConsent ? copy.consentGiven : copy.consentWithheld,
    },
    { type: 'divider' },
    { type: 'note', text: copy.replyNote },
  )

  // Dropped automatically if the company ever registers with the IAA, so the
  // reminder cannot outlive the situation that made it necessary.
  if (!IMMIGRATION_ADVICE_STATUS.registrationConfirmed) {
    blocks.push({ type: 'note', text: copy.complianceNote })
  }

  const { html, text } = renderEmail({
    locale,
    preheader: copy.preheader,
    title: copy.title,
    blocks,
  })

  const interestSuffix = lead.interest ? ` (${interestLabel(locale, lead.interest)})` : ''

  return {
    to: recipient,
    // The reference and the category, never the sender's name: subject lines are
    // logged by relays and shown on lock screens.
    subject: `${copy.subjectPrefix[lead.kind]} ${reference}${interestSuffix}`,
    html,
    text,
    replyTo: lead.email,
    template: 'enquiry-notification',
    locale,
  }
}
