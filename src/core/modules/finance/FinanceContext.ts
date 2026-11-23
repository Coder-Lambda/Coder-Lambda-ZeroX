import { createContext, useContext } from 'react'
import type { financeSummary } from './store'
import type { FinanceBook, FinanceData, FinEntry, FinTitle } from './types'

export type FinanceDialog =
  | { type: 'accounts'; hint?: boolean }
  | { type: 'entry'; entry?: FinEntry; entryType?: FinEntry['type'] }
  | { type: 'title'; title?: FinTitle; kind?: FinTitle['kind']; dueDate?: string }
  | { type: 'pay'; title: FinTitle }
  | { type: 'titles'; kind: FinTitle['kind'] }

export interface FinanceContextValue {
  book: FinanceBook
  data: FinanceData
  /** Selected month, 'YYYY-MM'. */
  month: string
  setMonth: (month: string) => void
  today: string
  summary: ReturnType<typeof financeSummary>
  open: (dialog: FinanceDialog) => void
}

export const FinanceContext = createContext<FinanceContextValue | null>(null)

export function useFinanceContext() {
  const value = useContext(FinanceContext)
  if (!value) throw new Error('useFinanceContext precisa estar dentro de <FinancePage>')
  return value
}
