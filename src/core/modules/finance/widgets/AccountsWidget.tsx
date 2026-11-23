import { Landmark, Plus, Settings2 } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { compareNames, formatMoney } from '../../../lib/format'
import { useFinanceContext } from '../FinanceContext'
import { balanceAt } from '../store'
import { Money, WidgetCard } from './WidgetCard'

export function AccountsWidget() {
  const { data, summary, today, open } = useFinanceContext()
  const accounts = [...data.accounts].sort((a, b) => compareNames(a.name, b.name))
  const openAccounts = () => open({ type: 'accounts' })

  if (accounts.length === 0) {
    return (
      <WidgetCard icon={Landmark} title={t.finance.widgets.accounts}>
        <p className="fin-empty-title">{t.finance.noAccountsTitle}</p>
        <p className="fin-sub">{t.finance.noAccountsSub}</p>
        <div>
          <button type="button" className="btn btn-primary tactile" onClick={openAccounts}>
            <Plus />
            {t.finance.accounts.add}
          </button>
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard
      icon={Landmark}
      title={t.finance.widgets.accounts}
      action={
        <button type="button" className="btn btn-icon btn-ghost tactile" aria-label={t.finance.manageAccounts} onClick={openAccounts}>
          <Settings2 />
        </button>
      }
      footer={
        <button type="button" className="btn btn-secondary tactile" onClick={openAccounts}>
          {t.finance.manageAccounts}
        </button>
      }
    >
      <p className="fin-label">{t.finance.balanceLabel}</p>
      <Money value={summary.balance} className="fin-value" />
      <p className="fin-sub">
        {(summary.monthIsPast ? t.finance.monthEndActual : t.finance.monthEndProjected)(formatMoney(summary.monthEndBalance))}
      </p>
      <ul className="fin-mini-list">
        {accounts.slice(0, 3).map((account) => (
          <li key={account.id}>
            <span className="fin-mini-name">{account.name}</span>
            <Money value={balanceAt(data, today, account.id)} className="num" />
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
