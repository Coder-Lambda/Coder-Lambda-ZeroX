import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, Settings, WandSparkles, type LucideIcon } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import type { ModuleId } from '../config/types'
import { readPref, writePref } from '../data/localDb'
import { useClientExtension } from '../extensions/useClientExtension'
import { t } from '../i18n/pt-BR'
import { BASE_MODULES, SET_AS_WISH_PATH } from '../modules/registry'
import { Blobs } from '../ui/Blobs'
import { Logo } from '../ui/Logo'
import { Toaster } from '../ui/Toaster'

// Reads every module's tables to evaluate the rule book, so it loads on its own chunk.
const AlertBell = lazy(() => import('../rules/AlertBell'))

interface NavEntry {
  to: string
  label: string
  icon: LucideIcon
}

export function AppShell() {
  const { active } = useSession()
  const enabled = active?.modules
  const extensionState = useClientExtension(enabled?.setAsWish === true)
  const [collapsed, setCollapsed] = useState(() => readPref('sidebar-collapsed') === '1')
  const { pathname } = useLocation()
  const contentRef = useRef<HTMLElement>(null)

  // The content area scrolls, not the window: start each new page at the top.
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  if (!active || !enabled) return null

  const extension = extensionState.status === 'ready' ? extensionState.extension : null
  const labelFor = (id: ModuleId) => extension?.labels[id] ?? active.labels[id] ?? t.modules[id].label

  const toEntry = (m: (typeof BASE_MODULES)[number]): NavEntry => ({ to: `/${m.path}`, label: labelFor(m.id), icon: m.icon })
  // The Dashboard is the first item and the Dashboard principal always the last one, after the client's own pages.
  const moduleEntries: NavEntry[] = BASE_MODULES.filter((m) => enabled[m.id] && m.id !== 'mainDashboard').map(toEntry)
  const mainEntries: NavEntry[] = BASE_MODULES.filter((m) => enabled[m.id] && m.id === 'mainDashboard').map(toEntry)
  const extensionEntries: NavEntry[] = (extension?.routes ?? []).map((r) => ({
    to: `/${SET_AS_WISH_PATH}/${r.path}`,
    label: r.label,
    icon: r.icon ?? WandSparkles,
  }))
  const allEntries = [...moduleEntries, ...extensionEntries, ...mainEntries]

  const toggleSidebar = () => {
    writePref('sidebar-collapsed', collapsed ? '0' : '1')
    setCollapsed(!collapsed)
  }

  return (
    <>
      <a className="skip-link" href="#conteudo">
        {t.common.skipToContent}
      </a>
      <div className="frame app-frame">
        <Blobs />

        <aside className={`sidebar glass${collapsed ? ' is-collapsed' : ''}`}>
          <div className="sidebar-brand">
            <Logo />
          </div>
          <nav className="sidebar-nav" aria-label={t.shell.navModules}>
            {moduleEntries.map((entry) => (
              <SideItem key={entry.to} entry={entry} />
            ))}
            {extensionEntries.length > 0 && (
              <>
                <p className="nav-group-label">{labelFor('setAsWish')}</p>
                {extensionEntries.map((entry) => (
                  <SideItem key={entry.to} entry={entry} />
                ))}
              </>
            )}
            {mainEntries.length > 0 && extensionEntries.length > 0 && <hr className="nav-divider" />}
            {mainEntries.map((entry) => (
              <SideItem key={entry.to} entry={entry} />
            ))}
          </nav>
          <div className="sidebar-foot">
            <div className="sidebar-business">
              <strong>{active.businessType}</strong>
              <span>{active.userName}</span>
            </div>
            <Suspense fallback={null}>
              <AlertBell variant="side" />
            </Suspense>
            <SideItem entry={{ to: '/configuracoes', label: t.shell.settings, icon: Settings }} />
            <button
              type="button"
              className="nav-item as-button"
              onClick={toggleSidebar}
              aria-label={collapsed ? t.shell.expand : t.shell.collapse}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              <span className="nav-label">{collapsed ? t.shell.expand : t.shell.collapse}</span>
            </button>
          </div>
        </aside>

        <header className="topbar glass">
          <Logo />
          <div className="topbar-actions">
            <Suspense fallback={null}>
              <AlertBell variant="top" />
            </Suspense>
            <NavLink
              to="/configuracoes"
              className="btn btn-icon btn-secondary tactile"
              aria-label={t.shell.settings}
            >
              <Settings />
            </NavLink>
          </div>
        </header>

        <main id="conteudo" ref={contentRef} className="app-content" tabIndex={-1}>
          <Suspense fallback={<p className="text-2">{t.shell.loading}</p>}>
            <Outlet context={extensionState} />
          </Suspense>
        </main>

        {allEntries.length > 0 && (
          <nav className="bottombar glass" aria-label={t.shell.navModules}>
            {allEntries.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className="tab-item">
                <Icon />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
      <Toaster />
    </>
  )
}

function SideItem({ entry: { to, label, icon: Icon } }: { entry: NavEntry }) {
  return (
    <NavLink to={to} className="nav-item" title={label}>
      <Icon />
      <span className="nav-label">{label}</span>
    </NavLink>
  )
}
