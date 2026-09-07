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

## Page-change cloud fly-through

Internal public-site links can trigger a short travel transition. The effect is designed as a camera move rather than a flat overlay: the current page recedes as though the viewer is climbing away from the ground, distant cloud forms accelerate toward the camera until the viewport is completely obscured, the route changes while the viewer is inside the cloud layer, then the new page grows back toward the viewer while the foreground clouds rush past and clear.

Implementation: `src/components/chrome/RouteCloudTransition.tsx`, the `#route-scene` wrapper in the locale layout, and `src/styles/travel-motion.css`.

Behaviour:
- ordinary left-click on a different same-origin route: scene begins to recede, full cloud cover is reached at roughly half a second, navigation starts only after the old page is obscured, then the new page is revealed through a roughly one-second descent;
- a short `covered` phase prevents a normal page swap from flashing underneath the effect;
- modifier clicks, new-tab links, downloads, mailto/tel links, external links and same-page anchors are untouched;
- reduced-motion users use normal navigation with no interception and no scene transform;
- a fallback timeout clears the effect if navigation does not complete normally;
- all clouds are original CSS gradient compositions, are `aria-hidden`, and contain no information.

## Dependency decision

This version deliberately stays dependency-free. Native browser APIs are sufficient for the current SVG path tracking and route fly-through. Introduce the `motion` package only when future scenes need spring physics, shared-layout transitions, gesture response, complex enter/exit orchestration or reusable scroll-linked MotionValues.
