import { CircleAlert } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import type { FinAccount } from '../types'

export function FieldError({ id, message }: { id: string; message: string | null }) {
  return (
    <p id={id} className="field-error" role="alert">
      {message && (
        <>
          <CircleAlert size={14} /> {message}
        </>
      )}
    </p>
  )
}

export function AccountSelect({
  id,
  label = t.finance.entry.account,
  accounts,
  value,
  onChange,
}: {
  id: string
  label?: string
  accounts: FinAccount[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="input select" value={value} onChange={(e) => onChange(e.target.value)}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function CategoryInput({
  id,
  value,
  onChange,
  suggestions,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  suggestions: string[]
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {t.finance.entry.category}
      </label>
      <input
        id={id}
        className="input"
        list={`${id}-options`}
        maxLength={40}
        placeholder={t.finance.entry.categoryPlaceholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={`${id}-options`}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}
