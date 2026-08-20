# Design system

Every token lives in the `@theme` block of [`src/styles/globals.css`](../src/styles/globals.css).
Tailwind v4 is CSS-first, so those tokens are real CSS custom properties: readable at runtime,
inspectable in devtools, with no JavaScript config file that can drift out of sync with them.

Nothing here is decorative preference. Each constraint has a reason, and the accessibility ones are
enforced by a script that exits non-zero.

---

## 1. Palette

### Provenance

The palette is derived from the real brand artwork, not invented. Two independent sources agree,
which is what makes it trustworthy.

**Source A, the official print brochure** (`Happy-Education-Yaz-Okullari-2025-A4-print.pdf`, read
from the decompressed content-stream `scn` operators). These are deliberate, designer-set values:

| Hex | Fill count | Role |
|---|---|---|
| `#F17924` | 217 fills, 22 strokes | Primary brand orange |
| `#113458` | 105 fills | Secondary brand navy |
| `#231F20` | 23 fills | Rich black, text |

**Source B, pixel quantisation of the logo master** (`happyedu.logo_.png`, 1131×1131, 916×384
usable ink, analysed with alpha > 250 and near-white excluded, across 105,252 ink pixels):

- Wordmark charcoal **`#3A3A3C`**, 44.70 percent of all ink and the single most common exact
  colour. The mean of its 55,453 dark pixels is exactly `#3A3A3C`.
- The symbol carries a diagonal gradient, sampled bottom-left to top-right along the book diagonal:
  `#EF5D2A` → `#F26828` → **`#F47426`** → `#F47A24` → `#F68023` → `#F68721` → `#F68E1F`

**Cross-check.** The brochure's `#F17924` sits inside the logo gradient range and within 3/255 of
the logo's mean orange `#F27426`. The brochure accent `#EF582B` is within 5/255 of the gradient's
dark end `#EF5D2A`. The print palette and the artwork agree, so the sampled values are the brand's
actual colours rather than one designer's guess.

**`--color-brand: #F47426` is the midpoint of that sampled gradient**, chosen as the single flat
value that represents the symbol without picking one end of a gradient the design system does not
reproduce (see the anti-pattern list: no gradients).

The `#113458` navy from the brochure is **not** in the token set. The site's dark surface is a
neutral near-black (`#232326`) instead, which sits closer to the charcoal wordmark and avoids
introducing a second hue that competes with the orange. The navy is available if the brand ever
wants it, and it is documented here so the decision is visible rather than accidental.

### Tokens

#### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--color-paper` | `#FAF8F5` | The page ground. Warm off-white, **never `#ffffff`**. |
| `--color-paper-sunk` | `#F2EDE4` | Recessed bands, the footer, table headers, secondary-button hover. |
| `--color-card` | `#FFFFFF` | Raised panels. White is a *lift* here, which only works because the page ground is not white. |
| `--color-ink-surface` | `#232326` | Dark sections, such as the consultation band. |
| `--color-ink-surface-soft` | `#313135` | A step up inside a dark section. |

#### Foregrounds

| Token | Hex | Use |
|---|---|---|
| `--color-fg` | `#1B1B1D` | Body text and headings. |
| `--color-fg-muted` | `#56565C` | Secondary text, metadata, captions. |
| `--color-fg-on-ink` | `#F5F2EC` | Body text on a dark surface. |
| `--color-fg-muted-on-ink` | `#B4B2AE` | Secondary text on a dark surface. |

#### Brand

| Token | Hex | Use |
|---|---|---|
| `--color-brand` | `#F47426` | **Fill only.** Large flat panels, the identity, graphic blocks, `::selection`, quote rules. |
| `--color-brand-strong` | `#B8490A` | Interactive text: links, quiet buttons, eyebrows. Also the primary button fill. |
| `--color-brand-pressed` | `#8A3706` | Primary button hover and active. |
| `--color-brand-on-ink` | `#F79A4A` | Link text on a dark surface. |

#### Status and lines

