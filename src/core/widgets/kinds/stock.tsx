import { t } from '../../i18n/pt-BR'
import { compareNames } from '../../lib/format'
import { monthLabel } from '../../lib/month'
import { quantities, stockSummary } from '../../modules/stock/store'
import type { StockData, StockMove } from '../../modules/stock/types'
import { ChartLegend } from '../../ui/charts/ChartTooltip'
import { ChartTable } from '../../ui/charts/ChartTable'
import { ColumnChart } from '../../ui/charts/ColumnChart'
import { RankedBars } from '../../ui/charts/RankedBars'
import { Delta, Figure, Muted, Rows, Sparkline, tileMoney, tileNumber } from '../parts'
import { bucketLabel, buckets, CHART_SIZE, currentAndPrevious, SPARK_SIZE, sumIn, tickEvery } from '../periods'
import type { WidgetProps } from '../types'

const w = t.widgets

/** Products can use different units; totals only carry a unit when they all share one. */
function sharedUnit(stock: StockData) {
  const units = new Set(stock.products.map((p) => p.unit))
  return units.size === 1 ? [...units][0] : ''
}
const qtyFormat = (unit: string) => (v: number) => (unit ? `${tileNumber(v)} ${unit}` : tileNumber(v))

const moved = (moves: StockMove[], type: 'in' | 'out', key: string) =>
  sumIn(moves.filter((m) => m.type === type), key, (m) => m.date, (m) => m.quantity)

export function StockTodayWidget({ data }: WidgetProps) {
  const summary = stockSummary(data.stock, data.today.slice(0, 7))
  if (summary.products === 0) return <Muted>{w.labels.noProducts}</Muted>
  return (
    <>
      <Figure value={tileNumber(summary.products)} label={w.labels.products} />
      <Rows
        rows={[
          { label: w.labels.low, value: summary.lowStock },
          { label: w.labels.zero, value: summary.outOfStock },
          ...(data.rules.stock.itemValue ? [{ label: w.labels.stockValue, value: tileMoney(summary.stockValue) }] : []),
        ]}
      />
    </>
  )
}

/** How the stock moved: received minus sent in the period (widget) or both per bucket (chart). */
export function StockFluctuationWidget({ data, instance, asTable }: WidgetProps) {
  const p = instance.period ?? 'daily'
  const { moves } = data.stock
  const fmt = qtyFormat(sharedUnit(data.stock))
  if (instance.kind === 'chart') {
    const keys = buckets(p, data.today, CHART_SIZE[p])
    const series = [
      { name: w.labels.received, values: keys.map((k) => moved(moves, 'in', k)), color: 'var(--series-1)' },
      { name: w.labels.sent, values: keys.map((k) => moved(moves, 'out', k)), color: 'var(--series-2)' },
    ]
    return asTable ? (
      <ChartTable
        caption={w.types['stock.fluctuation'].title}
        columns={[w.periodColumn[p], w.labels.received, w.labels.sent]}
        rows={keys.map((k, i) => [bucketLabel(k, p), fmt(series[0].values[i]), fmt(series[1].values[i])])}
      />
    ) : (
      <>
        <ChartLegend rows={series.map((s) => ({ name: s.name, color: s.color, shape: 'rect' as const }))} />
        <ColumnChart
          categories={keys.map((k) => bucketLabel(k, p))}
          showTick={tickEvery(keys.length)}
          tooltipTitle={(i) => bucketLabel(keys[i], p)}
          series={series}
          format={fmt}
          axisFormat={(v) => tileNumber(v)}
          ariaLabel={`${w.types['stock.fluctuation'].title} ${w.periodTitle[p]}`}
          height={200}
        />
      </>
    )
  }
  const net = (key: string) => moved(moves, 'in', key) - moved(moves, 'out', key)
  const { current, previous } = currentAndPrevious(p, data.today)
  const now = net(current)
  return (
    <>
      <Figure
        value={`${now > 0 ? '+' : ''}${fmt(now)}`}
        label={w.labels.netChange[p]}
        delta={<Delta change={now - net(previous)} versus={w.vs[p]} format={fmt} upIsGood={null} />}
      />
      <Rows
        rows={[
          { label: w.labels.received, value: fmt(moved(moves, 'in', current)) },
          { label: w.labels.sent, value: fmt(moved(moves, 'out', current)) },
        ]}
      />
      <Sparkline values={buckets(p, data.today, SPARK_SIZE[p]).map(net)} />
    </>
  )
}

