'use client'

import { useConsent } from './ConsentProvider'
import { t } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'

/**
 * Footer control that reopens the preferences dialog. UK GDPR requires that
 * consent be as easy to withdraw as to give, so this appears on every page.
 */
export function CookiePreferencesButton({ locale }: { locale: Locale }) {
  const { openPreferences } = useConsent()
  return (
    <button
      type="button"
      onClick={openPreferences}
      className="text-left text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline"
    >
      {t(locale, 'footer.cookiePreferences')}
    </button>
  )
}
