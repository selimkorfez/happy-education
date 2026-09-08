import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const routeTransition = readFileSync('src/components/chrome/RouteCloudTransition.tsx', 'utf8')
const journeyFlight = readFileSync('src/components/ui/JourneyFlightLayer.tsx', 'utf8')
const travelCss = readFileSync('src/styles/travel-motion.css', 'utf8')
const localeLayout = readFileSync('src/app/(site)/[locale]/layout.tsx', 'utf8')

describe('travel motion', () => {
  it('keeps route transitions limited to ordinary internal navigation', () => {
    expect(routeTransition).toContain("next.origin !== window.location.origin")
    expect(routeTransition).toContain("rawHref.startsWith('mailto:')")
    expect(routeTransition).toContain("anchor.hasAttribute('download')")
    expect(routeTransition).toContain("prefers-reduced-motion: reduce")
  })

  it('commits the cloud state before starting immediate navigation', () => {
    const flushIndex = routeTransition.indexOf("flushSync(() =>")
    const pushIndex = routeTransition.indexOf('router.push(destination)')

    expect(flushIndex).toBeGreaterThan(-1)
    expect(pushIndex).toBeGreaterThan(flushIndex)
    expect(routeTransition).toContain("applyPhase('covering')")
    expect(routeTransition).toContain('const MIN_COVER_MS = 180')
    expect(routeTransition).not.toContain('navigationRef')
    expect(routeTransition).not.toContain("type Phase = 'idle' | 'covering' | 'covered'")
  })

  it('uses recognisable SVG cloud silhouettes for the route transition', () => {
    expect(routeTransition).toContain('<ellipse cx="120" cy="84"')
    expect(routeTransition).toContain('<circle cx="103" cy="50"')
    expect(routeTransition).toContain('he-route-cloud-6')
    expect(travelCss).toContain('.he-route-sky')
  })

  it('uses the same SVG route for the visible path and the scroll-linked plane', () => {
    expect(journeyFlight).toContain('getPointAtLength')
    expect(journeyFlight).toContain('getTotalLength')
    expect(journeyFlight).toContain('requestAnimationFrame')
  })

  it('keeps only a short camera cue while the real route changes underneath', () => {
    expect(localeLayout).toContain('id="route-scene"')
    expect(travelCss).toContain("html[data-route-transition='covering'] #route-scene")
    expect(travelCss).toContain("html[data-route-transition='clearing'] #route-scene")
    expect(travelCss).not.toContain("html[data-route-transition='covered'] #route-scene")
  })

  it('removes decorative travel motion for reduced-motion users', () => {
    expect(travelCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(travelCss).toContain('.he-flight-layer')
    expect(travelCss).toContain('.he-route-cloud-transition')
    expect(travelCss).toContain('html[data-route-transition] #route-scene')
  })
})
