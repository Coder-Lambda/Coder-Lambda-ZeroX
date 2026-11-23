import { useState } from 'react'
import { t } from '../../i18n/pt-BR'
import { formatDateKey, formatMoney } from '../../lib/format'
import { useFinanceContext } from './FinanceContext'
import { monthLabel } from '../../lib/month'
import type { FinEntry } from './types'

type Filter = 'all' | FinEntry['type']

/** Every entry of the selected month; tap one to edit or delete it. */
export function MovementsList() {
  const { data, month, open } = useFinanceContext()
  const [filter, setFilter] = useState<Filter>('all')
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]))
  const rows = data.entries
    .filter((e) => e.date.startsWith(month) && (filter === 'all' || e.type === filter))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  return (
    <section className="glass card fin-movements" aria-label={t.finance.movements.title}>
      <div className="section-head">
        <h2 className="card-title mb-0">
          {t.finance.movements.title} · {monthLabel(month)}
        </h2>
        <div className="ob-chips" role="group" aria-label={t.finance.movements.title}>
          {(['all', 'in', 'out'] as const).map((f) => (
            <button key={f} type="button" className="chip tactile" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {t.finance.movements.filters[f]}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="empty-state">{t.finance.movements.empty}</p>
      ) : (
        <ul className="people-list">
          {rows.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="fin-movement well tactile" onClick={() => open({ type: 'entry', entry })}>
                <span className="fin-movement-date num">{formatDateKey(entry.date, false)}</span>
                <span className="fin-movement-main">
                  <span className="fin-mini-name">{entry.description || entry.category || '—'}</span>
                  <span className="person-sub">
                    {[entry.category, accountName.get(entry.accountId), entry.titleId ? t.finance.movements.paymentOf : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className={`fin-movement-amount num is-${entry.type}`}>
                  {entry.type === 'in' ? '+' : '−'} {formatMoney(entry.amount)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
