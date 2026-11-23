import type { BusinessRow } from '../../data/useTable'

export const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct', 'fd', 'sc', 'm'] as const
export type Unit = (typeof UNITS)[number]

export interface StockProduct extends BusinessRow {
  name: string
  code: string
  unit: Unit
  /** Counted when the product was registered. The current quantity adds every move after it. */
  initialQuantity: number
  /** Low-stock warning threshold; null = no warning. */
  minQuantity: number | null
  createdAt: string
}

/**
 * Every change to a product's quantity.
 * in = received (adds), out = sent (subtracts), adjust = manual recount (signed difference).
 */
export interface StockMove extends BusinessRow {
  productId: string
  type: 'in' | 'out' | 'adjust'
  /** Positive for in/out; signed for adjust. */
  quantity: number
  /** YYYY-MM-DD */
  date: string
  description: string
  /** Where it came from (in) or where it is going (out). */
  party: string
  createdAt: string
}

export interface StockData {
  products: StockProduct[]
  moves: StockMove[]
}
