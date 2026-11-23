import { useState, type FormEvent } from 'react'
import { CircleAlert, Trash2 } from 'lucide-react'
import { newId } from '../../data/localDb'
import { useScope } from '../../data/useTable'
import { t } from '../../i18n/pt-BR'
import { parseDecimal } from '../../lib/format'
import { haptic } from '../../lib/haptic'
import { ConfirmDialog } from '../../ui/Dialog'
import { TextInput } from '../../ui/TextInput'
import { toast } from '../../ui/Toaster'
import { formatQty, qtyInputValue } from './format'
import { useStockContext } from './StockContext'
import { deleteMove, findProduct, partySuggestions, saveMove, saveProduct } from './store'
import type { StockMove } from './types'

interface Props {
  type: 'in' | 'out'
  move?: StockMove
  productId?: string
  onDone: () => void
}

type Problem = 'product' | 'quantity' | 'notEnough' | null

/** Recebido (adds to stock) or Enviado (takes from stock). */
export function MoveForm({ type, move, productId, onDone }: Props) {
  const { data, qty, today } = useStockContext()
  const scope = useScope()
  const initialProduct = data.products.find((p) => p.id === (move?.productId ?? productId))
  const [productName, setProductName] = useState(initialProduct?.name ?? '')
  const [quantity, setQuantity] = useState(qtyInputValue(move?.quantity))
  const [date, setDate] = useState(move?.date ?? today)
  const [party, setParty] = useState(move?.party ?? '')
  const [description, setDescription] = useState(move?.description ?? '')
  const [problem, setProblem] = useState<Problem>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const product = findProduct(data.products, productName)
  const isNew = type === 'in' && productName.trim() !== '' && !product
  // When editing a send, its own quantity is already out of stock: give it back before checking.
  const available = product ? (qty.get(product.id) ?? 0) + (move && move.productId === product.id ? move.quantity : 0) : 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const amount = parseDecimal(quantity, 3)
    const found: Problem =
      !productName.trim() || (type === 'out' && !product)
        ? 'product'
        : !amount || amount <= 0
          ? 'quantity'
          : type === 'out' && amount > available
            ? 'notEnough'
            : null
    if (found) {
      setProblem(found)
      haptic('error')
      return
    }
    let target = product
    if (!target) {
      target = {
        id: newId('prd'),
        ...scope,
        name: productName.trim(),
        code: '',
        unit: 'un',
        initialQuantity: 0,
        minQuantity: null,
        createdAt: new Date().toISOString(),
      }
      saveProduct(target)
    }
    saveMove({
      id: move?.id ?? newId('mov'),
      ...scope,
      productId: target.id,
      type,
      quantity: amount as number,
      date: date || today,
      description: description.trim(),
      party: party.trim(),
      createdAt: move?.createdAt ?? new Date().toISOString(),
    })
    haptic('success')
    toast(t.stock.moves.saved)
    onDone()
  }

  const message =
    problem === 'product'
      ? t.stock.moves.unknownProduct
      : problem === 'quantity'
        ? t.stock.moves.quantityRequired
        : problem === 'notEnough' && product
          ? t.stock.moves.notEnough(formatQty(available, product.unit))
          : null

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field span-2">
        <label className="field-label" htmlFor="move-product">
          {t.stock.moves.product}
        </label>
        <input
          id="move-product"
          className="input"
          list="move-product-options"
          data-autofocus={!initialProduct || undefined}
          maxLength={80}
          placeholder={t.stock.moves.productPlaceholder}
          value={productName}
          aria-invalid={problem === 'product' || undefined}
          aria-describedby="move-error move-product-hint"
          onChange={(e) => {
            setProductName(e.target.value)
            setProblem(null)
          }}
        />
        <datalist id="move-product-options">
          {data.products.map((p) => (
            <option key={p.id} value={p.name}>
              {formatQty(qty.get(p.id) ?? 0, p.unit)}
            </option>
          ))}
        </datalist>
        <p id="move-product-hint" className="text-2 text-[12.5px]">
          {isNew ? t.stock.moves.newProductHint : product ? formatQty(qty.get(product.id) ?? 0, product.unit) : ' '}
        </p>
      </div>
      <TextInput
        id="move-quantity"
        label={product ? `${t.stock.moves.quantity} (${product.unit})` : t.stock.moves.quantity}
        value={quantity}
        onChange={(v) => {
          setQuantity(v)
          setProblem(null)
        }}
        inputMode="decimal"
        placeholder="0"
        autoFocus={Boolean(initialProduct)}
        invalid={problem === 'quantity' || problem === 'notEnough'}
        describedBy="move-error"
      />
      <TextInput id="move-date" label={t.stock.moves.date} value={date} onChange={setDate} type="date" />
      <div className="span-2">
        <TextInput
          id="move-party"
          label={type === 'in' ? t.stock.moves.from : t.stock.moves.to}
          value={party}
          onChange={setParty}
          placeholder={type === 'in' ? t.stock.moves.fromPlaceholder : t.stock.moves.toPlaceholder}
          list="move-party-options"
        />
        <datalist id="move-party-options">
          {partySuggestions(data.moves, type).map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>
      <div className="field span-2">
        <label className="field-label" htmlFor="move-description">
          {t.stock.moves.description}
        </label>
        <textarea
          id="move-description"
          className="input textarea"
          rows={2}
          maxLength={500}
          placeholder={t.stock.moves.descriptionPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <p id="move-error" className="field-error span-2" role="alert">
        {message && (
          <>
            <CircleAlert size={14} /> {message}
          </>
        )}
      </p>

      <div className="form-actions span-2">
        {move && (
          <button type="button" className="btn btn-ghost tactile mr-auto" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
            {t.common.delete}
          </button>
        )}
        <button type="button" className="btn btn-secondary tactile" onClick={onDone}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary tactile">
          {t.common.save}
        </button>
      </div>

      {move && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.stock.moves.deleteTitle}
          message={t.stock.moves.deleteMessage}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            deleteMove(move)
            toast(t.stock.moves.deleted)
            onDone()
          }}
        />
      )}
    </form>
  )
}
