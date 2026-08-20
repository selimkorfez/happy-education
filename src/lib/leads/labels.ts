import { t, type MessageKey } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'
import type { ContactMethod, EducationLevel, Interest, StartWindow } from './types'

/**
 * Human labels for the fixed option sets.
 *
 * One mapping, used by the browser form to render the `<option>` list and by the
 * notification email to say what was chosen. Without this the two drift, and an
 * adviser ends up reading `nextAcademicYear` in an email while the student saw
 * "Next academic year" on the page.
 *
 * The strings themselves live in the dictionary, so both locales stay typed and a
 * missing Turkish translation is a compile error rather than an English leak.
 */

const INTEREST_KEYS: Record<Interest, MessageKey> = {
  universities: 'form.interest.universities',
  languageSchools: 'form.interest.languageSchools',
  summerSchools: 'form.interest.summerSchools',
  boardingSchools: 'form.interest.boardingSchools',
  tours: 'form.interest.tours',
  other: 'form.interest.other',
}

const LEVEL_KEYS: Record<EducationLevel, MessageKey> = {
  secondary: 'form.level.secondary',
  highSchool: 'form.level.highSchool',
  foundation: 'form.level.foundation',
  undergraduate: 'form.level.undergraduate',
  postgraduate: 'form.level.postgraduate',
  adultLearner: 'form.level.adultLearner',
  other: 'form.level.other',
}

const START_KEYS: Record<StartWindow, MessageKey> = {
  asSoonAsPossible: 'form.start.asSoonAsPossible',
  withinSixMonths: 'form.start.withinSixMonths',
  nextAcademicYear: 'form.start.nextAcademicYear',
  undecided: 'form.start.undecided',
}

const CONTACT_KEYS: Record<ContactMethod, MessageKey> = {
  email: 'form.contactMethod.email',
  phone: 'form.contactMethod.phone',
  whatsapp: 'form.contactMethod.whatsapp',
}

export function interestLabel(locale: Locale, value: Interest): string {
  return t(locale, INTEREST_KEYS[value])
}

export function educationLevelLabel(locale: Locale, value: EducationLevel): string {
  return t(locale, LEVEL_KEYS[value])
}

export function startWindowLabel(locale: Locale, value: StartWindow): string {
  return t(locale, START_KEYS[value])
}

export function contactMethodLabel(locale: Locale, value: ContactMethod): string {
  return t(locale, CONTACT_KEYS[value])
}
