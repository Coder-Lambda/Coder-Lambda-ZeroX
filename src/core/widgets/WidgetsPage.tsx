import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, ChartColumn, LayoutGrid, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import { t } from '../i18n/pt-BR'
import { PageHead } from '../layout/PageHead'
import { MODULE_ICONS } from '../modules/registry'
import { readRules } from '../rules/defaults'
import { toast } from '../ui/Toaster'
import { CreateWidgetDialog, placeLabel } from './CreateWidgetDialog'
import { capacity, isDashboard, PLACES, useWidgetLayout } from './store'
import type { WidgetInstance, WidgetKind, WidgetPlace } from './types'
import { widgetTitle } from './WidgetSlot'
import './widgets.css'

const copy = t.widgets

/** Configurações › Widgets: what each part of the app shows, and Criar widget. */
export default function WidgetsPage() {
  const { active } = useSession()
  const [params, setParams] = useSearchParams()
  const requested = PLACES.find((p) => p === params.get('criar'))
  const requestedKind = (params.get('tipo') === 'chart' ? 'chart' : 'widget') as WidgetKind
  const [creating, setCreating] = useState(params.has('criar'))
  if (!active) return null
  const places = PLACES.filter((p) => active.modules[p])

  const close = () => {
    setCreating(false)
    // Drop ?criar so a reload doesn't reopen the dialog.
    if (params.has('criar')) setParams({}, { replace: true })
  }

  return (
    <>
      <Link to="/configuracoes" className="back-link mb-3">
        <ArrowLeft />
        {t.rules.back}
      </Link>
      <PageHead
        title={copy.title}
        sub={copy.sub}
        aside={
          <button type="button" className="btn btn-primary tactile" onClick={() => setCreating(true)}>
            <Plus />
            {copy.create}
          </button>
        }
      />

      <div className="card-grid">
        {places.map((place) => (
          <PlaceCard key={place} place={place} />
        ))}
      </div>

      <CreateWidgetDialog
        key={creating ? `${requested ?? 'any'}-${requestedKind}` : 'closed'}
        open={creating}
        onClose={close}
        initialPlace={requested}
        initialKind={requestedKind}
      />
    </>
  )
}

function PlaceCard({ place }: { place: WidgetPlace }) {
  const { active } = useSession()
  const { read, remove, move, reset } = useWidgetLayout()
  if (!active) return null
  const rules = readRules(active)
  const room = capacity(place, rules)
  const { widgets, charts, preset } = read(place)
  const Icon = MODULE_ICONS[place]
  const label = placeLabel(place, active.labels)
  const dashboard = isDashboard(place)

  return (
    <section className="glass card span-6 wp-card" aria-label={label}>
      <header className="wp-head">
        <span className="wp-icon" aria-hidden="true">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="card-title mb-0">{label}</h2>
          <p className="text-2 num text-[13px]">
            {dashboard
              ? `${copy.capacity.widgets(Math.min(widgets.length, room.widgets), room.widgets)} · ${copy.capacity.charts(Math.min(charts.length, room.charts), room.charts)}`
              : copy.capacity.module(widgets.length, room.widgets)}
          </p>
        </div>
      </header>

      {preset && <p className="text-2 text-[13px]">{copy.preset}</p>}

      {widgets.length + charts.length === 0 ? (
        <p className="wg-muted">{dashboard ? copy.emptyDashboard : copy.emptyModule}</p>
      ) : (
        <>
          <InstanceList place={place} kind="widget" list={widgets} room={room.widgets} onRemove={remove} onMove={move} />
          {dashboard && <InstanceList place={place} kind="chart" list={charts} room={room.charts} onRemove={remove} onMove={move} />}
        </>
      )}

      <div className="wp-actions">
        {dashboard && (
          <Link to={`/configuracoes/regras#regras-${place}`} className="btn btn-ghost tactile">
            <BookOpen />
            {copy.placesInRules}
          </Link>
        )}
        {dashboard && !preset && (
          <button
            type="button"
            className="btn btn-ghost tactile"
            onClick={() => {
              reset(place)
              toast(copy.restored)
            }}
          >
            <RotateCcw />
            {copy.restore}
          </button>
        )}
      </div>
    </section>
  )
}

function InstanceList({
  place,
  kind,
  list,
  room,
  onRemove,
  onMove,
}: {
  place: WidgetPlace
  kind: WidgetKind
  list: WidgetInstance[]
  room: number
  onRemove: (place: WidgetPlace, uid: string) => void
  onMove: (place: WidgetPlace, uid: string, delta: -1 | 1) => void
}) {
  if (list.length === 0) return null
  const Icon = kind === 'chart' ? ChartColumn : LayoutGrid
  return (
    <ul className="people-list" aria-label={kind === 'chart' ? copy.wizard.kinds.chart : copy.wizard.kinds.widget}>
      {list.map((instance, i) => {
        const title = widgetTitle(instance)
        const hidden = i >= room
        return (
          <li key={instance.uid} className={`wp-row well${hidden ? ' is-hidden' : ''}`}>
            <Icon className="wp-kind" aria-label={copy.wizard.kinds[kind]} role="img" />
            <span className="person-main">
              <span className="person-name">{title}</span>
              {hidden && <span className="person-sub">{copy.hidden}</span>}
            </span>
            <button type="button" className="btn btn-icon btn-ghost tactile" aria-label={copy.moveUp(title)} disabled={i === 0} onClick={() => onMove(place, instance.uid, -1)}>
              <ArrowUp />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-ghost tactile"
              aria-label={copy.moveDown(title)}
              disabled={i === list.length - 1}
              onClick={() => onMove(place, instance.uid, 1)}
            >
              <ArrowDown />
            </button>
            <button
              type="button"
              className="btn btn-icon btn-ghost tactile"
              aria-label={copy.remove(title)}
              onClick={() => {
                onRemove(place, instance.uid)
                toast(copy.removed)
              }}
            >
              <Trash2 />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
