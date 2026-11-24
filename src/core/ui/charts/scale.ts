import { useLayoutEffect, useRef, useState } from 'react'

/** Clean axis: rounded ticks that always include zero (bars grow from it; balances are read against it). */
export function niceScale(values: number[], count = 4) {
  let min = Math.min(0, ...values)
  let max = Math.max(0, ...values)
  if (min === max) max = min + 1
  const rawStep = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  let step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
  // Counts (employees, absences, products) never get "0,5" ticks.
  if (values.every(Number.isInteger)) step = Math.max(step, 1)
  min = Math.floor(min / step) * step
  max = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = min; v <= max + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return { min, max, ticks }
}

const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

/** Axis money: in full under 10.000, compact on an axis that reaches it (one style per axis). */
export function axisMoneyFormatter(ticks: number[]) {
  const big = ticks.some((t) => Math.abs(t) >= 10_000)
  return (value: number) => `R$ ${big ? compact.format(value) : full.format(value)}`
}

/** Width of an element, kept current as it resizes. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    setWidth(Math.floor(element.getBoundingClientRect().width))
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** Bar with a 4px rounded data-end and a square baseline (marks spec). Works for negative values too. */
export function columnPath(x: number, width: number, yValue: number, yZero: number) {
  const height = Math.abs(yZero - yValue)
  if (height < 0.5) return ''
  const r = Math.min(4, width / 2, height)
  if (yValue < yZero) {
    return `M${x},${yZero}V${yValue + r}Q${x},${yValue} ${x + r},${yValue}H${x + width - r}Q${x + width},${yValue} ${x + width},${yValue + r}V${yZero}Z`
  }
  return `M${x},${yZero}V${yValue - r}Q${x},${yValue} ${x + r},${yValue}H${x + width - r}Q${x + width},${yValue} ${x + width},${yValue - r}V${yZero}Z`
}
