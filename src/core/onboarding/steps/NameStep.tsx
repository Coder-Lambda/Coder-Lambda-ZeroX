import { useState, type FormEvent } from 'react'
import { ArrowRight, CircleAlert } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'

export function NameStep({ value, onDone }: { value: string; onDone: (name: string) => void }) {
  const [name, setName] = useState(value)
  const [invalid, setInvalid] = useState(false)
  const [shaking, setShaking] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim().length < 2) {
      setInvalid(true)
      setShaking(true)
      haptic('error')
      return
    }
    haptic('light')
    onDone(name.trim())
  }

  return (
    <>
      <h1 className="ob-title" tabIndex={-1}>
        {t.onboarding.nameTitle}
      </h1>
      <p className="ob-sub">{t.onboarding.nameSub}</p>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <div className={`field${shaking ? ' shake' : ''}`} onAnimationEnd={() => setShaking(false)}>
          <label className="field-label" htmlFor="ob-name">
            {t.onboarding.nameLabel}
          </label>
          <input
            id="ob-name"
            className="input"
            data-autofocus
            autoComplete="given-name"
            maxLength={40}
            placeholder={t.onboarding.namePlaceholder}
            value={name}
            aria-invalid={invalid}
            aria-describedby="ob-name-error"
            onChange={(e) => {
              setName(e.target.value)
              setInvalid(false)
            }}
          />
          <p id="ob-name-error" className="field-error" role="alert">
            {invalid && (
              <>
                <CircleAlert size={14} /> {t.onboarding.nameError}
              </>
            )}
          </p>
        </div>
        <div className="ob-actions">
          <button type="submit" className="btn btn-primary btn-lg tactile">
            {t.common.continue}
            <ArrowRight />
          </button>
        </div>
      </form>
    </>
  )
}
