import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import { t } from '../i18n/pt-BR'
import { haptic } from '../lib/haptic'
import { pageName } from '../rules/defaults'
import { toast } from '../ui/Toaster'
import { WidgetDataProvider, useWidgetData } from './data'
import { capacity, onPage, pagesOf, readPlace, slotsOf, useWidgetLayout } from './store'
import type { DashboardPlace, ModulePlace, WidgetInstance } from './types'
import { EmptySlot, widgetTitle, WidgetSlot } from './WidgetSlot'

interface GridProps {
  place: DashboardPlace
  /** Main dashboard page (0–2). */
  page?: number
  /** Shows each widget's organize bar: earlier / later, other page, remove. */
  organizing?: boolean
}

/**
 * A dashboard (page): the rule book's places in order, each widget place filled by the page's next widget
 * and each chart place by its next chart. Places without one offer to create it.
 */
export function WidgetGrid(props: GridProps) {
  return (
    <WidgetDataProvider>
      <Grid {...props} />
    </WidgetDataProvider>
  )
}

function Grid({ place, page = 0, organizing = false }: GridProps) {
  const data = useWidgetData()
  const { read } = useWidgetLayout()
  const here = onPage(read(place), page)
  const slots = slotsOf(place, data.rules, page)
  const room = capacity(place, data.rules, page)
  let widgetIndex = 0
  let chartIndex = 0

  return (
    <div className={`card-grid widget-grid-dash${organizing ? ' is-organizing' : ''}`}>
      {slots.map((slot, i) => {
        const list = slot === 'chart' ? here.charts : here.widgets
        const index = slot === 'chart' ? chartIndex++ : widgetIndex++
        const instance = list[index]
        const toolbar =
          organizing && instance ? (
            <OrganizeBar
              place={place}
              instance={instance}
              canEarlier={index > 0}
              canLater={index < Math.min(list.length, slot === 'chart' ? room.charts : room.widgets) - 1}
            />
          ) : undefined
        return (
          <div key={instance?.uid ?? `empty-${page}-${i}`} className={`widget-cell fade-in ${slot === 'chart' ? 'span-6' : 'span-3'}`}>
            {instance ? (
              <WidgetSlot instance={instance} extended={place === 'mainDashboard'} toolbar={toolbar} />
            ) : (
              <EmptySlot place={place} kind={slot} page={page} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Organize mode on a widget: move it earlier or later on its page, send it to another page, or remove it. */
function OrganizeBar({
  place,
  instance,
  canEarlier,
  canLater,
}: {
  place: DashboardPlace
  instance: WidgetInstance
  canEarlier: boolean
  canLater: boolean
}) {
  const data = useWidgetData()
  const { read, move, moveToPage, remove } = useWidgetLayout()
  const title = widgetTitle(instance)
  const copy = t.widgets.organize
  const current = instance.page ?? 0
  const all = read(place)
  const key = instance.kind === 'chart' ? 'charts' : 'widgets'
  const hasRoom = (page: number) => onPage(all, page)[key].length < capacity(place, data.rules, page)[key]

  return (
    <div className="wg-organize" role="group" aria-label={copy.label(title)}>
      <button type="button" className="btn btn-icon btn-ghost tactile" aria-label={copy.earlier(title)} disabled={!canEarlier} onClick={() => move(place, instance.uid, -1)}>
        <ArrowLeft />
      </button>
      <button type="button" className="btn btn-icon btn-ghost tactile" aria-label={copy.later(title)} disabled={!canLater} onClick={() => move(place, instance.uid, 1)}>
        <ArrowRight />
      </button>
      {place === 'mainDashboard' && (
        <select
          className="input select wg-organize-page"
          aria-label={copy.toPage(title)}
          value={current}
          onChange={(e) => {
            const target = Number(e.target.value)
            moveToPage(instance.uid, target)
            haptic('success')
            toast(copy.moved(title, pageName(data.rules.mainDashboard, target)))
          }}
        >
          {pagesOf(place).map((p) => (
            <option key={p} value={p} disabled={p !== current && !hasRoom(p)}>
              {pageName(data.rules.mainDashboard, p)}
              {p !== current && !hasRoom(p) ? ` · ${copy.full}` : ''}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        className="btn btn-icon btn-ghost tactile"
        aria-label={copy.remove(title)}
        onClick={() => {
          remove(place, instance.uid)
          haptic('medium')
          toast(t.widgets.removed)
        }}
      >
        <Trash2 />
      </button>
    </div>
  )
}

/** The small widgets the business added to the top of a module (nothing when there are none). */
export function WidgetStrip({ place }: { place: ModulePlace }) {
  const { active } = useSession()
  if (!active || readPlace(active, place).widgets.length === 0) return null
  return (
    <WidgetDataProvider>
      <Strip place={place} />
    </WidgetDataProvider>
  )
}

function Strip({ place }: { place: ModulePlace }) {
  const { read } = useWidgetLayout()
  return (
    <div className="widget-strip">
      {read(place).widgets.map((instance) => (
        <WidgetSlot key={instance.uid} instance={instance} />
      ))}
    </div>
  )
}
