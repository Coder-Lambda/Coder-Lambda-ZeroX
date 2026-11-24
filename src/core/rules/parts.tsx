import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronRight, CircleAlert, Plus, Trash2, type LucideIcon } from 'lucide-react'
import { t } from '../i18n/pt-BR'
import { parseDecimal } from '../lib/format'
import { haptic } from '../lib/haptic'
import { ConfirmDialog, Dialog } from '../ui/Dialog'

/** One chapter of the book = one module chosen in the onboarding. */
export function Chapter({
  id,
  number,
  icon: Icon,
  title,
  sub,
  children,
}: {
  id: string
  number: number
  icon: LucideIcon
  title: string
  sub: string
  children: ReactNode
}) {
  return (
    <section id={`regras-${id}`} className="glass card rule-chapter" aria-labelledby={`regras-${id}-title`}>
      <header className="rule-chapter-head">
        <span className="rule-chapter-icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <p className="rule-chapter-eyebrow num">{t.rules.chapter(number)}</p>
          <h2 id={`regras-${id}-title`} className="rule-chapter-title">
            {title}
          </h2>
          <p className="text-2 text-[13px]">{sub}</p>
        </div>
      </header>
      <div className="rule-chapter-body">{children}</div>
    </section>
  )
}

/** A single rule: what it is on the left, its control on the right. */
export function RuleRow({
  title,
  hint,
  children,
  disabled,
  below,
}: {
  title: string
  hint: string
  children?: ReactNode
  disabled?: boolean
  /** Extra controls that need the full width (segmented choices, values). */
  below?: ReactNode
}) {
  return (
    <div className={`rule-row well${disabled ? ' is-disabled' : ''}`}>
      <div className="rule-row-main">
        <div className="rule-row-text">
          <h3 className="rule-title">{title}</h3>
          <p className="rule-hint">{disabled ? t.rules.needsPresence : hint}</p>
        </div>
        {children && <div className="rule-row-control">{children}</div>}
      </div>
      {below && !disabled && <div className="rule-row-below">{below}</div>}
    </div>
  )
}

export interface RuleListItem {
  id: string
  title: string
  sub?: string
}

/** A rule made of a list the business writes (situations, alarms, units…): tap one to edit it. */
export function RuleList({
  title,
  hint,
  items,
  addLabel,
  onAdd,
  onEdit,
  disabled,
  footer,
}: {
  title: string
  hint: string
  items: RuleListItem[]
  addLabel: string
  onAdd: () => void
  onEdit: (id: string) => void
  disabled?: boolean
  footer?: ReactNode
}) {
  return (
    <div className={`rule-row well${disabled ? ' is-disabled' : ''}`}>
      <div className="rule-row-main">
        <div className="rule-row-text">
          <h3 className="rule-title">{title}</h3>
          <p className="rule-hint">{disabled ? t.rules.needsPresence : hint}</p>
        </div>
        {!disabled && (
          <div className="rule-row-control">
            <button type="button" className="btn btn-secondary tactile" onClick={onAdd}>
              <Plus />
              {addLabel}
            </button>
          </div>
        )}
      </div>
      {!disabled && items.length > 0 && (
        <ul className="rule-items">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="rule-item tactile" onClick={() => onEdit(item.id)}>
                <span className="person-main">
                  <span className="person-name">{item.title}</span>
                  {item.sub && <span className="person-sub">{item.sub}</span>}
                </span>
                <ChevronRight className="person-chevron" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!disabled && footer}
    </div>
  )
}

/** Which item of a list is being edited (`null` = a new one), or closed. */
export function useEditor<T extends { id: string }>(items: T[]) {
  const [editing, setEditing] = useState<{ id: string | null } | null>(null)
  return {
    open: editing !== null,
    item: editing?.id ? items.find((i) => i.id === editing.id) : undefined,
    add: () => setEditing({ id: null }),
    edit: (id: string) => setEditing({ id }),
    close: () => setEditing(null),
  }
}

/** The dialog every list rule is written in: fields, an error line, and Remover / Cancelar / Salvar. */
export function RuleDialog({
  open,
  title,
  onClose,
  onSubmit,
  onRemove,
  removeName,
  removeTitle,
  removeMessage,
  error,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  /** Returns false when the form is not valid (the dialog stays open). */
  onSubmit: () => boolean
  onRemove?: () => void
  removeName?: string
  /** Replaces the default "the rule leaves the book" confirmation. */
  removeTitle?: string
  removeMessage?: string
  error?: string | null
  children: ReactNode
}) {
  const [confirming, setConfirming] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (onSubmit()) {
      haptic('success')
      onClose()
    } else {
      haptic('error')
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title={title}>
        <form className="form-grid" onSubmit={submit} noValidate>
          {children}
          <p className="field-error span-2" role="alert">
            {error && (
              <>
                <CircleAlert size={14} /> {error}
              </>
            )}
          </p>
          <div className="form-actions span-2">
            {onRemove && (
              <button type="button" className="btn btn-ghost tactile mr-auto" onClick={() => setConfirming(true)}>
                <Trash2 />
                {t.rules.remove}
              </button>
            )}
            <button type="button" className="btn btn-secondary tactile" onClick={onClose}>
              {t.common.cancel}
            </button>
            <button type="submit" className="btn btn-primary tactile">
              {t.common.save}
            </button>
          </div>
        </form>
      </Dialog>
      {onRemove && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title={removeTitle ?? t.rules.removeTitle(removeName ?? '')}
          message={removeMessage ?? t.rules.removeMessage}
          confirmLabel={t.rules.remove}
          danger
          onConfirm={() => {
            onRemove()
            onClose()
          }}
        />
      )}
    </>
  )
}

/** A number written in the book: saved when the field loses focus or Enter is pressed. */
export function NumberRule({
  id,
  label,
  value,
  onCommit,
  prefix,
  suffix,
  decimals = 0,
  min = 0,
  disabled,
}: {
  id: string
  label: string
  value: number | null
  onCommit: (value: number | null) => void
  prefix?: string
  suffix?: string
  decimals?: number
  min?: number
  disabled?: boolean
}) {
  const shown = value == null ? '' : value.toLocaleString('pt-BR', { maximumFractionDigits: decimals, useGrouping: false })
  const [text, setText] = useState(shown)
  const [invalid, setInvalid] = useState(false)
  useEffect(() => setText(shown), [shown])

  const commit = () => {
    if (text.trim() === '') {
      setInvalid(false)
      if (value !== null) onCommit(null)
      return
    }
    const parsed = parseDecimal(text, decimals)
    if (parsed == null || parsed < min) {
      setInvalid(true)
      haptic('error')
      return
    }
    setInvalid(false)
    if (parsed !== value) onCommit(parsed)
  }

  return (
    <label className="rule-number" htmlFor={id}>
      <span className="sr-only">{label}</span>
      <span className="input-prefix">
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          className="input num"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
        />
      </span>
      {suffix && <span className="rule-number-suffix">{suffix}</span>}
    </label>
  )
}

/** Name + number fields parsed the same way in every rule dialog. */
export const parseOptional = (text: string, decimals = 0) => (text.trim() === '' ? null : parseDecimal(text, decimals))
