import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Info, Package, Plus, Search } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { compareNames, normalize } from '../../lib/format'
import { StatTile } from '../../ui/StatTile'
import { formatQty } from './format'
import { useStockContext } from './StockContext'
import { isLow, stockSummary } from './store'

type Filter = 'all' | 'low' | 'zero'

/** Estoque geral: every product and how much of it there is. */
export function ProductsList() {
  const { data, qty, today, open } = useStockContext()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const summary = stockSummary(data, today.slice(0, 7))

  const rows = useMemo(() => {
    const q = normalize(query)
    return data.products
      .filter((p) => !q || normalize(p.name).includes(q) || normalize(p.code).includes(q))
      .filter((p) => {
        const amount = qty.get(p.id) ?? 0
        return filter === 'all' || (filter === 'low' ? isLow(p, amount) : amount <= 0)
      })
      .sort((a, b) => compareNames(a.name, b.name))
  }, [data.products, qty, query, filter])

  if (data.products.length === 0) {
    return (
      <div className="module-body">
        <div className="glass empty-hero">
          <span className="empty-hero-icon">
            <Package />
          </span>
          <h2 className="empty-hero-title">{t.stock.general.emptyTitle}</h2>
          <p className="text-2">{t.stock.general.emptySub}</p>
          <button type="button" className="btn btn-primary tactile" onClick={() => open({ type: 'product' })}>
            <Plus />
            {t.stock.add.general}
          </button>
        </div>
        <IntegrationNote />
      </div>
    )
  }

  return (
    <div className="module-body">
      <div className="stat-row stat-row-3">
        <StatTile value={summary.products} label={t.stock.general.stats.products} />
        <StatTile value={summary.lowStock} label={t.stock.general.stats.low} />
        <StatTile value={summary.outOfStock} label={t.stock.general.stats.zero} />
      </div>

      <div className="glass card">
        <div className="list-toolbar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <input
              className="input"
              type="search"
              placeholder={t.stock.general.searchPlaceholder}
              aria-label={t.stock.general.searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="ob-chips" role="group" aria-label={t.stock.general.filterLabel}>
            {(['all', 'low', 'zero'] as const).map((f) => (
              <button key={f} type="button" className="chip tactile" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {t.stock.general.filters[f]}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="empty-state">{t.stock.general.noResults}</p>
        ) : (
          <ul className="people-list">
            {rows.map((product) => {
              const amount = qty.get(product.id) ?? 0
              return (
                <li key={product.id}>
                  <Link to={`/estoque/geral/${product.id}`} className="person-row well tactile">
                    <span className="stock-icon" aria-hidden="true">
                      <Package />
                    </span>
                    <span className="person-main">
                      <span className="person-name">{product.name}</span>
                      {product.code && <span className="person-sub">{product.code}</span>}
                    </span>
                    {amount <= 0 ? (
                      <span className="tag tag-inactive">{t.stock.general.zeroTag}</span>
                    ) : (
                      isLow(product, amount) && <span className="tag tag-warning">{t.stock.general.lowTag}</span>
                    )}
                    <span className={`stock-qty num${amount < 0 ? ' is-negative' : ''}`}>{formatQty(amount, product.unit)}</span>
                    <ChevronRight className="person-chevron" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <IntegrationNote />
    </div>
  )
}

function IntegrationNote() {
  return (
    <p className="ob-note stock-note">
      <Info />
      {t.stock.general.integrationNote}
    </p>
  )
}
