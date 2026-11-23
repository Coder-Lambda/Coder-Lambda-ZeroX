import { useMemo, useState } from 'react'
import { PackageMinus, PackagePlus, Search } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { formatDateKey, normalize } from '../../lib/format'
import { MonthSwitch } from '../../ui/MonthSwitch'
import { StatTile } from '../../ui/StatTile'
import { MoveRow } from './MoveRow'
import { useStockContext } from './StockContext'

/** Recebidos or Enviados of a month, grouped by day, newest first. */
export function MovesList({ type }: { type: 'in' | 'out' }) {
  const { data, today, open } = useStockContext()
  const currentMonth = today.slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [query, setQuery] = useState('')
  const names = useMemo(() => new Map(data.products.map((p) => [p.id, p.name])), [data.products])

  const inMonth = data.moves.filter((m) => m.type === type && m.date.startsWith(month))
  const q = normalize(query)
  const rows = inMonth
    .filter((m) => !q || normalize(`${names.get(m.productId) ?? ''} ${m.party} ${m.description}`).includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const byDay = new Map<string, typeof rows>()
  rows.forEach((m) => byDay.set(m.date, [...(byDay.get(m.date) ?? []), m]))

  const Icon = type === 'in' ? PackagePlus : PackageMinus

  return (
    <div className="module-body">
      <div className="stock-filters">
        <MonthSwitch value={month} onChange={setMonth} currentMonth={currentMonth} />
      </div>
      <div className="stat-row stat-row-2">
        <StatTile value={inMonth.length} label={type === 'in' ? t.stock.moves.statsIn : t.stock.moves.statsOut} />
        <StatTile value={new Set(inMonth.map((m) => m.productId)).size} label={t.stock.moves.statsProducts} />
      </div>

      <section className="glass card" aria-label={type === 'in' ? t.stock.moves.receivedTitle : t.stock.moves.sentTitle}>
        <div className="list-toolbar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder={t.stock.moves.searchPlaceholder}
              aria-label={t.stock.moves.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {rows.length === 0 ? (
          <div className="empty-state flex flex-col items-center gap-3">
            <span>{t.stock.moves.empty[type]}</span>
            <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'move', moveType: type })}>
              <Icon />
              {type === 'in' ? t.stock.add.received : t.stock.add.sent}
            </button>
          </div>
        ) : (
          [...byDay].map(([day, moves]) => (
            <section key={day} aria-label={formatDateKey(day)}>
              <h3 className="people-letter num">{formatDateKey(day)}</h3>
              <ul className="people-list">
                {moves.map((move) => (
                  <MoveRow key={move.id} move={move} showDate={false} />
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </div>
  )
}
