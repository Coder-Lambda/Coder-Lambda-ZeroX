import { useMemo } from 'react'
import { CLIENT_ID } from '../../config/clientRegistry'
import { localDb, newId } from '../../data/localDb'
import { useTable } from '../../data/useTable'
import { t } from '../../i18n/pt-BR'
import { addMonths, dayKey, daysInMonth } from '../../lib/month'
import { normalize } from '../../lib/format'
import type { FinAccount, FinanceBook, FinanceData, FinCategory, FinEntry, FinTitle } from './types'

export const FIN_TABLES = {
  accounts: 'fin_accounts',
  entries: 'fin_entries',
  titles: 'fin_titles',
  categories: 'fin_categories',
} as const

type Scope = { tenant_id: string; business_id: string }

export function useFinance(book: FinanceBook): FinanceData {
  const accounts = useTable<FinAccount>(FIN_TABLES.accounts)
  const entries = useTable<FinEntry>(FIN_TABLES.entries)
  const titles = useTable<FinTitle>(FIN_TABLES.titles)
  const categories = useTable<FinCategory>(FIN_TABLES.categories)
  return useMemo(
    () => ({
      accounts: accounts.filter((a) => a.book === book),
      entries: entries.filter((e) => e.book === book),
      titles: titles.filter((ti) => ti.book === book),
      categories: categories.filter((c) => c.book === book),
    }),
    [accounts, entries, titles, categories, book],
  )
}

const signed = (entry: FinEntry) => (entry.type === 'in' ? entry.amount : -entry.amount)
const titleSign = (title: FinTitle) => (title.kind === 'receivable' ? title.amount : -title.amount)
const round = (value: number) => Math.round(value * 100) / 100

/** Balance at the end of `day`, for one account or all of them. */
export function balanceAt(data: FinanceData, day: string, accountId?: string) {
  const accounts = accountId ? data.accounts.filter((a) => a.id === accountId) : data.accounts
  const ids = new Set(accounts.map((a) => a.id))
  const initial = accounts.reduce((sum, a) => sum + a.initialBalance, 0)
  const moved = data.entries.filter((e) => ids.has(e.accountId) && e.date <= day).reduce((sum, e) => sum + signed(e), 0)
  return round(initial + moved)
}

export const isOpen = (title: FinTitle) => title.paidOn === null
export const isOverdue = (title: FinTitle, today: string) => isOpen(title) && title.dueDate < today

/** What the balance will be on `day` if every open title is settled on its due date. */
function projectedAt(data: FinanceData, day: string) {
  const open = data.titles.filter((ti) => isOpen(ti) && ti.dueDate <= day).reduce((sum, ti) => sum + titleSign(ti), 0)
  return round(balanceAt(data, day) + open)
}

export function monthTotals(entries: FinEntry[], month: string) {
  const inMonth = entries.filter((e) => e.date.startsWith(month))
  const sum = (type: FinEntry['type']) => round(inMonth.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0))
  return {
    incomes: sum('in'),
    outcomes: sum('out'),
    incomeCount: inMonth.filter((e) => e.type === 'in').length,
    outcomeCount: inMonth.filter((e) => e.type === 'out').length,
  }
}

/** The numbers &maindashboard& reads for this book. */
export function financeSummary(data: FinanceData, month: string, today: string) {
  const open = data.titles.filter(isOpen)
  const sum = (titles: FinTitle[]) => round(titles.reduce((s, ti) => s + ti.amount, 0))
  const payable = open.filter((ti) => ti.kind === 'payable')
  const receivable = open.filter((ti) => ti.kind === 'receivable')
  const monthEnd = dayKey(month, daysInMonth(month))
  const monthIsPast = monthEnd < today
  return {
    balance: balanceAt(data, today),
    monthIsPast,
    /** Past month: the real closing balance. Current/future month: expected if open titles are settled on time. */
    monthEndBalance: monthIsPast ? balanceAt(data, monthEnd) : projectedAt(data, monthEnd),
    ...monthTotals(data.entries, month),
    openPayable: sum(payable),
    openReceivable: sum(receivable),
    overduePayable: payable.filter((ti) => ti.dueDate < today).length,
    overdueReceivable: receivable.filter((ti) => ti.dueDate < today).length,
  }
}

/** Day-by-day balance for a month: what happened (up to today) and what's expected (from today on). */
export function balanceSeries(data: FinanceData, month: string, today: string) {
  const days = Array.from({ length: daysInMonth(month) }, (_, i) => dayKey(month, i + 1))
  return {
    days,
    actual: days.map((d) => (d <= today ? balanceAt(data, d) : null)),
    projected: days.map((d) => (d >= today ? projectedAt(data, d) : null)),
  }
}

export function monthlyFlows(entries: FinEntry[], lastMonth: string, count = 6) {
  const months = Array.from({ length: count }, (_, i) => addMonths(lastMonth, i - count + 1))
  const totals = months.map((m) => monthTotals(entries, m))
  return { months, incomes: totals.map((x) => x.incomes), outcomes: totals.map((x) => x.outcomes) }
}

