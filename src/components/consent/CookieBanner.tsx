'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useConsent } from './ConsentProvider'
import { Button } from '@/components/ui/Button'
import { legalPath } from '@/lib/legal'
import type { Locale } from '@/lib/i18n/config'

/**
 * Cookie banner and preferences dialog.
 *
 * Deliberately not a dark pattern: Accept and Reject are the same size, the same
 * weight and sit next to each other. Rejecting is one click from the first layer,
 * not buried behind a preferences screen.
 */

const COPY = {
  en: {
    heading: 'Cookies on this site',
    body: 'We use essential cookies to make this site work. We would also like to set optional cookies to understand how the site is used. We will not set optional cookies unless you turn them on.',
    accept: 'Accept optional cookies',
    reject: 'Reject optional cookies',
    manage: 'Manage preferences',
    dialogHeading: 'Cookie preferences',
    save: 'Save preferences',
    cancel: 'Cancel',
    essentialTitle: 'Essential cookies',
    essentialBody:
      'Needed for the site to function: your language, your cookie choice, form security and fraud prevention. These cannot be switched off.',
    essentialAlways: 'Always on',
    analyticsTitle: 'Analytics cookies',
    analyticsBody:
      'Help us understand which pages are useful and where visitors get stuck, so we can improve the guidance we publish.',
    marketingTitle: 'Marketing cookies',
    marketingBody:
      'Used to measure whether our advertising reaches people who find it relevant. Set by third parties.',
    more: 'Read our Cookie Policy',
    regionLabel: 'Cookie consent',
  },
  tr: {
    heading: 'Bu sitede çerezler',
    body: 'Sitenin çalışması için zorunlu çerezleri kullanıyoruz. Sitenin nasıl kullanıldığını anlamak için isteğe bağlı çerezleri de kullanmak istiyoruz. Siz izin vermeden isteğe bağlı çerez yerleştirmiyoruz.',
    accept: 'İsteğe bağlı çerezleri kabul et',
    reject: 'İsteğe bağlı çerezleri reddet',
    manage: 'Tercihleri yönet',
    dialogHeading: 'Çerez tercihleri',
    save: 'Tercihleri kaydet',
    cancel: 'Vazgeç',
    essentialTitle: 'Zorunlu çerezler',
    essentialBody:
      'Sitenin çalışması için gereklidir: dil tercihiniz, çerez seçiminiz, form güvenliği ve dolandırıcılık önleme. Bunlar kapatılamaz.',
    essentialAlways: 'Her zaman açık',
    analyticsTitle: 'Analiz çerezleri',
    analyticsBody:
      'Hangi sayfaların işe yaradığını ve ziyaretçilerin nerede zorlandığını anlamamıza yardımcı olur; yayımladığımız içeriği buna göre geliştiririz.',
    marketingTitle: 'Pazarlama çerezleri',
    marketingBody:
      'Reklamlarımızın ilgili kişilere ulaşıp ulaşmadığını ölçmek için kullanılır. Üçüncü taraflarca yerleştirilir.',
    more: 'Çerez Politikamızı okuyun',
    regionLabel: 'Çerez onayı',
  },
} as const

export function CookieBanner({ locale }: { locale: Locale }) {
  const { needsDecision, isManaging, acceptOptional, rejectOptional, openPreferences } = useConsent()
  const copy = COPY[locale]

  if (isManaging) return <PreferencesDialog locale={locale} />
  if (!needsDecision) return null

  return (
    <section
      aria-label={copy.regionLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card"
    >
      <div className="mx-auto flex max-w-[78rem] flex-col gap-4 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:gap-8 lg:px-10">
        <div className="lg:flex-1">
          <h2 className="text-base font-semibold text-fg">{copy.heading}</h2>
          <p className="mt-1.5 max-w-[70ch] text-sm leading-relaxed text-fg-muted">
            {copy.body}{' '}
            <Link
              href={legalPath(locale, 'cookies')}
              className="text-brand-strong underline underline-offset-4"
            >
              {copy.more}
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button onClick={acceptOptional}>{copy.accept}</Button>
          <Button variant="secondary" onClick={rejectOptional}>
            {copy.reject}
          </Button>
          <Button variant="secondary" onClick={openPreferences}>
            {copy.manage}
          </Button>
        </div>
      </div>
    </section>
  )
}

function PreferencesDialog({ locale }: { locale: Locale }) {
  const { consent, closePreferences, saveCustom } = useConsent()
  const copy = COPY[locale]
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const analyticsRef = useRef<HTMLInputElement | null>(null)
  const marketingRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePreferences()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const { body } = document
    const prev = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = prev
      previouslyFocused?.focus()
    }
  }, [closePreferences])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-0 sm:items-center sm:p-6">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-prefs-heading"
        className="max-h-[85dvh] w-full max-w-2xl overflow-y-auto border border-border bg-card p-6 sm:p-8"
      >
        <h2 id="cookie-prefs-heading" className="text-xl font-semibold text-fg">
          {copy.dialogHeading}
        </h2>

        <div className="mt-6 space-y-5">
          <fieldset className="border border-border p-4">
            <legend className="px-1.5 text-sm font-semibold text-fg">{copy.essentialTitle}</legend>
            <p className="text-sm leading-relaxed text-fg-muted">{copy.essentialBody}</p>
            <p className="mt-2 text-sm font-medium text-success">{copy.essentialAlways}</p>
          </fieldset>

          <CategoryToggle
            inputRef={analyticsRef}
            id="consent-analytics"
            title={copy.analyticsTitle}
            body={copy.analyticsBody}
            defaultChecked={consent?.analytics ?? false}
          />
          <CategoryToggle
            inputRef={marketingRef}
            id="consent-marketing"
            title={copy.marketingTitle}
            body={copy.marketingBody}
            defaultChecked={consent?.marketing ?? false}
          />
        </div>

        <div className="mt-7 flex flex-wrap gap-2.5">
          <Button
            onClick={() =>
              saveCustom({
                analytics: analyticsRef.current?.checked ?? false,
                marketing: marketingRef.current?.checked ?? false,
              })
            }
          >
            {copy.save}
          </Button>
          <Button variant="secondary" onClick={closePreferences}>
            {copy.cancel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CategoryToggle({
  id,
  title,
  body,
  defaultChecked,
  inputRef,
}: {
  id: string
  title: string
  body: string
  defaultChecked: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-start gap-3">
        <input
          ref={inputRef}
          type="checkbox"
          id={id}
          // Never pre-ticked on a first visit: `defaultChecked` reflects a prior
          // saved choice only, and is false when no decision exists yet.
          defaultChecked={defaultChecked}
          className="mt-1 h-5 w-5 shrink-0 accent-brand-strong"
        />
        <div>
          <label htmlFor={id} className="block text-sm font-semibold text-fg">
            {title}
          </label>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{body}</p>
        </div>
      </div>
    </div>
  )
}
