import { normalize } from '../../lib/format'
import type { FinanceAlarm, MoneyAlarm, MoneyMetric } from '../../rules/types'
import { isOpen } from './store'
import type { FinTitle } from './types'

/** Whole days from `today` to `day` (negative when it already passed). */
export function daysUntil(day: string, today: string) {
  const [y1, m1, d1] = today.split('-').map(Number)
  const [y2, m2, d2] = day.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

export const alarmMatches = (alarm: FinanceAlarm, title: FinTitle) =>
  alarm.kind === title.kind &&
  (!alarm.match.trim() || normalize(`${title.description} ${title.category}`).includes(normalize(alarm.match)))

/** Open titles an alarm is ringing for: due within its days (or already overdue). */
export function ringingTitles(titles: FinTitle[], alarms: FinanceAlarm[], today: string) {
  const ringing: { alarm: FinanceAlarm; title: FinTitle; daysLeft: number }[] = []
  for (const title of titles) {
    if (!isOpen(title)) continue
    const daysLeft = daysUntil(title.dueDate, today)
    const alarm = alarms.find((a) => alarmMatches(a, title) && daysLeft <= a.daysBefore)
    if (alarm) ringing.push({ alarm, title, daysLeft })
  }
  return ringing.sort((a, b) => a.daysLeft - b.daysLeft)
}

export type MoneyFigures = Record<MoneyMetric, number>

/** A money alarm fires once the figure reaches the value (above) or falls under it (below). */
export function moneyAlarmFired(alarm: MoneyAlarm, figures: MoneyFigures) {
  const value = figures[alarm.metric]
  return alarm.when === 'above' ? value >= alarm.value : value < alarm.value
}
