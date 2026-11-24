import { formatDateKey, toDateKey } from '../lib/format'
import { addMonths, daysInMonth, dayKey, shortMonthLabel } from '../lib/month'
import type { Period } from './types'

/**
 * Buckets of a period, oldest first, ending with the one that holds `today`.
 * Keys are prefixes of a YYYY-MM-DD date: '2026-11-23' (day), '2026-11' (month), '2026' (year),
 * so `date.startsWith(key)` tells whether a date is inside a bucket.
 */
export function buckets(period: Period, today: string, count: number) {
  if (period === 'daily') {
    const [y, m, d] = today.split('-').map(Number)
    return Array.from({ length: count }, (_, i) => toDateKey(new Date(y, m - 1, d - count + 1 + i)))
  }
  if (period === 'monthly') {
    const month = today.slice(0, 7)
    return Array.from({ length: count }, (_, i) => addMonths(month, i - count + 1))
  }
  const year = Number(today.slice(0, 4))
  return Array.from({ length: count }, (_, i) => String(year - count + 1 + i))
}

/** How many buckets a chart shows, and a sparkline. */
export const CHART_SIZE: Record<Period, number> = { daily: 30, monthly: 12, yearly: 5 }
export const SPARK_SIZE: Record<Period, number> = { daily: 12, monthly: 12, yearly: 5 }

/** The current bucket and the one before it. */
export function currentAndPrevious(period: Period, today: string) {
  const [previous, current] = buckets(period, today, 2)
  return { current, previous }
}

/** Last day of a bucket, never after today (balances are read at this day). */
export function bucketEnd(key: string, period: Period, today: string) {
  const end = period === 'daily' ? key : period === 'monthly' ? dayKey(key, daysInMonth(key)) : `${key}-12-31`
  return end < today ? end : today
}

export function bucketLabel(key: string, period: Period) {
  if (period === 'daily') return formatDateKey(key, false)
  if (period === 'monthly') return `${shortMonthLabel(key)}/${key.slice(2, 4)}`
  return key
}

/** Sum of `value` over the items whose date falls in the bucket. */
export function sumIn<T>(items: T[], key: string, dateOf: (item: T) => string, valueOf: (item: T) => number) {
  let total = 0
  for (const item of items) if (dateOf(item).startsWith(key)) total += valueOf(item)
  return Math.round(total * 1000) / 1000
}

/**
 * Only the ticks that fit: evenly spaced back from the last (current) bucket, plus the first one when it
 * is far enough from its neighbour not to collide.
 */
export function tickEvery(count: number) {
  const step = count > 20 ? 7 : count > 8 ? 3 : 1
  const firstFits = (count - 1) % step === 0 || (count - 1) % step >= Math.ceil(step / 2)
  return (i: number) => (count - 1 - i) % step === 0 || (i === 0 && firstFits)
}
