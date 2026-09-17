import { siteUrl } from '@/lib/env'
import { BUSINESS, SOCIAL, publicValue } from '@/lib/business-facts'
import { HREFLANG, type Locale } from '@/lib/i18n/config'
import { imageUrl } from '@/lib/sanity/image'
import type { SiteSettings } from '@/lib/sanity/queries/settings'

/**
 * Organization structured data.
 *
 * Built only from independently verified facts. Anything still pending
 * verification is omitted rather than guessed, because structured data is exactly
 * where a wrong company detail propagates furthest.
 *
 * Typed as EducationalOrganization would overstate what this business is: it is an
 * advisory service (Companies House SIC 85600, educational support services), not
 * a teaching institution. Claiming to be a school in schema would be a misleading
 * signal, so this is an Organization with a ProfessionalService touch.
 */
export function OrganizationSchema({ locale, settings }: { locale: Locale; settings?: SiteSettings | null }) {
  const legalName = settings?.legalName?.trim() || publicValue(BUSINESS.legalName)
  const companyNumber = settings?.companyNumber?.trim() || publicValue(BUSINESS.companyNumber)
  const registeredOffice = settings?.registeredOffice?.trim() || publicValue(BUSINESS.registeredOffice)
  const phone = settings?.phone?.trim() || publicValue(BUSINESS.phone)
  const email = settings?.email?.trim() || publicValue(BUSINESS.email)
  const founded = publicValue(BUSINESS.foundedYear)
  const cmsLogo = settings?.brand?.logoOnLight?.licence?.cleared === true
    ? imageUrl(settings.brand.logoOnLight, 1437)
    : null

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: settings?.tradingName?.trim() || BUSINESS.tradingName.value,
    url: `${siteUrl}/${locale}`,
    logo: {
      '@type': 'ImageObject',
      url: cmsLogo ?? `${siteUrl}/brand/official/logo-color.png`,
      ...(cmsLogo ? {} : { width: 1437, height: 672 }),
    },
    inLanguage: HREFLANG[locale],
  }

  if (legalName) schema.legalName = legalName
  if (founded) schema.foundingDate = founded

  // Companies House number, expressed as an identifier rather than a bare string
  // so it is machine-checkable against the register.
  if (companyNumber) {
    schema.identifier = {
      '@type': 'PropertyValue',
      propertyID: 'GB-COH',
      value: companyNumber,
    }
  }

  if (registeredOffice) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: registeredOffice,
      addressCountry: 'GB',
    }
  }

  const contactPoints: unknown[] = []
  if (phone || email) {
    contactPoints.push({
      '@type': 'ContactPoint',
      contactType: 'customer support',
      ...(phone ? { telephone: phone.replace(/\s/g, '') } : {}),
      ...(email ? { email } : {}),
      availableLanguage: ['en-GB', 'tr-TR'],
    })
  }
  if (contactPoints.length) schema.contactPoint = contactPoints

  const verifiedSocial = settings?.social
    ? settings.social.flatMap((account) => account.url?.startsWith('https://') ? [account.url] : [])
    : SOCIAL.filter((s) => s.status === 'verified').map((s) => s.url)
  if (verifiedSocial.length) schema.sameAs = verifiedSocial

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped for the </script> sequence, which is the
      // only injection vector in a JSON-LD block.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
      }}
    />
  )
}
