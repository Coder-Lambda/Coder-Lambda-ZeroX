export interface TooltipRow {
  name: string
  value: string
  color: string
  dashed?: boolean
  /** Rect key for bars, line key for lines (the legend mirrors the mark). */
  shape?: 'line' | 'rect'
}

interface ChartTooltipProps {
  title: string
  rows: TooltipRow[]
  x: number
  y: number
  width: number
}

/** Values lead, names follow; keyed with the series' line or swatch. Text stays in text tokens. */
export function ChartTooltip({ title, rows, x, y, width }: ChartTooltipProps) {
  const left = Math.min(Math.max(x, 80), Math.max(80, width - 80))
  return (
    <div className="chart-tooltip" style={{ left, top: y }} role="presentation">
      <div className="chart-tooltip-title">{title}</div>
      {rows.map((row) => (
        <div key={row.name} className="chart-tooltip-row">
          <span
            className={`chart-key${row.shape === 'rect' ? ' is-rect' : ''}${row.dashed ? ' is-dashed' : ''}`}
            style={{ color: row.color }}
            aria-hidden="true"
          />
          <strong>{row.value}</strong>
          <span>{row.name}</span>
        </div>
      ))}
    </div>
  )
}

export function ChartLegend({ rows }: { rows: { name: string; color: string; dashed?: boolean; shape?: 'line' | 'rect' }[] }) {
  return (
    <ul className="chart-legend">
      {rows.map((row) => (
        <li key={row.name}>
          <span
            className={`chart-key${row.shape === 'rect' ? ' is-rect' : ''}${row.dashed ? ' is-dashed' : ''}`}
            style={{ color: row.color }}
            aria-hidden="true"
          />
          {row.name}
        </li>
      ))}
    </ul>
  )
}
