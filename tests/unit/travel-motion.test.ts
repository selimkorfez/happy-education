import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const routeTransition = readFileSync('src/components/chrome/RouteCloudTransition.tsx', 'utf8')
const journeyFlight = readFileSync('src/components/ui/JourneyFlightLayer.tsx', 'utf8')
const travelCss = readFileSync('src/styles/travel-motion.css', 'utf8')

describe('travel motion', () => {
  it('keeps route transitions limited to ordinary internal navigation', () => {
    expect(routeTransition).toContain("next.origin !== window.location.origin")
    expect(routeTransition).toContain("rawHref.startsWith('mailto:')")
    expect(routeTransition).toContain("anchor.hasAttribute('download')")
    expect(routeTransition).toContain("prefers-reduced-motion: reduce")
  })

  it('uses the same SVG route for the visible path and the scroll-linked plane', () => {
    expect(journeyFlight).toContain('getPointAtLength')
    expect(journeyFlight).toContain('getTotalLength')
    expect(journeyFlight).toContain('requestAnimationFrame')
  })

  it('removes decorative travel motion for reduced-motion users', () => {
    expect(travelCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(travelCss).toContain('.he-flight-layer')
    expect(travelCss).toContain('.he-route-cloud-transition')
  })
})
