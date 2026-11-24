import type { ProductionItem, ProductionPeriod } from '../../../rules/types'
import type { Employee, ProductionRecord } from '../types'

export const PERIODS: ProductionPeriod[] = ['daily', 'monthly', 'yearly']

const round = (value: number) => Math.round(value * 1000) / 1000

/** Does a record's date fall in the day, month or year of `day`? */
export function inPeriod(date: string, period: ProductionPeriod, day: string) {
  if (period === 'daily') return date === day
  return date.startsWith(period === 'monthly' ? day.slice(0, 7) : day.slice(0, 4))
}

/** How much each employee made of an item in the period. */
export function totalsByEmployee(records: ProductionRecord[], itemId: string, period: ProductionPeriod, day: string) {
  const totals = new Map<string, number>()
  for (const r of records) {
    if (r.itemId !== itemId || !inPeriod(r.date, period, day)) continue
    totals.set(r.employee_id, round((totals.get(r.employee_id) ?? 0) + r.quantity))
  }
  return totals
}

export function teamTotal(records: ProductionRecord[], itemId: string, period: ProductionPeriod, day: string) {
  return round(
    records.filter((r) => r.itemId === itemId && inPeriod(r.date, period, day)).reduce((s, r) => s + r.quantity, 0),
  )
}

export type TargetState = 'none' | 'below' | 'reached' | 'over'

/**
 * Where a value stands against the item's target for the period.
 * goal: below until reached. ceiling: reached while under it, over once it is passed.
 */
export function targetState(item: ProductionItem, period: ProductionPeriod, value: number) {
  const target = item[period]
  if (target == null || target <= 0) return { target: null, ratio: 0, state: 'none' as TargetState }
  const ratio = value / target
  const state: TargetState = item.kind === 'goal' ? (value >= target ? 'reached' : 'below') : value > target ? 'over' : 'reached'
  return { target, ratio, state }
}

/** The figure the target is compared with: one employee's total, or the whole team's. */
export function progressFor(
  item: ProductionItem,
  records: ProductionRecord[],
  period: ProductionPeriod,
  day: string,
  employeeId?: string,
) {
  const value =
    item.per === 'team' || !employeeId
      ? teamTotal(records, item.id, period, day)
      : (totalsByEmployee(records, item.id, period, day).get(employeeId) ?? 0)
  return { value, ...targetState(item, period, value) }
}

/**
 * What &maindashboard& reads to compare production: per item, the team total and each employee's share
 * for the day, month and year of `day`.
 */
export function productionStats(records: ProductionRecord[], items: ProductionItem[], employees: Employee[], day: string) {
  const names = new Map(employees.map((e) => [e.id, e.name]))
  return items.map((item) => ({
    item,
    periods: Object.fromEntries(
      PERIODS.map((period) => {
        const byEmployee = [...totalsByEmployee(records, item.id, period, day)]
          .map(([id, value]) => ({ employeeId: id, name: names.get(id) ?? '—', value }))
          .sort((a, b) => b.value - a.value)
        return [period, { total: teamTotal(records, item.id, period, day), target: item[period], byEmployee }]
      }),
    ) as Record<
      ProductionPeriod,
      { total: number; target: number | null; byEmployee: { employeeId: string; name: string; value: number }[] }
    >,
  }))
}
