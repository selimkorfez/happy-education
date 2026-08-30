# Happy Education — Master UI/UX Design System

> Source of truth for public-site visual design. Read this file before changing any customer-facing UI.
>
> Direction: **Blue / White / Black — modern, premium, international, trustworthy.**

## 1. Product and experience

Happy Education is an international education consultancy. The interface must feel trustworthy enough for parents making a high-consideration decision, current enough for students, and structured enough to support a large catalogue of destinations, universities, language schools, summer programmes, guides and editorial content.

The site should feel like a modern international education platform rather than a WordPress brochure.

### Experience priorities

1. Clarity before decoration.
2. Real, licensed destination/campus photography before generic imagery.
3. Strong navigation and search for a deep multi-page catalogue.
4. Obvious next actions without aggressive sales pressure.
5. Fast, accessible and responsive at every breakpoint.
6. English and Turkish layouts must both survive natural text wrapping.

## 2. Visual direction

### Style

**Modern Editorial Minimal + Image-led International**

Use:
- crisp white surfaces;
- near-black/navy foundations;
- confident royal/electric blue accents;
- large editorial photography;
- generous negative space;
- clear section hierarchy;
- restrained depth and borders;
- simple geometric cards;
- subtle motion with meaningful hover/focus feedback.

Avoid:
- orange as a primary interface colour;
- rainbow/pastel section colouring;
- purple/pink AI-style gradients;
- excessive glassmorphism;
- decorative blobs on every section;
- oversized pill controls everywhere;
- hover-only information;
- tiny grey text;
- fake ratings, fake testimonials, fake popularity metrics;
- imagery without a clear reuse right.

## 3. Colour system

All UI should reference semantic tokens rather than introducing raw hex values in components.

| Role | Value | Usage |
|---|---|---|
| Ink / Black | `#060B16` | Footer, dark panels, strong contrast areas |
| Ink Soft | `#101827` | Secondary dark surfaces |
| Primary Blue | `#1267F5` | Main CTA, active state, key highlights |
| Blue Strong | `#0B4DB8` | Links/text on light backgrounds |
| Blue Pressed | `#073A8A` | Pressed/active CTA states |
| Blue on Dark | `#75A9FF` | Links and accents on black/navy |
| White | `#FFFFFF` | Cards and primary surfaces |
| Canvas | `#F7F9FC` | Main page background |
| Canvas Sunk | `#EEF3F8` | Filters, inset surfaces, alternate blocks |
| Blue Soft | `#EAF2FF` | Selected/secondary accent backgrounds |
| Text | `#081120` | Primary copy |
| Muted Text | `#526174` | Secondary copy |
| Border | `#D8E1EC` | Cards and dividers |
| Input Border | `#8190A5` | Form controls |
| Focus | `#1267F5` | Keyboard focus ring |

### Contrast

- Normal body text: minimum 4.5:1.
- Large text/UI graphics: minimum 3:1.
- Primary blue buttons use white text.
- Blue text on white uses Blue Strong, not the brighter CTA blue when contrast would be marginal.
- Never communicate state by colour alone.

## 4. Typography

Primary family: **Figtree**.

Use a sans-led system for a contemporary international feel. Fraunces may be used sparingly for long-form editorial quotations only; it is not the main heading style.

- H1: bold, tight tracking, approximately 44–76px fluid.
- H2: bold, approximately 32–44px fluid.
- H3: bold, approximately 22–30px.
- Body: 16–18px with at least 1.55 line height.
- Eyebrows: 12–14px, bold, uppercase only where it improves scanning.
- Long Turkish strings must be allowed to wrap naturally.

Do not use body text smaller than 12px. Keep critical supporting copy at 14px+ where practical.

## 5. Layout and spacing

- Page max-width: approximately 1440px for visual sections; content columns narrower.
- Marketing sections: 64–112px vertical rhythm on desktop, 40–72px mobile.
- Card gaps: 16–28px depending on density.
- Minimum interactive target: 44×44px.
- Mobile-first; verify at 375, 768, 1024 and 1440 widths.
- No essential content may require horizontal scrolling.

## 6. Geometry and depth

- Primary card radius: 20–28px.
- Smaller controls: 10–16px.
- Use full pills primarily for CTA buttons, filters and compact status controls — not every visual element.
- Prefer borders + restrained shadows over floating glass panels.
- Dark sections can use thin white/blue borders for structure.

## 7. Navigation

Desktop header:
- slim black utility bar;
- white main navigation surface;
- clear black typography;
- blue primary consultation CTA;
- mega/disclosure menus remain predictable and keyboard accessible.

Mobile:
- menu target at least 44×44px;
- visible close control;
- nested navigation must not depend on hover;
- consultation CTA remains easy to reach.

## 8. Hero pattern

Homepage hero should communicate three things within the first viewport:

1. Happy Education helps organise study-abroad decisions.
2. The visitor can explore real destinations/institutions.
3. There is a clear consultation path.

Design:
- strong black/navy + white/blue contrast;
- one dominant documentary/brand image, not a collage of stock images;
- one primary blue CTA;
- one secondary neutral CTA;
- short trust/support points;
- restrained decorative motion only.

## 9. Cards and catalogue

Destination and institution cards should be image-led where cleared media exists.

Cards should contain only the information needed to decide whether to open the page:
- name;
- location/category;
- short useful description where available;
- clear interaction affordance.

Do not invent rankings, availability counts or popularity scores. If an editorial ordering is used, label it as curated rather than live popularity.

## 10. Forms

- Persistent visible labels.
- Inline field errors near the relevant input.
- Helpful supporting copy before high-friction information.
- Inputs at least 44px high.
- Clear loading, success and failure states.
- Keyboard focus is never obscured by sticky UI.

## 11. Motion

Motion level: **4/10 — restrained**.

- Standard transitions around 160–240ms.
- Use movement for hierarchy/feedback, not decoration.
- Large entrance animation should remain subtle and cancellable.
- Respect `prefers-reduced-motion` globally.
- Avoid continuous animation unless it adds meaningful context.

## 12. Photography

Use the existing rights-aware hierarchy:

1. Happy Education-owned/cleared CMS image;
2. verified openly licensed campus photograph;
3. verified openly licensed city photograph;
4. safe commissioned/editorial fallback.

CC BY/CC BY-SA images require visible attribution and source/licence traceability. Avoid identifiable people as the subject unless the publication/privacy basis is confirmed.

## 13. Accessibility checklist

Before a visual PR is ready:

- [ ] body text contrast meets WCAG AA;
- [ ] keyboard focus is clearly visible;
- [ ] all icon-only controls have accessible labels;
- [ ] interactive targets are at least 44×44px;
- [ ] images have correct alt/decorative treatment;
- [ ] layout works at 375/768/1024/1440px;
- [ ] 200% browser zoom does not hide essential content;
- [ ] reduced-motion preference is respected;
- [ ] no interaction relies on hover alone;
- [ ] English and Turkish content can reflow without clipping.

## 14. Implementation rule

The semantic tokens in `src/styles/globals.css` are the code source of truth for colour and general visual primitives. Prefer updating or reusing those tokens over scattering arbitrary colours through JSX.

Page-specific variations may exist under `design-system/happy-education/pages/`, but they override only the named page. This master file remains the default everywhere else.
