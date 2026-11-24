import type { Employee } from '../../collaborators/types'
import type { StockMove } from '../../stock/types'
import { balanceAt, monthTotals } from '../store'
import type { FinanceData, FinEntry } from '../types'
import { payroll, type PayrollRules } from './payroll'

const round = (value: number) => Math.round(value * 100) / 100
const sum = (entries: FinEntry[]) => round(entries.reduce((s, e) => s + e.amount, 0))

/** Stock receipts of the month that carry a paid price, with whether finance already paid each one. */
export function stockPurchases(data: FinanceData, stockMoves: StockMove[], month: string) {
  return stockMoves
    .filter((m) => m.type === 'in' && (m.price ?? 0) > 0 && m.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((move) => ({
      move,
      payment: data.entries.find((e) => e.source === 'stock' && e.sourceRef === move.id) ?? null,
    }))
}

/**
 * The numbers &maindashboard& reads for the business: cash in and out, payroll and stock costs.
 * With `payrollRules`, the expected payroll follows the rule book (special values and absence discounts).
 */
export function businessSummary(
  data: FinanceData,
  month: string,
  today: string,
  employees: Employee[],
  stockMoves: StockMove[],
  payrollRules?: PayrollRules,
) {
  const onList = employees.filter((e) => e.status !== 'inactive')
  const payrollExpected = payroll(employees, month, payrollRules).total
  const payrollPaid = sum(data.entries.filter((e) => e.source === 'payroll' && e.sourceRef === month))
  const purchases = stockPurchases(data, stockMoves, month)
  const totals = monthTotals(data.entries, month)
  return {
    balance: balanceAt(data, today),
    revenue: totals.incomes,
    expenses: totals.outcomes,
    result: round(totals.incomes - totals.outcomes),
    employees: onList.length,
    payrollExpected,
    payrollPaid,
    stockBought: round(purchases.reduce((s, p) => s + (p.move.price ?? 0), 0)),
    stockPaid: round(purchases.reduce((s, p) => s + (p.payment?.amount ?? 0), 0)),
  }
}
