import { Link } from 'react-router-dom'
import { ChartColumn, LayoutGrid, Minus, Plus } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { SLOT_LIMITS } from '../defaults'
import { RuleRow } from '../parts'
import type { SlotKind } from '../types'
import { useChapter } from '../useRules'

const copy = t.rules.dashboard

/**
 * The dashboards' places: the dashboard holds up to 9 with at most 2 charts, the main dashboard up to
 * 15 widgets and 6 charts. Each place is a widget or is exchanged for a chart.
 */
export function DashboardChapter({ chapter: id }: { chapter: 'dashboard' | 'mainDashboard' }) {
  const { chapter, update } = useChapter(id)
  const limit = SLOT_LIMITS[id]
  const slots = chapter.slots
  const charts = slots.filter((s) => s === 'chart').length
  const widgets = slots.length - charts
  const canAdd = slots.length < limit.max && widgets < limit.maxWidgets

  const resize = (delta: 1 | -1) => {
    if (delta === 1 ? !canAdd : slots.length <= limit.min) return
    haptic('selection')
    // A new place is a widget; removing takes the last place.
    update((c) => ({ slots: delta === 1 ? [...c.slots, 'widget' as SlotKind] : c.slots.slice(0, -1) }))
  }

  const flip = (index: number) => {
    const toChart = slots[index] === 'widget'
    if (toChart ? charts >= limit.maxCharts : widgets >= limit.maxWidgets) {
      haptic('error')
      return
    }
    haptic('rigid')
    update((c) => ({ slots: c.slots.map((s, i) => (i === index ? (s === 'widget' ? 'chart' : 'widget') : s)) }))
  }

  const blocked = charts >= limit.maxCharts ? copy.chartsFull(limit.maxCharts) : null

  return (
    <RuleRow
      title={copy.title}
      hint={copy.hint(limit.max, limit.maxWidgets, limit.maxCharts)}
      below={
        <>
          <div className="rule-slots" role="group" aria-label={copy.title}>
            {slots.map((slot, index) => {
              const locked = slot === 'widget' ? charts >= limit.maxCharts : widgets >= limit.maxWidgets
              return (
                <button
                  key={index}
                  type="button"
                  className={`rule-slot tactile is-${slot}`}
                  aria-label={slot === 'widget' ? copy.toChart(index + 1) : copy.toWidget(index + 1)}
                  aria-disabled={locked || undefined}
                  title={locked ? (slot === 'widget' ? copy.chartsFull(limit.maxCharts) : copy.widgetsFull(limit.maxWidgets)) : undefined}
                  onClick={() => flip(index)}
                >
                  {slot === 'widget' ? <LayoutGrid aria-hidden="true" /> : <ChartColumn aria-hidden="true" />}
                  <span className="num">
                    {slot === 'widget' ? copy.widget : copy.chart} {index + 1}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="rule-hint">
            {copy.summary(widgets, charts)}
            {blocked && ` · ${blocked}`}
          </p>
          <p className="rule-hint">
            <Link to="/configuracoes/widgets" className="text-link">
              {copy.contentNote}
            </Link>
          </p>
        </>
      }
    >
      <div className="rule-stepper">
        <button
          type="button"
          className="btn btn-icon btn-secondary tactile"
          aria-label={copy.less}
          disabled={slots.length <= limit.min}
          onClick={() => resize(-1)}
        >
          <Minus />
        </button>
        <span className="rule-stepper-value num" aria-live="polite">
          {copy.count(slots.length)}
        </span>
        <button type="button" className="btn btn-icon btn-secondary tactile" aria-label={copy.more} disabled={!canAdd} onClick={() => resize(1)}>
          <Plus />
        </button>
      </div>
    </RuleRow>
  )
}
