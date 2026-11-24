import type { ReactNode } from 'react'
import type { ModuleId } from '../../config/types'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { MODULE_ICONS } from '../../modules/registry'
import { withName } from '../withName'

interface ModuleStepProps {
  module: ModuleId
  name: string
  value: boolean | undefined
  onAnswer: (enabled: boolean) => void
  /** Set-as-wish: what to build, shown after "Sim". */
  wish?: ReactNode
}

export function ModuleStep({ module, name, value, onAnswer, wish }: ModuleStepProps) {
  const copy = t.modules[module]
  const Icon = MODULE_ICONS[module]

  const answer = (enabled: boolean) => {
    haptic(enabled ? 'rigid' : 'soft')
    onAnswer(enabled)
  }

  return (
    <>
      <p className="ob-eyebrow">
        {t.onboarding.moduleEyebrow} · {copy.label}
      </p>
      <h1 className="ob-title" tabIndex={-1}>
        {withName(copy.question(name), name)}
      </h1>
      <div className="glass module-mock" aria-hidden="true">
        <span className="module-mock-icon">
          <Icon />
        </span>
        <span className="module-mock-lines">
          <span />
          <span />
          <span />
        </span>
      </div>
      <p className="text-2 text-base">{copy.description}</p>
      <div className="ob-choice">
        <button
          type="button"
          className="btn btn-secondary btn-lg tactile"
          aria-pressed={value === false}
          onClick={() => answer(false)}
        >
          {t.common.no}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg tactile"
          aria-pressed={value === true}
          onClick={() => answer(true)}
        >
          {t.common.yes}
        </button>
      </div>
      {wish}
    </>
  )
}
