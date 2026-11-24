import { Link } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useSession } from '../../auth/SessionProvider'
import { t } from '../../i18n/pt-BR'
import { PageHead } from '../../layout/PageHead'
import { WidgetGrid } from '../../widgets/WidgetGrid'

/** Dashboard inicial: the greeting and the day-to-day widgets, in the places the rule book sets. */
export default function DashboardModule() {
  const { active } = useSession()
  if (!active) return null
  return (
    <>
      <PageHead
        title={active.labels.dashboard ?? t.modules.dashboard.label}
        sub={t.modules.dashboard.description}
        aside={<CustomizeLink />}
      />
      <div className="glass glass-feature hero mb-[14px]">
        <p className="hero-eyebrow">{active.businessType}</p>
        <p className="hero-title">
          {t.shell.greeting} {active.userName}
        </p>
      </div>
      <WidgetGrid place="dashboard" />
    </>
  )
}

export function CustomizeLink() {
  return (
    <Link to="/configuracoes/widgets" className="btn btn-secondary tactile">
      <SlidersHorizontal />
      {t.widgets.customize}
    </Link>
  )
}
