'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CONSENT_COOKIE,
  DENY_ALL,
  acceptAll,
  consentCookieAttributes,
  custom,
  parseConsent,
  rejectAll,
  serialiseConsent,
  toGoogleConsentMode,
  type ConsentRecord,
} from '@/lib/consent'

interface ConsentContextValue {
  /** null until the visitor has made a choice. */
  consent: ConsentRecord | null
  /** True when the banner should be visible. */
  needsDecision: boolean
  /** True when the preferences dialog is open. */
  isManaging: boolean
  openPreferences: () => void
  closePreferences: () => void
  acceptOptional: () => void
  rejectOptional: () => void
  saveCustom: (choices: { analytics: boolean; marketing: boolean }) => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
  return match ? (match.split('=').slice(1).join('=') ?? null) : null
}

function writeConsent(record: ConsentRecord) {
  const attrs = consentCookieAttributes(window.location.protocol === 'https:')
  document.cookie = `${CONSENT_COOKIE}=${serialiseConsent(record)}; ${attrs}`
}

/**
 * Pushes the decision into Google Consent Mode. Safe to call when no tag manager
 * is present: it only queues onto the dataLayer, which GTM reads if it ever loads.
 */
function signalConsentMode(record: ConsentRecord) {
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer ?? []
  w.dataLayer.push(['consent', 'update', toGoogleConsentMode(record)])
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentRecord | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [isManaging, setIsManaging] = useState(false)

  // Read the existing decision after mount. Rendering the banner is deferred until
  // then so the server and client markup agree during hydration.
  useEffect(() => {
    setConsent(parseConsent(readCookie(CONSENT_COOKIE)))
    setHydrated(true)
  }, [])

  const commit = useCallback((record: ConsentRecord) => {
    writeConsent(record)
    signalConsentMode(record)
    setConsent(record)
    setIsManaging(false)
  }, [])

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      needsDecision: hydrated && consent === null,
      isManaging,
      openPreferences: () => setIsManaging(true),
      closePreferences: () => setIsManaging(false),
      acceptOptional: () => commit(acceptAll(new Date().toISOString())),
      rejectOptional: () => commit(rejectAll(new Date().toISOString())),
      saveCustom: (choices) => commit(custom(new Date().toISOString(), choices)),
    }),
    [consent, hydrated, isManaging, commit],
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    throw new Error('useConsent must be used inside <ConsentProvider>')
  }
  return ctx
}

/** Current permissions, defaulting to deny before a decision exists. */
export function useConsentState(): ConsentRecord {
  return useConsent().consent ?? DENY_ALL
}
