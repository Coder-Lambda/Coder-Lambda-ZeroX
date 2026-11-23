import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider, useSession } from './core/auth/SessionProvider'
import { SignInPage } from './core/auth/SignInPage'
import { AppShell } from './core/layout/AppShell'
import { ExtensionRoutes, HomeRedirect, ModuleRoute, OnboardingRoute, RequireBusiness } from './core/layout/routes'
import { BASE_MODULES, SET_AS_WISH_PATH } from './core/modules/registry'
import { SettingsPage } from './core/settings/SettingsPage'
import { applyTheme } from './core/theme/applyTheme'

/** Outside the onboarding, the theme always follows the active business (mono when signed out). */
function ThemeSync() {
  const { active } = useSession()
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/onboarding')) return
    applyTheme(pathname.startsWith('/entrar') || !active ? 'mono' : active.theme)
  }, [pathname, active])
  return null
}

export function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ThemeSync />
        <Routes>
          <Route path="/entrar" element={<SignInPage />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route
            element={
              <RequireBusiness>
                <AppShell />
              </RequireBusiness>
            }
          >
            <Route index element={<HomeRedirect />} />
            {BASE_MODULES.map((module) => (
              <Route key={module.id} path={`${module.path}/*`} element={<ModuleRoute module={module} />} />
            ))}
            <Route path={`${SET_AS_WISH_PATH}/*`} element={<ExtensionRoutes />} />
            <Route path="configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  )
}
