import type { ReactNode } from 'react'

/** Number first, small grey label under it (icy rule 3). */
export function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stat-tile glass">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
