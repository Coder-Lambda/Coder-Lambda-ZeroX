import { ChartColumn, LayoutGrid, Minus, Plus } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { SLOT_LIMITS } from '../defaults'
import { RuleRow } from '../parts'
import type { SlotKind } from '../types'
import { useChapter } from '../useRules'

const copy = t.rules.dashboard

/** 1–9 places (dashboard) or 1–12 (main dashboard); each one is a widget or exchanged for a chart. */
export function DashboardChapter({ chapter: id }: { chapter: 'dashboard' | 'mainDashboard' }) {
  const { chapter, update } = useChapter(id)
  const { min, max } = SLOT_LIMITS[id]
  const slots = chapter.slots
  const charts = slots.filter((s) => s === 'chart').length

  const resize = (delta: number) => {
    const size = Math.min(max, Math.max(min, slots.length + delta))
    if (size === slots.length) return
    haptic('selection')
    update((c) =>
      size > c.slots.length
        ? { slots: [...c.slots, ...Array<SlotKind>(size - c.slots.length).fill('widget')] }
        : { slots: c.slots.slice(0, size) },
    )
  }

  const flip = (index: number) => {
    haptic('rigid')
    update((c) => ({ slots: c.slots.map((s, i) => (i === index ? (s === 'widget' ? 'chart' : 'widget') : s)) }))
  }

  return (
    <RuleRow
      title={copy.title}
      hint={copy.hint(min, max)}
      below={
        <>
          <div className="rule-slots" role="group" aria-label={copy.title}>
            {slots.map((slot, index) => (
              <button
                key={index}
                type="button"
                className={`rule-slot tactile is-${slot}`}
                aria-label={slot === 'widget' ? copy.toChart(index + 1) : copy.toWidget(index + 1)}
                onClick={() => flip(index)}
              >
                {slot === 'widget' ? <LayoutGrid aria-hidden="true" /> : <ChartColumn aria-hidden="true" />}
                <span className="num">
                  {slot === 'widget' ? copy.widget : copy.chart} {index + 1}
                </span>
              </button>
            ))}
          </div>
          <p className="rule-hint">
            {copy.summary(slots.length - charts, charts)} · {copy.contentNote}
          </p>
        </>
      }
    >
      <div className="rule-stepper">
        <button
          type="button"
          className="btn btn-icon btn-secondary tactile"
          aria-label={copy.less}
          disabled={slots.length <= min}
          onClick={() => resize(-1)}
        >
          <Minus />
        </button>
        <span className="rule-stepper-value num" aria-live="polite">
          {copy.count(slots.length)}
        </span>
        <button
          type="button"
          className="btn btn-icon btn-secondary tactile"
          aria-label={copy.more}
          disabled={slots.length >= max}
          onClick={() => resize(1)}
        >
          <Plus />
        </button>
      </div>
    </RuleRow>
  )
}
