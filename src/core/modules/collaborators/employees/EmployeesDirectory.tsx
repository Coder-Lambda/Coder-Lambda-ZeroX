import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileSpreadsheet, Plus, Search, Users } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { compareNames, formatDateTime, formatMoney, normalize } from '../../../lib/format'
import { PeopleList, type PersonItem } from '../PeopleList'
import { StatTile } from '../../../ui/StatTile'
import { collaboratorStats, useAbsences, useEmployees } from '../store'
import type { Employee, EmployeeStatus } from '../types'
import { EmployeesViewSwitch } from './EmployeesViewSwitch'
import { StatusBadge } from './StatusBadge'

type Filter = 'all' | EmployeeStatus
type Sort = 'alpha' | 'date'
const FILTERS: Filter[] = ['all', 'active', 'inactive', 'vacation']

interface Props {
  onAdd: () => void
  onImport: () => void
}

export function EmployeesDirectory({ onAdd, onImport }: Props) {
  const employees = useEmployees()
  const absences = useAbsences()
  // Kept in the URL so coming back from an employee card restores the same view.
  const [params, setParams] = useSearchParams()
  const filter = (FILTERS.find((f) => f === params.get('situacao')) ?? 'all') as Filter
  const sort: Sort = params.get('ordem') === 'data' ? 'date' : 'alpha'
  const query = params.get('busca') ?? ''

  // Built from the live URL: React Router's updater doesn't queue, so two quick clicks would drop one.
  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(window.location.search)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const stats = collaboratorStats(employees, absences)

  const items = useMemo<PersonItem[]>(() => {
    const q = normalize(query)
    const visible = employees.filter(
      (e) => (filter === 'all' || e.status === filter) && (!q || normalize(e.name).includes(q)),
    )
    const sorted = [...visible].sort((a, b) =>
      sort === 'alpha' ? compareNames(a.name, b.name) : b.createdAt.localeCompare(a.createdAt),
    )
    return sorted.map((e) => toItem(e, sort))
  }, [employees, filter, sort, query])

  if (employees.length === 0) {
    return (
      <div className="module-body">
        <div className="glass empty-hero">
          <span className="empty-hero-icon">
            <Users />
          </span>
          <h2 className="empty-hero-title">{t.collab.employees.emptyTitle}</h2>
          <p className="text-2">{t.collab.employees.emptySub}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-secondary tactile" onClick={onImport}>
              <FileSpreadsheet />
              {t.collab.importSheet}
            </button>
            <button type="button" className="btn btn-primary tactile" onClick={onAdd}>
              <Plus />
              {t.collab.add.employees}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="module-body">
      <EmployeesViewSwitch current="directory" />

      <div className="stat-row">
        <StatTile value={stats.totalEmployees} label={t.collab.employees.stats.total} />
        <StatTile value={formatMoney(stats.totalSalary)} label={t.collab.employees.stats.payroll} />
        <StatTile value={formatMoney(stats.averageSalary)} label={t.collab.employees.stats.average} />
        <StatTile value={`${stats.absencesToday} · ${stats.absencesMonth}`} label={t.collab.employees.stats.absences} />
      </div>

      <div className="glass card">
        <div className="list-toolbar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder={t.collab.employees.searchPlaceholder}
              aria-label={t.collab.employees.searchPlaceholder}
              value={query}
              onChange={(e) => setParam('busca', e.target.value || null)}
            />
          </label>
          <div className="ob-chips" role="group" aria-label={t.collab.employees.filterLabel}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className="chip tactile"
                aria-pressed={filter === f}
                onClick={() => setParam('situacao', f === 'all' ? null : f)}
              >
                {t.collab.employees.filters[f]}
              </button>
            ))}
          </div>
          <div className="ob-chips" role="group" aria-label={t.collab.employees.sortLabel}>
            {(['alpha', 'date'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="chip tactile"
                aria-pressed={sort === s}
                onClick={() => setParam('ordem', s === 'date' ? 'data' : null)}
              >
                {t.collab.employees.sort[s]}
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="empty-state">{t.collab.employees.noResults}</p>
        ) : (
          <PeopleList items={items} grouped={sort === 'alpha'} />
        )}
      </div>
    </div>
  )
}

function toItem(employee: Employee, sort: Sort): PersonItem {
  const contact = employee.phone || employee.email
  return {
    id: employee.id,
    name: employee.name,
    to: `/colaboradores/funcionarios/${employee.id}`,
    removed: employee.status === 'inactive',
    sub: sort === 'date' ? t.collab.employees.addedOn(formatDateTime(employee.createdAt)) : contact || undefined,
    aside: employee.status !== 'active' ? <StatusBadge status={employee.status} /> : undefined,
  }
}
