/**
 * Business facts registry.
 *
 * Rule for this project: the website never publishes a claim that has not been
 * verified. Rather than scattering hopeful strings through JSX, every real-world
 * assertion lives here with an explicit provenance status.
 *
 *   'verified'   observed directly from a primary source; safe to render
 *   'pending'    plausible but NOT independently confirmed; must NOT be rendered
 *   'refuted'    checked and found to be wrong; kept so nobody re-adds it
 *
 * `publicValue()` returns null for anything not verified, so a pending fact
 * silently renders nothing instead of shipping a guess. Components must handle
 * null rather than substituting a placeholder.
 *
 * Values here are build-time defaults and schema fallbacks. Editable operational
 * content (addresses, hours, phone) is owned by `siteSettings` in Sanity once the
 * dataset is populated; this file is the safety net and the audit trail.
 */

export type FactStatus = 'verified' | 'pending' | 'refuted'

export interface Fact<T = string> {
  value: T
  status: FactStatus
  /** Where the value came from, or what still needs checking. */
  source: string
  /** ISO date the check was performed. */
  checked: string
}

const CHECKED = '2026-08-20'

export const BUSINESS = {
  /** Trading name as used across the site. */
  tradingName: {
    value: 'Happy Education',
    status: 'verified',
    source: 'Logo artwork and site-wide usage on happyeducation.uk',
    checked: CHECKED,
  } satisfies Fact,

  /**
   * Confirmed against the Companies House register: the client-supplied name is an
   * exact match and the company is active.
   *
   * Note there are similarly named UK companies — HAPPY EDUCATION LONDON LTD
   * (14996288) and HAPPY EDUCATIONAL CONSULTANCY LTD (12842646). Neither is this
   * business. Do not merge their details in.
   */
  legalName: {
    value: 'HAPPY EDUCATION CONSULTANCY LTD',
    status: 'verified',
    source:
      'Companies House register, company 11331426 — exact name match, status Active, private limited company.',
    checked: CHECKED,
  } satisfies Fact,

  companyNumber: {
    value: '11331426',
    status: 'verified',
    source: 'Companies House register — resolves to HAPPY EDUCATION CONSULTANCY LTD.',
    checked: CHECKED,
  } satisfies Fact,

  /** Sole director since incorporation. Matches the "Director" named on the current site. */
  director: {
    value: 'Sefa Mutlu Koca',
    status: 'verified',
    source: 'Companies House officers list for 11331426 — sole officer, appointed 26 April 2018.',
    checked: CHECKED,
  } satisfies Fact,

  /** SIC 85600. Useful for Organization structured data. */
  natureOfBusiness: {
    value: 'Educational support services',
    status: 'verified',
    source: 'Companies House SIC code 85600 for 11331426.',
    checked: CHECKED,
  } satisfies Fact,

  /** Observed on the live homepage markup. */
  phone: {
    value: '+44 7735 826785',
    status: 'verified',
    source: 'happyeducation.uk homepage markup, tel: link',
    checked: CHECKED,
  } satisfies Fact,

  whatsapp: {
    value: '447735826785',
    status: 'verified',
    source: 'happyeducation.uk homepage, wa.me link',
    checked: CHECKED,
  } satisfies Fact,

  email: {
    value: 'admin@happyeducation.uk',
    status: 'verified',
    source: 'happyeducation.uk homepage markup, mailto: link',
    checked: CHECKED,
  } satisfies Fact,

  /**
   * The Companies Act 2006 and the E-Commerce Regulations require the registered
   * office to appear on the website, so this is rendered in the footer.
   *
   * It must be labelled "registered office" and never described as a headquarters
   * or a staffed office: it is a Regus serviced address shared with roughly 2,600
   * other registered companies. Calling it an office would be a misleading claim.
   */
  registeredOffice: {
    value: '16 Upper Woburn Place, London, England, WC1H 0AF',
    status: 'verified',
    source: 'Companies House registered office for 11331426, effective 12 November 2025.',
    checked: CHECKED,
  } satisfies Fact,

  /**
   * A visitor-facing office where staff actually meet students is a different claim
   * from the registered office, and no such address is confirmed. The legacy English
   * contact page still renders the literal string "Address will be added here".
   */
  visitingOffice: {
    value: '',
    status: 'pending',
    source:
      'No staffed public office confirmed. Registered office is a Regus address. Client must confirm whether students are received anywhere, and at what address.',
    checked: CHECKED,
  } satisfies Fact,

  /** Published on the Turkish contact page but not independently confirmed. */
  istanbulOffice: {
    value: 'Altunizade Mah. Kısıklı Cad. No:28, Üsküdar, İstanbul',
    status: 'pending',
    source:
      'Published on happyeducation.uk/anasayfa/iletisim/. No Turkish legal entity or tenancy independently verified.',
    checked: CHECKED,
  } satisfies Fact,

  /**
   * Supported by two independent sources: Companies House incorporation
   * (26 April 2018) and Nominet domain registration (9 July 2018).
   *
   * Phrase it as "established in 2018" or "UK-registered since 2018". Avoid the
   * stale "6 years of experience" copy from the legacy site — as of 2026 that
   * would be eight years, and a wrong duration reads as carelessness.
   */
  foundedYear: {
    value: '2018',
    status: 'verified',
    source:
      'Companies House incorporation 26 April 2018; Nominet registration of happyeducation.uk 9 July 2018.',
    checked: CHECKED,
  } satisfies Fact,
} as const

