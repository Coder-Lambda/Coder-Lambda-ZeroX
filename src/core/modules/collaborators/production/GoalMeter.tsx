import { t } from '../../../i18n/pt-BR'
import type { ProductionItem, ProductionPeriod } from '../../../rules/types'
import { targetState } from './production'

export const formatAmount = (value: number, unit: string) =>
  `${value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unit}`

/** How far a value is from the item's meta (goal) or teto (ceiling) for one period. Nothing when there is no target. */
export function GoalMeter({ item, period, value }: { item: ProductionItem; period: ProductionPeriod; value: number }) {
  const { target, ratio, state } = targetState(item, period, value)
  if (target == null) return null
  const copy = t.collab.production
  const label = item.kind === 'goal' ? copy.target.goal(formatAmount(target, item.unit)) : copy.target.ceiling(formatAmount(target, item.unit))
  const status =
    item.kind === 'goal'
      ? copy.state.goal[state === 'reached' ? 'reached' : 'below']
      : copy.state.ceiling[state === 'over' ? 'over' : 'reached']
  const modifier = state === 'over' ? ' is-over' : item.kind === 'goal' && state === 'reached' ? ' is-reached' : ''

  return (
    <div className={`goal-meter${modifier}`}>
      <div
        className="goal-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={Math.min(value, target)}
        aria-label={`${label} · ${status}`}
      >
        <span className="goal-fill" style={{ width: `${Math.min(1, ratio) * 100}%` }} />
      </div>
      <div className="goal-caption">
        <span>{label}</span>
        <strong>{status}</strong>
      </div>
    </div>
  )
}
