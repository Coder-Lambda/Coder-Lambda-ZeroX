import { useState, type KeyboardEvent } from 'react'
import { ChartTooltip } from './ChartTooltip'
import { axisMoneyFormatter, columnPath, niceScale, useElementWidth } from './scale'

export interface ColumnSeries {
  name: string
  values: number[]
  color: string
}

interface ColumnChartProps {
  categories: string[]
  tooltipTitle: (index: number) => string
  series: ColumnSeries[]
  format: (value: number) => string
  /** Axis tick labels; money (R$) by default. */
  axisFormat?: (value: number) => string
  /** Which category labels to print on the x axis (all by default). */
  showTick?: (index: number) => boolean
  ariaLabel: string
  height?: number
}

const PAD = { top: 12, right: 8, bottom: 26, left: 64 }
const MAX_BAR = 24
const GAP = 2

/** Grouped columns: ≤24px bars, 2px surface gap, the whole category band is the hover target. */
export function ColumnChart({
  categories,
  tooltipTitle,
  series,
  format,
  axisFormat,
  showTick = () => true,
  ariaLabel,
  height = 230,
}: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)

  const { min, max, ticks } = niceScale(series.flatMap((s) => s.values))
  const axis = axisFormat ?? axisMoneyFormatter(ticks)
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = height - PAD.top - PAD.bottom
  const band = plotW / Math.max(categories.length, 1)
  const barW = Math.max(4, Math.min(MAX_BAR, (band * 0.7 - GAP * (series.length - 1)) / series.length))
  const groupW = barW * series.length + GAP * (series.length - 1)
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH
  const yZero = y(0)

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const step = event.key === 'ArrowRight' ? 1 : -1
      setActive((c) => Math.max(0, Math.min(categories.length - 1, (c ?? (step > 0 ? -1 : categories.length)) + step)))
    } else if (event.key === 'Escape') setActive(null)
  }

  return (
    <div ref={ref} className="chart" tabIndex={0} role="img" aria-label={ariaLabel} onKeyDown={onKey} onBlur={() => setActive(null)}>
      {width > 0 && (
        <svg width={width} height={height} aria-hidden="true">
          <g className="chart-grid">
            {ticks.map((tick) => (
              <line key={tick} x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} />
            ))}
          </g>
          <g className="chart-axis">
            {ticks.map((tick) => (
              <text key={tick} x={PAD.left - 10} y={y(tick)} dy="0.32em" textAnchor="end">
                {axis(tick)}
              </text>
            ))}
            {categories.map((category, i) =>
              showTick(i) ? (
                <text key={`${category}-${i}`} x={PAD.left + band * i + band / 2} y={height - 6} textAnchor="middle">
                  {category}
                </text>
              ) : null,
            )}
          </g>
          {categories.map((category, i) => {
            const start = PAD.left + band * i + (band - groupW) / 2
            return (
              <g key={category} className={active === i ? 'is-active' : undefined}>
                {active === i && <rect className="chart-band" x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} />}
                {series.map((s, si) => (
                  <path
                    key={s.name}
                    className="chart-bar"
                    d={columnPath(start + si * (barW + GAP), barW, y(s.values[i]), yZero)}
                    style={{ fill: s.color }}
                  />
                ))}
                <rect
                  className="chart-hit"
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={plotH}
                  onPointerEnter={() => setActive(i)}
                  onPointerDown={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                />
              </g>
            )
          })}
        </svg>
      )}
      {active != null && (
        <ChartTooltip
          title={tooltipTitle(active)}
          rows={series.map((s) => ({ name: s.name, value: format(s.values[active]), color: s.color, shape: 'rect' as const }))}
          x={PAD.left + band * active + band / 2}
          y={Math.min(...series.map((s) => y(Math.max(0, s.values[active]))))}
          width={width}
        />
      )}
    </div>
  )
}