| Token | Hex | Use |
|---|---|---|
| `--color-success` | `#1F6B45` | |
| `--color-warning` | `#8A5A05` | Also the `important` callout rule. |
| `--color-error` | `#A32319` | Field errors, error summaries. |
| `--color-focus` | `#1F5FBF` | The focus ring, everywhere. Also the `official` callout rule. |
| `--color-border` | `#DED7CB` | **Decorative hairlines only.** Section dividers, table rules. Carries no information, so WCAG 1.4.11 does not apply. |
| `--color-border-input` | `#8C8073` | **Control boundaries.** Bounds something interactive, so it must clear 3:1 and does. |

The split between `border` and `border-input` is the whole point of having two. A decorative rule at
3.6:1 would be visually heavy and unnecessary; a form field boundary below 3:1 is a WCAG failure.
Using one token for both forces a bad compromise in one direction or the other.

---

## 2. The rule about brand orange

> **`--color-brand` (`#F47426`) is a fill. It is never text.**

At 2.69:1 on paper and 2.85:1 on card, it fails normal text (4.5:1), large text (3:1) and
non-text UI contrast (3:1). This is not a near miss that could be argued; the audit measured every
brand orange variant against both white and warm off-white and **every one fails as text on a light
background**:

| Orange | vs `#FFFFFF` | vs `#FAF8F4` | Verdict as text |
|---|---|---|---|
| `#F17924` (brochure primary) | 2.80:1 | 2.64:1 | Fails everything, including 3:1 non-text |
| `#EF5D2A` / `#EF582B` | 3.35 / 3.44:1 | 3.25:1 | Large text only |
| `#F68E1F` | 2.38:1 | 2.25:1 | Fails everything |
| `#EE8C1C` (most-used on the legacy site) | 2.50:1 | | Fails everything |
| `#EA6C03` (Elementor default) | 3.16:1 | 2.98:1 | Misses 3:1 on warm ground by 0.02 |

White text on brand orange is **2.80:1**, which fails even large text. **Orange buttons with white
labels are not accessible at any brand orange value.** That single measurement is why the primary
button is filled with `--color-brand-strong` (`#B8490A`) instead, where a white label reaches
5.26:1.

`--color-brand-strong` is a darkened continuation of the same hue, not a different colour. The
identity still reads as orange; the text is simply legible.

**Where `--color-brand` is legitimately used:** the `MediaFrame` placeholder panel, the blockquote
rule in `.prose-he`, `::selection`, and any large flat panel. When ink text sits on a full-strength
orange panel it reaches 6.04:1, which passes comfortably, so orange-as-ground is fine. Orange-as-
figure on a light ground is not.

---

## 3. Measured contrast

Output of `node scripts/check-contrast.mjs`. Every pairing the system actually uses is listed, with
the WCAG 2.2 threshold that applies (4.5:1 normal text, 3:1 large text and non-text UI).

### Text on light surfaces

| Foreground | Background | Ratio | Min | |
|---|---|---|---|---|
| `fg` `#1B1B1D` | `paper` `#FAF8F5` | **16.22:1** | 4.5 | PASS |
| `fg` `#1B1B1D` | `paper-sunk` `#F2EDE4` | **14.75:1** | 4.5 | PASS |
| `fg` `#1B1B1D` | `card` `#FFFFFF` | **17.20:1** | 4.5 | PASS |
| `fg-muted` `#56565C` | `paper` | **6.88:1** | 4.5 | PASS |
| `fg-muted` `#56565C` | `paper-sunk` | **6.25:1** | 4.5 | PASS |
| `fg-muted` `#56565C` | `card` | **7.29:1** | 4.5 | PASS |

### Text on dark surfaces

| Foreground | Background | Ratio | Min | |
|---|---|---|---|---|
| `fg-on-ink` `#F5F2EC` | `ink-surface` `#232326` | **14.03:1** | 4.5 | PASS |
| `fg-on-ink` `#F5F2EC` | `ink-surface-soft` `#313135` | **11.59:1** | 4.5 | PASS |
| `fg-muted-on-ink` `#B4B2AE` | `ink-surface` | **7.40:1** | 4.5 | PASS |

### Interactive

