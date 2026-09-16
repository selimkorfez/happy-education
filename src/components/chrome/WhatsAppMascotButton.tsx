import Image from 'next/image'
import { BUSINESS, publicValue } from '@/lib/business-facts'
import { brandImage } from '@/lib/media/library'
import type { Locale } from '@/lib/i18n/config'

const COPY = {
  en: { label: 'Get in touch', message: 'Hello Happy Education, I would like to talk about my study plans.' },
  tr: { label: 'Bize yazın', message: 'Merhaba Happy Education, eğitim planlarım hakkında görüşmek istiyorum.' },
} as const

export function WhatsAppMascotButton({ locale }: { locale: Locale }) {
  const number = publicValue(BUSINESS.whatsapp)
  if (!number) return null

  const mascot = brandImage('owlMascotPlaceholder')
  const copy = COPY[locale]
  const href = `https://wa.me/${number}?text=${encodeURIComponent(copy.message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${copy.label}: WhatsApp`}
      className="he-whatsapp-button group fixed bottom-24 right-4 z-[45] flex items-center gap-2.5 border border-white/18 bg-ink-surface py-1.5 pl-4 pr-1.5 text-sm font-black text-fg-on-ink no-underline shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:bg-ink-surface-soft focus-visible:outline-offset-4 sm:bottom-6 sm:right-6"
    >
      <span className="hidden sm:inline">{copy.label}</span>
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden border border-white/18 bg-card">
        <Image src={mascot.src} alt="" width={56} height={56} className="h-full w-full object-contain" />
      </span>
    </a>
  )
}
