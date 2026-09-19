import "server-only";
import { sanityFetch } from "@/lib/sanity/client";
import {
  docPath,
  type Locale,
  type SectionKey,
} from "@/lib/i18n/config";
import { isConfigured } from "@/lib/env";

/**
 * Resolves the equivalent document in another locale.
 *
 * Every localisable document carries a `translationOf` reference pointing at a
 * shared `translationGroup`. Two documents in the same group are the same page in
 * different languages, which is what makes a slug-independent switch possible.
 *
 * The query walks: this document -> its group -> the sibling in the target locale.
 */

const TRANSLATED_ROUTE_QUERY = /* groq */ `
*[
  _type in $types
  && locale == $fromLocale
  && slug.current == $slug
][0] {
  "sibling": *[
    _type in $types
    && locale == $toLocale
    && translationGroup._ref == ^.translationGroup._ref
    && defined(slug.current)
  ][0] {
    _type,
    "slug": slug.current,
    section,
    format,
    "parentSlug": parent->slug.current,
    "countrySlug": select(
      destination->kind == "city" => destination->parent->slug.current,
      destination->slug.current
    )
  }
}.sibling
`;

interface TranslatedRoute {
  _type: string
  slug: string
  section?: string | null
  format?: 'individual' | 'group' | null
  parentSlug?: string | null
  countrySlug?: string | null
}

/** Document types that can appear under each section. */
const SECTION_TYPES: Record<SectionKey, string[]> = {
  universities: ["destination", "institution"],
  languageSchools: ["destination", "languageSchool"],
  summerSchools: ["summerProgramme", "page"],
  boardingSchools: ["boardingSchool", "destination"],
  tours: ["tour"],
  services: ["service"],
  guides: ["guide", "page"],
  insights: ["article"],
  about: ["page"],
  contact: ["page"],
  consultation: ["page"],
  search: ["page"],
  legal: ["legalPage"],
};

export async function findTranslatedPath({
  fromLocale,
  toLocale,
  section,
  slugPath,
}: {
  fromLocale: Locale;
  toLocale: Locale;
  section: SectionKey;
  slugPath: string[];
}): Promise<string | null> {
  const leaf = slugPath[slugPath.length - 1];
  if (!leaf) return null;

  if (!isConfigured.sanity()) return null

  const translated = await sanityFetch<TranslatedRoute | null>(
    TRANSLATED_ROUTE_QUERY,
    {
      types: SECTION_TYPES[section],
      fromLocale,
      toLocale,
      slug: leaf,
    },
    { tags: ["translation"], revalidate: 3600 },
    null,
  )

  if (!translated?.slug) return null

  if (translated._type === 'destination') {
    return translated.parentSlug
      ? docPath(toLocale, section, translated.parentSlug, translated.slug)
      : docPath(toLocale, section, translated.slug)
  }

  if (translated._type === 'institution' || translated._type === 'languageSchool') {
    return translated.countrySlug
      ? docPath(toLocale, section, translated.countrySlug, translated.slug)
      : docPath(toLocale, section, translated.slug)
  }

  if (translated._type === 'summerProgramme') {
    const format = translated.format === 'group' ? 'group' : 'individual'
    const formatSlug = format === 'group'
      ? (toLocale === 'tr' ? 'grup' : 'group')
      : (toLocale === 'tr' ? 'bireysel' : 'individual')
    return docPath(toLocale, section, formatSlug, translated.slug)
  }

  return docPath(toLocale, section, translated.slug)
}

/**
 * All locale variants of a document, for emitting `hreflang` alternates.
 * Returns only locales that genuinely have a published translation — advertising
 * an alternate that 404s is worse than omitting it.
 */
export async function findAlternates({
  types,
  translationGroupId,
}: {
  types: string[];
  translationGroupId: string | null;
}): Promise<Array<{ locale: Locale; slug: string }>> {
  if (!translationGroupId) return [];

  return sanityFetch<Array<{ locale: Locale; slug: string }>>(
    /* groq */ `
      *[_type in $types && translationGroup._ref == $groupId && defined(slug.current)] {
        locale,
        "slug": slug.current
      }
    `,
    { types, groupId: translationGroupId },
    { tags: ["translation"], revalidate: 3600 },
    [],
  );
}