| Foreground | Background | Ratio | Min | |
|---|---|---|---|---|
| `brand-strong` `#B8490A` | `paper` | **4.96:1** | 4.5 | PASS |
| `brand-strong` `#B8490A` | `paper-sunk` | **4.51:1** | 4.5 | PASS (tight) |
| `brand-strong` `#B8490A` | `card` | **5.26:1** | 4.5 | PASS |
| `card` `#FFFFFF` | `brand-strong` (button label) | **5.26:1** | 4.5 | PASS |
| `card` `#FFFFFF` | `brand-pressed` `#8A3706` | **7.99:1** | 4.5 | PASS |
| `brand-on-ink` `#F79A4A` | `ink-surface` | **7.22:1** | 4.5 | PASS |

`brand-strong` on `paper-sunk` at **4.51:1** is the tightest pairing in the system, 0.01 above the
threshold. Darkening `paper-sunk` or lightening it will break it. Change either token only with the
script in front of you.

### Status

| Foreground | Background | Ratio | Min | |
|---|---|---|---|---|
| `success` `#1F6B45` | `paper` | **6.10:1** | 4.5 | PASS |
| `warning` `#8A5A05` | `paper` | **5.59:1** | 4.5 | PASS |
| `error` `#A32319` | `paper` | **7.05:1** | 4.5 | PASS |
| `error` `#A32319` | `card` | **7.47:1** | 4.5 | PASS |

### Non-text (WCAG 2.2 SC 1.4.11 and 2.4.11)

| Foreground | Background | Ratio | Min | |
|---|---|---|---|---|
| `focus` `#1F5FBF` | `paper` | **5.75:1** | 3.0 | PASS |
| `focus` `#1F5FBF` | `card` | **6.09:1** | 3.0 | PASS |
| `focus` `#1F5FBF` | `paper-sunk` | **5.22:1** | 3.0 | PASS |
| `border-input` `#8C8073` | `paper` | **3.63:1** | 3.0 | PASS |
| `border-input` `#8C8073` | `card` | **3.85:1** | 3.0 | PASS |
| `border-input` `#8C8073` | `paper-sunk` | **3.30:1** | 3.0 | PASS |

### Brand orange as a ground

| Foreground | Background | Ratio | Min | |
|---|---|---|---|---|
| `fg` `#1B1B1D` | `brand` `#F47426` | **6.04:1** | 4.5 | PASS |

### Asserted failures

The script also asserts that two pairings **continue to fail**, so that a well-meaning token change
that made orange "accessible enough to use as text" would be caught:

| Pairing | Ratio | Expected |
|---|---|---|
| `brand` as body text on `paper` | 2.69:1 | Must stay below 4.5 |
| `brand` as body text on `card` | 2.85:1 | Must stay below 4.5 |

**26 of 26 required pairings pass.**

---

## 4. `scripts/check-contrast.mjs`

```bash
node scripts/check-contrast.mjs
```

It holds its own copy of the token table, computes sRGB relative luminance and contrast ratios for
every declared pairing, prints a PASS/FAIL line for each, and **exits non-zero if anything fails**.
That exit code is the point: it is a gate, not a report.

**How to use it.**

- Run it in CI. A colour token change that breaks a pairing must fail the pipeline, not reach
  review as a diff nobody can evaluate by eye.
- **Change a colour there first, then in `globals.css`.** The script is the source of truth for
  intent; `globals.css` is the implementation. Doing it the other way round means shipping the
  change and finding out afterwards.
- If you add a new colour pairing to the design (a new surface, a new status colour, text on a new
  background), **add it to `REQUIRED` in the script**. An untested pairing is an untested pairing
  whether or not it happens to pass.

**The `FORBIDDEN_FOR_TEXT` list** is the unusual part. It asserts that certain pairings *fail*. If
someone lightens the page ground or darkens `--color-brand` enough that raw brand orange starts
passing as text, the script reports `UNEXPECTED` and fails, prompting a review of whether the token
still means what it used to. Silently gaining permission to do something the system forbids is its
own kind of regression.

`--color-border` is deliberately absent from the required list. It is decorative, carries no
information and bounds nothing interactive, so 1.4.11 does not apply to it. `--color-border-input`
is present and must clear 3:1.

