export type LandmarkMotif =
  | 'clock-bridge'
  | 'university'
  | 'castle'
  | 'industrial'
  | 'harbour'
  | 'liberty'
  | 'skyline'
  | 'tower'
  | 'opera'
  | 'tram'
  | 'coast'
  | 'fort'
  | 'desert'
  | 'dome'
  | 'mountains'

export interface LandmarkScene {
  key: string
  label: string
  motif: LandmarkMotif
  secondary: LandmarkMotif
}

const scenes: LandmarkScene[] = [
  { key: 'united-kingdom', label: 'United Kingdom', motif: 'clock-bridge', secondary: 'university' },
  { key: 'united-states', label: 'United States', motif: 'liberty', secondary: 'skyline' },
  { key: 'canada', label: 'Canada', motif: 'tower', secondary: 'mountains' },
  { key: 'ireland', label: 'Ireland', motif: 'university', secondary: 'harbour' },
  { key: 'australia', label: 'Australia', motif: 'opera', secondary: 'harbour' },
  { key: 'new-zealand', label: 'New Zealand', motif: 'mountains', secondary: 'harbour' },
  { key: 'malta', label: 'Malta', motif: 'fort', secondary: 'dome' },
  { key: 'cyprus', label: 'Cyprus', motif: 'fort', secondary: 'coast' },
  { key: 'grenada', label: 'Grenada', motif: 'coast', secondary: 'fort' },
  { key: 'united-arab-emirates', label: 'United Arab Emirates', motif: 'desert', secondary: 'tower' },
  { key: 'london', label: 'London', motif: 'clock-bridge', secondary: 'skyline' },
  { key: 'oxford', label: 'Oxford', motif: 'dome', secondary: 'university' },
  { key: 'cambridge', label: 'Cambridge', motif: 'university', secondary: 'harbour' },
  { key: 'birmingham', label: 'Birmingham', motif: 'industrial', secondary: 'harbour' },
  { key: 'manchester', label: 'Manchester', motif: 'industrial', secondary: 'skyline' },
  { key: 'edinburgh', label: 'Edinburgh', motif: 'castle', secondary: 'mountains' },
  { key: 'cardiff', label: 'Cardiff', motif: 'castle', secondary: 'harbour' },
  { key: 'bristol', label: 'Bristol', motif: 'harbour', secondary: 'clock-bridge' },
  { key: 'leicester', label: 'Leicester', motif: 'tower', secondary: 'university' },
  { key: 'nottingham', label: 'Nottingham', motif: 'castle', secondary: 'university' },
  { key: 'sheffield', label: 'Sheffield', motif: 'industrial', secondary: 'mountains' },
  { key: 'leeds', label: 'Leeds', motif: 'tower', secondary: 'industrial' },
  { key: 'liverpool', label: 'Liverpool', motif: 'harbour', secondary: 'tower' },
  { key: 'dublin', label: 'Dublin', motif: 'university', secondary: 'dome' },
  { key: 'cork', label: 'Cork', motif: 'tower', secondary: 'harbour' },
  { key: 'galway', label: 'Galway', motif: 'fort', secondary: 'coast' },
  { key: 'new-york', label: 'New York', motif: 'liberty', secondary: 'skyline' },
  { key: 'boston', label: 'Boston', motif: 'dome', secondary: 'harbour' },
  { key: 'chicago', label: 'Chicago', motif: 'skyline', secondary: 'tower' },
  { key: 'los-angeles', label: 'Los Angeles', motif: 'coast', secondary: 'skyline' },
  { key: 'san-francisco', label: 'San Francisco', motif: 'clock-bridge', secondary: 'coast' },
  { key: 'toronto', label: 'Toronto', motif: 'tower', secondary: 'university' },
  { key: 'vancouver', label: 'Vancouver', motif: 'mountains', secondary: 'skyline' },
  { key: 'montreal', label: 'Montreal', motif: 'dome', secondary: 'skyline' },
  { key: 'sydney', label: 'Sydney', motif: 'opera', secondary: 'harbour' },
  { key: 'melbourne', label: 'Melbourne', motif: 'tram', secondary: 'skyline' },
  { key: 'brisbane', label: 'Brisbane', motif: 'clock-bridge', secondary: 'skyline' },
  { key: 'perth', label: 'Perth', motif: 'skyline', secondary: 'coast' },
  { key: 'auckland', label: 'Auckland', motif: 'tower', secondary: 'harbour' },
  { key: 'wellington', label: 'Wellington', motif: 'dome', secondary: 'harbour' },
  { key: 'christchurch', label: 'Christchurch', motif: 'university', secondary: 'mountains' },
  { key: 'valletta', label: 'Valletta', motif: 'fort', secondary: 'dome' },
  { key: 'sliema', label: 'Sliema', motif: 'coast', secondary: 'skyline' },
  { key: 'st-julians', label: "St Julian's", motif: 'harbour', secondary: 'coast' },
  { key: 'nicosia', label: 'Nicosia', motif: 'fort', secondary: 'dome' },
  { key: 'st-georges', label: "St George's", motif: 'coast', secondary: 'fort' },
  { key: 'dubai', label: 'Dubai', motif: 'desert', secondary: 'tower' },
  { key: 'abu-dhabi', label: 'Abu Dhabi', motif: 'dome', secondary: 'desert' },
]

const aliases: Record<string, string> = {
  uk: 'united-kingdom', england: 'united-kingdom', ingiltere: 'united-kingdom', 'birlesik-krallik': 'united-kingdom',
  usa: 'united-states', america: 'united-states', amerika: 'united-states', abd: 'united-states',
  kanada: 'canada', irlanda: 'ireland', avustralya: 'australia', 'yeni-zelanda': 'new-zealand', kibris: 'cyprus', bae: 'united-arab-emirates',
  'new-york-city': 'new-york', 'st-julian-s': 'st-julians', 'saint-julians': 'st-julians', lefkosa: 'nicosia', londra: 'london', edinburg: 'edinburgh', sidney: 'sydney',
}

const byKey = new Map(scenes.map((scene) => [scene.key, scene]))

export function landmarkForPathname(pathname: string): LandmarkScene | null {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment).toLocaleLowerCase('en-GB'))

  for (const segment of segments.reverse()) {
    const key = aliases[segment] ?? segment
    const scene = byKey.get(key)
    if (scene) return scene
  }
  return null
}

export function landmarkSceneKeys(): string[] {
  return scenes.map((scene) => scene.key)
}
