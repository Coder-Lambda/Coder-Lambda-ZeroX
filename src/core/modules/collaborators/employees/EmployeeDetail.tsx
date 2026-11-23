import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, Paperclip, Pencil, SlidersHorizontal, UserMinus, UserPlus } from 'lucide-react'
import { useSession } from '../../../auth/SessionProvider'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { ageOn, formatDateKey, formatMoney, todayKey } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { Avatar } from '../../../ui/Avatar'
import { ConfirmDialog, Dialog } from '../../../ui/Dialog'
import { toast } from '../../../ui/Toaster'
import { Toggle } from '../../../ui/Toggle'
import { TABLES, absencesFor, attachFile, save, useAbsences, useEmployees, useFiles, useNotes } from '../store'
import { EMPLOYEE_WIDGETS, type Employee, type EmployeeWidget } from '../types'
import { EmployeeForm, type EmployeeField } from './EmployeeForm'
import { FilesSection, MAX_FILE_BYTES } from './FilesSection'
import { NotesSection } from './NotesSection'
import { StatusBadge } from './StatusBadge'

const MAX_WIDGETS = 7

export function EmployeeDetail() {
  const { id } = useParams()
  const employee = useEmployees().find((e) => e.id === id)

  if (!employee) {
    return (
      <div className="module-body">
        <BackLink />
        <p className="glass empty-state">{t.collab.card.notFound}</p>
      </div>
    )
  }
  return <EmployeeCard employee={employee} />
}

