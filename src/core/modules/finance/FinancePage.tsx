import { PageHead } from '../../layout/PageHead'
import { MonthSwitch } from '../../ui/MonthSwitch'
import { FinanceCharts } from './charts/FinanceCharts'
import { FinanceContext } from './FinanceContext'
import { FinanceDialogs } from './forms/FinanceDialogs'
import { MovementsList } from './MovementsList'
import type { FinanceBook } from './types'
import { useFinanceController } from './useFinanceController'
import { AccountsWidget } from './widgets/AccountsWidget'
import { CalendarWidget } from './widgets/CalendarWidget'
import { FlowWidget } from './widgets/FlowWidget'
import { TitlesWidget } from './widgets/TitlesWidget'
import './finance.css'
import { WidgetStrip } from '../../widgets/WidgetGrid'

interface Props {
  book: FinanceBook
  title: string
  sub: string
}

/** 6 medium widgets, a chart carousel (up to 3 charts) and the month's movements, all scoped by one month. */
export function FinancePage({ book, title, sub }: Props) {
  const { value, dialog, closeDialog, currentMonth } = useFinanceController(book)

  return (
    <FinanceContext.Provider value={value}>
      <PageHead
        title={title}
        sub={sub}
        aside={<MonthSwitch value={value.month} onChange={value.setMonth} currentMonth={currentMonth} />}
      />

      {/* Personal finance strip; business finance shows its own above its navbar parts. */}
      {book === 'personal' && <WidgetStrip place="personalFinance" />}

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

      <FinanceDialogs dialog={dialog} onClose={closeDialog} />
    </FinanceContext.Provider>
  )
}