---

## 5. Typography

### The pairing

**Display: Fraunces.** **Body: Figtree.** Both self-hosted through `next/font/google`.

The Happy Education mark is a rounded, warm, slightly soft wordmark. A neutral grotesque fights it,
and a high-contrast Didone would read as corporate in a way this business is not. Fraunces is a
soft old-style serif with genuine personality that sits naturally beside the mark; Figtree is a
humanist geometric sans whose round bowls echo the mark without imitating it.

**Explicitly not used anywhere in this project: Inter, Geist, Space Grotesk.**

Worth recording: the brand's actual typeface is **Hurme Geometric Sans 1**, embedded in six weights
in the official 2025 brochure. It is a commercial licence from Hurme Design, its Turkish coverage
is unverified with the foundry, and it is not used anywhere on the live site (which loads
Poppins, Roboto, Archivo and Playfair Display instead, none of which was a deliberate choice: the
Elementor global typography was never configured). Fraunces and Figtree are a deliberate,
licence-clean pairing rather than a continuation of an accident.

### Turkish glyph coverage, with evidence

Turkish needs `ç ö ü ğ ş ı` and `Ç Ö Ü Ğ Ş İ`, which is U+00C7/E7, U+00D6/F6, U+00DC/FC,
U+011E/011F, U+015E/015F, U+0130 and U+0131.

Both families are loaded with `subsets: ['latin', 'latin-ext']`:

- The **`latin`** subset carries U+0131 (`ı`, the dotless i) and the `ç ö ü` range.
- The **`latin-ext`** subset carries U+0100 to U+02BA, which includes `İ Ğ ğ Ş ş`.

Together they cover the full set. **Declaring `latin-ext` explicitly is not optional.** The audit
found that with `latin` alone the browser must fetch a second font file for any string containing
`İ`, `Ğ` or `Ş`, which is close to every Turkish heading on the site, producing a visible flash of
unstyled text exactly where it is most noticeable. Removing `latin-ext` from either family would
reintroduce that.

Both are loaded as variable fonts: `weight` is omitted so the whole 100 to 900 range ships in one
file. Fraunces additionally declares its `SOFT`, `WONK` and `opsz` axes, so headlines can be tuned
in CSS through `font-variation-settings` without loading anything extra. Next.js rejects `axes`
alongside an explicit weight list, which is why the weight list is absent.

`display: 'swap'` and `adjustFontFallback: true` are set on both, with explicit fallback stacks
(`Iowan Old Style, Palatino Linotype, Georgia, serif` for Fraunces; `system-ui, Helvetica Neue,
Arial, sans-serif` for Figtree) so the metric-adjusted fallback shifts as little as possible.

Self-hosting through `next/font` also means **no request ever goes to `fonts.googleapis.com`**,
which keeps `font-src` in the Content-Security-Policy limited to `'self'` and `data:`.

### The scale

A 1.200 minor third at body sizes, opening up at display sizes. Everything from `2xl` upward is
clamped so a 320px phone and a 1440px display both read well without a media query per heading.

| Token | Value | Use |
|---|---|---|
| `--text-xs` | `0.8125rem` (13px) | Metadata, captions, eyebrows |
| `--text-sm` | `0.9063rem` (14.5px) | Labels, secondary text |
| `--text-base` | `1.0313rem` (16.5px) | Body. Slightly over 16px on purpose, for comfortable long-form reading |
| `--text-lg` | `1.1875rem` (19px) | Lead paragraphs, pull quotes |
| `--text-xl` | `1.375rem` (22px) | H3 in prose |
| `--text-2xl` | `clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)` | H2 in prose |
| `--text-3xl` | `clamp(1.75rem, 1.5rem + 1.25vw, 2.375rem)` | Section headings |
| `--text-4xl` | `clamp(2.125rem, 1.7rem + 2.1vw, 3.125rem)` | Page headings |
| `--text-5xl` | `clamp(2.5rem, 1.85rem + 3.25vw, 4rem)` | Homepage hero |

Line heights: `--leading-tight` 1.12 (display headings), `--leading-snug` 1.28 (H5/H6, compact UI),
`--leading-normal` 1.6 (body), `--leading-relaxed` 1.72 (long-form prose).

