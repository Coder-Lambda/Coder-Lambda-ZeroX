import { t } from '../../../i18n/pt-BR'
import type { EmployeeStatus } from '../types'

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return <span className={`tag tag-${status}`}>{t.collab.employees.status[status]}</span>
}
