import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { normalize } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog } from '../../../ui/Dialog'
import { TextInput } from '../../../ui/TextInput'
import { toast } from '../../../ui/Toaster'
import { useFinanceContext } from '../FinanceContext'
import { deleteCategory, saveCategory } from '../store'
import type { FinCategory } from '../types'
import { FieldError } from './fields'

interface Props {
  type: FinCategory['type']
  label?: FinCategory
  onDone: () => void
}

/** An income or expense label: its name, what it is, and where it comes from. */
export function LabelForm({ type, label, onDone }: Props) {
  const { book, data } = useFinanceContext()
  const scope = useScope()
  const [name, setName] = useState(label?.name ?? '')
  const [description, setDescription] = useState(label?.description ?? '')
  const [origin, setOrigin] = useState(label?.origin ?? '')
  const [problem, setProblem] = useState<'name' | 'taken' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const taken = data.categories.some(
      (c) => c.type === type && c.id !== label?.id && normalize(c.name) === normalize(name),
    )
    const found = !name.trim() ? 'name' : taken ? 'taken' : null
    if (found) {
      setProblem(found)
      haptic('error')
      return
    }
    saveCategory(
      {
        id: label?.id ?? newId('cat'),
        ...scope,
        book,
        type,
        name: name.trim(),
        description: description.trim(),
        origin: origin.trim(),
        createdAt: label?.createdAt ?? new Date().toISOString(),
      },
      label?.name,
    )
    haptic('success')
    toast(t.business.labels.saved)
    onDone()
  }

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="span-2">
        <TextInput
          id="label-name"
          label={t.business.labels.name}
          value={name}
          onChange={(v) => {
            setName(v)
            setProblem(null)
          }}
          placeholder={type === 'in' ? t.business.labels.namePlaceholderIn : t.business.labels.namePlaceholderOut}
          autoFocus
          invalid={problem !== null}
          describedBy="label-error"
        />
        <FieldError
          id="label-error"
          message={problem === 'name' ? t.business.labels.nameRequired : problem === 'taken' ? t.business.labels.nameTaken : null}
        />
      </div>
      <div className="field span-2">
        <label className="field-label" htmlFor="label-description">
          {t.business.labels.description}
        </label>
        <textarea
          id="label-description"
          className="input textarea"
          rows={2}
          maxLength={300}
          placeholder={type === 'in' ? t.business.labels.descriptionPlaceholderIn : t.business.labels.descriptionPlaceholderOut}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="span-2">
        <TextInput
          id="label-origin"
          label={t.business.labels.origin}
          value={origin}
          onChange={setOrigin}
          placeholder={type === 'in' ? t.business.labels.originPlaceholderIn : t.business.labels.originPlaceholderOut}
        />
      </div>

      <div className="form-actions span-2">
        {label && (
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

      {label && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.business.labels.deleteTitle(label.name)}
          message={t.business.labels.deleteMessage}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            deleteCategory(label)
            toast(t.business.labels.deleted)
            onDone()
          }}
        />
      )}
    </form>
  )
}