### Base rules

- `h1` to `h4` use Fraunces at weight 600, `--leading-tight`, `letter-spacing: -0.012em`, and
  `text-wrap: balance` so headings do not leave a single orphaned word.
- `h5` and `h6` use Figtree at weight 650. They function as UI labels rather than editorial
  headings, and setting them in the serif would misrepresent the hierarchy.
- Paragraphs use `text-wrap: pretty`.
- `font-synthesis-weight: none`, so a missing weight is never faked into a smeared bold.
- `[lang='tr']` sets `font-variant-ligatures: common-ligatures`, and the `<html lang>` attribute is
  set from `HREFLANG` per locale so the browser applies the right language rules rather than
  English casing conventions.

### Measure

`--container-prose: 68ch`. `.prose-he` is capped at it, which keeps lines in the 55 to 75 character
band. This is the single most effective typographic decision on a content site and the easiest one
to lose to a full-width layout.

---

## 6. Spacing, layout and radii

### Spacing

Tailwind's default 0.25rem scale, unmodified. There was no reason to invent a bespoke scale when
the default is already a consistent 4px rhythm.

Consistent patterns in use: section padding `py-14` for standard bands, `py-16 sm:py-20` for
emphasis bands, `mt-24` above the footer, `1.15em` between prose blocks (an em, so it tracks the
type size).

### Container widths

| Token | Value | Use |
|---|---|---|
| `--container-prose` | `68ch` | Editorial body text |
| `--container-page` | `78rem` | The default page container |
| `--container-wide` | `90rem` | Full-bleed rails and wide grids |

The `Container` component takes `width="prose" | "page" | "wide" | "full"` and applies the gutters:
`px-5` (20px), `sm:px-7` (28px), `lg:px-10` (40px). Gutters step up with the viewport rather than
staying fixed, so 320px phones keep usable edge spacing and wide displays do not run text to the
bezel.

### Radii

| Token | Value | Use |
|---|---|---|
| `--radius-none` | `0` | The default for most surfaces |
| `--radius-xs` | `2px` | The focus ring |
| `--radius-sm` | `3px` | **Buttons and interactive controls** |
| `--radius-md` | `4px` | The largest radius used on a surface |
| `--radius-full` | `9999px` | **Genuine circles only** (avatars). Never buttons. |

**3px, and no more.** This is an editorial layout, not a card deck. Large radii and pill buttons are
the visual signature of a template, and they flatten the difference between a consultancy publishing
considered guidance and a SaaS landing page. Nothing on this site is a pill.

---

## 7. Component inventory

### `ui/`

| Component | Notes |
|---|---|
| `Button` | Genuine actions only: submit, toggle, open. Never navigation. |
| `ButtonLink` | Anything that changes the URL. |
| `ExternalLink` | Opens in a new tab with `rel="noopener noreferrer"` and an `sr-only` suffix announcing it. |
| `Container` | The page gutter. `width`: prose / page / wide / full. |
| `MediaFrame` | Every photograph goes through here. Enforces the licence gate and required alt text. Renders a composed brand panel when there is no cleared image. |
| `Logo` | The lockup and the symbol-only mark, used unmodified. |

Button variants: `primary` (fill `brand-strong`, white label, hover `brand-pressed`), `secondary`
(`border-input` outline, transparent, hover `paper-sunk`), `quiet` (text action in `brand-strong`,
**always underlined**, so the affordance is never colour alone). Sizes `md` and `lg`. Every variant
except `quiet` carries `min-h-11` (44px).

`Logo` note: the only artwork available is raster. The largest usable source is 916×384 after
trimming, and no vector exists anywhere in the 964-item legacy media library (direct probes for
`logo.svg`, `happylogo.svg` and similar all returned 404). At the sizes used here the raster still
renders at 3 to 5 times density, which is acceptable for launch but not ideal. A true SVG should be
requested from whoever designed the 2025 brochure. The wordmark is charcoal and there is no reversed
variant, so the lockup only ever sits on light surfaces and is never recoloured to fake one. That
constraint is why the footer is warm light rather than a dark slab: the surface adapts to the logo
rather than the logo being altered without permission.

