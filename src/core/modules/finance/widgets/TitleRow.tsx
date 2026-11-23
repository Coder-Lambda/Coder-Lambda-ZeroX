import { t } from '../../../i18n/pt-BR'
import { formatDateKey, formatMoney } from '../../../lib/format'
import { useFinanceContext } from '../FinanceContext'
import { isOverdue } from '../store'
import type { FinTitle } from '../types'

/** One bill in a list: name, due label, amount, and the pay/receive button while open. */
export function TitleRow({ title, showKind = false }: { title: FinTitle; showKind?: boolean }) {
  const { today, open } = useFinanceContext()
  const overdue = isOverdue(title, today)
  const settled = title.paidOn !== null

  return (
    <li className={`fin-title-row${settled ? ' is-settled' : ''}`}>
      <button type="button" className="fin-title-main" onClick={() => open({ type: 'title', title })}>
        <span className="fin-mini-name">{title.description}</span>
        <span className="fin-title-meta">
          {showKind && <span className={`tag tag-${title.kind}`}>{t.finance.title.kind[title.kind]}</span>}
          {settled ? (
            <span className="text-2">
              {(title.kind === 'payable' ? t.finance.title.paidOn : t.finance.title.receivedOn)(formatDateKey(title.paidOn, false))}
            </span>
          ) : overdue ? (
            <span className="tag tag-inactive">{t.finance.overdueTag}</span>
          ) : title.dueDate === today ? (
            <span className="tag tag-vacation">{t.finance.todayTag}</span>
          ) : (
            <span className="text-2 num">{t.finance.title.dueOn(formatDateKey(title.dueDate, false))}</span>
          )}
        </span>
      </button>
      <span className="num fin-title-amount">{formatMoney(title.amount)}</span>
      {!settled && (
        <button type="button" className="chip tactile" onClick={() => open({ type: 'pay', title })}>
          {title.kind === 'payable' ? t.finance.payAction : t.finance.receiveAction}
        </button>
      )}
    </li>
  )
}
