import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { compareNames, formatDateKey, normalize, todayKey } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import { Avatar } from '../../../ui/Avatar'
import { MonthCalendar } from '../../../ui/MonthCalendar'
import { StatTile } from '../../../ui/StatTile'
import { useRules } from '../../../rules/useRules'
import { countedAbsences, leaveOn, reachedAbsenceAlert } from '../rules'
import { setAbsent, useAbsences, useEmployees, useLeaves, wasOnList } from '../store'
import { EmployeesViewSwitch } from './EmployeesViewSwitch'

export function PresenceList() {
  const employees = useEmployees()
  const absences = useAbsences()
  const leaves = useLeaves()
  const rules = useRules().rules.collaborators
  const scope = useScope()
  const today = todayKey()
  const [selected, setSelected] = useState(today)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [query, setQuery] = useState('')

  const roster = useMemo(
    () =>
      employees
        .filter((e) => wasOnList(e, selected) && normalize(e.name).includes(normalize(query)))
        .sort((a, b) => compareNames(a.name, b.name)),
    [employees, selected, query],
  )

  const absentToday = useMemo(
    () => new Set(absences.filter((a) => a.date === selected).map((a) => a.employee_id)),
    [absences, selected],
  )

  const marks = useMemo(() => {
    const counts: Record<string, number> = {}
    absences.forEach((a) => {
      counts[a.date] = (counts[a.date] ?? 0) + 1
    })
    return counts
  }, [absences])

  const selectedMonth = selected.slice(0, 7)
  // A day inside a special situation (rule book) is not an absence.
  const monthAbsences = absences.filter((a) => a.date.startsWith(selectedMonth) && !leaveOn(leaves, a.employee_id, a.date)).length

  const toggle = (employeeId: string, absent: boolean) => {
    haptic(absent ? 'rigid' : 'soft')
    setAbsent(scope, employeeId, selected, absent)
  }

  return (
    <div className="module-body">
      <EmployeesViewSwitch current="presence" />
      <p className="text-2">{t.collab.presence.sub}</p>

      <div className="presence-layout">
        <div className="flex flex-col gap-[14px]">
          <div className="glass card">
            <MonthCalendar
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onSelect={setSelected}
              maxDate={today}
              marks={marks}
              markLabel={t.collab.presence.absencesCount}
            />
          </div>
          <div className="stat-row stat-row-2">
            <StatTile value={absentToday.size} label={t.collab.presence.dayAbsences} />
            <StatTile value={monthAbsences} label={t.collab.presence.monthAbsences} />
          </div>
        </div>

        <section className="glass card" aria-label={t.collab.presence.dayTitle(formatDateKey(selected))}>
          <div className="section-head">
            <h2 className="card-title mb-0 num">
              {selected === today ? t.collab.presence.today : t.collab.presence.dayTitle(formatDateKey(selected))}
            </h2>
            <label className="search-field search-field-sm">
              <Search aria-hidden="true" />
              <input
                className="input"
                type="search"
                placeholder={t.collab.presence.searchPlaceholder}
                aria-label={t.collab.presence.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          {employees.length === 0 ? (
            <p className="empty-state">{t.collab.presence.empty}</p>
          ) : roster.length === 0 ? (
            <p className="empty-state">{t.collab.employees.noResults}</p>
          ) : (
            <ul className="people-list">
              {roster.map((employee) => {
                const leave = leaveOn(leaves, employee.id, selected)
                const absent = !leave && absentToday.has(employee.id)
                const onVacation = employee.status === 'vacation' && selected === today
                const count = countedAbsences(absences, leaves, employee.id, selectedMonth)
                const alert = reachedAbsenceAlert(count, rules)
                return (
                  <li key={employee.id} className={`presence-row well${absent ? ' is-absent' : ''}${alert ? ' is-alert' : ''}`}>
                    <Avatar name={employee.name} size={36} />
                    <Link to={`/colaboradores/funcionarios/${employee.id}`} className="person-name presence-name">
                      {employee.name}
                    </Link>
                    {alert && (
                      <span className="tag tag-alert" title={t.collab.presence.alertAria(employee.name, count)}>
                        <span className="alert-ping" aria-hidden="true" />
                        <span className="sr-only">{t.collab.presence.alertAria(employee.name, count)}</span>
                        <span aria-hidden="true" className="num">
                          {count}
                        </span>
                      </span>
                    )}
                    {leave ? (
                      <span className="tag tag-vacation">{leave.typeName}</span>
                    ) : onVacation ? (
                      <span className="tag tag-vacation">{t.collab.presence.onVacation}</span>
                    ) : (
                      <button
                        type="button"
                        className="chip absent-chip tactile"
                        aria-pressed={absent}
                        aria-label={`${t.collab.presence.absent}: ${employee.name}`}
                        onClick={() => toggle(employee.id, !absent)}
                      >
                        {t.collab.presence.absent}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
