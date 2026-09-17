import type { LandingContent } from '@/lib/content/section-landing'

export function SectionLandingContent({ content }: { content: LandingContent }) {
  return (
    <section className="rounded-[1.7rem] border border-border/70 bg-card p-6 shadow-[0_16px_45px_rgba(35,35,38,0.055)] sm:p-8 lg:p-10">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-strong">{content.eyebrow}</p>
      <h2 className="mt-3 max-w-[20ch] text-[length:var(--text-3xl)] font-bold text-fg">{content.title}</h2>
      <div className="mt-5 grid gap-3 text-base leading-relaxed text-fg-muted lg:max-w-[72rem] lg:grid-cols-2">
        {content.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {content.sections.map((section) => (
          <article key={section.title} className="rounded-[1.3rem] border border-border/70 bg-paper-sunk p-5 sm:p-6">
            <h3 className="text-xl font-bold text-fg">{section.title}</h3>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-relaxed text-fg-muted">{paragraph}</p>
            ))}
            {section.items?.length ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-fg-muted">
                    <span aria-hidden="true" className="mt-[0.45rem] h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
