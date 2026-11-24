import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, LineChart as LineIcon, Package, PackageMinus, PackagePlus, Pencil, Table2 } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { formatDateKey, formatMoney } from '../../lib/format'
import { useRules } from '../../rules/useRules'
import { ChartTable } from '../../ui/charts/ChartTable'
import { LineChart } from '../../ui/charts/LineChart'
import { StatTile } from '../../ui/StatTile'
import { formatExtra, formatQty } from './format'
import { MoveRow } from './MoveRow'
import { useStockContext } from './StockContext'
import { isLow, lastDays, levelSeries } from './store'
import type { StockProduct } from './types'

export function ProductDetail() {
  const { id } = useParams()
  const { data } = useStockContext()
  const product = data.products.find((p) => p.id === id)

  return (
    <div className="module-body">
      <Link to="/estoque/geral" className="back-link">
        <ArrowLeft />
        {t.stock.product.back}
      </Link>
      {product ? <ProductCard product={product} /> : <p className="glass empty-state">{t.stock.product.notFound}</p>}
    </div>
  )
}

function ProductCard({ product }: { product: StockProduct }) {
  const { data, qty, today, open } = useStockContext()
  const rules = useRules().rules.stock
  const [asTable, setAsTable] = useState(false)
  const amount = qty.get(product.id) ?? 0
  const month = today.slice(0, 7)
  const moves = data.moves.filter((m) => m.productId === product.id)
  const monthSum = (type: 'in' | 'out') =>
    moves.filter((m) => m.type === type && m.date.startsWith(month)).reduce((s, m) => s + m.quantity, 0)
  const days = lastDays(30, today)
  const level = levelSeries(product, data.moves, days, today)
  const history = [...moves].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <header className="glass card stock-head">
        <span className="stock-icon is-large" aria-hidden="true">
          <Package />
        </span>
        <div className="stock-head-main">
          <h2 className="stock-head-name">{product.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {product.code && <span className="text-2">{product.code}</span>}
            {product.minQuantity != null && <span className="text-2">{t.stock.product.minLabel(formatQty(product.minQuantity, product.unit))}</span>}
            {amount <= 0 ? (
              <span className="tag tag-inactive">{t.stock.general.zeroTag}</span>
            ) : (
              isLow(product, amount) && <span className="tag tag-warning">{t.stock.general.lowTag}</span>
            )}
          </div>
          {rules.itemValue && product.unitPrice != null && (
            <p className="text-2 num text-[13px]">
              {t.stock.product.priceLabel(formatMoney(product.unitPrice), formatMoney(Math.max(0, amount) * product.unitPrice))}
            </p>
          )}
          {rules.fields.some((f) => product.extra?.[f.id]) && (
            <div className="flex flex-wrap gap-2" aria-label={t.stock.product.extraTitle}>
              {rules.fields
                .filter((f) => product.extra?.[f.id])
                .map((f) => (
                  <span key={f.id} className="tag">
                    {f.name}: {formatExtra(f, product.extra?.[f.id] ?? '')}
                  </span>
                ))}
            </div>
          )}
        </div>
        <div className="employee-actions stock-head-actions">
          <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'product', product })}>
            <Pencil />
            {t.common.edit}
          </button>
          <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'move', moveType: 'in', productId: product.id })}>
            <PackagePlus />
            {t.stock.add.received}
          </button>
          <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'move', moveType: 'out', productId: product.id })}>
            <PackageMinus />
            {t.stock.add.sent}
          </button>
        </div>
      </header>

      <div className="stat-row stat-row-3">
        <StatTile value={formatQty(amount, product.unit)} label={t.stock.product.inStock} />
        <StatTile value={formatQty(monthSum('in'), product.unit)} label={t.stock.product.receivedMonth} />
        <StatTile value={formatQty(monthSum('out'), product.unit)} label={t.stock.product.sentMonth} />
      </div>

      <section className="glass card">
        <div className="section-head">
          <h2 className="card-title mb-0">{t.stock.product.levelTitle}</h2>
          <button type="button" className="btn btn-ghost tactile" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>
            {asTable ? <LineIcon /> : <Table2 />}
            {asTable ? t.finance.charts.showChart : t.finance.charts.showTable}
          </button>
        </div>
        {asTable ? (
          <ChartTable
            caption={t.stock.product.levelAria(product.name)}
            columns={[t.stock.overviewPage.day, t.stock.overviewPage.level]}
            rows={days.map((d, i) => [formatDateKey(d, false), level[i] == null ? '—' : formatQty(level[i] as number, product.unit)])}
          />
        ) : (
          <LineChart
            labels={days}
            showTick={(i) => i === 0 || i === days.length - 1 || (i + 1) % 7 === 0}
            tickLabel={(i) => formatDateKey(days[i], false)}
            tooltipTitle={(i) => t.finance.charts.dayTitle(formatDateKey(days[i], false))}
            series={[{ name: t.stock.overviewPage.level, values: level, color: 'var(--chart-accent)', area: true }]}
            format={(v) => formatQty(v, product.unit)}
            axisFormat={(v) => formatQty(v, product.unit)}
            ariaLabel={t.stock.product.levelAria(product.name)}
          />
        )}
      </section>

      <section className="glass card">
        <h2 className="card-title">{t.stock.product.history}</h2>
        {history.length === 0 ? (
          <p className="text-2 text-[13px]">{t.stock.product.noHistory}</p>
        ) : (
          <ul className="people-list">
            {history.map((move) => (
              <MoveRow key={move.id} move={move} showProduct={false} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
