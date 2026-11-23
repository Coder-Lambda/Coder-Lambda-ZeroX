import { t } from '../../i18n/pt-BR'
import { formatDateKey, formatMoney } from '../../lib/format'
import { formatQty } from './format'
import { useStockContext } from './StockContext'
import type { StockMove } from './types'

interface MoveRowProps {
  move: StockMove
  /** Off inside a product's own history, where the product is already known. */
  showProduct?: boolean
  showDate?: boolean
}

/** One received / sent / adjusted record; tap it to edit (adjustments can only be removed). */
export function MoveRow({ move, showProduct = true, showDate = true }: MoveRowProps) {
  const { data, open } = useStockContext()
  const product = data.products.find((p) => p.id === move.productId)
  const negative = move.type === 'out' || (move.type === 'adjust' && move.quantity < 0)
  const where =
    move.type === 'adjust'
      ? t.stock.product.adjustment
      : move.party
        ? (move.type === 'in' ? t.stock.moves.fromLabel : t.stock.moves.toLabel)(move.party)
        : ''
  const title = showProduct ? (product?.name ?? '—') : where || t.stock.moves.kind[move.type]
  const paid = move.price ? formatMoney(move.price) : null
  const sub = (showProduct ? [where, paid, move.description] : [paid, move.description]).filter(Boolean).join(' · ')

  return (
    <li>
      <button
        type="button"
        className="stock-move well tactile"
        onClick={() =>
          move.type === 'adjust' ? open({ type: 'adjustment', move }) : open({ type: 'move', moveType: move.type, move })
        }
      >
        {showDate && <span className="stock-move-date num">{formatDateKey(move.date, false)}</span>}
        <span className={`stock-move-kind is-${move.type}`}>{t.stock.moves.kind[move.type]}</span>
        <span className="person-main">
          <span className="person-name">{title}</span>
          {sub && <span className="person-sub">{sub}</span>}
        </span>
        <span className={`stock-move-qty num is-${move.type}`}>
          {negative ? '−' : '+'} {formatQty(Math.abs(move.quantity), product?.unit ?? 'un')}
        </span>
      </button>
    </li>
  )
}
