'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import type { MessageKey } from '@/lib/i18n/dictionary'
import { parseEnquiry, parseNewsletter, type FieldErrors as ParsedFieldErrors } from '@/lib/leads/validation'
import type {
  EnquiryApiResponse,
  EnquiryErrorCode,
  FieldErrorCode,
  NewsletterApiResponse,
} from '@/lib/leads/types'

/**
 * Submission state for the lead forms.
 *
 * PROGRESSIVE BY CONSTRUCTION. The form element is a real `<form action method>`
 * that works with JavaScript switched off: the server answers a plain submission
 * with a 303 back to the page, carrying the outcome in a query parameter. This
 * hook takes over when it can, sends the same fields as JSON, and keeps the
 * visitor on the page. `readInitialStatus` picks the redirect outcome back up so
 * the two paths end in the same place.
 *
 * The server is the source of truth for validation. Nothing here decides that a
 * submission is invalid; it only renders what came back.
 */

export type FormPhase = 'idle' | 'submitting' | 'success' | 'error'

const FIELD_ERROR_KEYS: Record<FieldErrorCode, MessageKey> = {
  required: 'form.error.required',
  invalid: 'form.error.invalid',
  tooLong: 'form.error.tooLong',
  tooShort: 'form.error.tooShort',
  unsupported: 'form.error.unsupported',
}

const FORM_ERROR_KEYS: Record<EnquiryErrorCode, MessageKey> = {
  validation: 'form.errorSummary',
  rateLimit: 'form.error.rateLimit',
  captcha: 'form.error.captcha',
  delivery: 'form.error.delivery',
  // An origin or shape failure means something is wrong with the request itself.
  // The visitor cannot act on that distinction, so they get the general message.
  origin: 'form.error.generic',
  malformed: 'form.error.generic',
  unavailable: 'form.error.generic',
}

/** Message key for a field error code, for rendering under the field. */
export function fieldErrorKey(code: FieldErrorCode): MessageKey {
  return FIELD_ERROR_KEYS[code]
}

type ApiResponse = EnquiryApiResponse | NewsletterApiResponse

export interface LeadFormController {
  phase: FormPhase
  /** Field name to error code, as returned by the server. */
  fieldErrors: Record<string, FieldErrorCode>
  /** Whole-form failure, already resolved to a dictionary key. */
  formErrorKey: MessageKey | null
  reference: string | null
  /** Attach to the error summary so it can take focus after a failed submit. */
  summaryRef: RefObject<HTMLDivElement | null>
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export interface UseLeadFormOptions {
  endpoint: string
  /**
   * Query parameter the no-JavaScript redirect uses to report an outcome, so a
   * visitor returning from the server path sees the same result.
   */
  statusParam: string
  /** Values of that parameter that mean success. */
  successValues: readonly string[]
}

export function useLeadForm({
  endpoint,
  statusParam,
  successValues,
}: UseLeadFormOptions): LeadFormController {
  const [phase, setPhase] = useState<FormPhase>('idle')
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorCode>>({})
  const [formErrorKey, setFormErrorKey] = useState<MessageKey | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement | null>(null)

  /*
   * Pick up the outcome of a no-JavaScript submission. Read from
   * `window.location` in an effect rather than through `useSearchParams`, which
   * would force every page embedding a form into a Suspense boundary.
   */
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get(statusParam)
    if (!status) return

    if (successValues.includes(status)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronising local state with an external system (URL, cookie or DOM), which is the case the rule's own guidance permits but cannot detect.
      setPhase('success')
      return
    }
    if (status === 'busy') {
      setPhase('error')
      setFormErrorKey('form.error.rateLimit')
      return
    }
    if (status === 'invalid') {
      setPhase('error')
      setFormErrorKey('form.errorSummary')
      return
    }
    if (status === 'error') {
      setPhase('error')
      setFormErrorKey('form.error.generic')
    }
  }, [statusParam, successValues])

  // Focus the summary so a keyboard or screen-reader user is taken to the problem
  // rather than left at the bottom of the form wondering what happened.
  useEffect(() => {
    if (phase === 'error') summaryRef.current?.focus()
  }, [phase, formErrorKey])

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      const form = event.currentTarget
      event.preventDefault()

      setFieldErrors({})
      setFormErrorKey(null)

      const payload: Record<string, string> = {}
      for (const [key, value] of new FormData(form).entries()) {
        // This site accepts no uploads, so a non-string entry is not ours.
        if (typeof value === 'string') payload[key] = value
      }

      /*
       * Pre-flight validation against the SAME Zod schema the route handler uses,
       * so the two can never disagree. The server remains authoritative — this
       * only avoids a pointless round trip.
       *
       * It matters beyond tidiness: without it an empty submission still posts,
       * so a visitor waits for the network to be told their name is missing, and
       * obviously-invalid input consumes their rate-limit allowance. Native
       * browser validation is switched off (`noValidate`) because it shows one
       * error at a time, in the browser's language rather than the page's.
       */
      const preflight = endpoint.includes('newsletter')
        ? parseNewsletter(payload)
        : parseEnquiry(payload)

      if (!preflight.ok) {
        setPhase('error')
        setFieldErrors(preflight.fields as ParsedFieldErrors)
        setFormErrorKey('form.errorSummary')
        return
      }

      setPhase('submitting')

      void (async () => {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload),
          })

          let data: ApiResponse | null = null
          try {
            data = (await response.json()) as ApiResponse
          } catch {
            data = null
          }

          if (data?.ok) {
            setPhase('success')
            setReference('reference' in data ? data.reference : null)
            return
          }

          setPhase('error')
          if (data && !data.ok) {
            setFieldErrors(
              // `fields` is a partial record; drop anything without a code so the
              // rendering side never has to handle undefined.
              Object.fromEntries(
                Object.entries(data.fields ?? {}).filter(
                  (entry): entry is [string, FieldErrorCode] => entry[1] !== undefined,
                ),
              ),
            )
            setFormErrorKey(FORM_ERROR_KEYS[data.error])
          } else {
            setFormErrorKey('form.error.generic')
          }
        } catch {
          // The request never completed: offline, blocked, or the tab lost the
          // network. Distinct from a server refusal, and the advice differs.
          setPhase('error')
          setFormErrorKey('form.error.network')
        }
      })()
    },
    [endpoint],
  )

  return { phase, fieldErrors, formErrorKey, reference, summaryRef, onSubmit }
}