function BackLink() {
  return (
    <Link to="/colaboradores/funcionarios" className="back-link">
      <ArrowLeft />
      {t.collab.card.back}
    </Link>
  )
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const { active, updateActive } = useSession()
  const scope = useScope()
  const navigate = useNavigate()
  const absences = absencesFor(useAbsences(), employee.id)
  const notes = useNotes().filter((n) => n.employee_id === employee.id)
  const files = useFiles().filter((f) => f.employee_id === employee.id)
  const fileInput = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState<EmployeeField | null>(null)
  const [confirmTakeOff, setConfirmTakeOff] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const removed = employee.status === 'inactive'
  const widgets = readWidgets(active?.layout.employeeWidgets)

  const setWidgets = (next: EmployeeWidget[]) =>
    active && updateActive({ layout: { ...active.layout, employeeWidgets: next } })

  const takeOff = () => {
    save<Employee>(TABLES.employees, { ...employee, status: 'inactive', removedOn: todayKey() })
    haptic('medium')
    toast(t.collab.card.takenOffToast(employee.name))
  }

  const reactivate = () => {
    save<Employee>(TABLES.employees, { ...employee, status: 'active', removedOn: null })
    haptic('success')
    toast(t.collab.card.reactivatedToast(employee.name))
  }

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return
    let added = 0
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        toast(t.collab.files.tooBig(file.name), 'error')
        continue
      }
      try {
        await attachFile(scope, employee.id, file)
        added += 1
      } catch {
        toast(t.collab.files.failed, 'error')
      }
    }
    if (added) toast(t.collab.files.added(added))
  }

  const exportPdf = async () => {
    setExporting(true)
    try {
      const { exportEmployeePdf } = await import('./exportPdf')
      await exportEmployeePdf({ employee, businessName: active?.businessType ?? '', absences, notes, files })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="module-body">
      <BackLink />

      <header className="glass card employee-head">
        <Avatar name={employee.name} size={64} muted={removed} />
        <div className="employee-head-main">
          <h2 className={`employee-name${removed ? ' is-removed' : ''}`}>{employee.name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={employee.status} />
            {removed && employee.removedOn && (
              <span className="text-2 text-[13px]">{t.collab.card.takenOff(formatDateKey(employee.removedOn))}</span>
            )}
          </div>
        </div>
        <div className="employee-actions">
          <button type="button" className="btn btn-secondary tactile" onClick={() => setEditing('name')}>
            <Pencil />
            {t.collab.card.edit}
          </button>
          <button type="button" className="btn btn-secondary tactile" onClick={() => fileInput.current?.click()}>
            <Paperclip />
            {t.collab.card.addFile}
          </button>
          <button type="button" className="btn btn-secondary tactile" onClick={exportPdf} disabled={exporting}>
            <FileDown />
            {exporting ? t.collab.card.exporting : t.collab.card.exportPdf}
          </button>
          {removed ? (
            <button type="button" className="btn btn-primary tactile" onClick={reactivate}>
              <UserPlus />
              {t.collab.card.reactivate}
            </button>
          ) : (
            <button type="button" className="btn btn-danger tactile" onClick={() => setConfirmTakeOff(true)}>
              <UserMinus />
              {t.collab.card.takeOff}
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.odt,.txt"
            onChange={(e) => {
              void addFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      <section aria-label={t.collab.card.customizeTitle}>
        <div className="section-head">
          <span />
          <button type="button" className="btn btn-ghost tactile" onClick={() => setCustomizing(true)}>
            <SlidersHorizontal />
            {t.collab.card.customize}
          </button>
        </div>
        <div className="widget-grid">
          {widgets.map((widget) => (
            <WidgetTile
              key={widget}
              widget={widget}
              employee={employee}
              absences={absences}
              onOpen={() =>
                widget === 'absences' ? navigate('/colaboradores/funcionarios/presenca') : setEditing(widget)
              }
            />
          ))}
        </div>
      </section>

      <div className="card-grid">
        <NotesSection employeeId={employee.id} notes={notes} />
        <FilesSection files={files} onAdd={() => fileInput.current?.click()} />
      </div>

      <EmployeeForm
        open={editing !== null}
        onClose={() => setEditing(null)}
        employee={employee}
        focusField={editing ?? undefined}
      />

      <ConfirmDialog
        open={confirmTakeOff}
        onClose={() => setConfirmTakeOff(false)}
        title={t.collab.card.takeOffTitle}
        message={t.collab.card.takeOffMessage(employee.name)}
        confirmLabel={t.collab.card.takeOff}
        danger
        onConfirm={takeOff}
      />

      <Dialog open={customizing} onClose={() => setCustomizing(false)} title={t.collab.card.customizeTitle}>
        <p className="text-2 mb-4">{t.collab.card.customizeSub}</p>
        <ul className="toggle-list">
          {EMPLOYEE_WIDGETS.map((widget) => {
            const shown = widgets.includes(widget)
            return (
              <li key={widget} className="well toggle-list-row">
                <span>{t.collab.widgets[widget]}</span>
                <Toggle
                  checked={shown}
                  label={t.collab.widgets[widget]}
                  onChange={(on) =>
                    setWidgets(
                      on
                        ? EMPLOYEE_WIDGETS.filter((w) => w === widget || widgets.includes(w)).slice(0, MAX_WIDGETS)
                        : widgets.filter((w) => w !== widget),
                    )
                  }
                />
              </li>
            )
          })}
        </ul>
      </Dialog>
    </div>
  )
}

/** The business's widget choice lives in ClientConfig.layout; anything invalid falls back to all 7. */
function readWidgets(value: unknown): EmployeeWidget[] {
  if (!Array.isArray(value)) return [...EMPLOYEE_WIDGETS]
  return EMPLOYEE_WIDGETS.filter((w) => value.includes(w))
}

interface WidgetTileProps {
  widget: EmployeeWidget
  employee: Employee
  absences: { month: number; total: number }
  onOpen: () => void
}

function WidgetTile({ widget, employee, absences, onOpen }: WidgetTileProps) {
  const label = t.collab.widgets[widget]
  let value: string | null
  let sub: string | null = null

  switch (widget) {
    case 'birthday':
      value = employee.birthday ? formatDateKey(employee.birthday, false) : null
      sub = employee.birthday ? t.collab.card.age(ageOn(employee.birthday)) : null
      break
    case 'salary':
      value = employee.salary == null ? null : formatMoney(employee.salary)
      break
    case 'registered':
      value =
        employee.registered == null
          ? null
          : employee.registered
            ? t.collab.card.registeredYes
            : t.collab.card.registeredNo
      break
    case 'absences':
      value = String(absences.month)
      sub = `${t.collab.card.absencesMonth} · ${t.collab.card.absencesTotal(absences.total)}`
      break
    default:
      value = employee[widget] || null
  }

  return (
    <button type="button" className={`widget-tile glass tactile widget-${widget}`} onClick={onOpen}>
      <span className="widget-label">{label}</span>
      <span className={`widget-value num${value ? '' : ' is-empty'}`}>{value ?? t.common.notInformed}</span>
      {sub && <span className="widget-sub">{sub}</span>}
    </button>
  )
}
