'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import {
  detectTimeZone,
  formatDateInZone,
  formatTimeInZone,
  safeTimeZone,
  timeZoneName,
  zonedDateKey,
} from '@/lib/booking/timezone'
import type { TimeSlot } from '@/lib/booking/types'

/**
 * Appointment picker: pick a date, then a time.
 *
 * WHAT THIS COMPONENT WILL NOT DO
 *   - It does not generate availability. Every slot comes from the server, already
 *     filtered for working hours, notice period and existing bookings. There is no
 *     decorative calendar and no "typical availability".
 *   - It does not show a date as bookable because it is a weekday. A date with no
 *     slots is announced as having none.
 *   - It does not hide the timezone. The zone the times are shown in is named in
 *     words, every time, and the adviser's zone is named too when it differs.
 *
 * TIMEZONE HANDLING
 * Slots arrive as UTC instants. The first render uses the business zone, which is
 * what the server rendered, so hydration matches; once mounted, the component
 * switches to the visitor's own zone and says which one it is. The value submitted
 * with the form is always the UTC instant, never a local time.
 *
 * KEYBOARD
 * The date grid is a real grid: arrow keys move by day and by week, Home and End
 * move within the week, PageUp and PageDown change month, and Enter or Space
 * chooses. Dates with no availability keep their place in the grid and stay
 * focusable with `aria-disabled`, so a screen reader user can move across the month
 * and hear why a date cannot be chosen rather than finding a silent gap.
 */

export interface AppointmentPickerProps {
  locale: Locale
  /** UTC ISO instants, resolved on the server. */
  slots: TimeSlot[]
  /** False when the business has not published working hours yet. */
  configured: boolean
  /** IANA zone the advisers work to. */
  businessTimezone: string
  /** Appointment length, shown so the visitor knows what they are booking. */
  durationMinutes?: number
  /** Form field name for the chosen UTC instant. */
  name?: string
}

const MS_PER_DAY = 86_400_000

/** Both locales start the week on Monday. */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const LOCALE_TAG: Record<Locale, string> = { en: 'en-GB', tr: 'tr-TR' }

function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function partsFromDateKey(key: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) - 1, day: Number(match[3]) }
}

