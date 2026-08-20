import "server-only";
import { sanityFetch } from "@/lib/sanity/client";
import {
  sectionSegment,
  type Locale,
  type SectionKey,
} from "@/lib/i18n/config";
import { isConfigured } from "@/lib/env";
import { hasLocalContent } from "@/lib/content/local-source";
import { localFindTranslatedSlug } from "@/lib/content/local-queries";

/**
 * Resolves the equivalent document in another locale.
 *
 * Every localisable document carries a `translationOf` reference pointing at a
 * shared `translationGroup`. Two documents in the same group are the same page in
 * different languages, which is what makes a slug-independent switch possible.
 *
 * The query walks: this document -> its group -> the sibling in the target locale.
 */

const TRANSLATED_SLUG_QUERY = /* groq */ `
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
  ][0].slug.current
}.sibling
`;

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

  const readLocalBundle = !isConfigured.sanity() && hasLocalContent();
  const translatedSlug = readLocalBundle
    ? localFindTranslatedSlug(
        fromLocale,
        toLocale,
        SECTION_TYPES[section],
        leaf,
      )
    : await sanityFetch<string | null>(
        TRANSLATED_SLUG_QUERY,
        {
          types: SECTION_TYPES[section],
          fromLocale,
          toLocale,
          slug: leaf,
        },
        { tags: ["translation"], revalidate: 3600 },
        null,
      );

  if (!translatedSlug) return null;

  // Preserve any intermediate segments (e.g. a country under a section) by
  // translating only the leaf; deeper structures resolve their own parents when
  // the page renders.
  const parents = slugPath.slice(0, -1);
  return `/${toLocale}/${[sectionSegment(toLocale, section), ...parents, translatedSlug].join("/")}`;
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
