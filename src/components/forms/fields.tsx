'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Form controls.
 *
 * The accessibility work is in here rather than repeated in each form, so it
 * cannot be half-applied: every control gets a real `<label for>`, hints and error
 * messages are wired through `aria-describedby`, and an invalid control carries
 * `aria-invalid` so a screen reader announces the state and not only the text.
 *
 * Two smaller decisions worth keeping:
 *
 *   - Errors are prefixed with a visually hidden "Error:" so they are announced as
 *     errors rather than as an unexplained sentence appearing under a field.
 *   - REQUIRED fields are marked, not optional ones. Most fields on these forms are
 *     optional, and marking the minority is less visual noise than marking the rest.
 */

const LABEL = 'block text-sm font-semibold text-fg'
const HINT = 'mt-1 text-sm leading-snug text-fg-muted'
const ERROR = 'mt-1.5 text-sm font-semibold text-error'
const CONTROL =
  'mt-1.5 block w-full min-h-11 rounded-[3px] border border-border-input bg-card px-3 py-2.5 ' +
  'text-base text-fg placeholder:text-fg-muted aria-[invalid=true]:border-error'

/**
 * The two strings every control needs but no control should have to be handed.
 * A context rather than a prop on each field, so a form cannot ship a control that
 * silently falls back to English.
 */
export interface FormText {
  requiredLabel: string
  errorPrefix: string
}

const FormTextContext = createContext<FormText>({ requiredLabel: 'required', errorPrefix: 'Error:' })

export function FormTextProvider({ value, children }: { value: FormText; children: ReactNode }) {
  return <FormTextContext.Provider value={value}>{children}</FormTextContext.Provider>
}

function useFormText(): FormText {
  return useContext(FormTextContext)
}

function describedBy(hintId: string | null, errorId: string | null): string | undefined {
  const ids = [hintId, errorId].filter((value): value is string => Boolean(value))
  return ids.length > 0 ? ids.join(' ') : undefined
}

function ErrorText({ id, children }: { id: string; children: string }) {
  const { errorPrefix } = useFormText()
  return (
    <p id={id} className={ERROR}>
      <span className="sr-only">{errorPrefix} </span>
      {children}
    </p>
  )
}

interface FieldFrameProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: { describedBy: string | undefined; invalid: boolean }) => ReactNode
}

function FieldFrame({ id, label, hint, error, required, children }: FieldFrameProps) {
  const { requiredLabel } = useFormText()
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null

  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        {label}
        {required ? (
          <span className="ml-1 font-normal text-fg-muted">({requiredLabel})</span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId ?? undefined} className={HINT}>
          {hint}
        </p>
      ) : null}
      {children({ describedBy: describedBy(hintId, errorId), invalid: Boolean(error) })}
      {error && errorId ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}

interface CommonProps {
  id: string
  name: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  defaultValue?: string
}

export function TextField({
  type = 'text',
  autoComplete,
  inputMode,
  maxLength,
  ...props
}: CommonProps & {
  type?: 'text' | 'email' | 'tel'
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel'
  maxLength?: number
}) {
  return (
    <FieldFrame {...props}>
      {({ describedBy: described, invalid }) => (
        <input
          id={props.id}
          name={props.name}
          type={type}
          className={CONTROL}
          defaultValue={props.defaultValue}
          required={props.required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          aria-describedby={described}
          aria-invalid={invalid || undefined}
        />
      )}
    </FieldFrame>
  )
}

export function TextAreaField({
  rows = 5,
  maxLength,
  ...props
}: CommonProps & { rows?: number; maxLength?: number }) {
  return (
    <FieldFrame {...props}>
      {({ describedBy: described, invalid }) => (
        <textarea
          id={props.id}
          name={props.name}
          rows={rows}
          className={`${CONTROL} resize-y`}
          defaultValue={props.defaultValue}
          required={props.required}
          maxLength={maxLength}
          aria-describedby={described}
          aria-invalid={invalid || undefined}
        />
      )}
    </FieldFrame>
  )
}

export interface SelectOption {
  value: string
  label: string
}

export function SelectField({
  options,
  placeholder,
  ...props
}: CommonProps & { options: readonly SelectOption[]; placeholder: string }) {
  return (
    <FieldFrame {...props}>
      {({ describedBy: described, invalid }) => (
        <select
          id={props.id}
          name={props.name}
          className={CONTROL}
          defaultValue={props.defaultValue ?? ''}
          required={props.required}
          aria-describedby={described}
          aria-invalid={invalid || undefined}
        >
          {/* An empty first option keeps "no answer" possible: a pre-selected
              value would put words in the visitor's mouth. */}
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldFrame>
  )
}

/**
 * A group of radios. `fieldset`/`legend` rather than a heading and loose inputs, so
 * the question is announced with each option instead of once at the top.
 */
export function RadioGroupField({
  name,
  legend,
  options,
  hint,
  error,
  idPrefix,
}: {
  name: string
  legend: string
  options: readonly SelectOption[]
  hint?: string
  error?: string
  idPrefix: string
}) {
  const hintId = hint ? `${idPrefix}-hint` : null
  const errorId = error ? `${idPrefix}-error` : null

  return (
    <fieldset aria-describedby={describedBy(hintId, errorId)}>
      <legend className={LABEL}>{legend}</legend>
      {hint ? (
        <p id={hintId ?? undefined} className={HINT}>
          {hint}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {options.map((option) => (
          <div key={option.value} className="flex min-h-11 items-center gap-2">
            <input
              id={`${idPrefix}-${option.value}`}
              type="radio"
              name={name}
              value={option.value}
              className="h-5 w-5 border-border-input accent-brand-strong"
            />
            <label htmlFor={`${idPrefix}-${option.value}`} className="text-base text-fg">
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && errorId ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </fieldset>
  )
}

/**
 * A single checkbox with its own explanation.
 *
 * Never pre-ticked. Consent that arrives already given is not consent, and for the
 * marketing box it would also be unlawful under UK PECR.
 */
export function CheckboxField({
  id,
  name,
  label,
  explanation,
  error,
}: {
  id: string
  name: string
  label: string
  explanation?: ReactNode
  error?: string
}) {
  const explanationId = explanation ? `${id}-explanation` : null
  const errorId = error ? `${id}-error` : null

  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          value="true"
          className="mt-1 h-5 w-5 shrink-0 border-border-input accent-brand-strong"
          aria-describedby={describedBy(explanationId, errorId)}
          aria-invalid={error ? true : undefined}
        />
        <label htmlFor={id} className="text-base leading-snug text-fg">
          {label}
        </label>
      </div>
      {explanation ? (
        <div
          id={explanationId ?? undefined}
          className="mt-2 pl-8 text-sm leading-snug text-fg-muted"
        >
          {explanation}
        </div>
      ) : null}
      {error && errorId ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  )
}

/**
 * The honeypot.
 *
 * Hidden from sight, hidden from assistive technology (`aria-hidden` plus
 * `tabIndex={-1}`), and excluded from autofill. A person cannot fill it in by
 * accident; a bot that fills every input will.
 *
 * Positioned off-screen rather than given `hidden`, because some bots skip inputs
 * that are explicitly hidden, which would defeat the point.
 */
export function HoneypotField({ name }: { name: string }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
      <label htmlFor={`${name}-field`}>Leave this field empty</label>
      <input
        id={`${name}-field`}
        name={name}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  )
}
