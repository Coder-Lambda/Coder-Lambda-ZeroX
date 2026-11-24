import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Factory, Table2, ChartBar } from 'lucide-react'
import { useScope } from '../../../data/useTable'
import { t } from '../../../i18n/pt-BR'
import { compareNames, formatDateKey, parseDecimal, todayKey } from '../../../lib/format'
import { haptic } from '../../../lib/haptic'
import type { ProductionItem, ProductionPeriod } from '../../../rules/types'
import { useRules } from '../../../rules/useRules'
import { Avatar } from '../../../ui/Avatar'
import { ChartTable } from '../../../ui/charts/ChartTable'
import { RankedBars } from '../../../ui/charts/RankedBars'
import { MonthCalendar } from '../../../ui/MonthCalendar'
import { Segmented } from '../../../ui/Segmented'
import { StatTile } from '../../../ui/StatTile'
import { EmployeesViewSwitch } from '../employees/EmployeesViewSwitch'
import { leaveOn } from '../rules'
import { setProduction, useEmployees, useLeaves, useProduction, wasOnList } from '../store'
import type { Employee, ProductionRecord } from '../types'
import { formatAmount, GoalMeter } from './GoalMeter'
import { PERIODS, teamTotal, totalsByEmployee } from './production'

const copy = t.collab.production

