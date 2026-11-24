import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, ChartColumn, LayoutGrid, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import { t } from '../i18n/pt-BR'
import { PageHead } from '../layout/PageHead'
import { MODULE_ICONS } from '../modules/registry'
import { pageName, readRules } from '../rules/defaults'
import { toast } from '../ui/Toaster'
import { CreateWidgetDialog, placeLabel } from './CreateWidgetDialog'
import { capacity, isDashboard, onPage, pagesOf, PLACES, useWidgetLayout } from './store'
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
  const requestedPage = Math.min(2, Math.max(0, (Number(params.get('pagina')) || 1) - 1))
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
        initialPage={requestedPage}
      />
    </>
  )
}

function PlaceCard({ place }: { place: WidgetPlace }) {
  const { active } = useSession()
  const { read, remove, move, moveToPage, reset } = useWidgetLayout()
  if (!active) return null
  const rules = readRules(active)
  const all = read(place)
  const preset = all.preset
  const pages = pagesOf(place)
  const main = place === 'mainDashboard'
  const Icon = MODULE_ICONS[place]
  const label = placeLabel(place, active.labels)
  const dashboard = isDashboard(place)
  const rooms = pages.map((page) => capacity(place, rules, page))
  const total = { widgets: rooms.reduce((s, r) => s + r.widgets, 0), charts: rooms.reduce((s, r) => s + r.charts, 0) }
  const shown = (key: 'widgets' | 'charts') =>
    pages.reduce((s, page, i) => s + Math.min(onPage(all, page)[key].length, rooms[i][key]), 0)
  const hasRoom = (kind: WidgetKind, page: number) => {
    const key = kind === 'chart' ? 'charts' : 'widgets'
    return onPage(all, page)[key].length < rooms[page][key]
  }

  return (
    <section className={`glass card ${main ? 'span-12' : 'span-6'} wp-card`} aria-label={label}>
      <header className="wp-head">
        <span className="wp-icon" aria-hidden="true">
          <Icon />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="card-title mb-0">{label}</h2>
          <p className="text-2 num text-[13px]">
            {dashboard
              ? `${copy.capacity.widgets(shown('widgets'), total.widgets)} · ${copy.capacity.charts(shown('charts'), total.charts)}`
              : copy.capacity.module(all.widgets.length, total.widgets)}
          </p>
        </div>
      </header>

      {preset && <p className="text-2 text-[13px]">{copy.preset}</p>}

      <div className={main ? 'wp-pages' : undefined}>
        {pages.map((page, i) => {
          const here = onPage(all, page)
          return (
            <div key={page} className="wp-page">
              {main && (
                <h3 className="wp-page-title">
                  <span className="md-step num" aria-hidden="true">
                    {page + 1}
                  </span>
                  {pageName(rules.mainDashboard, page)}
                  <span className="text-2 num">
                    {here.widgets.length}/{rooms[i].widgets} · {here.charts.length}/{rooms[i].charts}
                  </span>
                </h3>
              )}
              {here.widgets.length + here.charts.length === 0 ? (
                <p className="wg-muted">{dashboard ? copy.emptyDashboard : copy.emptyModule}</p>
              ) : (
                (['widget', 'chart'] as const).map((kind) => (
                  <InstanceList
                    key={kind}
                    place={place}
                    kind={kind}
                    list={kind === 'chart' ? here.charts : here.widgets}
                    room={kind === 'chart' ? rooms[i].charts : rooms[i].widgets}
                    onRemove={remove}
                    onMove={move}
                    pages={
                      main
                        ? {
                            current: page,
                            options: pages.map((p) => ({ page: p, name: pageName(rules.mainDashboard, p), room: hasRoom(kind, p) })),
                            onMove: moveToPage,
                          }
                        : undefined
                    }
                  />
                ))
              )}
            </div>
          )
        })}
      </div>

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

interface PageChoice {
  current: number
  options: { page: number; name: string; room: boolean }[]
  onMove: (uid: string, page: number) => void
}

function InstanceList({
  place,
  kind,
  list,
  room,
  onRemove,
  onMove,
  pages,
}: {
  place: WidgetPlace
  kind: WidgetKind
  list: WidgetInstance[]
  room: number
  onRemove: (place: WidgetPlace, uid: string) => void
  onMove: (place: WidgetPlace, uid: string, delta: -1 | 1) => void
  /** Main dashboard: send a widget to another page. */
  pages?: PageChoice
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
            {pages && (
              <select
                className="input select wg-organize-page wp-page-select"
                aria-label={copy.organize.toPage(title)}
                value={pages.current}
                onChange={(e) => {
                  const target = Number(e.target.value)
                  pages.onMove(instance.uid, target)
                  toast(copy.organize.moved(title, pages.options[target].name))
                }}
              >
                {pages.options.map((o) => (
                  <option key={o.page} value={o.page} disabled={o.page !== pages.current && !o.room}>
                    {o.name}
                    {o.page !== pages.current && !o.room ? ` · ${copy.organize.full}` : ''}
                  </option>
                ))}
              </select>
            )}
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
