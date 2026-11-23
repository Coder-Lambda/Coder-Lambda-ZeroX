import type { BusinessRow } from '../../data/useTable'

/** Personal finance now; business finance (&businessfinance&) reuses the same tables with book 'business'. */
export type FinanceBook = 'personal' | 'business'

export interface FinAccount extends BusinessRow {
  book: FinanceBook
  name: string
  /** Money already in the account when it was registered. Can be negative. */
  initialBalance: number
  createdAt: string
}

export interface FinEntry extends BusinessRow {
  book: FinanceBook
  accountId: string
  type: 'in' | 'out'
  /** Always positive; `type` gives the sign. */
  amount: number
  /** YYYY-MM-DD */
  date: string
  description: string
  category: string
  /** Set when this entry is the payment of a title. */
  titleId: string | null
  /** Where the money came from or went to (business book). */
  party?: string
  /** What generated the expense, when it wasn't typed freely: the payroll or a stock purchase. */
  source?: 'payroll' | 'stock' | null
  /** Payroll: the month 'YYYY-MM'. Stock: the stock receipt id. */
  sourceRef?: string | null
  createdAt: string
}

/** An income or expense label of the business, with what it is and where it comes from. */
export interface FinCategory extends BusinessRow {
  book: FinanceBook
  type: 'in' | 'out'
  name: string
  description: string
  origin: string
  createdAt: string
}

/** A bill to pay later or money to receive later. */
export interface FinTitle extends BusinessRow {
  book: FinanceBook
  kind: 'payable' | 'receivable'
  description: string
  amount: number
  /** YYYY-MM-DD */
  dueDate: string
  category: string
  /** YYYY-MM-DD when paid/received; null while open. */
  paidOn: string | null
  /** The entry created by the payment. */
  entryId: string | null
  createdAt: string
}

export interface FinanceData {
  accounts: FinAccount[]
  entries: FinEntry[]
  titles: FinTitle[]
  categories: FinCategory[]
}
