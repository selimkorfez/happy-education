'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { DownloadIcon } from '@sanity/icons/Download'
import { LaunchIcon } from '@sanity/icons/Launch'
import { SearchIcon } from '@sanity/icons/Search'
import { Badge, Box, Button, Card, Flex, Grid, Inline, Spinner, Stack, Text, TextInput } from '@sanity/ui'
import {
  type ImageValue,
  type ObjectInputProps,
  type ObjectSchemaType,
  PatchEvent,
  set,
  setIfMissing,
  unset,
  useClient,
  useFormValue,
} from 'sanity'
import {
  imageSearchSeed,
  isBrandArtworkPath,
  searchWikimedia,
  type LicensedImageSuggestion,
} from '../lib/wikimedia'

const API_VERSION = '2026-09-01'

/**
 * Adds a free, source-aware Wikimedia Commons search beneath every editorial
 * image input. Selecting an item uploads the original to Sanity and records its
 * machine-readable provenance, but never clears the image for publication.
 */
export function LicensedImageInput(props: ObjectInputProps<ImageValue, ObjectSchemaType>) {
  const client = useClient({ apiVersion: API_VERSION })
  const document = useFormValue([]) as Record<string, unknown> | undefined
  const defaultQuery = useMemo(
    () => imageSearchSeed(document, props.path),
    [document, props.path],
  )
  const [query, setQuery] = useState(defaultQuery)
  const [results, setResults] = useState<LicensedImageSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const previousDefault = useRef(defaultQuery)

  useEffect(() => {
    if (!query || query === previousDefault.current) setQuery(defaultQuery)
    previousDefault.current = defaultQuery
  }, [defaultQuery, query])

  useEffect(() => () => abortRef.current?.abort(), [])

  const brandArtwork = isBrandArtworkPath(props.path)

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const requested = query.trim()
    if (requested.length < 3) {
      setError('En az üç karakter girin. / Enter at least three characters.')
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)
    setError(null)
    setMessage(null)

    try {
      const suggestions = await searchWikimedia(requested, controller.signal)
      setResults(suggestions)
      if (suggestions.length === 0) {
        setMessage('Uygun lisanslı sonuç bulunamadı. Aramayı sadeleştirin. / No eligible result found.')
      }
    } catch (searchError) {
      if (searchError instanceof DOMException && searchError.name === 'AbortError') return
      setError('Wikimedia Commons araması şu anda tamamlanamadı. Lütfen tekrar deneyin.')
    } finally {
      if (abortRef.current === controller) setSearching(false)
    }
  }

  async function handleImport(suggestion: LicensedImageSuggestion) {
    setImportingId(suggestion.id)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(suggestion.originalUrl)
      if (!response.ok) throw new Error(`Image download failed (${response.status}).`)
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) throw new Error('The selected file is not an image.')
      if (blob.size > 25 * 1024 * 1024) throw new Error('The selected file is larger than 25 MB.')

      const asset = await client.assets.upload('image', blob, {
        filename: suggestion.filename,
        title: suggestion.title,
        description: suggestion.description,
        creditLine: `${suggestion.creator} - ${suggestion.licence}`,
        source: {
          id: suggestion.id,
          name: 'Wikimedia Commons',
          url: suggestion.sourceUrl,
        },
      })

      props.onChange(PatchEvent.from([
        setIfMissing({ _type: 'image' }),
        set({ _type: 'reference', _ref: asset._id }, ['asset']),
        unset(['crop']),
        unset(['hotspot']),
        set(suggestion.alt, ['alt']),
        set(false, ['decorative']),
        set(`${suggestion.creator} - ${suggestion.licence}`, ['attribution']),
        setIfMissing({}, ['licence']),
        set(suggestion.creator, ['licence', 'holder']),
        set(suggestion.licence, ['licence', 'terms']),
        set(suggestion.sourceUrl, ['licence', 'sourceUrl']),
        ...(suggestion.licenceUrl
          ? [set(suggestion.licenceUrl, ['licence', 'licenceUrl'])]
          : [unset(['licence', 'licenceUrl'])]),
        set(new Date().toISOString(), ['licence', 'reviewedAt']),
        set(false, ['licence', 'cleared']),
      ]))

      setMessage(
        'Görsel ve kaynak bilgileri aktarıldı. Kaynak sayfasını kontrol edin; ardından yalnızca uygunsa “Cleared for publication” kutusunu işaretleyin.',
      )
    } catch {
      setError('Görsel Sanity’ye aktarılamadı. Bağlantıyı kontrol edip tekrar deneyin.')
    } finally {
      setImportingId(null)
    }
  }

  return (
    <Stack gap={3}>
      {props.renderDefault(props)}

      {brandArtwork ? (
        <Card border padding={3} radius={2} tone="caution">
          <Text size={1}>
            Logo ve marka simgeleri için yalnızca Happy Education tarafından sağlanan resmi dosyaları yükleyin.
          </Text>
        </Card>
      ) : (
        <Card border padding={4} radius={3} tone="primary">
          <Stack gap={4}>
            <Stack gap={2}>
              <Flex align="center" gap={2} wrap="wrap">
                <Text size={1} weight="semibold">Lisanslı görsel asistanı</Text>
                <Badge tone="positive">Ücretsiz kaynak</Badge>
                <Badge tone="caution">İnsan onayı gerekir</Badge>
              </Flex>
              <Text muted size={1}>
                Konuya uygun Wikimedia Commons fotoğraflarını bulur. Yalnızca ticari yeniden kullanıma izin veren
                lisanslar gösterilir; sonuç yine de yayın öncesinde kontrol edilmelidir.
              </Text>
            </Stack>

            <form onSubmit={handleSearch}>
              <Flex align="stretch" gap={2}>
                <Box flex={1}>
                  <TextInput
                    aria-label="Lisanslı görsel araması"
                    disabled={props.readOnly || searching}
                    onChange={(event) => setQuery(event.currentTarget.value)}
                    placeholder="Örn. Oxford university campus"
                    value={query}
                  />
                </Box>
                <Button
                  disabled={props.readOnly || searching}
                  icon={searching ? Spinner : SearchIcon}
                  mode="ghost"
                  text={searching ? 'Aranıyor' : 'Ara'}
                  type="submit"
                />
              </Flex>
            </form>

            {error ? (
              <Card padding={3} radius={2} tone="critical">
                <Text size={1}>{error}</Text>
              </Card>
            ) : null}
            {message ? (
              <Card padding={3} radius={2} tone="positive">
                <Text size={1}>{message}</Text>
              </Card>
            ) : null}

            {results.length > 0 ? (
              <Grid gridTemplateColumns={[1, 1, 2]} gap={3}>
                {results.map((suggestion) => (
                  <SuggestionCard
                    disabled={Boolean(props.readOnly || importingId)}
                    importing={importingId === suggestion.id}
                    key={suggestion.id}
                    onImport={() => handleImport(suggestion)}
                    suggestion={suggestion}
                  />
                ))}
              </Grid>
            ) : null}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}

function SuggestionCard({
  suggestion,
  importing,
  disabled,
  onImport,
}: {
  suggestion: LicensedImageSuggestion
  importing: boolean
  disabled: boolean
  onImport: () => void
}) {
  return (
    <Card border radius={2} overflow="hidden">
      {/* Commons thumbnails are previews only. The original is imported after selection. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={suggestion.alt}
        loading="lazy"
        src={suggestion.thumbnailUrl}
        style={{ aspectRatio: '16 / 9', display: 'block', objectFit: 'cover', width: '100%' }}
      />
      <Box padding={3}>
        <Stack gap={3}>
          <Stack gap={2}>
            <Text size={1} weight="semibold">{suggestion.title}</Text>
            <Text muted size={1} textOverflow="ellipsis">
              {suggestion.creator}
            </Text>
            <Inline gap={2}>
              <Badge tone="positive">{suggestion.licence}</Badge>
              <Badge>{suggestion.width} x {suggestion.height}</Badge>
            </Inline>
          </Stack>
          <Flex gap={2} wrap="wrap">
            <Button
              disabled={disabled}
              icon={importing ? Spinner : DownloadIcon}
              onClick={onImport}
              text={importing ? 'Aktarılıyor' : 'Taslağa aktar'}
              tone="primary"
            />
            <Button
              as="a"
              href={suggestion.sourceUrl}
              icon={LaunchIcon}
              mode="bleed"
              target="_blank"
              text="Kaynağı aç"
            />
          </Flex>
        </Stack>
      </Box>
    </Card>
  )
}
