import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircleAlert, Trash2 } from 'lucide-react'
import { newId } from '../../../data/localDb'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { moneyInputValue, parseMoney } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { ConfirmDialog, Dialog } from '../../../ui/Dialog'
import { toast } from '../../../ui/Toaster'
import { Toggle } from '../../../ui/Toggle'
import { TABLES, removeEmployee, save } from '../store'
import type { Employee } from '../types'

export type EmployeeField = 'name' | 'phone' | 'email' | 'pixKey' | 'birthday' | 'salary' | 'registered'

interface Props {
  open: boolean
  onClose: () => void
  /** Editing an existing employee; omitted to add a new one. */
  employee?: Employee
  focusField?: EmployeeField
}

export function EmployeeForm({ open, onClose, employee, focusField }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title={employee ? t.collab.form.editEmployee : t.collab.form.newEmployee}>
      <EmployeeFormBody employee={employee} focusField={focusField} onDone={onClose} />
    </Dialog>
  )
}

function EmployeeFormBody({ employee, focusField = 'name', onDone }: { employee?: Employee; focusField?: EmployeeField; onDone: () => void }) {
  const scope = useScope()
  const navigate = useNavigate()
  const [name, setName] = useState(employee?.name ?? '')
  const [phone, setPhone] = useState(employee?.phone ?? '')
  const [email, setEmail] = useState(employee?.email ?? '')
  const [pixKey, setPixKey] = useState(employee?.pixKey ?? '')
  const [birthday, setBirthday] = useState(employee?.birthday ?? '')
  const [salary, setSalary] = useState(moneyInputValue(employee?.salary))
  const [registered, setRegistered] = useState(employee?.registered ?? false)
  const [status, setStatus] = useState<'active' | 'vacation'>(employee?.status === 'vacation' ? 'vacation' : 'active')
  const [invalid, setInvalid] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setInvalid(true)
      haptic('error')
      return
    }
    const fields = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pixKey: pixKey.trim(),
      birthday: birthday || null,
      salary: parseMoney(salary),
      registered,
    }
    if (employee) {
      save<Employee>(TABLES.employees, {
        ...employee,
        ...fields,
        status: employee.status === 'inactive' ? 'inactive' : status,
      })
      toast(t.collab.form.saved)
    } else {
      save<Employee>(TABLES.employees, {
        id: newId('emp'),
        ...scope,
        ...fields,
        status,
        removedOn: null,
        source: 'manual',
        createdAt: new Date().toISOString(),
      })
      toast(t.collab.form.added(fields.name))
    }
    haptic('success')
    onDone()
  }

  const autoFocus = (field: EmployeeField) => focusField === field

  return (
    <form className="form-grid" onSubmit={submit} noValidate>
      <div className="field span-2">
        <label className="field-label" htmlFor="emp-name">
          {t.collab.form.name}
        </label>
        <input
          id="emp-name"
          className="input"
          data-autofocus={autoFocus('name') || undefined}
          maxLength={80}
          value={name}
          aria-invalid={invalid}
          aria-describedby="emp-name-error"
          onChange={(e) => {
            setName(e.target.value)
            setInvalid(false)
          }}
        />
        <p id="emp-name-error" className="field-error" role="alert">
          {invalid && (
            <>
              <CircleAlert size={14} /> {t.collab.form.nameRequired}
            </>
          )}
        </p>
      </div>
      <TextInput id="emp-phone" label={t.collab.form.phone} value={phone} onChange={setPhone} type="tel" autoFocus={autoFocus('phone')} />
      <TextInput id="emp-email" label={t.collab.form.email} value={email} onChange={setEmail} type="email" autoFocus={autoFocus('email')} />
      <TextInput id="emp-pix" label={t.collab.form.pixKey} value={pixKey} onChange={setPixKey} autoFocus={autoFocus('pixKey')} />
      <TextInput id="emp-birthday" label={t.collab.form.birthday} value={birthday} onChange={setBirthday} type="date" autoFocus={autoFocus('birthday')} />
      <TextInput
        id="emp-salary"
        label={t.collab.form.salary}
        value={salary}
        onChange={setSalary}
        inputMode="decimal"
        placeholder="0,00"
        prefix="R$"
        autoFocus={autoFocus('salary')}
      />
      <div className="field">
        <span className="field-label" id="emp-registered-label">
          {t.collab.form.registered}
        </span>
        <div className="toggle-row">
          <Toggle
            checked={registered}
            onChange={setRegistered}
            label={t.collab.form.registered}
            id="emp-registered"
            autoFocus={autoFocus('registered')}
          />
          <span className="text-2">{registered ? t.collab.card.registeredYes : t.collab.card.registeredNo}</span>
        </div>
      </div>
      {employee?.status !== 'inactive' && (
        <div className="field span-2">
          <span className="field-label">{t.collab.form.status}</span>
          <div className="ob-chips">
            {(['active', 'vacation'] as const).map((s) => (
              <button key={s} type="button" className="chip tactile" aria-pressed={status === s} onClick={() => setStatus(s)}>
                {t.collab.employees.status[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="form-actions span-2">
        {employee && (
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

      {employee && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={t.collab.form.deleteTitle(employee.name)}
          message={t.collab.form.deleteEmployeeMessage}
          confirmLabel={t.common.delete}
          danger
          onConfirm={() => {
            removeEmployee(employee)
            toast(t.collab.form.deleted(employee.name))
            onDone()
            navigate('/colaboradores/funcionarios', { replace: true })
          }}
        />
      )}
    </form>
  )
}

interface TextInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'decimal' | 'tel' | 'email' | 'text'
  placeholder?: string
  prefix?: string
  autoFocus?: boolean
}

export function TextInput({ id, label, value, onChange, type = 'text', inputMode, placeholder, prefix, autoFocus }: TextInputProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className={prefix ? 'input-prefix' : undefined}>
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          className="input"
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          data-autofocus={autoFocus || undefined}
          maxLength={120}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
