import { createContext, useContext } from 'react'
import type { StockData, StockMove, StockProduct } from './types'

export type StockDialog =
  | { type: 'product'; product?: StockProduct }
  | { type: 'move'; moveType: 'in' | 'out'; move?: StockMove; productId?: string }
  | { type: 'adjustment'; move: StockMove }

export interface StockContextValue {
  data: StockData
  /** Current quantity of each product, by id. */
  qty: Map<string, number>
  today: string
  open: (dialog: StockDialog) => void
}

export const StockContext = createContext<StockContextValue | null>(null)

export function useStockContext() {
  const value = useContext(StockContext)
  if (!value) throw new Error('useStockContext precisa estar dentro de <StockModule>')
  return value
}
