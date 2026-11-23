interface TextInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'decimal' | 'tel' | 'email' | 'text'
  placeholder?: string
  /** Fixed text inside the field, e.g. "R$". */
  prefix?: string
  /** Focused first when its dialog opens. */
  autoFocus?: boolean
  list?: string
  invalid?: boolean
  describedBy?: string
}

export function TextInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  inputMode,
  placeholder,
  prefix,
  autoFocus,
  list,
  invalid,
  describedBy,
}: TextInputProps) {
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
          list={list}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
