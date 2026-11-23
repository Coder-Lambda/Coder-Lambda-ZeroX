import { useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ChartTooltip } from './ChartTooltip'
import { axisMoneyFormatter, niceScale, useElementWidth } from './scale'

export interface LineSeries {
  name: string
  /** null = no value at that x (the line breaks). */
  values: (number | null)[]
  color: string
  dashed?: boolean
  /** 10% wash under the line. */
  area?: boolean
}

interface LineChartProps {
  labels: string[]
  /** Which x positions get an axis label. */
  showTick: (index: number) => boolean
  tickLabel: (index: number) => string
  tooltipTitle: (index: number) => string
  series: LineSeries[]
  format: (value: number) => string
  /** Axis tick labels; money (R$) by default. */
  axisFormat?: (value: number) => string
  ariaLabel: string
  height?: number
}

const PAD = { top: 12, right: 12, bottom: 26, left: 64 }

/** Line chart with a crosshair that snaps to the nearest x; arrow keys move it when focused. */
export function LineChart({
  labels,
  showTick,
  tickLabel,
  tooltipTitle,
  series,
  format,
  axisFormat,
  ariaLabel,
  height = 230,
}: LineChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const count = labels.length

  const values = series.flatMap((s) => s.values.filter((v): v is number => v != null))
  const { min, max, ticks } = niceScale(values)
  const axis = axisFormat ?? axisMoneyFormatter(ticks)
  const plotW = Math.max(width - PAD.left - PAD.right, 1)
  const plotH = height - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2)
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH

  const pathFor = (s: LineSeries) => {
    let d = ''
    let pen = false
    s.values.forEach((v, i) => {
      if (v == null) {
        pen = false
        return
      }
      d += `${pen ? 'L' : 'M'}${x(i)},${y(v)}`
      pen = true
    })
    return d
  }

  const areaFor = (s: LineSeries) => {
    const points = s.values.map((v, i) => (v == null ? null : [x(i), y(v)] as const)).filter((p) => p !== null)
    if (points.length < 2) return ''
    const zero = y(Math.max(min, Math.min(0, max)))
    return `M${points[0][0]},${zero}${points.map(([px, py]) => `L${px},${py}`).join('')}L${points[points.length - 1][0]},${zero}Z`
  }

  const onPointer = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    setActive(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))))
  }

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      const step = event.key === 'ArrowRight' ? 1 : -1
      setActive((current) => Math.max(0, Math.min(count - 1, (current ?? (step > 0 ? -1 : count)) + step)))
    } else if (event.key === 'Escape') setActive(null)
  }

  const activePoints =
    active == null ? [] : series.flatMap((s) => (s.values[active] == null ? [] : [{ s, v: s.values[active] as number }]))
  const activeRows = activePoints.map(({ s, v }) => ({ name: s.name, value: format(v), color: s.color, dashed: s.dashed }))

  return (
    <div
      ref={ref}
      className="chart"
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onKeyDown={onKey}
      onBlur={() => setActive(null)}
    >
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
            {labels.map((_, i) =>
              showTick(i) ? (
                <text key={i} x={x(i)} y={height - 6} textAnchor="middle">
                  {tickLabel(i)}
                </text>
              ) : null,
            )}
          </g>
          {series.map((s) =>
            s.area ? <path key={`${s.name}-area`} d={areaFor(s)} className="chart-area" style={{ fill: s.color }} /> : null,
          )}
          {series.map((s) => (
            <path key={s.name} d={pathFor(s)} className={`chart-line${s.dashed ? ' is-dashed' : ''}`} style={{ stroke: s.color }} />
          ))}
          {active != null && (
            <g>
              <line className="chart-crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} />
              {series.map((s) =>
                s.values[active] != null ? (
                  <circle key={s.name} className="chart-dot" cx={x(active)} cy={y(s.values[active] as number)} r={4.5} style={{ fill: s.color }} />
                ) : null,
              )}
            </g>
          )}
          <rect
            className="chart-hit"
            x={PAD.left - 8}
            y={PAD.top}
            width={plotW + 16}
            height={plotH}
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}
      {active != null && activeRows.length > 0 && (
        <ChartTooltip
          title={tooltipTitle(active)}
          rows={activeRows}
          x={x(active)}
          y={Math.min(...activePoints.map(({ v }) => y(v)))}
          width={width}
        />
      )}
    </div>
  )
}
