import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { todayKey } from '../../lib/format'
import { isMonthKey } from '../../lib/month'
import type { FinanceContextValue, FinanceDialog } from './FinanceContext'
import { financeSummary, useFinance } from './store'
import type { FinanceBook } from './types'

/** Data, the selected month (kept in the URL as ?mes=) and the open dialog for one finance book. */
export function useFinanceController(book: FinanceBook) {
  const data = useFinance(book)
  const today = todayKey()
  const currentMonth = today.slice(0, 7)
  const [params, setParams] = useSearchParams()
  const requested = params.get('mes')
  const month = isMonthKey(requested) ? requested : currentMonth
  const [dialog, setDialog] = useState<FinanceDialog | null>(null)

  const value = useMemo<FinanceContextValue>(() => {
    const setMonth = (next: string) => {
      const search = new URLSearchParams(window.location.search)
      if (next === currentMonth) search.delete('mes')
      else search.set('mes', next)
      setParams(search, { replace: true })
    }
    // Money always moves through an account: ask for one first.
    const open = (next: FinanceDialog, options?: { accountReady?: boolean }) =>
      setDialog(
        (next.type === 'entry' || next.type === 'pay') && data.accounts.length === 0 && !options?.accountReady
          ? { type: 'accounts', hint: true, then: next }
          : next,
      )
    return { book, data, month, setMonth, today, summary: financeSummary(data, month, today), open }
  }, [book, data, month, today, currentMonth, setParams])

  return { value, dialog, closeDialog: () => setDialog(null), currentMonth }
}
