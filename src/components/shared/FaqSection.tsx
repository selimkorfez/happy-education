import { PortableText } from '@/components/content/PortableText'
import { Container } from '@/components/ui/Container'
import type { Locale } from '@/lib/i18n/config'

export interface Faq {
  question: string
  answer: unknown
}

/**
 * FAQs, rendered as native <details> elements.
 *
 * No JavaScript, correct keyboard behaviour and correct screen-reader semantics
 * come free. FAQPage structured data is emitted only when there are real questions,
 * because marking up an empty or decorative FAQ is a guidelines violation.
 */
export function FaqSection({
  locale,
  faqs,
  heading,
  emitSchema = true,
}: {
  locale: Locale
  faqs: Faq[]
  heading?: string
  emitSchema?: boolean
}) {
  const valid = faqs.filter((f) => f.question && f.answer)
  if (valid.length === 0) return null

  const title = heading ?? (locale === 'tr' ? 'Sık sorulan sorular' : 'Frequently asked questions')

  return (
    <section className="border-t border-border py-14">
      <Container>
        <h2 className="font-display text-[length:var(--text-3xl)] font-semibold text-fg">{title}</h2>
        <div className="mt-8 max-w-[72ch] border-t border-border">
          {valid.map((faq, index) => (
            <details key={index} className="group border-b border-border">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-fg [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span aria-hidden="true" className="shrink-0 text-fg-muted group-open:rotate-180">
                  <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                    <path d="M1 3.5 5 7l4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                </span>
              </summary>
              <div className="pb-5">
                <PortableText value={faq.answer} locale={locale} />
              </div>
            </details>
          ))}
        </div>
      </Container>

      {emitSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: valid.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: portableTextToPlain(faq.answer) },
              })),
            }).replace(/</g, '\\u003c'),
          }}
        />
      ) : null}
    </section>
  )
}

/** Flattens Portable Text to plain text for structured data. */
export function portableTextToPlain(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block: unknown) => {
      const b = block as { _type?: string; children?: Array<{ text?: string }> }
      if (b?._type !== 'block') return ''
      return (b.children ?? []).map((c) => c.text ?? '').join('')
    })
    .filter(Boolean)
    .join(' ')
    .trim()
}
