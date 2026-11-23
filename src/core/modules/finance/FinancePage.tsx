import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHead } from '../../layout/PageHead'
import { todayKey } from '../../lib/format'
import { MonthSwitch } from '../../ui/MonthSwitch'
import { FinanceCharts } from './charts/FinanceCharts'
import { FinanceContext, type FinanceContextValue, type FinanceDialog } from './FinanceContext'
import { FinanceDialogs } from './forms/FinanceDialogs'
import { isMonthKey } from '../../lib/month'
import { MovementsList } from './MovementsList'
import { financeSummary, useFinance } from './store'
import type { FinanceBook } from './types'
import { AccountsWidget } from './widgets/AccountsWidget'
import { CalendarWidget } from './widgets/CalendarWidget'
import { FlowWidget } from './widgets/FlowWidget'
import { TitlesWidget } from './widgets/TitlesWidget'
import './finance.css'

interface Props {
  book: FinanceBook
  title: string
  sub: string
}

/** 6 medium widgets, a chart carousel (up to 3 charts) and the month's movements, all scoped by one month. */
export function FinancePage({ book, title, sub }: Props) {
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
    const open = (next: FinanceDialog) =>
      setDialog((next.type === 'entry' || next.type === 'pay') && data.accounts.length === 0 ? { type: 'accounts', hint: true } : next)
    return { book, data, month, setMonth, today, summary: financeSummary(data, month, today), open }
  }, [book, data, month, today, currentMonth, setParams])

  return (
    <FinanceContext.Provider value={value}>
      <PageHead
        title={title}
        sub={sub}
        aside={<MonthSwitch value={month} onChange={value.setMonth} currentMonth={currentMonth} />}
      />

      <div className="fin-widgets">
        <AccountsWidget />
        <FlowWidget type="in" />
        <FlowWidget type="out" />
        <CalendarWidget />
        <TitlesWidget kind="payable" />
        <TitlesWidget kind="receivable" />
      </div>

      <FinanceCharts />
      <MovementsList />

      <FinanceDialogs dialog={dialog} onClose={() => setDialog(null)} />
    </FinanceContext.Provider>
  )
}
