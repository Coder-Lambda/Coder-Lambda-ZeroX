import { useNavigate } from 'react-router-dom'
import { t } from '../../../i18n/pt-BR'
import { useRules } from '../../../rules/useRules'
import { Segmented } from '../../../ui/Segmented'

type View = 'directory' | 'presence' | 'production'

const PATHS: Record<View, string> = {
  directory: '/colaboradores/funcionarios',
  presence: '/colaboradores/funcionarios/presenca',
  production: '/colaboradores/funcionarios/producao',
}

/** Diretório | Lista de presença | Produção — the views of the Funcionários sector the rule book turned on. */
export function EmployeesViewSwitch({ current }: { current: View }) {
  const navigate = useNavigate()
  const { collaborators } = useRules().rules
  const views: View[] = [
    'directory',
    ...(collaborators.presenceList ? (['presence'] as const) : []),
    ...(collaborators.production ? (['production'] as const) : []),
  ]
  if (views.length < 2) return null
  return (
    <div className={views.length > 2 ? 'max-w-md' : 'max-w-sm'}>
      <Segmented
        label={t.collab.tabs.employees}
        options={views.map((view) => t.collab.employees.views[view])}
        value={Math.max(0, views.indexOf(current))}
        onChange={(index) => navigate(PATHS[views[index]])}
      />
    </div>
  )
}