/** Outflows of the month by category, largest first; the tail past `top` folds into "Outras". */
export function categoryBreakdown(entries: FinEntry[], month: string, top = 7) {
  const byCategory = new Map<string, number>()
  entries
    .filter((e) => e.type === 'out' && e.date.startsWith(month))
    .forEach((e) => {
      const key = e.category || t.finance.charts.uncategorized
      byCategory.set(key, (byCategory.get(key) ?? 0) + e.amount)
    })
  const ranked = [...byCategory].map(([label, value]) => ({ label, value: round(value) })).sort((a, b) => b.value - a.value)
  if (ranked.length <= top) return ranked
  const rest = ranked.slice(top - 1).reduce((s, r) => s + r.value, 0)
  return [...ranked.slice(0, top - 1), { label: t.finance.charts.others, value: round(rest) }]
}

/** Categories offered in the form: the book's labels, personal defaults, and everything already used for that type. */
export function categorySuggestions(data: FinanceData, type: FinEntry['type'], book: FinanceBook) {
  const labels = data.categories.filter((c) => c.type === type).map((c) => c.name)
  const used = [
    ...data.entries.filter((e) => e.type === type).map((e) => e.category),
    ...data.titles.filter((ti) => (ti.kind === 'receivable' ? 'in' : 'out') === type).map((ti) => ti.category),
  ]
  const defaults = book === 'personal' ? t.finance.categories[type] : []
  return [...new Set([...labels, ...defaults, ...used].filter(Boolean))]
}

/** Month total per category name (case/accent-insensitive), for one entry type. */
export function categoryTotals(entries: FinEntry[], month: string, type: FinEntry['type']) {
  const totals = new Map<string, number>()
  entries
    .filter((e) => e.type === type && e.date.startsWith(month))
    .forEach((e) => {
      const key = normalize(e.category)
      totals.set(key, round((totals.get(key) ?? 0) + e.amount))
    })
  return totals
}

// ── Writes ───────────────────────────────────────────────────────────────

export const saveAccount = (account: FinAccount) => localDb.upsert<FinAccount>(FIN_TABLES.accounts, account)
export const saveEntry = (entry: FinEntry) => localDb.upsert<FinEntry>(FIN_TABLES.entries, entry)
export const saveTitle = (title: FinTitle) => localDb.upsert<FinTitle>(FIN_TABLES.titles, title)

export function deleteAccount(account: FinAccount) {
  localDb.remove<FinAccount>(FIN_TABLES.accounts, CLIENT_ID, (row) => row.id === account.id)
}

/** Saves a label; a rename carries over to the entries filed under the old name, so their totals follow. */
export function saveCategory(category: FinCategory, previousName?: string) {
  localDb.upsert<FinCategory>(FIN_TABLES.categories, category)
  if (!previousName || normalize(previousName) === normalize(category.name)) return
  localDb
    .list<FinEntry>(FIN_TABLES.entries, CLIENT_ID, (e) =>
      e.business_id === category.business_id &&
      e.book === category.book &&
      e.type === category.type &&
      normalize(e.category) === normalize(previousName),
    )
    .forEach((e) => saveEntry({ ...e, category: category.name }))
}

/** Removes the label only; entries keep their category text. */
export function deleteCategory(category: FinCategory) {
  localDb.remove<FinCategory>(FIN_TABLES.categories, CLIENT_ID, (row) => row.id === category.id)
}

/** Deleting a title's payment entry reopens the title. */
export function deleteEntry(entry: FinEntry) {
  localDb.remove<FinEntry>(FIN_TABLES.entries, CLIENT_ID, (row) => row.id === entry.id)
  if (entry.titleId) {
    const title = localDb.get<FinTitle>(FIN_TABLES.titles, CLIENT_ID, entry.titleId)
    if (title) saveTitle({ ...title, paidOn: null, entryId: null })
  }
}

export function deleteTitle(title: FinTitle) {
  if (title.entryId) localDb.remove<FinEntry>(FIN_TABLES.entries, CLIENT_ID, (row) => row.id === title.entryId)
  localDb.remove<FinTitle>(FIN_TABLES.titles, CLIENT_ID, (row) => row.id === title.id)
}

/** Settles a title: records the money moving in the chosen account and marks the title paid. */
export function payTitle(scope: Scope, title: FinTitle, payment: { accountId: string; date: string; amount: number }) {
  const entryId = newId('ent')
  saveEntry({
    id: entryId,
    ...scope,
    book: title.book,
    accountId: payment.accountId,
    type: title.kind === 'receivable' ? 'in' : 'out',
    amount: payment.amount,
    date: payment.date,
    description: title.description,
    category: title.category,
    titleId: title.id,
    createdAt: new Date().toISOString(),
  })
  saveTitle({ ...title, paidOn: payment.date, entryId })
}

export function undoPayment(title: FinTitle) {
  if (title.entryId) localDb.remove<FinEntry>(FIN_TABLES.entries, CLIENT_ID, (row) => row.id === title.entryId)
  saveTitle({ ...title, paidOn: null, entryId: null })
}
