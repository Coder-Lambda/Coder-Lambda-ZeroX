import { t } from '../../i18n/pt-BR'
import { formatDateKey } from '../../lib/format'
import type { CustomUnit, ItemField } from '../../rules/types'
import { UNITS, type Unit } from './types'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })

export function formatQty(value: number, unit: string) {
  return `${number.format(value)} ${unit}`
}

/** The units a product can use: the standard ones and the business's own (rule book), plus the current one if it was removed. */
export function unitOptions(custom: CustomUnit[], current?: string) {
  const standard = UNITS.map((u) => ({ value: u as string, label: t.stock.units[u] }))
  const own = custom.map((u) => ({ value: u.abbr, label: `${u.name} (${u.abbr})` }))
  const known = new Set([...standard, ...own].map((o) => o.value))
  if (current && !known.has(current)) own.push({ value: current, label: current })
  return { standard, own }
}

export const isStandardUnit = (unit: string): unit is Unit => (UNITS as readonly string[]).includes(unit)

/** Value for a quantity <input>: 2.5 → "2,5". */
export function qtyInputValue(value: number | null | undefined) {
  return value == null ? '' : number.format(value).replace(/\./g, '')
}

/** An extra label's value as shown on the product (dates in pt-BR). */
export const formatExtra = (field: ItemField, value: string) =>
  field.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDateKey(value) : value