### `chrome/`

`SiteHeader` (two rows on desktop, sticky, Server Component), `PrimaryNav` (desktop disclosure
panels, client), `MobileNav` (full-height panel with focus trap, client), `LanguageSwitcher`
(client), `SiteFooter` (Server Component), `SkipLink` (first focusable element on every page,
WCAG 2.4.1).

### `shared/`

`PageHero`, `Breadcrumbs` (plus `BreadcrumbList` JSON-LD; the trail scrolls horizontally on narrow
screens rather than wrapping, because Turkish institution names are long), `FaqSection` (native
`<details>`, plus `FAQPage` JSON-LD only when real questions exist), `ReviewMeta` (publication and
review provenance), `ConsultationBand` (the closing call to action, on `ink-surface`).

### `content/`

`PortableText` renders CMS rich text, with block types for images, tables and callouts. There is no
`dangerouslySetInnerHTML` in it, and the schema has no HTML or embed block, so no editor-supplied
string is ever parsed as markup. Headings render as h2/h3/h4 only; the page template owns the single
h1.

### `consent/`

`ConsentProvider`, `CookieBanner`, `CookiePreferencesButton`, `Analytics`. The banner is
deliberately not a dark pattern: Accept and Reject are the same size, the same weight, and sit next
to each other. Rejecting is one click from the first layer, not buried behind a preferences screen.

### CSS component classes

`.prose-he` is the editorial prose context: capped at `--container-prose`, `--leading-relaxed`,
`1.15em` between blocks, links in `brand-strong` with `text-underline-offset: 0.18em` and
`text-decoration-thickness: from-font` (thickening to 2px on hover), blockquotes with a 2px
`--color-brand` rule and set in the display serif, and tables at `--text-sm` with `paper-sunk`
header cells.

Utilities: `.scroll-x` (a horizontal-scroll container that is focusable so keyboard users can scroll
it, per WCAG 2.1.1) and `.sr-only-focusable` (visually hidden until focused, for the skip link).

---

## 8. Motion policy

**There is essentially no motion.**

What is permitted:

- `transition-colors duration-150` on interactive elements. Colour only.
- A disclosure panel appearing or disappearing. No slide, no fade, no stagger.
- `scroll-behavior: smooth` on `html`.

What is not permitted anywhere:

- Hover transforms. Nothing lifts, scales, tilts or slides on hover.
- Scroll-triggered animation. Nothing fades or rises into view.
- Counters that count up. (Also: the numbers they would count to are all on the blocked-claims list.)
- Parallax, marquees, auto-advancing carousels.
- Skeleton loaders for static content. It is a static page; render it.

The reasoning is partly aesthetic and partly ethical. This is a business asking families to make a
decision worth tens of thousands of pounds. Interface theatre reads as sales pressure, and pressure
is the last thing that should be applied to that decision. Calm, fast and legible is the correct
register.

`prefers-reduced-motion: reduce` is honoured globally: animations and transitions collapse to
0.01ms and smooth scrolling becomes instant. Because the motion budget is near zero, an assistive
setting and the default experience are nearly identical, which is the right outcome.

---

## 9. Responsive behaviour

Tailwind v4 defaults, unmodified: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

Where they are used:

- **640px (`sm`)** gutters step from 20px to 28px; the consultation button appears in the header;
  the footer moves to two columns; section padding opens up.
- **1024px (`lg`)** gutters step to 40px; the desktop utility row and `PrimaryNav` appear and
  `MobileNav` disappears; the footer moves to its 12-column grid; heroes split into asymmetric
  columns.

`next.config.ts` declares image `deviceSizes` of `[320, 375, 390, 640, 768, 1024, 1280, 1440, 1920]`,
which matches these layout breakpoints plus the common phone widths, so the browser is not choosing
between a 640px and a 1080px source for a 390px screen.

Non-negotiables at every width:

- **320px is a supported width.** Layouts must not break at it, and the type scale clamps are
  authored with it as the lower bound.
