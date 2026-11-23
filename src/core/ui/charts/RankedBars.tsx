import { useState } from 'react'

interface RankedBarsProps {
  items: { label: string; value: number }[]
  color: string
  format: (value: number) => string
  /** Tooltip extra, e.g. the share of the total. */
  detail?: (value: number) => string
  ariaLabel: string
}

/** Part-to-whole as ranked horizontal bars, one hue, largest first, value at the tip (choosing-a-form). */
export function RankedBars({ items, color, format, detail, ariaLabel }: RankedBarsProps) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ul className="ranked-bars" aria-label={ariaLabel}>
      {items.map((item, index) => (
        <li
          key={item.label}
          className={`ranked-row${active === index ? ' is-active' : ''}`}
          tabIndex={0}
          aria-label={`${item.label}: ${format(item.value)}${detail ? ` (${detail(item.value)})` : ''}`}
          onPointerEnter={() => setActive(index)}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(index)}
          onBlur={() => setActive(null)}
        >
          <span className="ranked-label">{item.label}</span>
          <span className="ranked-track">
            <span className="ranked-bar" style={{ width: `${(item.value / max) * 100}%`, background: color }} />
            <span className="ranked-value">{format(item.value)}</span>
          </span>
          {active === index && detail && (
            <span className="chart-tooltip ranked-tip" aria-hidden="true">
              <span className="chart-tooltip-row">
                <span className="chart-key is-rect" style={{ color }} />
                <strong>{format(item.value)}</strong>
                <span>{detail(item.value)}</span>
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
