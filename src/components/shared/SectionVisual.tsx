import type { Locale } from '@/lib/i18n/config'

export type SectionVisualVariant =
  | 'about'
  | 'city'
  | 'contact'
  | 'consultation'
  | 'guides'
  | 'insights'
  | 'language'
  | 'services'
  | 'tours'
  | 'universities'
  | 'summer'
  | 'boarding'

export function SectionVisual({ variant, label, locale }: { variant: SectionVisualVariant; label: string; locale: Locale }) {
  const visual = VISUALS[variant]
  const copy = visual.copy[locale]

  return (
    <div className={`relative aspect-[10/7] w-full overflow-hidden rounded-[1.35rem] ${visual.surface}`} role="img" aria-label={label}>
      <div aria-hidden="true" className={`absolute -right-16 -top-20 h-56 w-56 rounded-full blur-2xl ${visual.glow}`} />
      <div aria-hidden="true" className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-white/45 blur-2xl" />
      <div className="absolute inset-0 p-5 sm:p-7">
        <div className="flex h-full flex-col justify-between rounded-[1.35rem] border border-white/65 bg-white/48 p-5 shadow-[0_20px_55px_rgba(35,35,38,0.10)] backdrop-blur-md sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex rounded-full bg-white/85 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.11em] text-fg shadow-sm">{copy.kicker}</span>
            <span className={`h-3 w-3 rounded-full ${visual.dot}`} />
          </div>
          <VisualMark variant={variant} locale={locale} />
          <div className="grid grid-cols-3 gap-2.5">
            {copy.tags.map((tag, index) => (
              <div key={tag} className="rounded-[0.95rem] border border-white/70 bg-white/72 p-3 shadow-[0_8px_24px_rgba(35,35,38,0.06)]">
                <span className="text-[0.62rem] font-black tabular-nums text-brand-strong">0{index + 1}</span>
                <p className="mt-1 text-xs font-bold leading-tight text-fg">{tag}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function VisualMark({ variant, locale }: { variant: SectionVisualVariant; locale: Locale }) {
  if (variant === 'tours' || variant === 'city') {
    return <div aria-hidden="true" className="relative mx-auto h-32 w-[86%]"><svg viewBox="0 0 360 140" className="h-full w-full" fill="none"><path d="M18 102C73 15 136 128 200 55C241 8 293 27 342 83" stroke="currentColor" className="text-brand" strokeWidth="5" strokeLinecap="round" strokeDasharray="5 12" /><circle cx="23" cy="99" r="12" className="fill-ink-surface" /><circle cx="337" cy="82" r="14" className="fill-brand" /><path d="M169 60l17-10 14 8-14 6-2 15-7-3-1-10-12 2 5-8Z" className="fill-ink-surface" /></svg></div>
  }

  if (variant === 'language') {
    return <div aria-hidden="true" className="relative mx-auto flex h-32 w-[88%] items-center justify-center gap-3"><div className="-rotate-3 rounded-[1.4rem] bg-ink-surface px-6 py-5 text-2xl font-black text-white shadow-[0_18px_42px_rgba(35,35,38,0.16)]">{locale === 'tr' ? 'Merhaba' : 'Hello'}</div><div className="translate-y-4 rotate-3 rounded-[1.4rem] bg-brand px-6 py-5 text-2xl font-black text-fg shadow-[0_18px_42px_rgba(244,116,38,0.20)]">{locale === 'tr' ? 'Hello!' : 'Hi!'}</div><div className="-translate-y-3 rounded-full bg-white px-4 py-3 text-lg font-black text-brand-strong shadow-lg">Aa</div></div>
  }

  if (variant === 'insights' || variant === 'guides') {
    return <div aria-hidden="true" className="relative mx-auto h-32 w-[82%]"><div className="absolute left-4 top-4 h-24 w-[62%] -rotate-3 rounded-[1.25rem] border border-white/70 bg-white p-4 shadow-[0_15px_38px_rgba(35,35,38,0.11)]"><div className="h-2 w-16 rounded-full bg-brand" /><div className="mt-3 h-2 w-full rounded-full bg-fg/12" /><div className="mt-2 h-2 w-4/5 rounded-full bg-fg/12" /></div><div className="absolute bottom-1 right-4 grid h-20 w-20 place-items-center rotate-6 rounded-[1.4rem] bg-ink-surface text-3xl font-black text-brand-on-ink shadow-[0_16px_38px_rgba(35,35,38,0.18)]">?</div></div>
  }

  if (variant === 'about' || variant === 'contact' || variant === 'consultation') {
    return <div aria-hidden="true" className="relative mx-auto flex h-32 w-[82%] items-end justify-center gap-4"><PersonCard className="-rotate-4 bg-brand-soft" /><PersonCard className="translate-y-2 rotate-2 bg-white" /><div className="absolute right-2 top-1 rounded-[1.2rem] bg-ink-surface px-4 py-3 text-sm font-black text-white shadow-lg">{locale === 'tr' ? 'Konuşalım' : "Let's talk"}</div></div>
  }

  if (variant === 'summer') {
    return <div aria-hidden="true" className="relative mx-auto h-32 w-[86%] overflow-hidden rounded-[1.4rem] bg-sky-200/55"><div className="absolute -bottom-9 -left-10 h-28 w-44 rotate-6 rounded-[50%] bg-brand/70" /><div className="absolute bottom-2 right-4 h-16 w-16 rounded-full bg-yellow-200" /><div className="absolute left-1/2 top-5 h-14 w-2 -translate-x-1/2 rounded-full bg-ink-surface" /><div className="absolute left-1/2 top-5 h-12 w-16 origin-left -rotate-12 rounded-r-full bg-white/90" /></div>
  }

  if (variant === 'boarding') {
    return <div aria-hidden="true" className="relative mx-auto h-32 w-[86%]"><div className="absolute inset-x-5 bottom-2 h-24 rounded-t-[2rem] bg-ink-surface shadow-[0_18px_42px_rgba(35,35,38,0.18)]" /><div className="absolute bottom-2 left-1/2 h-14 w-10 -translate-x-1/2 rounded-t-xl bg-brand" /><div className="absolute left-[25%] top-9 h-5 w-5 rounded-md bg-sky-100" /><div className="absolute right-[25%] top-9 h-5 w-5 rounded-md bg-sky-100" /><div className="absolute left-1/2 top-1 h-10 w-10 -translate-x-1/2 rotate-45 bg-ink-surface" /></div>
  }

  return <div aria-hidden="true" className="relative mx-auto h-32 w-[86%]"><div className="absolute bottom-3 left-2 h-24 w-[70%] -rotate-2 rounded-[1.5rem] bg-ink-surface shadow-[0_18px_42px_rgba(35,35,38,0.18)]" /><div className="absolute bottom-8 left-8 h-9 w-9 rounded-lg bg-sky-100" /><div className="absolute bottom-8 left-20 h-9 w-9 rounded-lg bg-brand-soft" /><div className="absolute bottom-8 left-32 h-9 w-9 rounded-lg bg-mint-soft" /><div className="absolute right-3 top-2 grid h-20 w-20 place-items-center rounded-full bg-brand text-2xl font-black text-fg shadow-lg">↗</div></div>
}

function PersonCard({ className }: { className: string }) {
  return <div className={`relative h-28 w-24 rounded-[1.45rem] border border-white/70 shadow-[0_16px_36px_rgba(35,35,38,0.11)] ${className}`}><div className="absolute left-1/2 top-4 h-9 w-9 -translate-x-1/2 rounded-full bg-ink-surface/85" /><div className="absolute bottom-0 left-1/2 h-14 w-16 -translate-x-1/2 rounded-t-[2rem] bg-ink-surface/85" /></div>
}

type VisualCopy = { kicker: string; tags: [string, string, string] }
type VisualConfig = { surface: string; glow: string; dot: string; copy: Record<Locale, VisualCopy> }

const VISUALS: Record<SectionVisualVariant, VisualConfig> = {
  universities: { surface: 'bg-gradient-to-br from-sky-soft via-white to-brand-soft', glow: 'bg-sky-300/50', dot: 'bg-brand', copy: { en: { kicker: 'Study options', tags: ['Course fit', 'City life', 'Next step'] }, tr: { kicker: 'Eğitim seçenekleri', tags: ['Bölüm uyumu', 'Şehir hayatı', 'Sonraki adım'] } } },
  language: { surface: 'bg-gradient-to-br from-brand-soft via-white to-mint-soft', glow: 'bg-brand/30', dot: 'bg-success', copy: { en: { kicker: 'Language + life', tags: ['Learn', 'Connect', 'Explore'] }, tr: { kicker: 'Dil + yaşam', tags: ['Öğren', 'Bağ kur', 'Keşfet'] } } },
  tours: { surface: 'bg-gradient-to-br from-mint-soft via-white to-sky-soft', glow: 'bg-sky-300/45', dot: 'bg-brand', copy: { en: { kicker: 'Travel with purpose', tags: ['Route', 'Experience', 'Support'] }, tr: { kicker: 'Amaçlı seyahat', tags: ['Rota', 'Deneyim', 'Destek'] } } },
  insights: { surface: 'bg-gradient-to-br from-[#fff1e6] via-white to-sky-soft', glow: 'bg-brand/25', dot: 'bg-ink-surface', copy: { en: { kicker: 'Read smarter', tags: ['Question', 'Compare', 'Decide'] }, tr: { kicker: 'Daha bilinçli oku', tags: ['Sor', 'Karşılaştır', 'Karar ver'] } } },
  guides: { surface: 'bg-gradient-to-br from-sky-soft via-white to-[#fff5db]', glow: 'bg-sky-300/40', dot: 'bg-brand', copy: { en: { kicker: 'Practical guide', tags: ['Understand', 'Plan', 'Check'] }, tr: { kicker: 'Pratik rehber', tags: ['Anla', 'Planla', 'Kontrol et'] } } },
  services: { surface: 'bg-gradient-to-br from-brand-soft via-white to-sky-soft', glow: 'bg-brand/25', dot: 'bg-success', copy: { en: { kicker: 'Support', tags: ['Shortlist', 'Apply', 'Prepare'] }, tr: { kicker: 'Destek', tags: ['Kısa liste', 'Başvur', 'Hazırlan'] } } },
  about: { surface: 'bg-gradient-to-br from-sky-soft via-white to-brand-soft', glow: 'bg-brand/24', dot: 'bg-success', copy: { en: { kicker: 'Human guidance', tags: ['Listen', 'Clarify', 'Organise'] }, tr: { kicker: 'İnsan odaklı destek', tags: ['Dinle', 'Netleştir', 'Düzenle'] } } },
  contact: { surface: 'bg-gradient-to-br from-mint-soft via-white to-sky-soft', glow: 'bg-sky-300/40', dot: 'bg-brand', copy: { en: { kicker: 'Start here', tags: ['Ask', 'Share', 'Reply'] }, tr: { kicker: 'Buradan başla', tags: ['Sor', 'Paylaş', 'Yanıt al'] } } },
  consultation: { surface: 'bg-gradient-to-br from-brand-soft via-white to-[#fff5db]', glow: 'bg-brand/28', dot: 'bg-success', copy: { en: { kicker: 'One conversation', tags: ['Goals', 'Options', 'Plan'] }, tr: { kicker: 'Bir görüşme', tags: ['Hedefler', 'Seçenekler', 'Plan'] } } },
  city: { surface: 'bg-gradient-to-br from-sky-soft via-white to-mint-soft', glow: 'bg-sky-300/45', dot: 'bg-brand', copy: { en: { kicker: 'Student city', tags: ['Study', 'Live', 'Explore'] }, tr: { kicker: 'Öğrenci şehri', tags: ['Oku', 'Yaşa', 'Keşfet'] } } },
  summer: { surface: 'bg-gradient-to-br from-[#fff1db] via-white to-sky-soft', glow: 'bg-yellow-200/60', dot: 'bg-brand', copy: { en: { kicker: 'Summer experience', tags: ['Learn', 'Meet', 'Explore'] }, tr: { kicker: 'Yaz deneyimi', tags: ['Öğren', 'Tanış', 'Keşfet'] } } },
  boarding: { surface: 'bg-gradient-to-br from-sky-soft via-white to-brand-soft', glow: 'bg-sky-300/45', dot: 'bg-brand', copy: { en: { kicker: 'School + home', tags: ['Academics', 'Pastoral', 'Boarding'] }, tr: { kicker: 'Okul + yaşam', tags: ['Akademik', 'Destek', 'Yatılı yaşam'] } } },
}
