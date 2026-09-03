# Happy Education motion and interaction system

This document defines how motion should be used across the public Happy Education website.

## Reference direction

The implementation takes design and interaction inspiration from:

- UI UX Pro Max — systematic UI/UX, accessibility, responsive behaviour and design-system discipline.
- 21st.dev — modern React marketing composition, animated backgrounds, bento grids, image-led cards and polished interaction patterns.
- Motion — production-oriented principles for spring, gesture, scroll, layout and reduced-motion animation.

These sources are references, not templates to copy wholesale. Happy Education should remain visually recognisable and use its own content, media rights policy and brand system.

## Experience target

The website should feel like a modern international education + travel platform:

- energetic without feeling childish;
- premium without becoming a luxury-fashion site;
- visual without hiding useful information;
- interactive without requiring hover to understand content;
- alive without permanently distracting from reading.

Avoid the previous museum/prospectus rhythm of heading → paragraph → paragraph → large blank space → list.

## Motion hierarchy

### Ambient motion

Slow decorative motion can live behind hero sections and selected high-impact sections. It must:

- remain pointer-events none;
- never contain information;
- animate transforms/opacity rather than layout dimensions;
- use long durations so it reads as atmosphere rather than an advert;
- stop under `prefers-reduced-motion: reduce`.

The shared `AmbientBackdrop` uses moving radial fields, a perspective grid and a slow light sweep.

### Entrance motion

Use the shared `Reveal` primitive for meaningful section/card entrances. It:

- animates once when content approaches the viewport;
- uses IntersectionObserver instead of scroll event listeners;
- becomes immediately visible for reduced-motion users;
- should use short stagger delays only where sequence helps scanning.

Do not hide essential content behind long entrance choreography.

### Hover and focus

Cards may lift, deepen shadow, gently enlarge imagery or reveal a light sweep. Keyboard focus must remain fully usable and visible. Do not create information that exists only on hover.

### Continuous animation

Continuous animation is reserved for low-frequency background atmosphere and small status cues. Do not continuously bounce buttons, headings, cards or navigation.

## CSS vs Motion package

Use CSS for self-contained effects such as:

- colour/background changes;
- simple hover transforms;
- ambient gradient movement;
- decorative light sweeps.

Add the `motion` package when a feature genuinely needs:

- scroll-linked values;
- spring-based gesture response;
- shared layout transitions;
- enter/exit orchestration;
- complex interruption-safe sequences.

Do not add an animation dependency merely to reproduce a CSS transition.

## Performance rules

- Prefer opacity and transform animation.
- Avoid animation that causes repeated layout/reflow.
- Keep large blurred layers few in number and visually simple.
- Images must continue to use Next Image/MediaFrame sizing and lazy-loading rules.
- Test desktop and mobile separately.
- Respect `prefers-reduced-motion` globally.

## Accessibility rules

- Motion must not communicate the only copy of important information.
- All interactive targets remain at least 44px in practical size.
- Hover treatment must have a touch-safe static equivalent.
- Focus outlines may not be removed.
- Avoid rapid flashing, strobing or large high-frequency parallax.
- Motion should stop or become effectively instant for reduced-motion users.

## Current reusable pieces

- `src/components/ui/AmbientBackdrop.tsx`
- `src/components/ui/Reveal.tsx`
- `.he-ambient-*` primitives in `src/styles/globals.css`
- `.he-shine-card`
- `.he-reveal`

Before introducing a new animation primitive, check whether one of these can be extended consistently.