/** What is being sold (sent) or received in the period, and its main product. */
export function StockMovesWidget({ data, instance, type }: WidgetProps & { type: 'in' | 'out' }) {
  const p = instance.period ?? 'daily'
  const { current, previous } = currentAndPrevious(p, data.today)
  const fmt = qtyFormat(sharedUnit(data.stock))
  const inPeriod = data.stock.moves.filter((m) => m.type === type && m.date.startsWith(current))
  const now = moved(data.stock.moves, type, current)
  const byProduct = new Map<string, number>()
  inPeriod.forEach((m) => byProduct.set(m.productId, (byProduct.get(m.productId) ?? 0) + m.quantity))
  const top = [...byProduct].sort((a, b) => b[1] - a[1])[0]
  const product = top && data.stock.products.find((x) => x.id === top[0])
  return (
    <>
      <Figure
        value={fmt(now)}
        label={(type === 'out' ? w.labels.sentIn : w.labels.receivedIn)[p]}
        delta={<Delta change={now - moved(data.stock.moves, type, previous)} versus={w.vs[p]} format={fmt} upIsGood={type === 'out' ? true : null} />}
      />
      <Rows
        rows={[
          { label: w.labels.moves, value: inPeriod.length },
          ...(product ? [{ label: product.name, value: `${tileNumber(top[1])} ${product.unit}` }] : []),
        ]}
      />
    </>
  )
}

/** Products with stock and products at zero. */
export function AvailabilityWidget({ data, extended }: WidgetProps) {
  const qty = quantities(data.stock)
  const zero = data.stock.products.filter((p) => (qty.get(p.id) ?? 0) <= 0).sort((a, b) => compareNames(a.name, b.name))
  if (data.stock.products.length === 0) return <Muted>{w.labels.noProducts}</Muted>
  return (
    <>
      <div className="wg-pair">
        <Figure value={data.stock.products.length - zero.length} label={w.labels.inStock} />
        <Figure value={<span className={zero.length > 0 ? 'is-negative' : undefined}>{zero.length}</span>} label={w.labels.zero} />
      </div>
      {zero.length > 0 && (
        <Rows rows={zero.slice(0, extended ? 5 : 3).map((p) => ({ key: p.id, label: p.name, value: `0 ${p.unit}` }))} />
      )}
    </>
  )
}

/** Products ranked by what was sent this month: most or least sold. */
export function RankingWidget({ data, instance, asTable, order }: WidgetProps & { order: 'most' | 'least' }) {
  const month = data.today.slice(0, 7)
  const sent = new Map<string, number>()
  data.stock.moves
    .filter((m) => m.type === 'out' && m.date.startsWith(month))
    .forEach((m) => sent.set(m.productId, (sent.get(m.productId) ?? 0) + m.quantity))
  const ranked = data.stock.products
    .map((p) => ({ label: p.name, value: sent.get(p.id) ?? 0, unit: p.unit }))
    .filter((r) => order === 'least' || r.value > 0)
    .sort((a, b) => (order === 'most' ? b.value - a.value : a.value - b.value) || compareNames(a.label, b.label))
  const title = w.types[order === 'most' ? 'stock.mostSold' : 'stock.leastSold'].title
  if (ranked.length === 0) return <Muted>{w.labels.noSales}</Muted>
  if (instance.kind === 'chart') {
    const top = ranked.slice(0, 7)
    return asTable ? (
      <ChartTable caption={title} columns={[w.labels.product, w.labels.sent]} rows={top.map((r) => [r.label, `${tileNumber(r.value)} ${r.unit}`])} />
    ) : (
      <RankedBars items={top} color="var(--chart-accent)" format={(v) => tileNumber(v)} ariaLabel={`${title} · ${monthLabel(month)}`} />
    )
  }
  return (
    <>
      <Figure value={ranked[0].label} label={`${tileNumber(ranked[0].value)} ${ranked[0].unit} · ${monthLabel(month)}`} />
      <Rows rows={ranked.slice(1, 4).map((r) => ({ key: r.label, label: r.label, value: `${tileNumber(r.value)} ${r.unit}` }))} />
    </>
  )
}

/** The month with the most (or least) stock sent, since the stock started, up to 12 months back. */
export function MonthRecordWidget({ data, order }: WidgetProps & { order: 'best' | 'worst' }) {
  const { moves, products } = data.stock
  const started = [...products.map((p) => p.createdAt.slice(0, 7)), ...moves.map((m) => m.date.slice(0, 7))].sort()[0]
  if (!started) return <Muted>{w.labels.noSales}</Muted>
  const current = data.today.slice(0, 7)
  const months = buckets('monthly', data.today, 12).filter((m) => m >= started && m <= current)
  const totals = months.map((m) => ({ month: m, value: moved(moves, 'out', m) }))
  if (totals.every((x) => x.value === 0)) return <Muted>{w.labels.noSales}</Muted>
  const pick = [...totals].sort((a, b) => (order === 'best' ? b.value - a.value : a.value - b.value) || b.month.localeCompare(a.month))[0]
  const average = totals.reduce((s, x) => s + x.value, 0) / totals.length
  const fmt = qtyFormat(sharedUnit(data.stock))
  return (
    <>
      <Figure value={monthLabel(pick.month)} label={w.labels.monthSent(fmt(pick.value))} />
      <Rows
        rows={[
          { label: w.labels.monthAverage, value: fmt(Math.round(average * 100) / 100) },
          { label: w.labels.monthsCompared, value: totals.length },
        ]}
      />
    </>
  )
}
