import { useSession } from '../../auth/SessionProvider'
import { t } from '../../i18n/pt-BR'
import { PageHead } from '../../layout/PageHead'
import { WidgetGrid } from '../../widgets/WidgetGrid'
import { CustomizeLink } from './DashboardModule'

/** Dashboard principal: every widget, more complete, and charts of the whole business. */
export default function MainDashboardModule() {
  const { active } = useSession()
  if (!active) return null
  return (
    <>
      <PageHead
        title={active.labels.mainDashboard ?? t.modules.mainDashboard.label}
        sub={t.modules.mainDashboard.description}
        aside={<CustomizeLink />}
      />
      <WidgetGrid place="mainDashboard" />
    </>
  )
}
