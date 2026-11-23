import { useState, type FormEvent } from 'react'
import { Trash2, Undo2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, moneyInputValue, parseMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog } from '../../../ui/Dialog'
import { TextInput } from '../../../ui/TextInput'
import { toast } from '../../../ui/Toaster'
import { useFinanceContext } from '../FinanceContext'
import { categorySuggestions, deleteTitle, saveTitle, undoPayment } from '../store'
import type { FinTitle } from '../types'
import { CategoryInput, FieldError } from './fields'

interface Props {
  title?: FinTitle
  initialKind?: FinTitle['kind']
  initialDue?: string
  onDone: () => void
}

type Problem = 'description' | 'amount' | 'due' | null

export function TitleForm({ title, initialKind, initialDue, onDone }: Props) {
  const { book, data, today } = useFinanceContext()
  const scope = useScope()
  const [kind, setKind] = useState<FinTitle['kind']>(title?.kind ?? initialKind ?? 'payable')
  const [description, setDescription] = useState(title?.description ?? '')
  const [amount, setAmount] = useState(moneyInputValue(title?.amount))
  const [dueDate, setDueDate] = useState(title?.dueDate ?? initialDue ?? today)
  const [category, setCategory] = useState(title?.category ?? '')
  const [problem, setProblem] = useState<Problem>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const settled = title?.paidOn != null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = parseMoney(amount)
    const found: Problem = !description.trim() ? 'description' : !value || value <= 0 ? 'amount' : !dueDate ? 'due' : null
    if (found) {
      setProblem(found)
      haptic('error')
      return
    }
    saveTitle({
      id: title?.id ?? newId('tit'),
      ...scope,
      book,
      kind,
      description: description.trim(),
      amount: value as number,
      dueDate,
      category: category.trim(),
      paidOn: title?.paidOn ?? null,
      entryId: title?.entryId ?? null,
      createdAt: title?.createdAt ?? new Date().toISOString(),
    })
    haptic('success')
    toast(t.finance.title.saved)
    onDone()
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {!settled && (
        <div className="field span-2">
          <span className="field-label">{t.finance.entry.type}</span>
          <div className="ob-chips">
            {(['payable', 'receivable'] as const).map((k) => (
              <button key={k} type="button" className="chip tactile" aria-pressed={kind === k} onClick={() => setKind(k)}>
                {t.finance.title.kind[k]}
              </button>
            ))}
          </div>
        </div>
      )}
      {settled && title && (
        <div className="span-2 flex flex-wrap items-center gap-3">
          <span className="tag tag-active">
            {(title.kind === 'payable' ? t.finance.title.paidOn : t.finance.title.receivedOn)(formatDateKey(title.paidOn))}
          </span>
          <button
            type="button"
            className="btn btn-ghost tactile"
            onClick={() => {
              undoPayment(title)
              toast(t.finance.title.undone)
              onDone()
            }}
          >
            <Undo2 />
            {t.finance.title.undo}
          </button>
        </div>
      )}

      <div className="span-2">
        <TextInput
          id="title-description"
          label={t.finance.title.description}
          value={description}
          onChange={(v) => {
            setDescription(v)
            setProblem(null)
          }}
          placeholder={t.finance.title.descriptionPlaceholder}
          autoFocus
          invalid={problem === 'description'}
          describedBy="title-error"
        />
      </div>
      <TextInput
        id="title-amount"
        label={t.finance.entry.amount}
        value={amount}
        onChange={(v) => {
          setAmount(v)
          setProblem(null)
        }}
        inputMode="decimal"
        placeholder="0,00"
        prefix="R$"
        invalid={problem === 'amount'}
        describedBy="title-error"
      />
      <TextInput
        id="title-due"
        label={t.finance.title.dueDate}
        value={dueDate}
        onChange={(v) => {
          setDueDate(v)
          setProblem(null)
        }}
        type="date"
        invalid={problem === 'due'}
        describedBy="title-error"
      />
      <div className="span-2">
        <CategoryInput
          id={`title-category-${kind}`}
          value={category}
          onChange={setCategory}
          suggestions={categorySuggestions(data, kind === 'receivable' ? 'in' : 'out', book)}
        />
      </div>
      <div className="span-2">
        <FieldError
          id="title-error"
          message={
            problem === 'description'
              ? t.finance.title.descriptionRequired
              : problem === 'amount'
                ? t.finance.entry.amountRequired
                : problem === 'due'
                  ? t.finance.title.dueRequired
                  : null
          }
        />
      </div>

      <div className="form-actions span-2">
        {title && (
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

      {title && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.finance.title.deleteTitle}
          message={settled ? t.finance.title.deletePaidMessage : t.finance.title.deleteMessage}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            deleteTitle(title)
            toast(t.finance.title.deleted)
            onDone()
          }}
        />
      )}
    </form>
  )
}