/** Funcionários › Produção: write what each employee made on a day, and compare the team by day, month and year. */
export function ProductionView() {
  const { productionItems: items } = useRules().rules.collaborators
  const [itemId, setItemId] = useState<string | null>(null)
  const item = items.find((i) => i.id === itemId) ?? items[0]

  if (!item) {
    return (
      <div className="module-body">
        <EmployeesViewSwitch current="production" />
        <div className="glass empty-hero">
          <span className="empty-hero-icon">
            <Factory />
          </span>
          <h2 className="empty-hero-title">{copy.emptyTitle}</h2>
          <p className="text-2">{copy.emptySub}</p>
          <Link to="/configuracoes/regras#regras-collaborators" className="btn btn-primary tactile">
            <BookOpen />
            {t.collab.leaves.openRules}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="module-body">
      <EmployeesViewSwitch current="production" />
      <p className="text-2">{copy.sub}</p>
      {items.length > 1 && (
        <div className="ob-chips" role="group" aria-label={copy.itemLabel}>
          {items.map((i) => (
            <button key={i.id} type="button" className="chip tactile" aria-pressed={i.id === item.id} onClick={() => setItemId(i.id)}>
              {i.name}
            </button>
          ))}
        </div>
      )}
      <ItemProduction key={item.id} item={item} />
    </div>
  )
}

function ItemProduction({ item }: { item: ProductionItem }) {
  const employees = useEmployees()
  const leaves = useLeaves()
  const records = useProduction()
  const today = todayKey()
  const [selected, setSelected] = useState(today)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const mine = useMemo(() => records.filter((r) => r.itemId === item.id), [records, item.id])
  const roster = useMemo(
    () => employees.filter((e) => wasOnList(e, selected)).sort((a, b) => compareNames(a.name, b.name)),
    [employees, selected],
  )
  const marks = useMemo(() => {
    const counts: Record<string, number> = {}
    mine.forEach((r) => {
      counts[r.date] = (counts[r.date] ?? 0) + 1
    })
    return counts
  }, [mine])
  const dayTotals = totalsByEmployee(mine, item.id, 'daily', selected)

  return (
    <>
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
              markLabel={copy.daysMarked}
            />
          </div>
          <div className="stat-row stat-row-2">
            <StatTile value={formatAmount(teamTotal(mine, item.id, 'daily', selected), item.unit)} label={copy.periodTotal.daily} />
            <StatTile value={formatAmount(teamTotal(mine, item.id, 'monthly', selected), item.unit)} label={copy.periodTotal.monthly} />
          </div>
          {item.per === 'team' && (
            <div className="glass card flex flex-col gap-3">
              {PERIODS.map((p) => (
                <GoalMeter key={p} item={item} period={p} value={teamTotal(mine, item.id, p, selected)} />
              ))}
            </div>
          )}
        </div>

        <section className="glass card" aria-label={copy.dayTitle(formatDateKey(selected))}>
          <h2 className="card-title num">{selected === today ? copy.today : copy.dayTitle(formatDateKey(selected))}</h2>
          {roster.length === 0 ? (
            <p className="empty-state">{copy.noEmployees}</p>
          ) : (
            <ul className="people-list">
              {roster.map((employee) => {
                const leave = leaveOn(leaves, employee.id, selected)
                return (
                  <li key={employee.id} className="production-row well">
                    <Avatar name={employee.name} size={36} />
                    <div className="production-row-main">
                      <Link to={`/colaboradores/funcionarios/${employee.id}`} className="person-name presence-name">
                        {employee.name}
                      </Link>
                      {item.per === 'employee' && !leave && (
                        <GoalMeter item={item} period="daily" value={dayTotals.get(employee.id) ?? 0} />
                      )}
                    </div>
                    {leave ? (
                      <span className="tag tag-vacation">{leave.typeName}</span>
                    ) : (
                      <QuantityInput item={item} employee={employee} day={selected} value={dayTotals.get(employee.id) ?? null} />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <Comparison item={item} records={mine} employees={employees} day={selected} />
    </>
  )
}

/** What one employee made on the day; saved when the field loses focus or Enter is pressed. */
function QuantityInput({ item, employee, day, value }: { item: ProductionItem; employee: Employee; day: string; value: number | null }) {
  const scope = useScope()
  const shown = value == null ? '' : value.toLocaleString('pt-BR', { maximumFractionDigits: 3, useGrouping: false })
  const [text, setText] = useState(shown)
  const [invalid, setInvalid] = useState(false)
  useEffect(() => setText(shown), [shown])

  const commit = () => {
    const parsed = text.trim() === '' ? null : parseDecimal(text, 3)
    if (text.trim() !== '' && (parsed == null || parsed < 0)) {
      setInvalid(true)
      haptic('error')
      return
    }
    setInvalid(false)
    if ((parsed ?? null) === value) return
    setProduction(scope, employee.id, item.id, day, parsed)
    haptic('soft')
  }

  return (
    <label className="production-input">
      <span className="sr-only">{copy.quantityLabel(employee.name, item.name)}</span>
      <input
        className="input num"
        inputMode="decimal"
        placeholder="0"
        value={text}
        aria-invalid={invalid || undefined}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
      />
      <span className="production-unit">{item.unit}</span>
    </label>
  )
}

/** Each employee's total for the day, month or year as ranked bars (or a table), with the team against its target. */
function Comparison({
  item,
  records,
  employees,
  day,
}: {
  item: ProductionItem
  records: ProductionRecord[]
  employees: Employee[]
  day: string
}) {
  const [period, setPeriod] = useState<ProductionPeriod>('monthly')
  const [asTable, setAsTable] = useState(false)
  const names = new Map(employees.map((e) => [e.id, e.name]))
  const rows = [...totalsByEmployee(records, item.id, period, day)]
    .map(([id, value]) => ({ label: names.get(id) ?? '—', value }))
    .sort((a, b) => b.value - a.value)
  const total = teamTotal(records, item.id, period, day)
  const target = item[period]
  const fmt = (v: number) => formatAmount(v, item.unit)

  return (
    <section className="glass card">
      <div className="section-head">
        <h2 className="card-title mb-0">{copy.summaryTitle}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[240px] max-w-full">
            <Segmented
              label={copy.summaryTitle}
              options={PERIODS.map((p) => copy.periods[p])}
              value={PERIODS.indexOf(period)}
              onChange={(i) => setPeriod(PERIODS[i])}
            />
          </div>
          <button type="button" className="btn btn-ghost tactile" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>
            {asTable ? <ChartBar /> : <Table2 />}
            {asTable ? t.finance.charts.showChart : t.finance.charts.showTable}
          </button>
        </div>
      </div>
      <p className="text-2 mb-3 text-[13px] num">
        {copy.periodTotal[period]}: {fmt(total)}
        {target != null &&
          ` · ${(item.kind === 'goal' ? copy.target.goal : copy.target.ceiling)(fmt(target))} ${item.per === 'team' ? copy.perTeam : copy.perEmployee}`}
      </p>
      {rows.length === 0 ? (
        <p className="text-2 text-[13px]">{copy.noRecords}</p>
      ) : asTable ? (
        <ChartTable
          caption={copy.chartAria(item.name, copy.periods[period])}
          columns={[t.collab.tabs.employees, item.name]}
          rows={rows.map((r) => [r.label, fmt(r.value)])}
        />
      ) : (
        <RankedBars
          items={rows}
          color="var(--chart-accent)"
          format={fmt}
          detail={total > 0 ? (v) => `${Math.round((v / total) * 100)}%` : undefined}
          ariaLabel={copy.chartAria(item.name, copy.periods[period])}
        />
      )}
    </section>
  )
}
