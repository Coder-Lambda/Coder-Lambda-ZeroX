import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { useSession } from '../../auth/SessionProvider'
import { t } from '../../i18n/pt-BR'
import { PageHead } from '../../layout/PageHead'
import { MAIN_DASHBOARD_PAGES, pageName } from '../../rules/defaults'
import { useRules } from '../../rules/useRules'
import { toast } from '../../ui/Toaster'
import { WidgetGrid } from '../../widgets/WidgetGrid'
import { DashboardActions } from './DashboardModule'

const PAGES = Array.from({ length: MAIN_DASHBOARD_PAGES }, (_, i) => i)

/**
 * Dashboard principal: the bigger dashboard, with its own navbar of three pages the client names.
 * Each page holds up to 5 widgets and 2 charts, organized right here or in Configurações › Widgets.
 */
export default function MainDashboardModule() {
  const { active } = useSession()
  const { rules } = useRules()
  const [organizing, setOrganizing] = useState(false)
  if (!active) return null

  return (
    <>
      <PageHead
        title={active.labels.mainDashboard ?? t.modules.mainDashboard.label}
        sub={t.modules.mainDashboard.description}
        aside={<DashboardActions organizing={organizing} onOrganize={() => setOrganizing(!organizing)} />}
      />

      <div className="module-nav glass">
        <nav className="module-tabs" aria-label={t.dashboard.pagesLabel}>
          {PAGES.map((page) => (
            <NavLink key={page} to={`/dashboard-principal/${page + 1}`} className="module-tab tactile">
              <span className="md-step num" aria-hidden="true">
                {page + 1}
              </span>
              {pageName(rules.mainDashboard, page)}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route index element={<Navigate to="1" replace />} />
        <Route path=":page" element={<MainPage organizing={organizing} />} />
        <Route path="*" element={<Navigate to="1" replace />} />
      </Routes>
    </>
  )
}

function MainPage({ organizing }: { organizing: boolean }) {
  const { page: param } = useParams()
  const page = Number(param) - 1
  if (!Number.isInteger(page) || page < 0 || page >= MAIN_DASHBOARD_PAGES) return <Navigate to="../1" replace />
  return (
    <>
      {organizing && <RenamePage key={page} page={page} />}
      <WidgetGrid key={page} place="mainDashboard" page={page} organizing={organizing} />
    </>
  )
}

/** While organizing, the current page's name can be changed (empty = "Página n"). */
function RenamePage({ page }: { page: number }) {
  const { rules, saveChapter } = useRules()
  const saved = rules.mainDashboard.pages[page]?.name ?? ''
  const [text, setText] = useState(saved)
  useEffect(() => setText(saved), [saved])

  const commit = () => {
    const name = text.trim().slice(0, 40)
    if (name === saved) return
    saveChapter('mainDashboard', (c) => ({ pages: c.pages.map((p, i) => (i === page ? { ...p, name } : p)) }))
    toast(t.dashboard.renamed(name || t.page(page + 1)))
  }

  return (
    <div className="md-rename">
      <div className="field">
        <label className="field-label" htmlFor="md-page-name">
          {t.dashboard.pageName(page + 1)}
        </label>
        <input
          id="md-page-name"
          className="input"
          value={text}
          maxLength={40}
          placeholder={t.page(page + 1)}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
        />
      </div>
      <p className="text-2 text-[13px]">{t.dashboard.organizeHint}</p>
    </div>
  )
}
