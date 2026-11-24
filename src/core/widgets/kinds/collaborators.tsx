import { t } from '../../i18n/pt-BR'
import { compareNames, localDayOf } from '../../lib/format'
import { leaveOn } from '../../modules/collaborators/rules'
import { teamTotal } from '../../modules/collaborators/production/production'
import { wasOnList } from '../../modules/collaborators/store'
import { ChartTable } from '../../ui/charts/ChartTable'
import { ColumnChart } from '../../ui/charts/ColumnChart'
import { LineChart } from '../../ui/charts/LineChart'
import type { WidgetData } from '../data'
import { Delta, Figure, Muted, Rows, Sparkline, tileMoney, tileNumber } from '../parts'
import { bucketEnd, bucketLabel, buckets, CHART_SIZE, currentAndPrevious, SPARK_SIZE, tickEvery } from '../periods'
import type { Period, WidgetProps } from '../types'

const w = t.widgets
const period = (p: WidgetProps) => p.instance.period ?? 'daily'
/** Production helpers take any day inside the bucket. */
const dayIn = (key: string, p: Period) => (p === 'daily' ? key : p === 'monthly' ? `${key}-01` : `${key}-01-01`)

/** Absences that count (a day inside a special situation is not one) of employees still on the list. */
function absencesIn(data: WidgetData, key: string) {
  const onList = new Set(data.employees.filter((e) => e.status !== 'inactive').map((e) => e.id))
  return data.absences.filter((a) => a.date.startsWith(key) && onList.has(a.employee_id) && !leaveOn(data.leaves, a.employee_id, a.date))
}

export function TeamWidget({ data, extended }: WidgetProps) {
  const onList = data.employees.filter((e) => e.status !== 'inactive')
  const onLeave = onList.filter((e) => leaveOn(data.leaves, e.id, data.today)).length
  return (
    <>
      <Figure value={tileNumber(onList.length)} label={w.labels.employees} />
      <Rows
        rows={[
          { label: w.labels.partners, value: data.partners.length },
          { label: w.labels.suppliers, value: data.suppliers.length },
          ...(extended || onLeave > 0 ? [{ label: w.labels.onLeave, value: onLeave }] : []),
        ]}
      />
    </>
  )
}

export function AbsencesWidget(props: WidgetProps) {
  const { data, extended, instance, asTable } = props
  const p = period(props)
  if (instance.kind === 'chart') {
    const keys = buckets(p, data.today, CHART_SIZE[p])
    const values = keys.map((k) => absencesIn(data, k).length)
    return asTable ? (
      <ChartTable caption={w.types['collab.absences'].title} columns={[w.periodColumn[p], w.labels.absencesColumn]} rows={keys.map((k, i) => [bucketLabel(k, p), values[i]])} />
    ) : (
      <ColumnChart
        categories={keys.map((k) => bucketLabel(k, p))}
        showTick={tickEvery(keys.length)}
        tooltipTitle={(i) => bucketLabel(keys[i], p)}
        series={[{ name: w.labels.absencesColumn, values, color: 'var(--chart-accent)' }]}
        format={(v) => tileNumber(v)}
        axisFormat={(v) => tileNumber(v)}
        ariaLabel={`${w.types['collab.absences'].title} ${w.periodTitle[p]}`}
        height={220}
      />
    )
  }
  const { current, previous } = currentAndPrevious(p, data.today)
  const now = absencesIn(data, current)
  const before = absencesIn(data, previous).length
  const names = new Map(data.employees.map((e) => [e.id, e.name]))
  const byEmployee = new Map<string, number>()
  now.forEach((a) => byEmployee.set(a.employee_id, (byEmployee.get(a.employee_id) ?? 0) + 1))
  const who = [...byEmployee]
    .map(([id, count]) => ({ name: names.get(id) ?? '—', count }))
    .sort((a, b) => b.count - a.count || compareNames(a.name, b.name))
  return (
    <>
      <Figure
        value={now.length}
        label={w.labels.absences[p]}
        delta={<Delta change={now.length - before} versus={w.vs[p]} format={tileNumber} upIsGood={false} />}
      />
      {who.length === 0 ? (
        <Muted>{w.labels.noAbsences}</Muted>
      ) : (
        <Rows rows={who.slice(0, extended ? 6 : 3).map((x) => ({ key: x.name, label: x.name, value: x.count }))} />
      )}
    </>
  )
}

