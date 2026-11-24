import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, Database } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import type { BaseModuleId } from '../config/types'
import { t } from '../i18n/pt-BR'
import { PageHead } from '../layout/PageHead'
import { MODULE_ICONS } from '../modules/registry'
import { CollaboratorsChapter } from './chapters/CollaboratorsChapter'
import { DashboardChapter, MainDashboardChapter } from './chapters/DashboardChapter'
import { BusinessFinanceChapter, PersonalFinanceChapter } from './chapters/FinanceChapters'
import { StockChapter } from './chapters/StockChapter'
import { Chapter } from './parts'
import './rules.css'

/** Chapters in the order of the modules; each one only exists for a module chosen in the onboarding. */
const CHAPTERS: { id: BaseModuleId; sub: string; body: ReactNode }[] = [
  { id: 'dashboard', sub: t.rules.dashboard.sub, body: <DashboardChapter /> },
  { id: 'collaborators', sub: t.rules.collaborators.sub, body: <CollaboratorsChapter /> },
  { id: 'personalFinance', sub: t.rules.personalFinance.sub, body: <PersonalFinanceChapter /> },
  { id: 'stock', sub: t.rules.stock.sub, body: <StockChapter /> },
  { id: 'businessFinance', sub: t.rules.businessFinance.sub, body: <BusinessFinanceChapter /> },
  { id: 'mainDashboard', sub: t.rules.dashboard.mainSub, body: <MainDashboardChapter /> },
]

/** Scrolls the content area to a chapter (smoothly, unless the user asked for reduced motion). */
function goTo(id: string) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(`regras-${id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export default function RuleBookPage() {
  const { active } = useSession()
  const { hash } = useLocation()
  // Links like /configuracoes/regras#regras-collaborators open the book on that chapter.
  useEffect(() => {
    if (hash.startsWith('#regras-')) requestAnimationFrame(() => goTo(hash.slice('#regras-'.length)))
  }, [hash])
  if (!active) return null
  const chapters = CHAPTERS.filter((c) => active.modules[c.id])
  const labelFor = (id: BaseModuleId) => active.labels[id] ?? t.modules[id].label
  const { database } = active
  const storage =
    database.hasExisting && database.provider
      ? t.rules.storageDatabase(t.rules.providers[database.provider])
      : t.rules.storageLocal

  return (
    <>
      <Link to="/configuracoes" className="back-link mb-3">
        <ArrowLeft />
        {t.rules.back}
      </Link>
      <PageHead
        title={t.rules.title}
        sub={t.rules.sub}
        aside={
          <span className="badge">
            <Check size={14} /> {t.rules.autosave}
          </span>
        }
      />

      <p className="ob-note rule-storage">
        <Database aria-hidden="true" />
        {storage}
      </p>

      {chapters.length === 0 ? (
        <p className="glass empty-state">{t.rules.noChapters}</p>
      ) : (
        <>
          <nav className="rule-index ob-chips" aria-label={t.rules.chaptersLabel}>
            {chapters.map((c, i) => {
              const Icon = MODULE_ICONS[c.id]
              return (
                <a
                  key={c.id}
                  href={`#regras-${c.id}`}
                  className="chip tactile"
                  onClick={(event) => {
                    event.preventDefault()
                    goTo(c.id)
                  }}
                >
                  <span className="num">{i + 1}</span>
                  <Icon size={14} aria-hidden="true" />
                  {labelFor(c.id)}
                </a>
              )
            })}
          </nav>
          <div className="rule-book">
            {chapters.map((c, i) => (
              <Chapter key={c.id} id={c.id} number={i + 1} icon={MODULE_ICONS[c.id]} title={labelFor(c.id)} sub={c.sub}>
                {c.body}
              </Chapter>
            ))}
          </div>
        </>
      )}
    </>
  )
}
