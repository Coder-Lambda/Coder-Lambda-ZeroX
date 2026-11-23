import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useOutletContext, useSearchParams } from 'react-router-dom'
import { useSession } from '../auth/SessionProvider'
import type { ExtensionState } from '../extensions/useClientExtension'
import { t } from '../i18n/pt-BR'
import { ModulePlaceholder } from '../modules/ModulePlaceholder'
import { BASE_MODULES, SET_AS_WISH_PATH, type ModuleDef } from '../modules/registry'
import { OnboardingFlow } from '../onboarding/OnboardingFlow'
import { PageHead } from './PageHead'

export function RequireBusiness({ children }: { children: ReactNode }) {
  const { account, businesses } = useSession()
  if (!account) return <Navigate to="/entrar" replace />
  if (businesses.length === 0) return <Navigate to="/onboarding" replace />
  return children
}

/** Onboarding runs once per business; a new one only starts from Configurações (?novo=1). */
export function OnboardingRoute() {
  const { account, businesses } = useSession()
  const [params] = useSearchParams()
  if (!account) return <Navigate to="/entrar" replace />
  const addingAnother = params.get('novo') === '1'
  if (businesses.length > 0 && !addingAnother) return <Navigate to="/" replace />
  return <OnboardingFlow account={account} prefillName={businesses.at(-1)?.userName ?? ''} />
}

export function HomeRedirect() {
  const { active } = useSession()
  const extension = useOutletContext<ExtensionState>()
  const first = BASE_MODULES.find((m) => active?.modules[m.id])
  if (first) return <Navigate to={`/${first.path}`} replace />
  if (extension.status === 'loading') return <p className="text-2">{t.shell.loading}</p>
  if (extension.status === 'ready' && extension.extension.routes.length > 0) {
    return <Navigate to={`/${SET_AS_WISH_PATH}`} replace />
  }
  return (
    <>
      <PageHead title={t.shell.noModulesTitle} />
      <div className="glass empty-state">{t.shell.noModulesSub}</div>
    </>
  )
}

export function ModuleRoute({ module }: { module: ModuleDef }) {
  const { active } = useSession()
  if (!active?.modules[module.id]) return <Navigate to="/" replace />
  const { Page } = module
  return Page ? <Page /> : <ModulePlaceholder module={module} />
}

/** Routes contributed by the client's extension, mounted under /set-as-wish. */
export function ExtensionRoutes() {
  const extension = useOutletContext<ExtensionState>()
  if (extension.status === 'off') return <Navigate to="/" replace />
  if (extension.status === 'loading') return <p className="text-2">{t.shell.loading}</p>
  const routes = extension.extension.routes
  if (routes.length === 0) return <Navigate to="/" replace />
  return (
    <Routes>
      <Route index element={<Navigate to={routes[0].path} replace />} />
      {routes.map(({ path, Component }) => (
        <Route key={path} path={`${path}/*`} element={<Component />} />
      ))}
      <Route path="*" element={<Navigate to={routes[0].path} replace />} />
    </Routes>
  )
}
