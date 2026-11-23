import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { moneyInputValue, parseMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog } from '../../../ui/Dialog'
import { TextInput } from '../../../ui/TextInput'
import { toast } from '../../../ui/Toaster'
import { useFinanceContext } from '../FinanceContext'
import { dayKey } from '../../../lib/month'
import { categorySuggestions, deleteEntry, saveEntry } from '../store'
import type { FinEntry } from '../types'
import { AccountSelect, CategoryInput, FieldError } from './fields'

interface Props {
  entry?: FinEntry
  initialType?: FinEntry['type']
  onDone: () => void
}

export function EntryForm({ entry, initialType, onDone }: Props) {
  const { book, data, month, today } = useFinanceContext()
  const scope = useScope()
  const [type, setType] = useState<FinEntry['type']>(entry?.type ?? initialType ?? 'out')
  const [amount, setAmount] = useState(moneyInputValue(entry?.amount))
  const [description, setDescription] = useState(entry?.description ?? '')
  const [category, setCategory] = useState(entry?.category ?? '')
  const [date, setDate] = useState(entry?.date ?? (today.startsWith(month) ? today : dayKey(month, 1)))
  const [accountId, setAccountId] = useState(entry?.accountId ?? data.accounts[0]?.id ?? '')
  const [invalid, setInvalid] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const linkedTitle = entry?.titleId ? data.titles.find((ti) => ti.id === entry.titleId) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = parseMoney(amount)
    if (!value || value <= 0) {
      setInvalid(true)
      haptic('error')
      return
    }
    saveEntry({
      id: entry?.id ?? newId('ent'),
      ...scope,
      book,
      accountId,
      type,
      amount: value,
      date: date || today,
      description: description.trim(),
      category: category.trim(),
      titleId: entry?.titleId ?? null,
      createdAt: entry?.createdAt ?? new Date().toISOString(),
    })
    haptic('success')
    toast(t.finance.entry.saved)
    onDone()
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      {!linkedTitle && (
        <div className="field span-2">
          <span className="field-label">{t.finance.entry.type}</span>
          <div className="ob-chips">
            {(['in', 'out'] as const).map((k) => (
              <button key={k} type="button" className="chip tactile" aria-pressed={type === k} onClick={() => setType(k)}>
                {t.finance.entry[k]}
              </button>
            ))}
          </div>
        </div>
      )}
      {linkedTitle && <p className="text-2 span-2 text-[13px]">{t.finance.entry.linkedNote(linkedTitle.description)}</p>}

      <div>
        <TextInput
          id="entry-amount"
          label={t.finance.entry.amount}
          value={amount}
          onChange={(v) => {
            setAmount(v)
            setInvalid(false)
          }}
          inputMode="decimal"
          placeholder="0,00"
          prefix="R$"
          autoFocus
          invalid={invalid}
          describedBy="entry-amount-error"
        />
        <FieldError id="entry-amount-error" message={invalid ? t.finance.entry.amountRequired : null} />
      </div>
      <TextInput id="entry-date" label={t.finance.entry.date} value={date} onChange={setDate} type="date" />
      <div className="span-2">
        <TextInput
          id="entry-description"
          label={t.finance.entry.description}
          value={description}
          onChange={setDescription}
          placeholder={t.finance.entry.descriptionPlaceholder}
        />
      </div>
      <CategoryInput id={`entry-category-${type}`} value={category} onChange={setCategory} suggestions={categorySuggestions(data, type)} />
      <AccountSelect id="entry-account" accounts={data.accounts} value={accountId} onChange={setAccountId} />

      <div className="form-actions span-2">
        {entry && (
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

      {entry && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.finance.entry.deleteTitle}
          message={linkedTitle ? t.finance.entry.deleteLinkedMessage : t.finance.entry.deleteMessage}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            deleteEntry(entry)
            toast(t.finance.entry.deleted)
            onDone()
          }}
        />
      )}
    </form>
  )
}
