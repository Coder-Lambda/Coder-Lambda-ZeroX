import { useMemo } from 'react'
import { CLIENT_ID } from '../../config/clientRegistry'
import { localDb, newId } from '../../data/localDb'
import { useTable } from '../../data/useTable'
import { normalize, toDateKey } from '../../lib/format'
import { dayKey, daysInMonth } from '../../lib/month'
import type { StockData, StockMove, StockProduct } from './types'

export const STOCK_TABLES = { products: 'stock_products', moves: 'stock_moves' } as const

type Scope = { tenant_id: string; business_id: string }

export function useStock(): StockData {
  const products = useTable<StockProduct>(STOCK_TABLES.products)
  const moves = useTable<StockMove>(STOCK_TABLES.moves)
  return useMemo(() => ({ products, moves }), [products, moves])
}

const round = (value: number) => Math.round(value * 1000) / 1000
export const signedQuantity = (move: StockMove) => (move.type === 'out' ? -move.quantity : move.quantity)

/** Quantity at the end of `day` (or now, without a day). */
export function quantityOf(product: StockProduct, moves: StockMove[], day?: string) {
  const moved = moves
    .filter((m) => m.productId === product.id && (!day || m.date <= day))
    .reduce((sum, m) => sum + signedQuantity(m), 0)
  return round(product.initialQuantity + moved)
}

export function quantities(data: StockData) {
  return new Map(data.products.map((p) => [p.id, quantityOf(p, data.moves)]))
}

export const isLow = (product: StockProduct, quantity: number) =>
  product.minQuantity != null && quantity > 0 && quantity <= product.minQuantity

export function findProduct(products: StockProduct[], name: string) {
  const key = normalize(name)
  return key ? products.find((p) => normalize(p.name) === key || (p.code && normalize(p.code) === key)) : undefined
}

/** The numbers &maindashboard& reads for stock. */
export function stockSummary(data: StockData, month: string) {
  const qty = quantities(data)
  const inMonth = data.moves.filter((m) => m.date.startsWith(month))
  return {
    products: data.products.length,
    lowStock: data.products.filter((p) => isLow(p, qty.get(p.id) ?? 0)).length,
    outOfStock: data.products.filter((p) => (qty.get(p.id) ?? 0) <= 0).length,
    receivedCount: inMonth.filter((m) => m.type === 'in').length,
    sentCount: inMonth.filter((m) => m.type === 'out').length,
    /** What the stock on hand is worth, from the unit values (rule book › Valor dos itens). */
    stockValue: stockValue(data, qty),
  }
}

export function stockValue(data: StockData, qty = quantities(data)) {
  const total = data.products.reduce((sum, p) => sum + Math.max(0, qty.get(p.id) ?? 0) * (p.unitPrice ?? 0), 0)
  return Math.round(total * 100) / 100
}

/** Received and sent per day of a month, for one product or all of them (adjustments excluded). */
export function dailyFlows(moves: StockMove[], month: string, productId?: string) {
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => dayKey(month, i + 1))
  const relevant = moves.filter((m) => m.date.startsWith(month) && (!productId || m.productId === productId))
  const sum = (day: string, type: StockMove['type']) =>
    round(relevant.filter((m) => m.date === day && m.type === type).reduce((s, m) => s + m.quantity, 0))
  return { days, received: days.map((d) => sum(d, 'in')), sent: days.map((d) => sum(d, 'out')) }
}

/** Quantity at the end of each day; no value before the product was registered or after today. */
export function levelSeries(product: StockProduct, moves: StockMove[], days: string[], today: string) {
  const firstMove = moves.filter((m) => m.productId === product.id).reduce((min, m) => (m.date < min ? m.date : min), '9999')
  const since = [product.createdAt.slice(0, 10), firstMove].sort()[0]
  return days.map((d) => (d >= since && d <= today ? quantityOf(product, moves, d) : null))
}

export function lastDays(count: number, today: string) {
  const [y, m, d] = today.split('-').map(Number)
  return Array.from({ length: count }, (_, i) => toDateKey(new Date(y, m - 1, d - count + 1 + i)))
}

/** Places already used as origin (in) or destination (out), for the form's suggestions. */
export function partySuggestions(moves: StockMove[], type: 'in' | 'out') {
  return [...new Set(moves.filter((m) => m.type === type && m.party).map((m) => m.party))]
}

// ── Writes ───────────────────────────────────────────────────────────────

export const saveProduct = (product: StockProduct) => localDb.upsert<StockProduct>(STOCK_TABLES.products, product)
export const saveMove = (move: StockMove) => localDb.upsert<StockMove>(STOCK_TABLES.moves, move)

export function deleteMove(move: StockMove) {
  localDb.remove<StockMove>(STOCK_TABLES.moves, CLIENT_ID, (row) => row.id === move.id)
}

export function deleteProduct(product: StockProduct) {
  localDb.remove<StockMove>(STOCK_TABLES.moves, CLIENT_ID, (row) => row.productId === product.id)
  localDb.remove<StockProduct>(STOCK_TABLES.products, CLIENT_ID, (row) => row.id === product.id)
}

/** A recount: records the difference as an adjustment so the history explains the new number. */
export function adjustQuantity(scope: Scope, product: StockProduct, current: number, target: number, date: string) {
  const delta = round(target - current)
  if (delta === 0) return
  saveMove({
    id: newId('mov'),
    ...scope,
    productId: product.id,
    type: 'adjust',
    quantity: delta,
    date,
    description: '',
    party: '',
    createdAt: new Date().toISOString(),
  })
}
