import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react'
import './widgets.css'

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const moneyCompact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 })
const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const plainCompact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

/** Money for a tile: exact up to R$ 100 mil, compact after (R$ 1,2 mi) so it always fits. */
export const tileMoney = (value: number) => (Math.abs(value) >= 100_000 ? moneyCompact : money).format(value)
export const tileNumber = (value: number) => (Math.abs(value) >= 100_000 ? plainCompact : plain).format(value)

/** Value first, small grey label under it (stat tile contract). */
export function Figure({ value, label, delta }: { value: ReactNode; label?: string; delta?: ReactNode }) {
  return (
    <div className="wg-figure">
      <span className="wg-value num">{value}</span>
      {label && <span className="wg-label">{label}</span>}
      {delta}
    </div>
  )
}

/**
 * Signed change against a named period. Color says whether it is good, but the arrow and the sign
 * always say the direction, so color is never the only cue.
 */
export function Delta({
  change,
  versus,
  format,
  upIsGood = true,
}: {
  change: number
  versus: string
  format: (value: number) => string
  upIsGood?: boolean | null
}) {
  const rounded = Math.round(change * 100) / 100
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  const tone =
    direction === 'flat' || upIsGood == null ? 'neutral' : (direction === 'up') === upIsGood ? 'good' : 'bad'
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Equal
  const sign = direction === 'up' ? '+' : direction === 'down' ? '−' : ''
  return (
    <span className={`wg-delta is-${tone}`}>
      <Icon aria-hidden="true" />
      <span className="num">
        {sign}
        {format(Math.abs(rounded))}
      </span>
      <span className="wg-delta-vs">{versus}</span>
    </span>
  )
}

/** 12-point trend in the muted ink, the current point in the accent. Decorative: the figure carries the value. */
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const w = 120
  const h = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const x = (i: number) => (i / (values.length - 1)) * (w - 6) + 3
  const y = (v: number) => h - 4 - ((v - min) / span) * (h - 8)
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values.length - 1
  return (
    <svg className="wg-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" />
      <circle cx={x(last)} cy={y(values[last])} r="3" />
    </svg>
  )
}

/** Label / value rows under a figure. */
export function Rows({ rows }: { rows: { label: ReactNode; value: ReactNode; key?: string }[] }) {
  if (rows.length === 0) return null
  return (
    <dl className="wg-rows">
      {rows.map((row, i) => (
        <div key={row.key ?? i}>
          <dt>{row.label}</dt>
          <dd className="num">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="wg-muted">{children}</p>
}

export { money }
