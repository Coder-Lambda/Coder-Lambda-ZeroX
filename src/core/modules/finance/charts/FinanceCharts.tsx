import { useRef, useState } from 'react'
import { Table2, LineChart as LineIcon } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, formatMoney } from '../../../lib/format'
import { ChartLegend } from '../../../ui/charts/ChartTooltip'
import { ChartTable } from '../../../ui/charts/ChartTable'
import { ColumnChart } from '../../../ui/charts/ColumnChart'
import { LineChart, type LineSeries } from '../../../ui/charts/LineChart'
import { RankedBars } from '../../../ui/charts/RankedBars'
import { Segmented } from '../../../ui/Segmented'
import { useFinanceContext } from '../FinanceContext'
import { monthLabel, shortMonthLabel } from '../../../lib/month'
import { balanceSeries, categoryBreakdown, monthlyFlows } from '../store'

const CHARTS = ['balance', 'flows', 'categories'] as const

/** One card holding up to 3 charts side by side; swipe/scroll or use the tabs to move between them. */
export function FinanceCharts() {
  const track = useRef<HTMLDivElement>(null)
  // Slide a tab click is scrolling to; scroll events are ignored until it arrives so the tab doesn't flick back.
  const scrollingTo = useRef<number | null>(null)
  const [index, setIndex] = useState(0)
  const [asTable, setAsTable] = useState(false)

  const select = (next: number) => {
    const element = track.current
    if (!element) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollingTo.current = next
    element.scrollTo({ left: next * element.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
    setIndex(next)
  }

  return (
    <section className="glass card fin-charts" aria-label={t.finance.charts.title}>
      <div className="fin-charts-head">
        <Segmented
          label={t.finance.charts.title}
          options={CHARTS.map((c) => t.finance.charts[c])}
          value={index}
          onChange={select}
        />
        <button type="button" className="btn btn-ghost tactile" onClick={() => setAsTable(!asTable)} aria-pressed={asTable}>
          {asTable ? <LineIcon /> : <Table2 />}
          {asTable ? t.finance.charts.showChart : t.finance.charts.showTable}
        </button>
      </div>
      <div
        ref={track}
        className="fin-chart-track"
        onScroll={(e) => {
          const element = e.currentTarget
          const width = Math.max(element.clientWidth, 1)
          if (scrollingTo.current !== null) {
            if (Math.abs(element.scrollLeft - scrollingTo.current * width) < 2) scrollingTo.current = null
            return
          }
          const next = Math.round(element.scrollLeft / width)
          if (next !== index) setIndex(next)
        }}
        onScrollEnd={(e) => {
          // A swipe can interrupt a tab's smooth scroll: wherever it settles wins.
          scrollingTo.current = null
          const element = e.currentTarget
          setIndex(Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)))
        }}
      >
        <div className="fin-chart-slide" inert={index !== 0}>
          <BalanceChart asTable={asTable} />
        </div>
        <div className="fin-chart-slide" inert={index !== 1}>
          <FlowsChart asTable={asTable} />
        </div>
        <div className="fin-chart-slide" inert={index !== 2}>
          <CategoriesChart asTable={asTable} />
        </div>
      </div>
    </section>
  )
}

function BalanceChart({ asTable }: { asTable: boolean }) {
  const { data, month, today } = useFinanceContext()
  const { days, actual, projected } = balanceSeries(data, month, today)
  const series: LineSeries[] = []
  if (actual.some((v) => v != null)) series.push({ name: t.finance.charts.actual, values: actual, color: 'var(--chart-accent)', area: true })
  if (projected.some((v) => v != null)) series.push({ name: t.finance.charts.projected, values: projected, color: 'var(--chart-accent)', dashed: true })

  return (
    <>
      <div className="fin-chart-title">
        <h3>
          {t.finance.charts.balance} · {monthLabel(month)}
        </h3>
        {series.length > 1 && (
          <ChartLegend rows={series.map((s) => ({ name: s.name, color: s.color, dashed: s.dashed }))} />
        )}
      </div>
      {asTable ? (
        <ChartTable
          caption={t.finance.charts.balanceAria(monthLabel(month))}
          columns={[t.finance.charts.day, ...series.map((s) => s.name)]}
          rows={days.map((d, i) => [formatDateKey(d, false), ...series.map((s) => (s.values[i] == null ? '—' : formatMoney(s.values[i])))])}
        />
      ) : (
        <LineChart
          labels={days}
          showTick={(i) => i === 0 || (i + 1) % 5 === 0}
          tickLabel={(i) => String(i + 1)}
          tooltipTitle={(i) => t.finance.charts.dayTitle(formatDateKey(days[i], false))}
          series={series}
          format={formatMoney}
          ariaLabel={t.finance.charts.balanceAria(monthLabel(month))}
        />
      )}
    </>
  )
}

function FlowsChart({ asTable }: { asTable: boolean }) {
  const { data, month } = useFinanceContext()
  const { months, incomes, outcomes } = monthlyFlows(data.entries, month)
  const series = [
    { name: t.finance.widgets.incomes, values: incomes, color: 'var(--series-1)' },
    { name: t.finance.widgets.outcomes, values: outcomes, color: 'var(--series-2)' },
  ]

  return (
    <>
      <div className="fin-chart-title">
        <h3>{t.finance.charts.flows}</h3>
        <ChartLegend rows={series.map((s) => ({ name: s.name, color: s.color, shape: 'rect' as const }))} />
      </div>
      {asTable ? (
        <ChartTable
          caption={t.finance.charts.flowsAria}
          columns={[t.finance.charts.month, t.finance.widgets.incomes, t.finance.widgets.outcomes]}
          rows={months.map((m, i) => [monthLabel(m), formatMoney(incomes[i]), formatMoney(outcomes[i])])}
        />
      ) : (
        <ColumnChart
          categories={months.map(shortMonthLabel)}
          tooltipTitle={(i) => monthLabel(months[i])}
          series={series}
          format={formatMoney}
          ariaLabel={t.finance.charts.flowsAria}
        />
      )}
    </>
  )
}

function CategoriesChart({ asTable }: { asTable: boolean }) {
  const { data, month } = useFinanceContext()
  const items = categoryBreakdown(data.entries, month)
  const total = items.reduce((s, i) => s + i.value, 0)
  const share = (value: number) =>
    t.finance.charts.share(`${((value / Math.max(total, 1)) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`)

  return (
    <>
      <div className="fin-chart-title">
        <h3>
          {t.finance.charts.categories} · {monthLabel(month)}
        </h3>
      </div>
      {items.length === 0 ? (
        <p className="empty-state">{t.finance.charts.emptyCategories}</p>
      ) : asTable ? (
        <ChartTable
          caption={t.finance.charts.categoriesAria(monthLabel(month))}
          columns={[t.finance.charts.category, t.finance.charts.value, '%']}
          rows={items.map((i) => [i.label, formatMoney(i.value), `${Math.round((i.value / total) * 100)}%`])}
        />
      ) : (
        <RankedBars
          items={items}
          color="var(--chart-accent)"
          format={formatMoney}
          detail={share}
          ariaLabel={t.finance.charts.categoriesAria(monthLabel(month))}
        />
      )}
    </>
  )
}