- **The page body never scrolls horizontally.** Wide content (tables, rails, breadcrumb trails)
  scrolls inside its own `.scroll-x` container, which is focusable so it can be scrolled from the
  keyboard.
- **Touch targets are `min-h-11` (44px).** WCAG 2.2 SC 2.5.8 requires 24px; 44px is the comfortable
  target and is what the system uses.
- **Zoom to 200 percent must work.** `viewport.maximumScale` is 5 and user scaling is never
  disabled, per WCAG 1.4.4.

---

## 10. Focus and accessibility baseline

```css
:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}
.on-ink :focus-visible { outline-color: #9dc0ff; }
```

One ring, used everywhere, **never removed**. `:focus-visible` rather than `:focus`, so mouse users
do not see rings on click while keyboard users always do. Dark sections get a lighter ring that
survives the dark ground.

The rest of the baseline:

- `SkipLink` is the first focusable element on every page.
- `<main id="main-content" tabIndex={-1}>` so the skip link lands somewhere focusable.
- Alt text is required at the schema level, not left to the template.
- Colour is never the sole carrier of meaning. The `quiet` button variant is always underlined;
  prose links are always underlined.
- Semantic HTML first: native `<details>` for disclosures, real `<table>` with `<th scope>` for
  tables, `<time>` for dates.
- Target: **WCAG 2.2 AA**. `@axe-core/playwright` runs in the e2e suite, but automated checks catch
  roughly a third of real issues, so keyboard and screen-reader testing are not optional.

---

## 11. Anti-pattern blacklist

Things this project does not do. This list is enforced in review.

**Surface and depth**

- No gradients. Anywhere. Not in buttons, headers, overlays or "subtle" background washes.
- No glows, no neon, no coloured drop shadows.
- No glassmorphism, no `backdrop-filter` blur surfaces.
- No shadow-based hierarchy. Depth comes from surface colour (`paper` / `paper-sunk` / `card` /
  `ink-surface`) and hairline borders, not from stacked box shadows.

**Shape**

- No pill buttons. No large radii. 3px is the maximum on a control, 4px on a surface.
- `--radius-full` is for genuine circles only.

**Motion**

- No hover transforms or lift effects.
- No scroll-triggered animation, no parallax, no marquees, no auto-advancing carousels.
- No animated counters.
- No skeleton loaders for static content.

**Layout**

- **No three-equal-feature-card rows.** This is the single most template-coded pattern on the web.
  The homepage uses an indexed editorial list, an asymmetric hero and a horizontal rail instead,
  and the blog section gives the lead article a wide panel rather than making it one of three
  identical tiles.
- No pure `#ffffff` page ground. The paper is warm.
- No full-width body text. Prose is capped at 68ch.

**Type**

- Not Inter. Not Geist. Not Space Grotesk.
- No fake bold: `font-synthesis-weight: none`.
- No H1 available from the CMS.

**Ornament**

- No emoji as icons. No sparkles. Icons are inline SVG and there are very few of them.
- No stock-photo hero with text laid over it and a scrim to rescue the contrast. In `PageHero` and
  `HomeHero` the heading sits on the page ground and the image is a companion panel, so legibility
  never depends on what happens to be in the photograph.

**Claims and dark patterns**

- No unverified numbers, counters, badges or logo walls. See `BLOCKED_CLAIMS`.
- No fake scarcity. A places-remaining count must come from real availability or not exist.
- No cookie banner where Reject is harder than Accept.

---

## 12. Changing a token

1. Open `scripts/check-contrast.mjs` and change the value in `TOKENS`.
2. Run `node scripts/check-contrast.mjs`. If anything fails, the change is not viable as it stands.
3. If you introduced a new pairing, add it to `REQUIRED` and run again.
4. Only then mirror the value into the `@theme` block in `src/styles/globals.css`.
5. Update the palette table and the measured-contrast tables in this document.

Two pairings are tight enough to break first, so check them specifically: `brand-strong` on
`paper-sunk` (4.51:1, threshold 4.5) and `border-input` on `paper-sunk` (3.30:1, threshold 3.0).

Prefer not to change tokens at all. They are derived from measured artwork and verified against a
standard; a change needs a reason better than a preference.
