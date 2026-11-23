import { HandCoins, Plus, ReceiptText } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { useFinanceContext } from '../FinanceContext'
import { isOpen } from '../store'
import type { FinTitle } from '../types'
import { TitleRow } from './TitleRow'
import { Money, WidgetCard } from './WidgetCard'

/** A pagar / A receber: every open title, soonest due first. */
export function TitlesWidget({ kind }: { kind: FinTitle['kind'] }) {
  const { data, summary, open } = useFinanceContext()
  const openTitles = data.titles.filter((ti) => ti.kind === kind && isOpen(ti)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const overdue = kind === 'payable' ? summary.overduePayable : summary.overdueReceivable
  const payable = kind === 'payable'

  return (
    <WidgetCard
      icon={payable ? ReceiptText : HandCoins}
      title={payable ? t.finance.widgets.payable : t.finance.widgets.receivable}
      footer={
        <>
          <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'title', kind })}>
            <Plus />
            {payable ? t.finance.addPayable : t.finance.addReceivable}
          </button>
          <button type="button" className="btn btn-ghost tactile" onClick={() => open({ type: 'titles', kind })}>
            {t.finance.seeAll}
          </button>
        </>
      }
    >
      <Money value={payable ? summary.openPayable : summary.openReceivable} className="fin-value" />
      <p className="fin-sub">
        {t.finance.openTotal(openTitles.length)}
        {overdue > 0 && <span className="tag tag-inactive ml-2">{t.finance.overdue(overdue)}</span>}
      </p>
      {openTitles.length === 0 ? (
        <p className="fin-sub fin-muted">{t.finance.noOpen[kind]}</p>
      ) : (
        <ul className="fin-title-list">
          {openTitles.slice(0, 4).map((title) => (
            <TitleRow key={title.id} title={title} />
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
