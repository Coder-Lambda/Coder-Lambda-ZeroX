import { useState } from 'react'
import { Plus } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { useFinanceContext } from '../FinanceContext'
import { isOpen } from '../store'
import type { FinTitle } from '../types'
import { TitleRow } from '../widgets/TitleRow'

type Filter = 'open' | 'settled' | 'all'

/** Every title of one kind: open ones by due date, settled ones most recent first. */
export function TitlesList({ kind }: { kind: FinTitle['kind'] }) {
  const { data, open } = useFinanceContext()
  const [filter, setFilter] = useState<Filter>('open')
  const titles = data.titles
    .filter((ti) => ti.kind === kind)
    .filter((ti) => filter === 'all' || (filter === 'open') === isOpen(ti))
    .sort((a, b) => (isOpen(a) === isOpen(b) ? a.dueDate.localeCompare(b.dueDate) : isOpen(a) ? -1 : 1))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['open', 'settled', 'all'] as const).map((f) => (
          <button key={f} type="button" className="chip tactile" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {t.finance.title.filters[f]}
          </button>
        ))}
        <button type="button" className="btn btn-secondary tactile ml-auto" onClick={() => open({ type: 'title', kind })}>
          <Plus />
          {kind === 'payable' ? t.finance.addPayable : t.finance.addReceivable}
        </button>
      </div>
      {titles.length === 0 ? (
        <p className="empty-state">{t.finance.title.emptyList}</p>
      ) : (
        <ul className="fin-title-list">
          {titles.map((title) => (
            <TitleRow key={title.id} title={title} />
          ))}
        </ul>
      )}
    </div>
  )
}