/** Social profiles observed directly in the live homepage markup. */
export const SOCIAL = [
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/happyeducationturkiye/',
    status: 'verified' as FactStatus,
  },
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/HappyEdUK',
    status: 'verified' as FactStatus,
  },
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/company/happyeducation',
    status: 'verified' as FactStatus,
  },
] as const

/**
 * Claims that must never be rendered until the client confirms them in writing.
 * Surfaced in LEGAL_REVIEW.md and in the launch checklist.
 */
export const BLOCKED_CLAIMS = [
  // The legacy site's own figures contradict each other: the About page counters
  // read 20+ countries / 200+ universities / 150+ schools / 500+ students, while
  // its prose says 700+ students, and an archived page said "over a hundred"
  // universities. None can be corroborated — the company files micro-entity
  // accounts, which disclose neither turnover nor headcount.
  'Any student/applicant count ("500+", "700+", "hundreds of students")',
  'Number of partner or represented institutions ("200+ universities", "150+ schools")',
  'Number of countries served ("20+")',
  'Any success, acceptance or visa-approval rate',
  'Any years-of-experience figure carried over from the legacy site ("6 years" is stale)',

  // No register entry found for any of these.
  'British Council / English UK / ICEF / BAC accreditation or membership',
  'IAA (formerly OISC) immigration-advice registration at any level',
  'Any award, press mention or "as seen in" placement',
  'Any Trustpilot, Google or other review score — no profile was located',
  'Any partner or "trusted by" institution relationship not evidenced by a signed agreement',

  // Identity hygiene.
  'Describing the registered office as a headquarters or staffed office',
  'Any named staff member other than the director, pending employment confirmation and consent',
] as const

/**
 * Regulatory constraint carried into every template that touches visa content.
 *
 * The legacy site markets "vize danışmanlığı" (visa consultancy) across 54 of its
 * 331 pages. Under the Immigration and Asylum Act 1999, providing immigration
 * advice or services in the course of a business in the UK requires registration
 * with the Immigration Advice Authority (which replaced the OISC), or an exemption.
 * No registration could be confirmed for this company.
 *
 * Until the client supplies a registration number and level, visa content on this
 * site must:
 *   - describe administrative and application support only, never advice
 *   - state that decisions rest with the relevant government authority
 *   - link to official government sources for the requirements themselves
 *   - never promise, guarantee or predict an outcome
 * See docs/LEGAL_REVIEW.md.
 */
export const IMMIGRATION_ADVICE_STATUS = {
  registrationConfirmed: false,
  regulator: 'Immigration Advice Authority (IAA)',
  note: 'No IAA registration confirmed. Visa content is limited to non-advisory administrative support.',
} as const

/**
 * Returns the value only when it has been verified, otherwise null.
 * Callers must render nothing (not a placeholder) when this returns null.
 */
export function publicValue<T>(fact: Fact<T>): T | null {
  return fact.status === 'verified' ? fact.value : null
}

/** True when every fact in the record is verified — used by the pre-launch gate. */
export function allVerified(facts: Record<string, Fact<unknown>>): boolean {
  return Object.values(facts).every((f) => f.status === 'verified')
}

/** Facts still blocking launch, for the QA report and the launch checklist. */
export function pendingFacts(): Array<{ key: string; source: string }> {
  return Object.entries(BUSINESS)
    .filter(([, f]) => (f as Fact).status !== 'verified')
    .map(([key, f]) => ({ key, source: (f as Fact).source }))
}
