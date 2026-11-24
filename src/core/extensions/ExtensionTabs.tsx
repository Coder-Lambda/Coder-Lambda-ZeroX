import { Suspense } from 'react'
import { NavLink, Route } from 'react-router-dom'
import type { BaseModuleId } from '../config/types'
import { t } from '../i18n/pt-BR'
import type { ExtensionRoute } from './types'
import { useActiveExtension } from './useClientExtension'

/** The compartments a client ordered for one module's navbar (set-as-wish), and whether they are still loading. */
export function useExtensionTabs(module: BaseModuleId) {
  const extension = useActiveExtension()
  return {
    loading: extension.status === 'loading',
    tabs: extension.status === 'ready' ? (extension.extension.moduleTabs?.[module] ?? []) : [],
  }
}

/** Navbar links for the client's compartments, after the module's own tabs. */
export function ExtensionTabLinks({ base, tabs, search = '' }: { base: string; tabs: ExtensionRoute[]; search?: string }) {
  return tabs.map(({ path, label, icon: Icon }) => (
    <NavLink key={path} to={`${base}/x/${path}${search}`} className="module-tab tactile">
      {Icon && <Icon aria-hidden="true" />}
      {label}
    </NavLink>
  ))
}

/** <Route>s for the client's compartments, mounted under x/<path> inside the module's <Routes>. */
export function extensionTabRoutes(tabs: ExtensionRoute[]) {
  return tabs.map(({ path, Component }) => (
    <Route
      key={path}
      path={`x/${path}/*`}
      element={
        <Suspense fallback={<p className="text-2">{t.shell.loading}</p>}>
          <Component />
        </Suspense>
      }
    />
  ))
}
