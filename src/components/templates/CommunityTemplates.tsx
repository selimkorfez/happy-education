import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { ExternalLink } from '@/components/ui/Button'
import { safeExternalHref } from '@/lib/links'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import type { SocialPostCard, TestimonialCard } from '@/lib/sanity/queries/community'

export function SocialContentTemplate({
  locale,
  posts,
}: {
  locale: Locale
  posts: SocialPostCard[]
}) {
  const copy = SOCIAL_COPY[locale]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.insights'), href: sectionPath(locale, 'insights') },
    { label: copy.title },
  ]

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        visualVariant="insights"
      />

      <section className="bg-paper py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {copy.themes.map((theme, index) => (
              <article key={theme.title} className="rounded-[1.4rem] border border-border/70 bg-white p-5 shadow-[0_10px_30px_rgba(35,35,38,0.05)] sm:p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-xs font-black text-brand-strong">0{index + 1}</span>
                <h2 className="mt-5 text-lg font-bold text-fg">{theme.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{theme.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border/70 bg-white py-14 sm:py-18 lg:py-20">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{copy.feedEyebrow}</p>
              <h2 className="mt-2 max-w-[15ch] text-[length:var(--text-3xl)] font-bold text-fg">{copy.feedTitle}</h2>
            </div>
            <p className="max-w-[60ch] text-base leading-relaxed text-fg-muted lg:justify-self-end">{copy.feedIntro}</p>
          </div>

          {posts.length > 0 ? (
            <ul className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => {
                const href = safeExternalHref(post.externalUrl)
                if (!href) return null
                return (
                  <li key={post._id}>
                    <article className="flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-border/70 bg-paper shadow-[0_12px_34px_rgba(35,35,38,0.055)]">
                      {post.thumbnail ? (
                        <MediaFrame
                          image={post.thumbnail}
                          alt={post.thumbnail.alt ?? post.title}
                          width={900}
                          height={600}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="aspect-[3/2] w-full"
                          placeholderLabel={post.title}
                        />
                      ) : (
                        <div className="relative aspect-[3/2] overflow-hidden bg-ink-surface p-6 text-fg-on-ink">
                          <div aria-hidden="true" className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand/35 blur-2xl" />
                          <div className="relative flex h-full flex-col justify-between">
                            <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-on-ink">{post.platform}</span>
                            <p className="max-w-[16ch] text-2xl font-bold leading-tight">{post.title}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand-strong">{post.platform}</span>
                          {post.topic ? <span className="rounded-full bg-sky-soft px-3 py-1 text-xs font-bold text-fg-muted">{post.topic}</span> : null}
                        </div>
                        <h3 className="mt-4 text-xl font-bold text-fg">{post.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-fg-muted">{post.summary}</p>
                        <div className="mt-5 rounded-[1rem] bg-white p-4">
                          <p className="text-[0.68rem] font-black uppercase tracking-[0.09em] text-brand-strong">{copy.whyLabel}</p>
                          <p className="mt-1.5 text-sm leading-relaxed text-fg">{post.whyItMatters}</p>
                        </div>
                        <ExternalLink href={href} srSuffix={copy.opensNewTab} className="mt-5 inline-flex font-bold">
                          {copy.openPost} →
                        </ExternalLink>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="mt-9 rounded-[1.5rem] border border-dashed border-brand/35 bg-brand-soft/35 p-7 sm:p-9">
              <p className="max-w-[60ch] text-base font-semibold leading-relaxed text-fg">{copy.empty}</p>
            </div>
          )}
        </Container>
      </section>

      <ConsultationBand locale={locale} />
    </>
  )
}

export function StudentStoriesTemplate({
  locale,
  testimonials,
}: {
  locale: Locale
  testimonials: TestimonialCard[]
}) {
  const copy = STORIES_COPY[locale]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.insights'), href: sectionPath(locale, 'insights') },
    { label: copy.title },
  ]

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        visualVariant="about"
      />

      <section className="bg-paper py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="rounded-[1.4rem] border border-border/70 bg-white p-5 shadow-[0_10px_30px_rgba(35,35,38,0.04)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.1em] text-brand-strong">{copy.trustLabel}</p>
            <p className="mt-3 max-w-[72ch] text-base leading-relaxed text-fg-muted">{copy.trustBody}</p>
          </div>

          {testimonials.length > 0 ? (
            <ul className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((story) => (
                <li key={story._id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-border/70 bg-white shadow-[0_12px_34px_rgba(35,35,38,0.055)]">
                    {story.photo ? (
                      <MediaFrame
                        image={story.photo}
                        alt={story.photo.alt ?? story.studentName}
                        width={700}
                        height={520}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="aspect-[4/3] w-full"
                        placeholderLabel={story.studentName}
                      />
                    ) : null}
                    <div className="flex flex-1 flex-col p-6">
                      <span aria-hidden="true" className="text-4xl font-black leading-none text-brand/35">“</span>
                      <blockquote className="mt-2 text-base font-semibold leading-relaxed text-fg">{story.quote}</blockquote>
                      <div className="mt-auto pt-6">
                        <p className="font-bold text-fg">{story.studentName}</p>
                        {story.programme ? <p className="mt-1 text-sm text-fg-muted">{story.programme}</p> : null}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-9 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-dashed border-brand/35 bg-brand-soft/35 p-7 sm:p-9">
                <h2 className="text-2xl font-bold text-fg">{copy.emptyTitle}</h2>
                <p className="mt-3 max-w-[58ch] text-base leading-relaxed text-fg-muted">{copy.emptyBody}</p>
              </div>
              <div className="rounded-[1.5rem] bg-ink-surface p-7 text-fg-on-ink sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-brand-on-ink">{copy.shareLabel}</p>
                <h2 className="mt-3 text-2xl font-bold">{copy.shareTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-fg-muted-on-ink">{copy.shareBody}</p>
                <a href={sectionPath(locale, 'contact')} className="mt-5 inline-flex min-h-11 items-center font-bold text-brand-on-ink underline underline-offset-4">{copy.contact} →</a>
              </div>
            </div>
          )}
        </Container>
      </section>

      <ConsultationBand locale={locale} />
    </>
  )
}

export function socialPagePath(locale: Locale) {
  return docPath(locale, 'insights', locale === 'tr' ? 'sosyal-medyadan' : 'from-our-socials')
}

export function studentStoriesPath(locale: Locale) {
  return docPath(locale, 'insights', locale === 'tr' ? 'ogrenci-hikayeleri' : 'student-stories')
}

const SOCIAL_COPY = {
  en: {
    eyebrow: 'From our channels',
    title: 'Social content, with the context behind it.',
    intro: 'Short-form content is useful when it answers a real question. Here we explain what each selected Happy Education post is about, why we made it and where it fits into the wider study-abroad journey.',
    feedEyebrow: 'Selected posts',
    feedTitle: 'Watch the post. Understand the point.',
    feedIntro: 'We link to the original Happy Education post rather than loading tracker-heavy social embeds. The website adds the context that a caption or 30-second video cannot always fit.',
    whyLabel: 'Why this matters',
    openPost: 'View the original post',
    opensNewTab: 'opens the social platform in a new tab',
    empty: 'The page structure is ready for the team’s social library. Posts only appear here after the original Happy Education URL and the accompanying explanation have been reviewed, so we do not fill this space with invented examples.',
    themes: [
      { title: 'Applications, explained', body: 'Turn common application questions into short, useful explainers and point visitors to deeper website guidance.' },
      { title: 'Destinations in context', body: 'Show the city or study experience, then explain what a student should actually consider before choosing it.' },
      { title: 'Student-life questions', body: 'Use the questions students really ask about courses, accommodation and settling in as the starting point.' },
      { title: 'Behind the process', body: 'Give a clearer view of what the advisers are doing, what a document means and what happens next.' },
    ],
  },
  tr: {
    eyebrow: 'Sosyal medyadan',
    title: 'Sosyal medya içerikleri, arkasındaki fikirle birlikte.',
    intro: 'Kısa içerik gerçek bir soruyu yanıtladığında değerlidir. Burada seçtiğimiz Happy Education paylaşımlarının ne anlattığını, neden hazırlandığını ve yurt dışı eğitim sürecinin neresine oturduğunu açıklıyoruz.',
    feedEyebrow: 'Seçili paylaşımlar',
    feedTitle: 'Paylaşımı izleyin. Neden önemli olduğunu anlayın.',
    feedIntro: 'Yoğun takip teknolojileri kullanan sosyal medya gömmeleri yerine orijinal Happy Education paylaşımına bağlantı veriyoruz. Web sitesi, kısa bir video ya da açıklamaya sığmayan bağlamı ekliyor.',
    whyLabel: 'Neden önemli?',
    openPost: 'Orijinal paylaşımı aç',
    opensNewTab: 'sosyal medya platformunu yeni sekmede açar',
    empty: 'Sayfa, ekibin sosyal medya arşivi için hazır. Yalnızca orijinal Happy Education bağlantısı ve açıklaması kontrol edilmiş paylaşımlar burada görünür; alanı uydurma örneklerle doldurmuyoruz.',
    themes: [
      { title: 'Başvuruları açıklayın', body: 'Sık sorulan başvuru sorularını kısa açıklamalara dönüştürün ve ziyaretçiyi ayrıntılı web rehberlerine yönlendirin.' },
      { title: 'Destinasyonlara bağlam katın', body: 'Şehri veya eğitim deneyimini gösterin; ardından öğrencinin seçim yapmadan önce gerçekten nelere bakması gerektiğini anlatın.' },
      { title: 'Öğrenci hayatı soruları', body: 'Kurs, konaklama ve yeni bir yere alışma hakkında öğrencilerin gerçekten sorduğu sorulardan başlayın.' },
      { title: 'Sürecin arka planı', body: 'Danışmanların ne yaptığını, bir belgenin ne anlama geldiğini ve sonraki adımın ne olduğunu daha görünür hâle getirin.' },
    ],
  },
} as const

const STORIES_COPY = {
  en: {
    eyebrow: 'Student experiences',
    title: 'Real stories, published with permission.',
    intro: 'Student experiences can be more useful than marketing copy, but only when the quote is genuine and the student has agreed to its publication.',
    trustLabel: 'How reviews are handled',
    trustBody: 'The new site does not automatically copy old testimonials into a new system. A story only appears when Happy Education has verified the student and recorded publication permission. Any photograph must also pass the site’s separate image-rights check.',
    emptyTitle: 'Verified stories are being prepared.',
    emptyBody: 'The review system is live, but no legacy quote is treated as approved by default. Once permission is recorded in the publishing system, approved student experiences will appear here automatically.',
    shareLabel: 'Have a story to share?',
    shareTitle: 'Tell us about your experience.',
    shareBody: 'Past students can contact Happy Education if they would like to share an experience for possible publication. Nothing is published without review and permission.',
    contact: 'Contact Happy Education',
  },
  tr: {
    eyebrow: 'Öğrenci deneyimleri',
    title: 'Gerçek hikâyeler, izin alınarak yayımlanır.',
    intro: 'Öğrenci deneyimleri reklam metinlerinden daha faydalı olabilir; ancak yalnızca yorum gerçekse ve öğrenci yayımlanmasına izin verdiyse.',
    trustLabel: 'Yorumları nasıl yayımlıyoruz?',
    trustBody: 'Yeni site eski yorumları otomatik olarak yeni sisteme kopyalamaz. Bir deneyim ancak Happy Education öğrenciyi doğruladığında ve yayın iznini kaydettiğinde görünür. Fotoğraflar ayrıca görsel kullanım hakkı kontrolünden geçer.',
    emptyTitle: 'Doğrulanmış öğrenci hikâyeleri hazırlanıyor.',
    emptyBody: 'Yorum sistemi hazır; ancak eski sitedeki hiçbir yorum otomatik olarak onaylanmış kabul edilmiyor. Yayın izni sisteme kaydedildiğinde onaylı öğrenci deneyimleri burada otomatik olarak görünecek.',
    shareLabel: 'Hikâyenizi paylaşmak ister misiniz?',
    shareTitle: 'Deneyiminizi bize anlatın.',
    shareBody: 'Geçmiş öğrenciler, yayımlanmak üzere deneyimlerini paylaşmak isterlerse Happy Education ile iletişime geçebilir. İnceleme ve izin olmadan hiçbir içerik yayımlanmaz.',
    contact: 'Happy Education ile iletişime geçin',
  },
} as const
