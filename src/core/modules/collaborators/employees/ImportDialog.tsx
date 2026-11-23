import { useMemo, useRef, useState } from 'react'
import { CircleAlert, FileSpreadsheet, Upload } from 'lucide-react'
import { localDb, newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, formatMoney, normalize, todayKey } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { Dialog } from '../../../ui/Dialog'
import { toast } from '../../../ui/Toaster'
import { TABLES, useEmployees } from '../store'
import type { Employee } from '../types'
import { IMPORT_FIELDS, guessColumns, readSheetFile, toEmployees, type ColumnMap, type ImportField, type Sheet } from './importSheet'

const FIELD_LABELS: Record<ImportField, string> = {
  name: t.collab.form.name,
  phone: t.collab.form.phone,
  email: t.collab.form.email,
  pixKey: t.collab.form.pixKey,
  birthday: t.collab.form.birthday,
  salary: t.collab.form.salary,
  registered: t.collab.widgets.registered,
  status: t.collab.form.status,
}

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={t.collab.import.title} size="lg">
      <ImportBody onDone={onClose} />
    </Dialog>
  )
}

function ImportBody({ onDone }: { onDone: () => void }) {
  const scope = useScope()
  const existing = useEmployees()
  const input = useRef<HTMLInputElement>(null)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [map, setMap] = useState<ColumnMap | null>(null)
  const [state, setState] = useState<'idle' | 'reading' | 'error' | 'empty'>('idle')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setState('reading')
    try {
      const parsed = await readSheetFile(file)
      if (parsed.rows.length === 0) {
        setState('empty')
        return
      }
      setSheet(parsed)
      setMap(guessColumns(parsed.headers))
      setState('idle')
    } catch {
      setState('error')
    }
  }

  const people = useMemo(() => (sheet && map && map.name >= 0 ? toEmployees(sheet, map) : []), [sheet, map])
  const byName = useMemo(() => new Map(existing.map((e) => [normalize(e.name), e])), [existing])
  const updates = people.filter((p) => byName.has(normalize(p.name))).length

  const confirm = () => {
    const now = new Date().toISOString()
    const created: Employee[] = []
    people.forEach((person) => {
      const current = byName.get(normalize(person.name))
      if (current) {
        // Only overwrite what the sheet actually has.
        localDb.upsert<Employee>(TABLES.employees, {
          ...current,
          phone: person.phone || current.phone,
          email: person.email || current.email,
          pixKey: person.pixKey || current.pixKey,
          birthday: person.birthday ?? current.birthday,
          salary: person.salary ?? current.salary,
          registered: person.registered ?? current.registered,
          ...(map && map.status >= 0
            ? {
                status: person.status,
                removedOn: person.status === 'inactive' ? current.removedOn ?? (current.status === 'inactive' ? null : todayKey()) : null,
              }
            : {}),
        })
      } else {
        created.push({
          id: newId('emp'),
          ...scope,
          ...person,
          // A sheet doesn't say when someone left, so they stay out of every past presence list.
          removedOn: null,
          source: 'import',
          createdAt: now,
        })
      }
    })
    localDb.insertMany(TABLES.employees, created)
    haptic('success')
    toast(t.collab.import.done(created.length, people.length - created.length))
    onDone()
  }

  if (!sheet || !map) {
    return (
      <div className="import-drop">
        <span className="empty-hero-icon">
          <FileSpreadsheet />
        </span>
        <p className="text-2 text-center">{t.collab.import.sub}</p>
        <button type="button" className="btn btn-primary tactile" onClick={() => input.current?.click()} disabled={state === 'reading'}>
          <Upload />
          {state === 'reading' ? t.collab.import.reading : t.collab.import.choose}
        </button>
        {(state === 'error' || state === 'empty') && (
          <p className="field-error" role="alert">
            <CircleAlert size={14} /> {state === 'error' ? t.collab.import.error : t.collab.import.noRows}
          </p>
        )}
        <input
          ref={input}
          type="file"
          hidden
          accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(e) => {
            void pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="card-title">{t.collab.import.mapTitle}</h3>
        <p className="text-2 mb-3 text-[13px]">{t.collab.import.rowsFound(sheet.rows.length)}</p>
        <div className="map-grid">
          {IMPORT_FIELDS.map((field) => (
            <label key={field} className="field">
              <span className="field-label">{FIELD_LABELS[field]}</span>
              <select
                className="input select"
                value={map[field]}
                aria-invalid={field === 'name' && map.name < 0}
                onChange={(e) => setMap({ ...map, [field]: Number(e.target.value) })}
              >
                <option value={-1}>{t.collab.import.ignore}</option>
                {sheet.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header || `Coluna ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {map.name < 0 && (
          <p className="field-error mt-2" role="alert">
            <CircleAlert size={14} /> {t.collab.import.needName}
          </p>
        )}
      </div>

      {people.length > 0 && (
        <div>
          <h3 className="card-title">{t.collab.import.preview}</h3>
          <div className="table-wrap well">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.collab.form.name}</th>
                  <th>{t.collab.form.phone}</th>
                  <th>{t.collab.form.birthday}</th>
                  <th className="text-right">{t.collab.form.salary}</th>
                  <th>{t.collab.form.status}</th>
                </tr>
              </thead>
              <tbody>
                {people.slice(0, 5).map((person, index) => (
                  <tr key={index}>
                    <td>{person.name}</td>
                    <td>{person.phone || '—'}</td>
                    <td className="num">{formatDateKey(person.birthday)}</td>
                    <td className="num text-right">{formatMoney(person.salary)}</td>
                    <td>{t.collab.employees.status[person.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {updates > 0 && <p className="text-2 mt-2 text-[13px]">{t.collab.import.updates(updates)}</p>}
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost tactile mr-auto"
          onClick={() => {
            setSheet(null)
            setMap(null)
          }}
        >
          {t.collab.import.otherFile}
        </button>
        <button type="button" className="btn btn-secondary tactile" onClick={onDone}>
          {t.common.cancel}
        </button>
        <button type="button" className="btn btn-primary tactile" disabled={people.length === 0} onClick={confirm}>
          {t.collab.import.confirm(people.length)}
        </button>
      </div>
    </div>
  )
}
