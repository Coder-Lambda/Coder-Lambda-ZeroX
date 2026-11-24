import { t } from '../../i18n/pt-BR'
import { formatMoney } from '../../lib/format'
import { payroll } from '../../modules/finance/business/payroll'
import { stockPurchases } from '../../modules/finance/business/summary'
import { balanceAt, categoryBreakdown } from '../../modules/finance/store'
import type { FinanceBook, FinEntry } from '../../modules/finance/types'
import { ChartLegend } from '../../ui/charts/ChartTooltip'
import { ChartTable } from '../../ui/charts/ChartTable'
import { ColumnChart } from '../../ui/charts/ColumnChart'
import { LineChart } from '../../ui/charts/LineChart'
import { RankedBars } from '../../ui/charts/RankedBars'
import { Delta, Figure, Muted, Rows, Sparkline, tileMoney } from '../parts'
import { bucketEnd, bucketLabel, buckets, CHART_SIZE, currentAndPrevious, SPARK_SIZE, sumIn, tickEvery } from '../periods'
import type { WidgetProps } from '../types'

const w = t.widgets
const round = (v: number) => Math.round(v * 100) / 100

function flowsIn(entries: FinEntry[], key: string) {
  const inflow = sumIn(entries.filter((e) => e.type === 'in'), key, (e) => e.date, (e) => e.amount)
  const outflow = sumIn(entries.filter((e) => e.type === 'out'), key, (e) => e.date, (e) => e.amount)
  return { inflow: round(inflow), outflow: round(outflow), result: round(inflow - outflow) }
}

/** Today's balance across the book's accounts, against yesterday's. */
export function BalanceWidget({ data, book }: WidgetProps & { book: FinanceBook }) {
  const fin = data.finance[book]
  if (fin.accounts.length === 0) return <Muted>{w.labels.noAccounts}</Muted>
  const days = buckets('daily', data.today, SPARK_SIZE.daily)
  const series = days.map((d) => balanceAt(fin, d))
  const now = series[series.length - 1]
  const before = series[series.length - 2]
  return (
    <>
      <Figure
        value={tileMoney(now)}
        label={w.labels.balance(fin.accounts.length)}
        delta={<Delta change={now - before} versus={w.vs.daily} format={tileMoney} />}
      />
      <Sparkline values={series} />
    </>
  )
}

/** What came in and went out in the period. */
export function FlowsWidget({ data, book, instance }: WidgetProps & { book: FinanceBook }) {
  const p = instance.period ?? 'daily'
  const { current } = currentAndPrevious(p, data.today)
  const flows = flowsIn(data.finance[book].entries, current)
  return (
    <>
      <div className="wg-pair">
        <Figure value={tileMoney(flows.inflow)} label={w.labels.inflow} />
        <Figure value={tileMoney(flows.outflow)} label={w.labels.outflow} />
      </div>
      <Rows rows={[{ label: w.labels.result[p], value: tileMoney(flows.result) }]} />
    </>
  )
}

/** Gains or losses (in − out) of the period and how they moved; the chart shows in vs out per bucket. */
export function ResultWidget({ data, book, instance, asTable }: WidgetProps & { book: FinanceBook }) {
  const p = instance.period ?? 'daily'
  const entries = data.finance[book].entries
  if (instance.kind === 'chart') {
    const keys = buckets(p, data.today, CHART_SIZE[p])
    const flows = keys.map((k) => flowsIn(entries, k))
    const series = [
      { name: w.labels.inflow, values: flows.map((f) => f.inflow), color: 'var(--series-1)' },
      { name: w.labels.outflow, values: flows.map((f) => f.outflow), color: 'var(--series-2)' },
    ]
    return asTable ? (
      <ChartTable
        caption={w.types[`${book}.result`].title}
        columns={[w.periodColumn[p], w.labels.inflow, w.labels.outflow, w.labels.resultColumn]}
        rows={keys.map((k, i) => [bucketLabel(k, p), formatMoney(flows[i].inflow), formatMoney(flows[i].outflow), formatMoney(flows[i].result)])}
      />
    ) : (
      <>
        <ChartLegend rows={series.map((s) => ({ name: s.name, color: s.color, shape: 'rect' as const }))} />
        <ColumnChart
          categories={keys.map((k) => bucketLabel(k, p))}
          showTick={tickEvery(keys.length)}
          tooltipTitle={(i) => bucketLabel(keys[i], p)}
          series={series}
          format={formatMoney}
          ariaLabel={`${w.types[`${book}.result`].title} ${w.periodTitle[p]}`}
          height={200}
        />
      </>
    )
  }
  const { current, previous } = currentAndPrevious(p, data.today)
  const now = flowsIn(entries, current).result
  const before = flowsIn(entries, previous).result
  const spark = buckets(p, data.today, SPARK_SIZE[p]).map((k) => flowsIn(entries, k).result)
  return (
    <>
      <Figure
        value={<span className={now < 0 ? 'is-negative' : undefined}>{tileMoney(now)}</span>}
        label={w.labels.result[p]}
        delta={<Delta change={now - before} versus={w.vs[p]} format={tileMoney} />}
      />
      <Sparkline values={spark} />
    </>
  )
}

