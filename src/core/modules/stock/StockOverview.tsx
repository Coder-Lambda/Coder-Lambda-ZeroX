import { useMemo, useState } from 'react'
import { LineChart as LineIcon, Table2 } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { compareNames, formatDateKey, toDateKey } from '../../lib/format'
import { dayKey, firstDay, monthLabel } from '../../lib/month'
import { ChartLegend } from '../../ui/charts/ChartTooltip'
import { ChartTable } from '../../ui/charts/ChartTable'
import { ColumnChart } from '../../ui/charts/ColumnChart'
import { LineChart } from '../../ui/charts/LineChart'
import { MonthCalendar } from '../../ui/MonthCalendar'
import { MonthSwitch } from '../../ui/MonthSwitch'
import { StatTile } from '../../ui/StatTile'
import { formatQty } from './format'
import { MoveRow } from './MoveRow'
import { useStockContext } from './StockContext'
import { dailyFlows, levelSeries } from './store'

const plain = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 })

/** How much was received and sent each day, on a calendar and a list, and how the stock moved. */
export function StockOverview() {
  const { data, qty, today } = useStockContext()
  const currentMonth = today.slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [productId, setProductId] = useState('')
  const [picked, setPicked] = useState(today)
  const [asTable, setAsTable] = useState(false)
  const selected = picked.startsWith(month) ? picked : today.startsWith(month) ? today : dayKey(month, 1)

  const product = data.products.find((p) => p.id === productId)
  const fmt = (v: number) => (product ? formatQty(v, product.unit) : plain.format(v))
  const scoped = useMemo(
    () => data.moves.filter((m) => !productId || m.productId === productId),
    [data.moves, productId],
  )
  const flows = dailyFlows(scoped, month)
  const level = product ? levelSeries(product, data.moves, flows.days, today) : null

  const marks = useMemo(() => {
    const counts: Record<string, number> = {}
    scoped.filter((m) => m.type !== 'adjust').forEach((m) => {
      counts[m.date] = (counts[m.date] ?? 0) + 1
    })
    return counts
  }, [scoped])

  const dayMoves = scoped
    .filter((m) => m.date === selected)
    .sort((a, b) => a.type.localeCompare(b.type) || b.createdAt.localeCompare(a.createdAt))
  const activeDays = flows.days.map((d, i) => ({ d, i })).filter(({ i }) => flows.received[i] || flows.sent[i]).reverse()
  const monthMoves = scoped.filter((m) => m.date.startsWith(month) && m.type !== 'adjust').length
  const monthIn = flows.received.reduce((s, v) => s + v, 0)
  const monthOut = flows.sent.reduce((s, v) => s + v, 0)
  const series = [
    { name: t.stock.overviewPage.received, values: flows.received, color: 'var(--series-1)' },
    { name: t.stock.overviewPage.sent, values: flows.sent, color: 'var(--series-2)' },
  ]
  const sortedProducts = [...data.products].sort((a, b) => compareNames(a.name, b.name))

  return (
    <div className="module-body">
      <div className="stock-filters">
        <MonthSwitch value={month} onChange={setMonth} currentMonth={currentMonth} />
        <label className="stock-product-filter">
          <span className="sr-only">{t.stock.overviewPage.productFilter}</span>
          <select className="input select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">{t.stock.overviewPage.allProducts}</option>
            {sortedProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!product && <p className="text-2 text-[13px]">{t.stock.overviewPage.allNote}</p>}

      <div className="stat-row stat-row-3">
        <StatTile value={fmt(monthIn)} label={t.stock.product.receivedMonth} />
        <StatTile value={fmt(monthOut)} label={t.stock.product.sentMonth} />
        {product ? (
          <StatTile value={formatQty(qty.get(product.id) ?? 0, product.unit)} label={t.stock.product.inStock} />
        ) : (
          <StatTile value={t.stock.overviewPage.movesCount(monthMoves)} label={monthLabel(month)} />
        )}
      </div>

      <div className="stock-overview-grid">
        <section className="glass card" aria-label={monthLabel(month)}>
          <MonthCalendar
            month={firstDay(month)}
            onMonthChange={(date) => setMonth(toDateKey(date).slice(0, 7))}
            selected={selected}
            onSelect={setPicked}
            marks={marks}
            markLabel={t.stock.overviewPage.movesCount}
          />
        </section>
        <section className="glass card" aria-label={formatDateKey(selected)}>
          <h2 className="card-title num">{formatDateKey(selected)}</h2>
          {dayMoves.length === 0 ? (
            <p className="text-2 text-[13px]">{t.stock.overviewPage.dayEmpty}</p>
          ) : (
            <ul className="people-list">
              {dayMoves.map((move) => (
                <MoveRow key={move.id} move={move} showDate={false} />
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="glass card">
        <div className="section-head">
          <h2 className="card-title mb-0">
            {t.stock.overviewPage.chartTitle} · {monthLabel(month)}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <ChartLegend rows={series.map((s) => ({ name: s.name, color: s.color, shape: 'rect' as const }))} />
            <button type="button" className="btn btn-ghost tactile" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>
              {asTable ? <LineIcon /> : <Table2 />}
              {asTable ? t.finance.charts.showChart : t.finance.charts.showTable}
            </button>
          </div>
        </div>
        {asTable ? (
          <ChartTable
            caption={t.stock.overviewPage.chartAria(monthLabel(month))}
            columns={[t.stock.overviewPage.day, t.stock.overviewPage.received, t.stock.overviewPage.sent]}
            rows={flows.days.map((d, i) => [formatDateKey(d, false), fmt(flows.received[i]), fmt(flows.sent[i])])}
          />
        ) : (
          <ColumnChart
            categories={flows.days.map((d) => String(Number(d.slice(8))))}
            showTick={(i) => i === 0 || (i + 1) % 5 === 0}
            tooltipTitle={(i) => t.finance.charts.dayTitle(formatDateKey(flows.days[i], false))}
            series={series}
            format={fmt}
            axisFormat={(v) => plain.format(v)}
            ariaLabel={t.stock.overviewPage.chartAria(monthLabel(month))}
          />
        )}
      </section>

      {product && level && (
        <section className="glass card">
          <h2 className="card-title">
            {t.stock.overviewPage.levelTitle} · {product.name}
          </h2>
          <LineChart
            labels={flows.days}
            showTick={(i) => i === 0 || (i + 1) % 5 === 0}
            tickLabel={(i) => String(i + 1)}
            tooltipTitle={(i) => t.finance.charts.dayTitle(formatDateKey(flows.days[i], false))}
            series={[{ name: t.stock.overviewPage.level, values: level, color: 'var(--chart-accent)', area: true }]}
            format={fmt}
            axisFormat={fmt}
            ariaLabel={t.stock.overviewPage.levelAria(product.name, monthLabel(month))}
          />
        </section>
      )}

      <section className="glass card">
        <h2 className="card-title">{t.stock.overviewPage.daysTitle}</h2>
        {activeDays.length === 0 ? (
          <p className="text-2 text-[13px]">{t.stock.overviewPage.daysEmpty}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.stock.overviewPage.day}</th>
                  <th className="text-right">{t.stock.overviewPage.received}</th>
                  <th className="text-right">{t.stock.overviewPage.sent}</th>
                  <th className="text-right">{t.stock.overviewPage.net}</th>
                </tr>
              </thead>
              <tbody>
                {activeDays.map(({ d, i }) => {
                  const net = flows.received[i] - flows.sent[i]
                  return (
                    <tr key={d} className={d === selected ? 'is-selected' : undefined}>
                      <td>
                        <button type="button" className="link-button num" onClick={() => setPicked(d)} aria-pressed={d === selected}>
                          {formatDateKey(d)}
                        </button>
                      </td>
                      <td className="num text-right">{fmt(flows.received[i])}</td>
                      <td className="num text-right">{fmt(flows.sent[i])}</td>
                      <td className={`num text-right ${net < 0 ? 'is-negative' : ''}`}>
                        {net > 0 ? '+' : net < 0 ? '−' : ''}
                        {fmt(Math.abs(net))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
