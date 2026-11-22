import { useState, type FormEvent } from 'react'
import { ArrowRight, CircleAlert } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { withName } from '../withName'

interface BusinessStepProps {
  name: string
  value: string
  onDone: (businessType: string) => void
}

export function BusinessStep({ name, value, onDone }: BusinessStepProps) {
  const [business, setBusiness] = useState(value)
  const [invalid, setInvalid] = useState(false)
  const [shaking, setShaking] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (business.trim().length < 2) {
      setInvalid(true)
      setShaking(true)
      haptic('error')
      return
    }
    haptic('light')
    onDone(business.trim())
  }

  return (
    <>
      <h1 className="ob-title" tabIndex={-1}>
        {withName(t.onboarding.businessTitle(name), name)}
      </h1>
      <p className="ob-sub">{t.onboarding.businessSub}</p>
      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <div className={`field${shaking ? ' shake' : ''}`} onAnimationEnd={() => setShaking(false)}>
          <label className="field-label" htmlFor="ob-business">
            {t.onboarding.businessLabel}
          </label>
          <input
            id="ob-business"
            className="input"
            data-autofocus
            maxLength={60}
            placeholder={t.onboarding.businessPlaceholder}
            value={business}
            aria-invalid={invalid}
            aria-describedby="ob-business-error"
            onChange={(e) => {
              setBusiness(e.target.value)
              setInvalid(false)
            }}
          />
          <p id="ob-business-error" className="field-error" role="alert">
            {invalid && (
              <>
                <CircleAlert size={14} /> {t.onboarding.businessError}
              </>
            )}
          </p>
        </div>
        <div className="ob-chips">
          {t.onboarding.businessSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="chip tactile"
              aria-pressed={business === suggestion}
              onClick={() => {
                haptic('rigid')
                setBusiness(suggestion)
                setInvalid(false)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="ob-actions mt-2">
          <button type="submit" className="btn btn-primary btn-lg tactile">
            {t.common.continue}
            <ArrowRight />
          </button>
        </div>
      </form>
    </>
  )
}
