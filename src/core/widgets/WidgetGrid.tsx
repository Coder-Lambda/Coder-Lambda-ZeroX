import { useSession } from '../auth/SessionProvider'
import { WidgetDataProvider, useWidgetData } from './data'
import { readPlace, useWidgetLayout } from './store'
import type { DashboardPlace, ModulePlace } from './types'
import { EmptySlot, WidgetSlot } from './WidgetSlot'

/**
 * A dashboard: the rule book's places in order, each widget place filled by the next widget and each chart
 * place by the next chart. Places without one offer to create it.
 */
export function WidgetGrid({ place }: { place: DashboardPlace }) {
  return (
    <WidgetDataProvider>
      <Grid place={place} />
    </WidgetDataProvider>
  )
}

function Grid({ place }: { place: DashboardPlace }) {
  const data = useWidgetData()
  const { read } = useWidgetLayout()
  const { widgets, charts } = read(place)
  let widgetIndex = 0
  let chartIndex = 0

  return (
    <div className="card-grid widget-grid-dash">
      {data.rules[place].slots.map((slot, i) => {
        const instance = slot === 'chart' ? charts[chartIndex++] : widgets[widgetIndex++]
        return (
          <div key={instance?.uid ?? `empty-${i}`} className={`widget-cell fade-in ${slot === 'chart' ? 'span-6' : 'span-3'}`}>
            {instance ? <WidgetSlot instance={instance} extended={place === 'mainDashboard'} /> : <EmptySlot place={place} kind={slot} />}
          </div>
        )
      })}
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
