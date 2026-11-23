import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { t } from '../../../i18n/pt-BR'
import { PageHead } from '../../../layout/PageHead'
import { MonthSwitch } from '../../../ui/MonthSwitch'
import { FinanceContext } from '../FinanceContext'
import { FinanceDialogs } from '../forms/FinanceDialogs'
import { useFinanceController } from '../useFinanceController'
import { AccountsSection } from './AccountsSection'
import { IncomeExpenses } from './IncomeExpenses'
import '../finance.css'
import './business.css'

const BASE = '/financas-empresa'
const TABS = [
  { id: 'accounts', path: 'contas', n: 1 },
  { id: 'flows', path: 'receitas-despesas', n: 2 },
] as const

/** Finanças da empresa: the same engine as personal finance, on the 'business' book, split into parts. */
export default function BusinessFinanceModule() {
  const { value, dialog, closeDialog, currentMonth } = useFinanceController('business')
  const { search } = useLocation()

  return (
    <FinanceContext.Provider value={value}>
      <PageHead
        title={t.modules.businessFinance.label}
        sub={t.modules.businessFinance.description}
        aside={<MonthSwitch value={value.month} onChange={value.setMonth} currentMonth={currentMonth} />}
      />

      <div className="module-nav glass">
        <nav className="module-tabs" aria-label={t.modules.businessFinance.label}>
          {TABS.map((tab) => (
            // Keep ?mes= so switching parts stays on the same month.
            <NavLink key={tab.id} to={`${BASE}/${tab.path}${search}`} className="module-tab tactile">
              <span className="biz-step" aria-hidden="true">
                {tab.n}
              </span>
              {t.business.tabs[tab.id]}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route index element={<Navigate to={`contas${search}`} replace />} />
        <Route path="contas" element={<AccountsSection />} />
        <Route path="receitas-despesas" element={<IncomeExpenses />} />
        <Route path="*" element={<Navigate to="contas" replace />} />
      </Routes>

      <FinanceDialogs dialog={dialog} onClose={closeDialog} />
    </FinanceContext.Provider>
  )
}
