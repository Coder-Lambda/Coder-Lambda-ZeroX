import { createContext, useContext } from 'react'
import type { financeSummary } from './store'
import type { FinanceBook, FinanceData, FinCategory, FinEntry, FinTitle } from './types'

export type FinanceDialog =
  /** `then`: what the client was opening when it found there is no account yet; it continues after one is added. */
  | { type: 'accounts'; hint?: boolean; then?: FinanceDialog }
  | { type: 'entry'; entry?: FinEntry; entryType?: FinEntry['type']; preset?: Partial<FinEntry> }
  | { type: 'title'; title?: FinTitle; kind?: FinTitle['kind']; dueDate?: string }
  | { type: 'pay'; title: FinTitle }
  | { type: 'titles'; kind: FinTitle['kind'] }
  | { type: 'label'; labelType: FinCategory['type']; label?: FinCategory }

export interface FinanceContextValue {
  book: FinanceBook
  data: FinanceData
  /** Selected month, 'YYYY-MM'. */
  month: string
  setMonth: (month: string) => void
  today: string
  summary: ReturnType<typeof financeSummary>
  /** `accountReady`: an account was just added, skip the "add an account first" check. */
  open: (dialog: FinanceDialog, options?: { accountReady?: boolean }) => void
}

export const FinanceContext = createContext<FinanceContextValue | null>(null)

export function useFinanceContext() {
  const value = useContext(FinanceContext)
  if (!value) throw new Error('useFinanceContext precisa estar dentro de <FinancePage>')
  return value
}
