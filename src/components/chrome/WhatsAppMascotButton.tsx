import { BUSINESS, publicValue } from '@/lib/business-facts'
import { Logo } from '@/components/ui/Logo'
import { localised, type SiteSettings } from '@/lib/sanity/queries/settings'
import type { Locale } from '@/lib/i18n/config'

const COPY = {
  en: { label: 'Get in touch', message: 'Hello Happy Education, I would like to talk about my study plans.' },
  tr: { label: 'Bize yazın', message: 'Merhaba Happy Education, eğitim planlarım hakkında görüşmek istiyorum.' },
} as const

export function WhatsAppMascotButton({ locale, settings }: { locale: Locale; settings?: SiteSettings | null }) {
  const number = settings?.whatsapp?.replace(/\D/g, '') || publicValue(BUSINESS.whatsapp)
  if (!number) return null

  const copy = COPY[locale]
  const label = localised(settings?.interfaceCopy?.chatLabel, locale) ?? copy.label
  const message = localised(settings?.interfaceCopy?.chatMessage, locale) ?? copy.message
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: WhatsApp`}
      className="he-whatsapp-button group fixed bottom-24 right-4 z-[45] flex items-center gap-3 no-underline sm:bottom-6 sm:right-6"
    >
      <span className="he-chat-label relative border border-border/70 bg-card px-4 py-2.5 text-sm font-black text-fg shadow-[0_12px_34px_rgba(0,0,0,0.16)] transition duration-300 group-hover:-translate-x-1">
        {label}
      </span>
      <span className="he-chat-launcher grid h-16 w-16 shrink-0 place-items-center overflow-hidden bg-white p-1 shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition duration-300 group-hover:scale-105">
        <Logo variant="favicon" surface="light" brand={settings?.brand} title="" className="h-full w-full" />
      </span>
    </a>
  )
}
