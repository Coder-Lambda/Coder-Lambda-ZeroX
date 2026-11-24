import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { useSession } from '../../auth/SessionProvider'
import { t } from '../../i18n/pt-BR'
import { PageHead } from '../../layout/PageHead'
import { WidgetGrid } from '../../widgets/WidgetGrid'

/** Bom dia (5h–11h59), boa tarde (12h–17h59), boa noite (18h–4h59). */
export function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return t.dashboard.greeting.morning
  if (hour >= 12 && hour < 18) return t.dashboard.greeting.afternoon
  return t.dashboard.greeting.night
}

/** The hour, kept current while the page stays open. */
function useHour() {
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() => {
    const timer = window.setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return hour
}

/** Dashboard inicial: the greeting and the day-to-day widgets, in the places the rule book sets. */
export default function DashboardModule() {
  const { active } = useSession()
  const hour = useHour()
  const [organizing, setOrganizing] = useState(false)
  if (!active) return null
  return (
    <>
      <PageHead
        title={active.labels.dashboard ?? t.modules.dashboard.label}
        sub={t.modules.dashboard.description}
        aside={<DashboardActions organizing={organizing} onOrganize={() => setOrganizing(!organizing)} />}
      />
      <div className="glass glass-feature hero mb-[14px]">
        <p className="hero-eyebrow">{active.businessType}</p>
        <p className="hero-title">{t.dashboard.greet(greetingFor(hour), active.userName)}</p>
        <p className="hero-sub">{t.dashboard.question}</p>
      </div>
      <WidgetGrid place="dashboard" organizing={organizing} />
    </>
  )
}

/** Organizar (move and remove widgets right here) and Personalizar (Configurações › Widgets). */
export function DashboardActions({ organizing, onOrganize }: { organizing: boolean; onOrganize: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={`btn tactile ${organizing ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={organizing} onClick={onOrganize}>
        {organizing ? <Check /> : <LayoutGrid />}
        {organizing ? t.dashboard.doneOrganizing : t.dashboard.organize}
      </button>
      <Link to="/configuracoes/widgets" className="btn btn-secondary tactile">
        <SlidersHorizontal />
        {t.widgets.customize}
      </Link>
    </div>
  )
}
