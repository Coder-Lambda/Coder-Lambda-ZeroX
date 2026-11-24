import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, CalendarRange, Plus } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, todayKey } from '../../../lib/format'
import { RuleDialog } from '../../../rules/parts'
import { useRules } from '../../../rules/useRules'
import { TextInput } from '../../../ui/TextInput'
import { toast } from '../../../ui/Toaster'
import { leaveDays, leaveEnd } from '../rules'
import { TABLES, removeRow, saveLeave } from '../store'
import type { Employee, EmployeeLeave } from '../types'

const copy = t.collab.leaves

function leaveState(leave: EmployeeLeave, today: string) {
  if (leave.end < today) return 'finished'
  return leave.start > today ? 'upcoming' : 'ongoing'
}

/** The special situations (rule book) this employee was in: maternity leave, illness… */
export function LeavesSection({ employee, leaves }: { employee: Employee; leaves: EmployeeLeave[] }) {
  const { leaveTypes } = useRules().rules.collaborators
  const [editing, setEditing] = useState<{ leave?: EmployeeLeave } | null>(null)
  const today = todayKey()
  const sorted = [...leaves].sort((a, b) => b.start.localeCompare(a.start))

  return (
    <section className="glass card" aria-label={copy.title}>
      <div className="section-head">
        <div>
          <h2 className="card-title mb-0">{copy.title}</h2>
          <p className="text-2 text-[13px]">{copy.sub}</p>
        </div>
        {leaveTypes.length > 0 && (
          <button type="button" className="btn btn-secondary tactile" onClick={() => setEditing({})}>
            <Plus />
            {copy.add}
          </button>
        )}
      </div>

      {leaveTypes.length === 0 && (
        <p className="ob-note mb-3">
          <BookOpen aria-hidden="true" />
          <span>
            {copy.noTypes}{' '}
            <Link to="/configuracoes/regras#regras-collaborators" className="text-link">
              {copy.openRules}
            </Link>
          </span>
        </p>
      )}

      {sorted.length === 0 ? (
        <p className="text-2 text-[13px]">{copy.empty}</p>
      ) : (
        <ul className="people-list">
          {sorted.map((leave) => {
            const state = leaveState(leave, today)
            return (
              <li key={leave.id}>
                <button type="button" className="leave-row well tactile" onClick={() => setEditing({ leave })}>
                  <CalendarRange className="leave-icon" aria-hidden="true" />
                  <span className="person-main">
                    <span className="person-name">{leave.typeName}</span>
                    <span className="person-sub num">
                      {copy.period(formatDateKey(leave.start), formatDateKey(leave.end), leaveDays(leave))}
                      {leave.note && ` · ${leave.note}`}
                    </span>
                  </span>
                  <span className={`tag ${state === 'ongoing' ? 'tag-vacation' : ''}`}>{copy.state[state]}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <LeaveDialog
        key={editing ? (editing.leave?.id ?? 'new') : 'closed'}
        open={editing !== null}
        employee={employee}
        leave={editing?.leave}
        onClose={() => setEditing(null)}
      />
    </section>
  )
}

function LeaveDialog({
  open,
  employee,
  leave,
  onClose,
}: {
  open: boolean
  employee: Employee
  leave?: EmployeeLeave
  onClose: () => void
}) {
  const scope = useScope()
  const { leaveTypes } = useRules().rules.collaborators
  const initialType = leaveTypes.find((l) => l.id === leave?.typeId) ?? leaveTypes[0]
  const [typeId, setTypeId] = useState(leave?.typeId ?? initialType?.id ?? '')
  const [start, setStart] = useState(leave?.start ?? todayKey())
  const [end, setEnd] = useState(leave?.end ?? (initialType?.days ? leaveEnd(todayKey(), initialType.days) : todayKey()))
  const [note, setNote] = useState(leave?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  // A type with a usual length fills the end date; it can still be changed.
  const pickType = (id: string) => {
    setTypeId(id)
    const days = leaveTypes.find((l) => l.id === id)?.days
    if (days) setEnd(leaveEnd(start, days))
  }
  const pickStart = (value: string) => {
    setStart(value)
    setError(null)
    const days = leaveTypes.find((l) => l.id === typeId)?.days
    if (days && value) setEnd(leaveEnd(value, days))
  }
  const typeName = leaveTypes.find((l) => l.id === typeId)?.name ?? leave?.typeName ?? ''

  return (
    <RuleDialog
      open={open}
      title={`${leave ? copy.editTitle : copy.newTitle} · ${employee.name}`}
      onClose={onClose}
      error={error}
      removeTitle={copy.deleteTitle}
      removeMessage={copy.deleteMessage}
      onRemove={
        leave
          ? () => {
              removeRow(TABLES.leaves, leave.id)
              toast(copy.deleted)
            }
          : undefined
      }
      onSubmit={() => {
        if (!start || !end || end < start) {
          setError(copy.endBeforeStart)
          return false
        }
        saveLeave({
          id: leave?.id ?? newId('lv'),
          ...scope,
          employee_id: employee.id,
          typeId,
          typeName,
          start,
          end,
          note: note.trim(),
          createdAt: leave?.createdAt ?? new Date().toISOString(),
        })
        toast(copy.saved)
        return true
      }}
    >
      <div className="field span-2">
        <label className="field-label" htmlFor="leave-type">
          {copy.type}
        </label>
        <select id="leave-type" className="input select" value={typeId} data-autofocus onChange={(e) => pickType(e.target.value)}>
          {leave && !leaveTypes.some((l) => l.id === leave.typeId) && <option value={leave.typeId}>{leave.typeName}</option>}
          {leaveTypes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <TextInput id="leave-start" label={copy.start} type="date" value={start} onChange={pickStart} />
      <TextInput
        id="leave-end"
        label={copy.end}
        type="date"
        value={end}
        onChange={(v) => {
          setEnd(v)
          setError(null)
        }}
      />
      <div className="span-2">
        <TextInput id="leave-note" label={copy.note} value={note} onChange={setNote} />
      </div>
    </RuleDialog>
  )
}
