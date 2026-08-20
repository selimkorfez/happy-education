import { siteUrl } from '@/lib/env'
import { BUSINESS, SOCIAL, publicValue } from '@/lib/business-facts'
import { HREFLANG, type Locale } from '@/lib/i18n/config'

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
export function OrganizationSchema({ locale }: { locale: Locale }) {
  const legalName = publicValue(BUSINESS.legalName)
  const companyNumber = publicValue(BUSINESS.companyNumber)
  const registeredOffice = publicValue(BUSINESS.registeredOffice)
  const phone = publicValue(BUSINESS.phone)
  const email = publicValue(BUSINESS.email)
  const founded = publicValue(BUSINESS.foundedYear)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: BUSINESS.tradingName.value,
    url: `${siteUrl}/${locale}`,
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/brand/happy-education-logo.png`,
      width: 915,
      height: 384,
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
      streetAddress: '16 Upper Woburn Place',
      addressLocality: 'London',
      postalCode: 'WC1H 0AF',
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

  const verifiedSocial = SOCIAL.filter((s) => s.status === 'verified').map((s) => s.url)
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
