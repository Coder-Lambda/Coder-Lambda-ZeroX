import { Link } from 'react-router-dom'
import { Factory } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { todayKey } from '../../../lib/format'
import type { ProductionItem, ProductionPeriod } from '../../../rules/types'
import { useRules } from '../../../rules/useRules'
import { useProduction } from '../store'
import type { Employee } from '../types'
import { formatAmount, GoalMeter } from './GoalMeter'
import { PERIODS, totalsByEmployee } from './production'

/** The period whose target the card shows: the month when there is one. */
const mainPeriod = (item: ProductionItem): ProductionPeriod =>
  item.monthly != null ? 'monthly' : item.daily != null ? 'daily' : 'yearly'

/** On the employee card: what this person made today, this month and this year, against each item's target. */
export function ProductionCard({ employee }: { employee: Employee }) {
  const { productionItems } = useRules().rules.collaborators
  const records = useProduction()
  const today = todayKey()
  const copy = t.collab.production

  return (
    <section className="glass card" aria-label={t.collab.card.productionTitle}>
      <div className="section-head">
        <h2 className="card-title mb-0">{t.collab.card.productionTitle}</h2>
        <Link to="/colaboradores/funcionarios/producao" className="btn btn-ghost tactile">
          <Factory />
          {t.collab.card.productionAll}
        </Link>
      </div>
      <div className="production-items">
        {productionItems.map((item) => {
          const totals = PERIODS.map((p) => totalsByEmployee(records, item.id, p, today).get(employee.id) ?? 0)
          return (
            <div key={item.id} className="production-item well">
              <h3 className="production-item-name">{item.name}</h3>
              <dl className="production-figures">
                {PERIODS.map((p, i) => (
                  <div key={p}>
                    <dt>{copy.periods[p]}</dt>
                    <dd className="num">{formatAmount(totals[i], item.unit)}</dd>
                  </div>
                ))}
              </dl>
              {item.per === 'employee' && <GoalMeter item={item} period={mainPeriod(item)} value={totals[PERIODS.indexOf(mainPeriod(item))]} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}
