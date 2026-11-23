import type { Unit } from './types'

const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })

export function formatQty(value: number, unit: Unit) {
  return `${number.format(value)} ${unit}`
}

/** Value for a quantity <input>: 2.5 → "2,5". */
export function qtyInputValue(value: number | null | undefined) {
  return value == null ? '' : number.format(value).replace(/\./g, '')
}
