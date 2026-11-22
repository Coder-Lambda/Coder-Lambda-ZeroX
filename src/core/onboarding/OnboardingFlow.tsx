import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Account } from '../auth/SessionProvider'
import { useSession } from '../auth/SessionProvider'
import { CLIENT_ID, clientRegistry } from '../config/clientRegistry'
import { MODULE_IDS, type ClientConfig, type ModuleFlags, type ModuleId, type ThemeId } from '../config/types'
import { newId } from '../data/localDb'
import { t } from '../i18n/pt-BR'
import { applyTheme } from '../theme/applyTheme'
import { clearDraft, loadDraft, newDraft, saveDraft, type OnboardingDraft } from './draft'
import { IntroVideo } from './IntroVideo'
import { StepFrame } from './StepFrame'
import { buildSteps } from './steps'
import { BusinessStep } from './steps/BusinessStep'
import { DatabaseStep } from './steps/DatabaseStep'
import { ModuleStep } from './steps/ModuleStep'
import { NameStep } from './steps/NameStep'
import { ThemeStep } from './steps/ThemeStep'

export function OnboardingFlow({ account, prefillName }: { account: Account; prefillName: string }) {
  const { addBusiness } = useSession()
  const navigate = useNavigate()
  const steps = useMemo(() => buildSteps(clientRegistry.enabledModules), [])
  const [draft, setDraft] = useState<OnboardingDraft>(() => loadDraft(account.id) ?? newDraft(prefillName))
  const [initialTheme] = useState<ThemeId>(() => draft.theme ?? 'mono')

  // The app is black and white until a theme is chosen on the theme page.
  useEffect(() => {
    applyTheme(initialTheme)
  }, [initialTheme])

  useEffect(() => {
    saveDraft(account.id, draft)
  }, [account.id, draft])

  const advance = (patch: Partial<OnboardingDraft> = {}) =>
    setDraft((d) => ({ ...d, ...patch, stepIndex: Math.min(d.stepIndex + 1, steps.length - 1) }))

  const back = () => setDraft((d) => ({ ...d, stepIndex: Math.max(d.stepIndex - 1, 0) }))

  const answerModule = (module: ModuleId, enabled: boolean) =>
    setDraft((d) => ({
      ...d,
      modules: { ...d.modules, [module]: enabled },
      stepIndex: Math.min(d.stepIndex + 1, steps.length - 1),
    }))

  const finish = () => {
    const modules = Object.fromEntries(MODULE_IDS.map((id) => [id, draft.modules[id] === true])) as ModuleFlags
    const config: ClientConfig = {
      clientId: CLIENT_ID,
      businessId: newId('biz'),
      ownerAccountId: account.id,
      userName: draft.userName,
      theme: draft.theme ?? clientRegistry.theme,
      businessType: draft.businessType,
      database: draft.database ?? { hasExisting: false, provider: null },
      modules,
      layout: {},
      labels: {},
      createdAt: new Date().toISOString(),
    }
    clearDraft(account.id)
    addBusiness(config)
    navigate('/', { replace: true })
  }

  if (draft.phase === 'intro') {
    return <IntroVideo onDone={() => setDraft((d) => ({ ...d, phase: 'steps' }))} />
  }

  const index = Math.min(draft.stepIndex, steps.length - 1)
  const step = steps[index]
  const name = draft.userName

  if (step.kind === 'welcome') {
    return (
      <IntroVideo
        caption={t.onboarding.welcome(name)}
        sub={t.onboarding.welcomeSub}
        counter={t.onboarding.counter(index + 1, steps.length)}
        onDone={finish}
      />
    )
  }

  return (
    <StepFrame index={index} total={steps.length} onBack={back}>
      {step.kind === 'name' && <NameStep value={draft.userName} onDone={(userName) => advance({ userName })} />}
      {step.kind === 'theme' && (
        <ThemeStep
          name={name}
          selected={draft.theme}
          onPick={(theme) => applyTheme(theme, { animate: true, update: () => advance({ theme }) })}
        />
      )}
      {step.kind === 'business' && (
        <BusinessStep name={name} value={draft.businessType} onDone={(businessType) => advance({ businessType })} />
      )}
      {step.kind === 'database' && (
        <DatabaseStep name={name} value={draft.database} onDone={(database) => advance({ database })} />
      )}
      {step.kind === 'module' && (
        <ModuleStep
          module={step.module}
          name={name}
          value={draft.modules[step.module]}
          onAnswer={(enabled) => answerModule(step.module, enabled)}
        />
      )}
    </StepFrame>
  )
}
