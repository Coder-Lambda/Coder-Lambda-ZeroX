import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BookOpen, ChevronRight } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import { t } from '../i18n/pt-BR'
import { BASE_MODULES, MODULE_ICONS } from '../modules/registry'
import { Dialog } from '../ui/Dialog'
import { useAlerts } from './useAlerts'

/** The Avisos center: what the rule book is warning about. Sidebar item on desktop, icon button in the top bar on phones. */
export default function AlertBell({ variant }: { variant: 'side' | 'top' }) {
  const { active } = useSession()
  const alerts = useAlerts()
  const [open, setOpen] = useState(false)
  const count = alerts.length
  const label = t.alerts.label(count)
  const badge = count > 0 && (
    <span className="alert-badge num" aria-hidden="true">
      {count > 99 ? '99+' : count}
    </span>
  )
  const groups = BASE_MODULES.map((m) => ({ module: m, items: alerts.filter((a) => a.module === m.id) })).filter(
    (g) => g.items.length > 0,
  )

  return (
    <>
      {variant === 'side' ? (
        <button type="button" className="nav-item as-button alert-bell" title={label} aria-label={label} onClick={() => setOpen(true)}>
          <Bell />
          <span className="nav-label">{t.alerts.title}</span>
          {badge}
        </button>
      ) : (
        <button type="button" className="btn btn-icon btn-secondary tactile alert-bell" aria-label={label} onClick={() => setOpen(true)}>
          <Bell />
          {badge}
        </button>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title={t.alerts.title}>
        <p className="text-2 mb-4 text-[13px]">{t.alerts.sub}</p>
        {groups.length === 0 ? (
          <p className="well placeholder-well">{t.alerts.empty}</p>
        ) : (
          <div className="alert-groups">
            {groups.map(({ module, items }) => {
              const Icon = MODULE_ICONS[module.id]
              return (
                <section key={module.id} aria-label={active?.labels[module.id] ?? t.modules[module.id].label}>
                  <h3 className="alert-group-title">
                    <Icon aria-hidden="true" />
                    {active?.labels[module.id] ?? t.modules[module.id].label}
                  </h3>
                  <ul className="people-list">
                    {items.map((alert) => (
                      <li key={alert.id}>
                        <Link to={alert.to} className="alert-row well tactile" onClick={() => setOpen(false)}>
                          <span className="alert-ping" aria-hidden="true" />
                          <span className="person-main">
                            <span className="person-name">{alert.text}</span>
                          </span>
                          <ChevronRight className="person-chevron" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}
        <Link to="/configuracoes/regras" className="btn btn-secondary tactile mt-4" onClick={() => setOpen(false)}>
          <BookOpen />
          {t.alerts.openRules}
        </Link>
      </Dialog>
    </>
  )
}
