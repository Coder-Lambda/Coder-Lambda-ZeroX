import { useState } from 'react'
import { Database, ShieldCheck } from 'lucide-react'
import type { DatabaseChoice } from '../../config/types'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { withName } from '../withName'

interface DatabaseStepProps {
  name: string
  value: DatabaseChoice | null
  onDone: (choice: DatabaseChoice) => void
}

/** Shell only: Supabase does nothing yet. Stores which provider, never credentials. */
export function DatabaseStep({ name, value, onDone }: DatabaseStepProps) {
  const [wantsDb, setWantsDb] = useState(value?.hasExisting ?? false)
  const [provider, setProvider] = useState<DatabaseChoice['provider']>(value?.provider ?? null)

  const providers: { id: NonNullable<DatabaseChoice['provider']>; label: string }[] = [
    { id: 'supabase', label: t.onboarding.dbSupabase },
    { id: 'other', label: t.onboarding.dbOther },
  ]

  return (
    <>
      <h1 className="ob-title" tabIndex={-1}>
        {withName(t.onboarding.dbTitle(name), name)}
      </h1>
      <p className="ob-sub">{t.onboarding.dbSub}</p>
      <div className="ob-choice">
        <button
          type="button"
          className="btn btn-secondary btn-lg tactile"
          aria-pressed={value?.hasExisting === false}
          onClick={() => {
            haptic('light')
            onDone({ hasExisting: false, provider: null })
          }}
        >
          {t.common.no}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg tactile"
          aria-pressed={wantsDb}
          aria-expanded={wantsDb}
          onClick={() => {
            haptic('light')
            setWantsDb(true)
          }}
        >
          {t.common.yes}
        </button>
      </div>
      {wantsDb && (
        <div className="glass ob-panel">
          <span className="field-label">{t.onboarding.dbWhich}</span>
          <div className="ob-chips">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip tactile"
                aria-pressed={provider === p.id}
                onClick={() => {
                  haptic('rigid')
                  setProvider(p.id)
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="ob-note">
            <ShieldCheck />
            {t.onboarding.dbNote}
          </p>
          <div>
            <button
              type="button"
              className="btn btn-primary tactile"
              disabled={!provider}
              onClick={() => {
                haptic('success')
                onDone({ hasExisting: true, provider })
              }}
            >
              <Database />
              {t.onboarding.dbConnect}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
