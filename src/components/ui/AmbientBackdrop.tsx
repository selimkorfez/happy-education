export function AmbientBackdrop({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div
      aria-hidden="true"
      className={`he-ambient-backdrop ${tone === 'dark' ? 'he-ambient-backdrop-dark' : 'he-ambient-backdrop-light'}`}
    >
      <span className="he-ambient-orb he-ambient-orb-a" />
      <span className="he-ambient-orb he-ambient-orb-b" />
      <span className="he-ambient-orb he-ambient-orb-c" />
      <span className="he-ambient-grid" />
      <span className="he-ambient-sweep" />
    </div>
  )
}
