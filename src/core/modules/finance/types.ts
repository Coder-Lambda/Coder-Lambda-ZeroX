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
}
