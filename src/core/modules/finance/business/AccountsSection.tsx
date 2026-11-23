import { t } from '../../../i18n/pt-BR'
import { formatMoney } from '../../../lib/format'
import { StatTile } from '../../../ui/StatTile'
import { useFinanceContext } from '../FinanceContext'
import { AccountsPanel } from '../forms/AccountsPanel'

/** Part 1: the company's bank accounts. */
export function AccountsSection() {
  const { summary } = useFinanceContext()

  return (
    <div className="module-body">
      <div className="stat-row stat-row-3">
        <StatTile value={formatMoney(summary.balance)} label={t.business.accounts.total} />
        <StatTile value={formatMoney(summary.incomes)} label={t.business.accounts.monthIn} />
        <StatTile value={formatMoney(summary.outcomes)} label={t.business.accounts.monthOut} />
      </div>
      <section className="glass card" aria-label={t.business.tabs.accounts}>
        <h2 className="card-title">{t.business.tabs.accounts}</h2>
        <AccountsPanel />
      </section>
    </div>
  )
}
