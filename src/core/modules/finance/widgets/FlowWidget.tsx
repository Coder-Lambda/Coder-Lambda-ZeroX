import { ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey } from '../../../lib/format'
import { useFinanceContext } from '../FinanceContext'
import { monthTotals } from '../store'
import type { FinEntry } from '../types'
import { Money, WidgetCard } from './WidgetCard'

/** Entradas or Saídas of the selected month. */
export function FlowWidget({ type }: { type: FinEntry['type'] }) {
  const { data, month, open } = useFinanceContext()
  const totals = monthTotals(data.entries, month)
  const isIn = type === 'in'
  const recent = data.entries
    .filter((e) => e.type === type && e.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3)

  return (
    <WidgetCard
      icon={isIn ? ArrowDownLeft : ArrowUpRight}
      title={isIn ? t.finance.widgets.incomes : t.finance.widgets.outcomes}
      seriesColor={isIn ? 'var(--series-1)' : 'var(--series-2)'}
      footer={
        <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'entry', entryType: type })}>
          <Plus />
          {isIn ? t.finance.addIncome : t.finance.addOutcome}
        </button>
      }
    >
      <Money value={isIn ? totals.incomes : totals.outcomes} className="fin-value" />
      <p className="fin-sub">{t.finance.entriesCount(isIn ? totals.incomeCount : totals.outcomeCount)}</p>
      {recent.length === 0 ? (
        <p className="fin-sub fin-muted">{t.finance.nothingThisMonth}</p>
      ) : (
        <ul className="fin-mini-list">
          {recent.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="fin-mini-button" onClick={() => open({ type: 'entry', entry })}>
                <span className="fin-mini-name">{entry.description || entry.category}</span>
                <span className="fin-mini-date num">{formatDateKey(entry.date, false)}</span>
                <span className="num">{entry.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