/** Civil-calendar arithmetic only: no zone is involved in moving between dates. */
function shiftDateKey(key: string, days: number): string {
  const parts = partsFromDateKey(key)
  if (!parts) return key
  const shifted = new Date(Date.UTC(parts.year, parts.month, parts.day) + days * MS_PER_DAY)
  return dateKeyFromParts(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
}

function weekdayOf(key: string): number {
  const parts = partsFromDateKey(key)
  if (!parts) return 0
  return new Date(Date.UTC(parts.year, parts.month, parts.day)).getUTCDay()
}

export function AppointmentPicker({
  locale,
  slots,
  configured,
  businessTimezone,
  durationMinutes,
  name = 'startUtc',
}: AppointmentPickerProps) {
  const headingId = useId()
  const timeHeadingId = useId()
  const statusId = useId()

  const business = safeTimeZone(businessTimezone)

  // Server render and first client render agree on the business zone; the visitor's
  // own zone is applied after mount, which keeps hydration clean.
  const [zone, setZone] = useState<string>(business)
  useEffect(() => {
    const detected = detectTimeZone()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronising local state with an external system (URL, cookie or DOM), which is the case the rule's own guidance permits but cannot detect.
    if (detected) setZone(detected)
  }, [])

  const byDate = useMemo(() => {
    const map = new Map<string, TimeSlot[]>()
    for (const slot of slots) {
      const key = zonedDateKey(new Date(slot.startUtc), zone)
      const bucket = map.get(key)
      if (bucket) bucket.push(slot)
      else map.set(key, [slot])
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.startUtc.localeCompare(b.startUtc))
    }
    return map
  }, [slots, zone])

  const firstAvailable = useMemo(() => {
    const keys = [...byDate.keys()].sort()
    return keys[0] ?? null
  }, [byDate])

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const source = partsFromDateKey(firstAvailable ?? '') ?? {
      year: new Date().getUTCFullYear(),
      month: new Date().getUTCMonth(),
      day: 1,
    }
    return { year: source.year, month: source.month }
  })

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [focusedDate, setFocusedDate] = useState<string>(
    () => firstAvailable ?? dateKeyFromParts(visibleMonth.year, visibleMonth.month, 1),
  )

  const dayRefs = useRef(new Map<string, HTMLButtonElement>())
  const shouldFocus = useRef(false)

  useEffect(() => {
    if (!shouldFocus.current) return
    shouldFocus.current = false
    dayRefs.current.get(focusedDate)?.focus()
  }, [focusedDate, visibleMonth])

  // A zone change re-buckets every slot, so a date chosen in the old zone may no
  // longer be the day the visitor meant. Clearing is safer than silently moving it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronising local state with an external system (URL, cookie or DOM), which is the case the rule's own guidance permits but cannot detect.
    setSelectedDate(null)
    setSelectedSlot(null)
  }, [zone])

  if (!configured || slots.length === 0) {
    return (
      <UnavailableNotice
        locale={locale}
        title={
          configured ? t(locale, 'booking.noSlotsTitle') : t(locale, 'booking.noneConfigured.title')
        }
        message={
          configured ? t(locale, 'booking.noSlots') : t(locale, 'booking.noneConfigured.body')
        }
      />
    )
  }

  const weeks = buildMonthGrid(visibleMonth.year, visibleMonth.month)
  const daySlots = selectedDate ? (byDate.get(selectedDate) ?? []) : []

  function moveFocus(nextKey: string) {
    const parts = partsFromDateKey(nextKey)
    if (!parts) return
    shouldFocus.current = true
    setFocusedDate(nextKey)
    if (parts.year !== visibleMonth.year || parts.month !== visibleMonth.month) {
      setVisibleMonth({ year: parts.year, month: parts.month })
    }
  }

  function choose(key: string) {
    if (!byDate.has(key)) return
    setSelectedDate(key)
    setSelectedSlot(null)
    setFocusedDate(key)
  }

  function onGridKeyDown(event: React.KeyboardEvent<HTMLTableSectionElement>) {
    const key = focusedDate
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        moveFocus(shiftDateKey(key, -1))
        return
      case 'ArrowRight':
        event.preventDefault()
        moveFocus(shiftDateKey(key, 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        moveFocus(shiftDateKey(key, -7))
        return
      case 'ArrowDown':
        event.preventDefault()
        moveFocus(shiftDateKey(key, 7))
        return
      case 'Home': {
        event.preventDefault()
        const offset = WEEKDAY_ORDER.indexOf(weekdayOf(key))
        moveFocus(shiftDateKey(key, -offset))
        return
      }
      case 'End': {
        event.preventDefault()
        const offset = WEEKDAY_ORDER.indexOf(weekdayOf(key))
        moveFocus(shiftDateKey(key, 6 - offset))
        return
      }
      case 'PageUp':
        event.preventDefault()
        moveFocus(shiftDateKey(key, -28))
        return
      case 'PageDown':
        event.preventDefault()
        moveFocus(shiftDateKey(key, 28))
        return
      default:
        return
    }
  }

  const monthLabel = new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)))

  return (
    <div className="border border-border bg-card p-5 sm:p-6">
      <p className="text-sm text-fg-muted">
        {t(locale, 'booking.timezoneLabel')}:{' '}
        <span className="font-medium text-fg">
          {timeZoneName(zone, locale)} ({zone})
        </span>
      </p>
      {zone !== business ? (
        <p className="mt-1 text-sm text-fg-muted">
          {t(locale, 'booking.businessTimezoneNote')}: {timeZoneName(business, locale)} ({business})
        </p>
      ) : null}
      {durationMinutes ? (
        <p className="mt-1 text-sm text-fg-muted">
          {t(locale, 'booking.durationLabel')}: {durationMinutes} {t(locale, 'booking.minutes')}
        </p>
      ) : null}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 id={headingId} className="font-display text-[length:var(--text-xl)] font-semibold text-fg">
            {t(locale, 'booking.dateHeading')}
          </h3>
          <div className="flex items-center gap-1">
            <MonthButton
              label={t(locale, 'booking.previousMonth')}
              direction="previous"
              onClick={() =>
                setVisibleMonth(({ year, month }) =>
                  month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 },
                )
              }
            />
            <MonthButton
              label={t(locale, 'booking.nextMonth')}
              direction="next"
              onClick={() =>
                setVisibleMonth(({ year, month }) =>
                  month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 },
                )
              }
            />
          </div>
        </div>

        <p aria-live="polite" className="mt-2 text-sm font-medium text-fg">
          {monthLabel}
        </p>

        <table role="grid" aria-labelledby={headingId} className="mt-3 w-full table-fixed border-collapse">
          <caption className="sr-only">{t(locale, 'booking.calendarLabel')}</caption>
          <thead>
            <tr>
              {WEEKDAY_ORDER.map((weekday) => (
                <th
                  key={weekday}
                  scope="col"
                  className="pb-2 text-center text-xs font-medium text-fg-muted"
                >
                  <span aria-hidden="true">{shortWeekday(weekday, locale)}</span>
                  <span className="sr-only">{longWeekday(weekday, locale)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody onKeyDown={onGridKeyDown}>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((cell, cellIndex) => {
                  if (!cell) {
                    return <td key={cellIndex} role="gridcell" aria-hidden="true" className="p-0.5" />
                  }
                  const available = byDate.get(cell)?.length ?? 0
                  const isSelected = cell === selectedDate
                  const isFocused = cell === focusedDate
                  const readableDate = formatDateInZone(
                    `${cell}T12:00:00.000Z`,
                    'UTC',
                    locale,
                  )
                  const countLabel =
                    available === 0
                      ? t(locale, 'booking.unavailableDay')
                      : available === 1
                        ? t(locale, 'booking.oneTimeAvailable')
                        : `${available} ${t(locale, 'booking.timesAvailable')}`

                  return (
                    <td
                      key={cell}
                      role="gridcell"
                      aria-selected={isSelected}
                      className="p-0.5 align-top"
                    >
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) dayRefs.current.set(cell, node)
                          else dayRefs.current.delete(cell)
                        }}
                        tabIndex={isFocused ? 0 : -1}
                        aria-disabled={available === 0}
                        aria-label={`${readableDate}, ${countLabel}`}
                        onFocus={() => setFocusedDate(cell)}
                        onClick={() => choose(cell)}
                        className={[
                          'flex min-h-11 w-full items-center justify-center rounded-[3px] border text-sm transition-colors duration-150',
                          available === 0
                            ? 'cursor-not-allowed border-transparent text-fg-muted'
                            : 'border-border-input text-fg hover:bg-paper-sunk',
                          isSelected ? 'border-brand-strong bg-brand-strong text-white hover:bg-brand-pressed' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <span aria-hidden="true">{Number(cell.slice(8))}</span>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-7 border-t border-border pt-6">
        <h3
          id={timeHeadingId}
          className="font-display text-[length:var(--text-xl)] font-semibold text-fg"
        >
          {t(locale, 'booking.timeHeading')}
        </h3>

        <p id={statusId} aria-live="polite" className="mt-2 text-sm text-fg-muted">
          {!selectedDate
            ? t(locale, 'booking.selectDateFirst')
            : daySlots.length === 0
              ? t(locale, 'booking.noTimesOnDay')
              : `${formatDateInZone(`${selectedDate}T12:00:00.000Z`, 'UTC', locale)}: ${
                  daySlots.length === 1
                    ? t(locale, 'booking.oneTimeAvailable')
                    : `${daySlots.length} ${t(locale, 'booking.timesAvailable')}`
                }`}
        </p>

        {daySlots.length > 0 ? (
          <fieldset className="mt-4 border-0 p-0">
            <legend className="sr-only">{t(locale, 'booking.timeHeading')}</legend>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const checked = slot.startUtc === selectedSlot
                return (
                  <label
                    key={slot.startUtc}
                    className={[
                      'inline-flex min-h-11 cursor-pointer items-center rounded-[3px] border px-4 text-sm',
                      checked
                        ? 'border-brand-strong bg-brand-strong text-white'
                        : 'border-border-input text-fg hover:bg-paper-sunk',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={slot.startUtc}
                      checked={checked}
                      onChange={() => setSelectedSlot(slot.startUtc)}
                      className="sr-only"
                    />
                    {formatTimeInZone(slot.startUtc, zone, locale)}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ) : null}

        {selectedSlot ? (
          <p className="mt-5 text-sm text-fg">
            {t(locale, 'booking.chosen')}:{' '}
            <strong className="font-semibold">
              {formatDateInZone(selectedSlot, zone, locale)},{' '}
              {formatTimeInZone(selectedSlot, zone, locale)} ({timeZoneName(zone, locale)})
            </strong>
          </p>
        ) : null}

        <p className="mt-2 text-sm text-fg-muted">{t(locale, 'booking.confirmNote')}</p>

        {/* The visitor's zone travels with the booking so confirmations can be
            written in it. The instant itself is always the UTC value above. */}
        <input type="hidden" name={`${name}Timezone`} value={zone} readOnly />
      </div>
    </div>
  )
}

function MonthButton({
  label,
  direction,
  onClick,
}: {
  label: string
  direction: 'previous' | 'next'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[3px] border border-border-input text-fg transition-colors duration-150 hover:bg-paper-sunk"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d={direction === 'previous' ? 'M6.5 1 3 5l3.5 4' : 'M3.5 1 7 5l-3.5 4'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    </button>
  )
}

/** Honest empty state: says what is missing and offers a way through. */
function UnavailableNotice({
  locale,
  title,
  message,
}: {
  locale: Locale
  title: string
  message: string
}) {
  return (
    <div className="border border-border bg-paper-sunk p-5 sm:p-6">
      <h3 className="font-display text-[length:var(--text-xl)] font-semibold text-fg">{title}</h3>
      <p className="mt-2 max-w-[60ch] text-fg-muted">{message}</p>
      <p className="mt-4">
        <Link
          href={sectionPath(locale, 'contact')}
          className="text-brand-strong underline underline-offset-4"
        >
          {t(locale, 'footer.contactUs')}
        </Link>
      </p>
    </div>
  )
}

/** Weeks of the visible month, Monday first, padded with nulls. */
function buildMonthGrid(year: number, month: number): Array<Array<string | null>> {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const leading = WEEKDAY_ORDER.indexOf(firstWeekday)

  const cells: Array<string | null> = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(dateKeyFromParts(year, month, day))
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: Array<Array<string | null>> = []
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7))
  }
  return weeks
}

/** 2024-01-01 is a Monday, which anchors the weekday names without a lookup table. */
function weekdayDate(weekday: number): Date {
  const mondayOffset = (weekday + 6) % 7
  return new Date(Date.UTC(2024, 0, 1 + mondayOffset))
}

function shortWeekday(weekday: number, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { weekday: 'short', timeZone: 'UTC' }).format(
    weekdayDate(weekday),
  )
}

function longWeekday(weekday: number, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { weekday: 'long', timeZone: 'UTC' }).format(
    weekdayDate(weekday),
  )
}