/** The balance at the end of each day / month / year. */
export function BalanceTrendWidget({ data, book, instance, asTable }: WidgetProps & { book: FinanceBook }) {
  const p = instance.period ?? 'daily'
  const fin = data.finance[book]
  if (fin.accounts.length === 0) return <Muted>{w.labels.noAccounts}</Muted>
  const count = instance.kind === 'chart' ? CHART_SIZE[p] : SPARK_SIZE[p]
  const keys = buckets(p, data.today, count)
  const values = keys.map((k) => balanceAt(fin, bucketEnd(k, p, data.today)))
  if (instance.kind === 'chart') {
    return asTable ? (
      <ChartTable
        caption={w.types[`${book}.balanceTrend`].title}
        columns={[w.periodColumn[p], w.labels.balanceColumn]}
        rows={keys.map((k, i) => [bucketLabel(k, p), formatMoney(values[i])])}
      />
    ) : (
      <LineChart
        labels={keys}
        showTick={tickEvery(keys.length)}
        tickLabel={(i) => bucketLabel(keys[i], p)}
        tooltipTitle={(i) => bucketLabel(keys[i], p)}
        series={[{ name: w.labels.balanceColumn, values, color: 'var(--chart-accent)', area: true }]}
        format={formatMoney}
        ariaLabel={`${w.types[`${book}.balanceTrend`].title} ${w.periodTitle[p]}`}
        height={220}
      />
    )
  }
  const now = values[values.length - 1]
  const before = values[values.length - 2] ?? now
  return (
    <>
      <Figure
        value={tileMoney(now)}
        label={w.labels.balanceEnd[p]}
        delta={<Delta change={now - before} versus={w.vs[p]} format={tileMoney} />}
      />
      <Sparkline values={values} />
    </>
  )
}

/** The month's spending by category: a ranked list (widget) or ranked bars (chart). */
function CategoriesWidget({ entries, month, asTable, chart, title }: { entries: FinEntry[]; month: string; asTable: boolean; chart: boolean; title: string }) {
  const ranked = categoryBreakdown(entries, month)
  const total = round(ranked.reduce((s, r) => s + r.value, 0))
  if (ranked.length === 0) return <Muted>{w.labels.noSpending}</Muted>
  if (chart) {
    return asTable ? (
      <ChartTable caption={title} columns={[w.labels.category, w.labels.amount]} rows={ranked.map((r) => [r.label, formatMoney(r.value)])} />
    ) : (
      <RankedBars
        items={ranked}
        color="var(--chart-accent)"
        format={formatMoney}
        detail={(v) => `${Math.round((v / total) * 100)}%`}
        ariaLabel={title}
      />
    )
  }
  return (
    <>
      <Figure value={tileMoney(total)} label={w.labels.monthSpending} />
      <Rows rows={ranked.slice(0, 3).map((r) => ({ key: r.label, label: r.label, value: tileMoney(r.value) }))} />
    </>
  )
}

export function ExpensesWidget({ data, instance, asTable }: WidgetProps) {
  return (
    <CategoriesWidget
      entries={data.finance.personal.entries}
      month={data.today.slice(0, 7)}
      asTable={asTable}
      chart={instance.kind === 'chart'}
      title={w.types['personal.expenses'].title}
    />
  )
}

/** Expenses the business typed itself: not the payroll, not stock purchases. */
export function ExtraCostsWidget({ data, instance, asTable }: WidgetProps) {
  return (
    <CategoriesWidget
      entries={data.finance.business.entries.filter((e) => !e.source)}
      month={data.today.slice(0, 7)}
      asTable={asTable}
      chart={instance.kind === 'chart'}
      title={w.types['business.extraCosts'].title}
    />
  )
}

export function PayrollWidget({ data }: WidgetProps) {
  const month = data.today.slice(0, 7)
  const sheet = payroll(data.employees, month, {
    absences: data.absences,
    leaves: data.leaves,
    collaborators: data.rules.collaborators,
    payRules: data.rules.businessFinance.payRules,
  })
  const paid = round(
    data.finance.business.entries.filter((e) => e.source === 'payroll' && e.sourceRef === month).reduce((s, e) => s + e.amount, 0),
  )
  if (sheet.rows.length === 0) return <Muted>{w.labels.noEmployees}</Muted>
  return (
    <>
      <Figure value={tileMoney(sheet.total)} label={w.labels.payrollMonth} />
      <Rows
        rows={[
          { label: w.labels.paid, value: tileMoney(paid) },
          { label: w.labels.toPay, value: tileMoney(Math.max(0, round(sheet.total - paid))) },
        ]}
      />
    </>
  )
}

/** What left the stock this month at the items' unit value, and what was bought for it. */
export function StockSoldWidget({ data }: WidgetProps) {
  const month = data.today.slice(0, 7)
  const prices = new Map(data.stock.products.map((p) => [p.id, p.unitPrice ?? null]))
  const out = data.stock.moves.filter((m) => m.type === 'out' && m.date.startsWith(month))
  const sold = round(out.reduce((s, m) => s + m.quantity * (prices.get(m.productId) ?? 0), 0))
  const bought = round(stockPurchases(data.finance.business, data.stock.moves, month).reduce((s, x) => s + (x.move.price ?? 0), 0))
  const valued = data.rules.stock.itemValue
  return (
    <>
      {valued ? (
        <Figure value={tileMoney(sold)} label={w.labels.soldValue} />
      ) : (
        <Figure value={out.length} label={w.labels.sentMoves} />
      )}
      <Rows
        rows={[
          { label: w.labels.bought, value: tileMoney(bought) },
          ...(valued ? [] : [{ label: w.labels.noValues, value: '' }]),
        ]}
      />
    </>
  )
}