export function ProductionWidget(props: WidgetProps) {
  const { data, instance, asTable } = props
  const p = period(props)
  const items = data.rules.collaborators.productionItems
  const item = items.find((i) => i.id === instance.itemId) ?? items[0]
  if (!item) return <Muted>{w.unavailable.production}</Muted>
  const qty = (v: number) => `${tileNumber(v)} ${item.unit}`

  if (instance.kind === 'chart') {
    const keys = buckets(p, data.today, CHART_SIZE[p])
    const values = keys.map((k) => teamTotal(data.production, item.id, p, dayIn(k, p)))
    return asTable ? (
      <ChartTable caption={item.name} columns={[w.periodColumn[p], item.name]} rows={keys.map((k, i) => [bucketLabel(k, p), qty(values[i])])} />
    ) : (
      <ColumnChart
        categories={keys.map((k) => bucketLabel(k, p))}
        showTick={tickEvery(keys.length)}
        tooltipTitle={(i) => bucketLabel(keys[i], p)}
        series={[{ name: item.name, values, color: 'var(--chart-accent)' }]}
        format={qty}
        axisFormat={(v) => tileNumber(v)}
        ariaLabel={`${item.name} ${w.periodTitle[p]}`}
        height={220}
      />
    )
  }

  const { current, previous } = currentAndPrevious(p, data.today)
  const now = teamTotal(data.production, item.id, p, dayIn(current, p))
  const before = teamTotal(data.production, item.id, p, dayIn(previous, p))
  const spark = buckets(p, data.today, SPARK_SIZE[p]).map((k) => teamTotal(data.production, item.id, p, dayIn(k, p)))
  const target = item.per === 'team' ? item[p] : null
  return (
    <>
      <Figure
        value={qty(now)}
        label={`${item.name} · ${w.now[p].toLowerCase()}`}
        delta={<Delta change={now - before} versus={w.vs[p]} format={(v) => tileNumber(v)} upIsGood={item.kind === 'goal' ? true : null} />}
      />
      {target != null && (
        <Rows rows={[{ label: item.kind === 'goal' ? t.rules.collaborators.items.kinds.goal : t.rules.collaborators.items.kinds.ceiling, value: qty(target) }]} />
      )}
      <Sparkline values={spark} />
    </>
  )
}

/** Employees on the list at the end of a bucket. */
function headcountAt(data: WidgetData, day: string) {
  return data.employees.filter((e) => localDayOf(e.createdAt) <= day && wasOnList(e, day)).length
}

export function HeadcountWidget(props: WidgetProps) {
  const { data, instance, asTable } = props
  const p: Period = instance.period ?? 'monthly'
  if (instance.kind === 'chart') {
    const keys = buckets(p, data.today, CHART_SIZE[p])
    const values = keys.map((k) => headcountAt(data, bucketEnd(k, p, data.today)))
    return asTable ? (
      <ChartTable caption={w.types['collab.headcount'].title} columns={[w.periodColumn[p], w.labels.employeesColumn]} rows={keys.map((k, i) => [bucketLabel(k, p), values[i]])} />
    ) : (
      <LineChart
        labels={keys}
        showTick={tickEvery(keys.length)}
        tickLabel={(i) => bucketLabel(keys[i], p)}
        tooltipTitle={(i) => bucketLabel(keys[i], p)}
        series={[{ name: w.labels.employeesColumn, values, color: 'var(--chart-accent)', area: true }]}
        format={(v) => tileNumber(v)}
        axisFormat={(v) => tileNumber(v)}
        ariaLabel={w.types['collab.headcount'].title}
        height={220}
      />
    )
  }
  const { current, previous } = currentAndPrevious(p, data.today)
  const now = headcountAt(data, bucketEnd(current, p, data.today))
  const before = headcountAt(data, bucketEnd(previous, p, data.today))
  const spark = buckets(p, data.today, SPARK_SIZE[p]).map((k) => headcountAt(data, bucketEnd(k, p, data.today)))
  return (
    <>
      <Figure
        value={now}
        label={w.labels.employees}
        delta={<Delta change={now - before} versus={w.vs[p]} format={tileNumber} upIsGood={null} />}
      />
      <Sparkline values={spark} />
    </>
  )
}

export function SalariesWidget({ data }: WidgetProps) {
  const paid = data.employees.filter((e) => e.status !== 'inactive' && e.salary != null)
  if (paid.length === 0) return <Muted>{w.noData}</Muted>
  const total = paid.reduce((s, e) => s + (e.salary ?? 0), 0)
  const top = [...paid].sort((a, b) => (b.salary ?? 0) - (a.salary ?? 0))[0]
  return (
    <>
      <Figure value={tileMoney(total / paid.length)} label={w.labels.averageSalary} />
      <Rows
        rows={[
          { label: w.labels.maxSalary(top.name), value: tileMoney(top.salary ?? 0) },
          { label: w.labels.payroll, value: tileMoney(total) },
        ]}
      />
    </>
  )
}

