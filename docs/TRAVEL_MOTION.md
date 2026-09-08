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

Internal public-site links can trigger a short cloud fly-through that makes navigation feel travel-themed without turning the site into a loading screen.

Implementation: `src/components/chrome/RouteCloudTransition.tsx` and `src/styles/travel-motion.css`.

Behaviour:
- ordinary left-click on a different same-origin route starts navigation immediately with `router.push`;
- the cloud animation runs on top of the real route change and never waits before navigation begins;
- a very short minimum visual cover of roughly 160ms prevents the effect from reading as a flash when a route is already cached;
- once the pathname changes, the clouds clear in roughly 260ms;
- if navigation genuinely takes longer, the animated cloud layer remains visible until the route changes instead of showing an unfinished page swap;
- modifier clicks, new-tab links, downloads, mailto/tel links, external links and same-page anchors are untouched;
- reduced-motion users use normal navigation with no interception;
- a fallback timeout clears the effect if navigation does not complete normally;
- the overlay is `aria-hidden` and contains no information.

### Visual direction

The route transition intentionally uses clear cloud silhouettes rather than abstract blurred white shapes. A pale sky layer establishes contrast, six large puffy SVG clouds sweep through the viewport, and only a light mist layer softens the overlap. The page itself gets a very small scale/blur cue during the transition, but there is no long camera animation or artificial hold.

## Dependency decision

This version deliberately stays dependency-free. Native browser APIs are sufficient for the current SVG path tracking and short route-cover transition. Introduce the `motion` package only when future scenes need spring physics, shared-layout transitions, gesture response, complex enter/exit orchestration or reusable scroll-linked MotionValues.
