import { useNavigate } from 'react-router-dom'
import { t } from '../../../i18n/pt-BR'
import { Segmented } from '../../../ui/Segmented'

/** Diretório | Lista de presença — the two views of the Funcionários sector. */
export function EmployeesViewSwitch({ current }: { current: 'directory' | 'presence' }) {
  const navigate = useNavigate()
  const views = ['directory', 'presence'] as const
  return (
    <div className="max-w-sm">
      <Segmented
        label={t.collab.tabs.employees}
        options={views.map((view) => t.collab.employees.views[view])}
        value={views.indexOf(current)}
        onChange={(index) =>
          navigate(views[index] === 'presence' ? '/colaboradores/funcionarios/presenca' : '/colaboradores/funcionarios')
        }
      />
    </div>
  )
}
