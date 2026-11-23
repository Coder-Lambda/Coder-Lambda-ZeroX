import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, todayKey } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog } from '../../../ui/Dialog'
import { toast } from '../../../ui/Toaster'
import { TABLES, removeRow, save } from '../store'
import type { EmployeeNote } from '../types'

export function NotesSection({ employeeId, notes }: { employeeId: string; notes: EmployeeNote[] }) {
  const scope = useScope()
  const [kind, setKind] = useState<EmployeeNote['kind']>('warning')
  const [date, setDate] = useState(todayKey)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState<EmployeeNote | null>(null)

  const sorted = [...notes].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    save<EmployeeNote>(TABLES.notes, {
      id: newId('note'),
      ...scope,
      employee_id: employeeId,
      kind,
      date: date || todayKey(),
      text: text.trim(),
      createdAt: new Date().toISOString(),
    })
    setText('')
    haptic('success')
    toast(t.collab.notes.added)
  }

  return (
    <section className="glass card span-6">
      <h2 className="card-title">{t.collab.notes.title}</h2>
      <form className="flex flex-col gap-3" onSubmit={submit}>
        <div className="flex flex-wrap items-center gap-2">
          {(['warning', 'incident'] as const).map((k) => (
            <button key={k} type="button" className="chip tactile" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {t.collab.notes.kind[k]}
            </button>
          ))}
          <input
            type="date"
            className="input input-sm ml-auto"
            aria-label={t.collab.notes.dateLabel}
            value={date}
            max={todayKey()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <textarea
          className="input textarea"
          rows={3}
          maxLength={2000}
          placeholder={t.collab.notes.placeholder}
          aria-label={t.collab.notes.placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div>
          <button type="submit" className="btn btn-primary tactile" disabled={!text.trim()}>
            {t.collab.notes.add}
          </button>
        </div>
      </form>

      {sorted.length === 0 ? (
        <p className="text-2 mt-4 text-[13px]">{t.collab.notes.empty}</p>
      ) : (
        <ul className="note-list">
          {sorted.map((note) => (
            <li key={note.id} className="well note-row">
              <div className="note-meta">
                <span className={`tag tag-${note.kind}`}>{t.collab.notes.kind[note.kind]}</span>
                <span className="num text-2 text-[12.5px]">{formatDateKey(note.date)}</span>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost tactile ml-auto"
                  aria-label={t.common.delete}
                  onClick={() => setDeleting(note)}
                >
                  <Trash2 />
                </button>
              </div>
              <p className="note-text">{note.text}</p>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t.collab.notes.deleteTitle}
        message={t.collab.notes.deleteMessage}
        confirmLabel={t.common.delete}
        danger
        onConfirm={() => deleting && removeRow(TABLES.notes, deleting.id)}
      />
    </section>
  )
}
