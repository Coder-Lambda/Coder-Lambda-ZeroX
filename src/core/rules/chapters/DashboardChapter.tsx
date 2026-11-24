import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChartColumn, LayoutGrid, Minus, Plus } from 'lucide-react'
import { t } from '../../i18n/pt-BR'
import { haptic } from '../../lib/haptic'
import { MAIN_DASHBOARD_PAGES, SLOT_LIMITS } from '../defaults'
import { RuleRow } from '../parts'
import type { SlotKind } from '../types'
import { useChapter } from '../useRules'

const copy = t.rules.dashboard
type Limit = (typeof SLOT_LIMITS)[keyof typeof SLOT_LIMITS]

/** Dashboard inicial: up to 9 places, at most 2 of them charts. */
export function DashboardChapter() {
  const { chapter, update } = useChapter('dashboard')
  return (
    <RuleRow
      title={copy.title}
      hint={copy.hint(SLOT_LIMITS.dashboard.max, SLOT_LIMITS.dashboard.maxWidgets, SLOT_LIMITS.dashboard.maxCharts)}
      below={
        <>
          <SlotEditor slots={chapter.slots} limit={SLOT_LIMITS.dashboard} onChange={(change) => update((c) => ({ slots: change(c.slots) }))} />
          <ContentNote />
        </>
      }
    />
  )
}

/** Dashboard principal: three pages the client names, each with up to 5 widgets and 2 charts. */
export function MainDashboardChapter() {
  const { chapter, update } = useChapter('mainDashboard')
  const limit = SLOT_LIMITS.mainDashboard
  const editPage = (index: number, patch: (page: (typeof chapter.pages)[number]) => Partial<(typeof chapter.pages)[number]>) =>
    update((c) => ({ pages: c.pages.map((p, i) => (i === index ? { ...p, ...patch(p) } : p)) }))

  return (
    <>
      {Array.from({ length: MAIN_DASHBOARD_PAGES }, (_, index) => {
        const page = chapter.pages[index]
        return (
          <RuleRow
            key={index}
            title={copy.pageTitle(index + 1)}
            hint={copy.pageHint(limit.maxWidgets, limit.maxCharts)}
            below={
              <>
                <PageNameField index={index} name={page.name} onCommit={(name) => editPage(index, () => ({ name }))} />
                <SlotEditor slots={page.slots} limit={limit} onChange={(change) => editPage(index, (p) => ({ slots: change(p.slots) }))} />
              </>
            }
          />
        )
      })}
      <ContentNote />
    </>
  )
}

function ContentNote() {
  return (
    <p className="rule-hint">
      <Link to="/configuracoes/widgets" className="text-link">
        {copy.contentNote}
      </Link>
    </p>
  )
}

/** A page's name, saved when the field loses focus or Enter is pressed. */
export function PageNameField({ index, name, onCommit }: { index: number; name: string; onCommit: (name: string) => void }) {
  const [text, setText] = useState(name)
  useEffect(() => setText(name), [name])
  const commit = () => {
    const next = text.trim().slice(0, 40)
    if (next !== name) onCommit(next)
  }
  return (
    <label className="rule-page-name">
      <span className="field-label">{copy.pageName}</span>
      <input
        className="input"
        value={text}
        placeholder={t.page(index + 1)}
        maxLength={40}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
      />
    </label>
  )
}

/** The places of one dashboard (page): + / − places, tap one to exchange widget ↔ chart, within the limits. */
function SlotEditor({
  slots,
  limit,
  onChange,
}: {
  slots: SlotKind[]
  limit: Limit
  onChange: (change: (current: SlotKind[]) => SlotKind[]) => void
}) {
  const charts = slots.filter((s) => s === 'chart').length
  const widgets = slots.length - charts
  const canAdd = slots.length < limit.max && widgets < limit.maxWidgets

  const resize = (delta: 1 | -1) => {
    if (delta === 1 ? !canAdd : slots.length <= limit.min) return
    haptic('selection')
    // A new place is a widget; removing takes the last place.
    onChange((current) => (delta === 1 ? [...current, 'widget'] : current.slice(0, -1)))
  }

  const flip = (index: number) => {
    const toChart = slots[index] === 'widget'
    if (toChart ? charts >= limit.maxCharts : widgets >= limit.maxWidgets) {
      haptic('error')
      return
    }
    haptic('rigid')
    onChange((current) => current.map((s, i) => (i === index ? (s === 'widget' ? 'chart' : 'widget') : s)))
  }

  return (
    <>
      <div className="rule-slots-head">
        <p className="rule-hint">
          {copy.summary(widgets, charts)}
          {charts >= limit.maxCharts && ` · ${copy.chartsFull(limit.maxCharts)}`}
        </p>
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
      </div>
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
    </>
  )
}
