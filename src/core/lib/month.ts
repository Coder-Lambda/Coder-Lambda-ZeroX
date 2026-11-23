import { t } from '../i18n/pt-BR'

/** Months are 'YYYY-MM' keys. */
export function addMonths(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function daysInMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function dayKey(month: string, day: number) {
  return `${month}-${String(day).padStart(2, '0')}`
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return `${t.calendar.months[m - 1]} ${y}`
}

export function shortMonthLabel(key: string) {
  const [, m] = key.split('-').map(Number)
  return t.calendar.months[m - 1].slice(0, 3).toLowerCase()
}

export function firstDay(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export const isMonthKey = (value: string | null): value is string => !!value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
