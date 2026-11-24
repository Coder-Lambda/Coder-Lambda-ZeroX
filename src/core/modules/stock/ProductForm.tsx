import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, Trash2 } from 'lucide-react'
import { newId } from '../../data/localDb'
import { useScope } from '../../data/useTable'
import { t } from '../../i18n/pt-BR'
import { moneyInputValue, parseDecimal, parseMoney } from '../../lib/format'
import { useRules } from '../../rules/useRules'
import { haptic } from '../../lib/haptic'
import { ConfirmDialog } from '../../ui/Dialog'
import { TextInput } from '../../ui/TextInput'
import { toast } from '../../ui/Toaster'
import { qtyInputValue, unitOptions } from './format'
import { useStockContext } from './StockContext'
import { adjustQuantity, deleteProduct, findProduct, saveProduct } from './store'
import type { StockProduct } from './types'

type Problem = 'name' | 'taken' | 'quantity' | 'price' | null

export function ProductForm({ product, onDone }: { product?: StockProduct; onDone: () => void }) {
  const { data, qty, today } = useStockContext()
  const scope = useScope()
  const navigate = useNavigate()
  const current = product ? (qty.get(product.id) ?? 0) : 0
  const [name, setName] = useState(product?.name ?? '')
  const [code, setCode] = useState(product?.code ?? '')
  const rules = useRules().rules.stock
  const [unit, setUnit] = useState<string>(product?.unit ?? 'un')
  const [price, setPrice] = useState(moneyInputValue(product?.unitPrice))
  const [extra, setExtra] = useState<Record<string, string>>(product?.extra ?? {})
  const units = unitOptions(rules.units, product?.unit)
  const [quantity, setQuantity] = useState(qtyInputValue(current))
  const [min, setMin] = useState(qtyInputValue(product?.minQuantity))
  const [problem, setProblem] = useState<Problem>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const moveCount = product ? data.moves.filter((m) => m.productId === product.id).length : 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const target = quantity.trim() === '' ? 0 : parseDecimal(quantity, 3)
    const clash = findProduct(data.products, name)
    const unitPrice = price.trim() === '' ? null : parseMoney(price)
    const found: Problem = !name.trim()
      ? 'name'
      : clash && clash.id !== product?.id
        ? 'taken'
        : target == null || target < 0
          ? 'quantity'
          : rules.itemValue && price.trim() !== '' && (unitPrice == null || unitPrice < 0)
            ? 'price'
            : null
    if (found) {
      setProblem(found)
      haptic('error')
      return
    }
    const fields = {
      name: name.trim(),
      code: code.trim(),
      unit,
      minQuantity: min.trim() === '' ? null : parseDecimal(min, 3),
      // Values of rules the book turned off later are kept, not erased.
      unitPrice: rules.itemValue ? unitPrice : (product?.unitPrice ?? null),
      extra: Object.fromEntries(Object.entries(extra).filter(([, v]) => v.trim() !== '').map(([k, v]) => [k, v.trim()])),
    }
    if (product) {
      saveProduct({ ...product, ...fields })
      adjustQuantity(scope, product, current, target as number, today)
      toast(t.stock.product.saved)
    } else {
      saveProduct({ id: newId('prd'), ...scope, ...fields, initialQuantity: target as number, createdAt: new Date().toISOString() })
      toast(t.stock.product.added(fields.name))
    }
    haptic('success')
    onDone()
  }

  const message =
    problem === 'name'
      ? t.stock.product.nameRequired
      : problem === 'taken'
        ? t.stock.product.nameTaken
        : problem === 'quantity'
          ? t.stock.product.quantityInvalid
          : problem === 'price'
            ? t.rules.valueInvalid
            : null

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="span-2">
        <TextInput
          id="product-name"
          label={t.stock.product.name}
          value={name}
          onChange={(v) => {
            setName(v)
            setProblem(null)
          }}
          placeholder={t.stock.product.namePlaceholder}
          autoFocus
          invalid={problem === 'name' || problem === 'taken'}
          describedBy="product-error"
        />
      </div>
      <TextInput id="product-code" label={t.stock.product.code} value={code} onChange={setCode} placeholder={t.stock.product.codePlaceholder} />
      <div className="field">
        <label className="field-label" htmlFor="product-unit">
          {t.stock.product.unit}
        </label>
        <select id="product-unit" className="input select" value={unit} onChange={(e) => setUnit(e.target.value)}>
          {units.own.length > 0 ? (
            <>
              <optgroup label={t.stock.product.customUnits}>
                {units.own.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.stock.product.standardUnits}>
                {units.standard.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </optgroup>
            </>
          ) : (
            units.standard.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))
          )}
        </select>
      </div>
      <div>
        <TextInput
          id="product-quantity"
          label={t.stock.product.quantity}
          value={quantity}
          onChange={(v) => {
            setQuantity(v)
            setProblem(null)
          }}
          inputMode="decimal"
          placeholder="0"
          invalid={problem === 'quantity'}
          describedBy="product-error"
        />
        {product && <p className="text-2 mt-1 text-[12.5px]">{t.stock.product.quantityHint}</p>}
      </div>
      <TextInput id="product-min" label={t.stock.product.minQuantity} value={min} onChange={setMin} inputMode="decimal" />
      {rules.itemValue && (
        <TextInput
          id="product-price"
          label={t.stock.product.unitPrice}
          value={price}
          onChange={(v) => {
            setPrice(v)
            setProblem(null)
          }}
          inputMode="decimal"
          prefix="R$"
          invalid={problem === 'price'}
          describedBy="product-error"
        />
      )}
      {rules.fields.map((field) => (
        <TextInput
          key={field.id}
          id={`product-extra-${field.id}`}
          label={field.name}
          type={field.type === 'date' ? 'date' : 'text'}
          inputMode={field.type === 'number' ? 'decimal' : undefined}
          value={extra[field.id] ?? ''}
          onChange={(v) => setExtra((cur) => ({ ...cur, [field.id]: v }))}
        />
      ))}
      <p id="product-error" className="field-error span-2" role="alert">
        {message && (
          <>
            <CircleAlert size={14} /> {message}
          </>
        )}
      </p>

      <div className="form-actions span-2">
        {product && (
          <button type="button" className="btn btn-ghost tactile mr-auto" onClick={() => setConfirmDelete(true)}>
            <Trash2 />
            {t.common.delete}
          </button>
        )}
        <button type="button" className="btn btn-secondary tactile" onClick={onDone}>
          {t.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary tactile">
          {product ? t.common.save : t.stock.add.general}
        </button>
      </div>

      {product && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.stock.product.deleteTitle(product.name)}
          message={t.stock.product.deleteMessage(moveCount)}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            deleteProduct(product)
            toast(t.stock.product.deleted(product.name))
            onDone()
            navigate('/estoque/geral', { replace: true })
          }}
        />
      )}
    </form>
  )
}
