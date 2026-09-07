# Happy Education travel motion

This layer adds travel-specific motion without making movement essential to understanding or operating the site.

## Scroll-linked journey plane

The application journey includes a decorative flight path on large screens. The plane position and banking angle are derived from the same SVG curve that is rendered behind the six process cards.

Implementation: `src/components/ui/JourneyFlightLayer.tsx`.

Rules:
- decorative and `aria-hidden`;
- pointer-events disabled;
- updated through a requestAnimationFrame scroll loop rather than React state on every scroll event;
- follows an SVG path rather than a hard-coded diagonal translation;
- cloud puffs fade in and out at different parts of the journey;
- disabled under `prefers-reduced-motion: reduce`;
- hidden below the large breakpoint so it never competes with mobile process cards.

## Page-change cloud transition

Internal public-site links can briefly trigger a cloud cover before navigation. The transition exists to make moving between destinations feel more like travel without turning navigation into a loading screen.

Implementation: `src/components/chrome/RouteCloudTransition.tsx` and `src/styles/travel-motion.css`.

Behaviour:
- ordinary left-click on a different same-origin route: clouds cover, navigation starts after roughly 280ms, clouds clear when the pathname changes;
- modifier clicks, new-tab links, downloads, mailto/tel links, external links and same-page anchors are untouched;
- reduced-motion users use normal navigation with no interception;
- a fallback timeout clears the effect if navigation does not complete normally;
- the overlay is `aria-hidden` and contains no information.

## Dependency decision

This first version deliberately stays dependency-free. Native browser APIs are sufficient for the current SVG path tracking and short route-cover transition. Introduce the `motion` package only when future scenes need spring physics, shared-layout transitions, gesture response, complex enter/exit orchestration or reusable scroll-linked MotionValues.
