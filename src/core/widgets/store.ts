import { useCallback } from 'react'
import { useSession } from '../auth/SessionProvider'
import type { ClientConfig } from '../config/types'
import { newId } from '../data/localDb'
import { readRules } from '../rules/defaults'
import type { RuleBook } from '../rules/types'
import { widgetDef } from './catalog'
import type { DashboardPlace, Period, PlaceWidgets, WidgetContext, WidgetInstance, WidgetKind, WidgetPlace } from './types'

/** In onboarding order. */
export const PLACES: WidgetPlace[] = ['dashboard', 'collaborators', 'personalFinance', 'stock', 'businessFinance', 'mainDashboard']

/** Small widgets a module strip can hold. */
export const MODULE_STRIP_LIMIT = 4

export const isDashboard = (place: WidgetPlace): place is DashboardPlace => place === 'dashboard' || place === 'mainDashboard'

/** How many widgets and charts a place has room for: the dashboards follow the rule book's places. */
export function capacity(place: WidgetPlace, rules: RuleBook) {
  if (!isDashboard(place)) return { widgets: MODULE_STRIP_LIMIT, charts: 0 }
  const slots = rules[place].slots
  const charts = slots.filter((s) => s === 'chart').length
  return { widgets: slots.length - charts, charts }
}

type Seed = { type: string; kind: WidgetKind; period?: Period }
const seed = (type: string, kind: WidgetKind = 'widget', period?: Period): Seed => ({ type, kind, period })

/**
 * What the dashboards show before the business picks its own widgets: the first ones that are available
 * with the modules chosen in the onboarding and the rule book, until the places are full.
 */
const PRESETS: Record<DashboardPlace, { widgets: Seed[]; charts: Seed[] }> = {
  dashboard: {
    widgets: [
      seed('collab.team'),
      seed('collab.absences', 'widget', 'daily'),
      seed('personal.balance'),
      seed('business.balance'),
      seed('personal.flows', 'widget', 'daily'),
      seed('business.flows', 'widget', 'daily'),
      seed('stock.today'),
      seed('collab.production', 'widget', 'daily'),
      seed('stock.sent', 'widget', 'daily'),
      seed('stock.received', 'widget', 'daily'),
      seed('personal.result', 'widget', 'daily'),
      seed('business.result', 'widget', 'daily'),
    ],
    charts: [
      seed('business.balanceTrend', 'chart', 'daily'),
      seed('stock.fluctuation', 'chart', 'daily'),
      seed('personal.balanceTrend', 'chart', 'daily'),
      seed('collab.production', 'chart', 'daily'),
      seed('collab.absences', 'chart', 'daily'),
    ],
  },
  mainDashboard: {
    widgets: [
      seed('collab.team'),
      seed('collab.absences', 'widget', 'monthly'),
      seed('collab.salaries'),
      seed('collab.production', 'widget', 'monthly'),
      seed('business.balance'),
      seed('business.flows', 'widget', 'monthly'),
      seed('business.payroll'),
      seed('business.extraCosts'),
      seed('business.stockSold'),
      seed('personal.balance'),
      seed('personal.expenses'),
      seed('stock.today'),
      seed('stock.availability'),
      seed('stock.bestMonth'),
      seed('stock.worstMonth'),
      seed('stock.sent', 'widget', 'monthly'),
      seed('collab.headcount', 'widget', 'monthly'),
      seed('personal.flows', 'widget', 'monthly'),
    ],
    charts: [
      seed('business.result', 'chart', 'monthly'),
      seed('stock.fluctuation', 'chart', 'monthly'),
      seed('personal.result', 'chart', 'monthly'),
      seed('collab.production', 'chart', 'monthly'),
      seed('stock.mostSold', 'chart'),
      seed('collab.headcount', 'chart', 'monthly'),
      seed('business.balanceTrend', 'chart', 'monthly'),
      seed('personal.expenses', 'chart'),
    ],
  },
}

export const isAvailable = (type: string, ctx: WidgetContext) => {
  const def = widgetDef(type)
  return !!def && !def.unavailable?.(ctx)
}

function preset(place: DashboardPlace, ctx: WidgetContext): PlaceWidgets {
  const room = capacity(place, ctx.rules)
  const pick = (seeds: Seed[], count: number) =>
    seeds
      .filter((s) => isAvailable(s.type, ctx))
      .slice(0, count)
      .map((s): WidgetInstance => ({ uid: `preset-${s.type}-${s.kind}`, type: s.type, kind: s.kind, period: s.period }))
  return { widgets: pick(PRESETS[place].widgets, room.widgets), charts: pick(PRESETS[place].charts, room.charts) }
}

const KINDS: WidgetKind[] = ['widget', 'chart']
const PERIODS: Period[] = ['daily', 'monthly', 'yearly']

function parseInstance(value: unknown): WidgetInstance | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (typeof v.uid !== 'string' || typeof v.type !== 'string' || !KINDS.includes(v.kind as WidgetKind)) return null
  return {
    uid: v.uid,
    type: v.type,
    kind: v.kind as WidgetKind,
    period: PERIODS.includes(v.period as Period) ? (v.period as Period) : undefined,
    itemId: typeof v.itemId === 'string' ? v.itemId : undefined,
  }
}

function savedPlace(layout: ClientConfig['layout'], place: WidgetPlace): PlaceWidgets | null {
  const all = layout.widgets
  if (!all || typeof all !== 'object') return null
  const saved = (all as Record<string, unknown>)[place]
  if (!saved || typeof saved !== 'object') return null
  const list = (key: 'widgets' | 'charts') => {
    const raw = (saved as Record<string, unknown>)[key]
    return Array.isArray(raw) ? raw.map(parseInstance).filter((i): i is WidgetInstance => i !== null) : []
  }
  return { widgets: list('widgets'), charts: isDashboard(place) ? list('charts') : [] }
}

/** A place's widgets: what the business chose, or the dashboards' automatic selection until then. */
export function readPlace(config: Pick<ClientConfig, 'layout' | 'modules' | 'rules'>, place: WidgetPlace) {
  const saved = savedPlace(config.layout, place)
  if (saved) return { ...saved, preset: false }
  if (isDashboard(place)) return { ...preset(place, { modules: config.modules, rules: readRules(config) }), preset: true }
  return { widgets: [], charts: [], preset: false }
}

/** Add, remove, move and reset widgets; every change builds on the latest saved config. */
export function useWidgetLayout() {
  const { active, updateActive } = useSession()

  const change = useCallback(
    (place: WidgetPlace, edit: ((current: PlaceWidgets) => PlaceWidgets) | null) =>
      updateActive((latest) => {
        const widgets = { ...((latest.layout.widgets as Record<string, unknown> | undefined) ?? {}) }
        if (edit) {
          const { widgets: w, charts } = readPlace(latest, place)
          widgets[place] = edit({ widgets: w, charts })
        } else {
          delete widgets[place]
        }
        return { layout: { ...latest.layout, widgets } }
      }),
    [updateActive],
  )

  const read = useCallback((place: WidgetPlace) => (active ? readPlace(active, place) : { widgets: [], charts: [], preset: false }), [active])

  const add = useCallback(
    (place: WidgetPlace, instance: Omit<WidgetInstance, 'uid'>) =>
      change(place, (current) => {
        const next = { ...instance, uid: newId('wdg') }
        return instance.kind === 'chart'
          ? { ...current, charts: [...current.charts, next] }
          : { ...current, widgets: [...current.widgets, next] }
      }),
    [change],
  )

  const remove = useCallback(
    (place: WidgetPlace, uid: string) =>
      change(place, (current) => ({
        widgets: current.widgets.filter((i) => i.uid !== uid),
        charts: current.charts.filter((i) => i.uid !== uid),
      })),
    [change],
  )

  const move = useCallback(
    (place: WidgetPlace, uid: string, delta: -1 | 1) =>
      change(place, (current) => {
        const shift = (list: WidgetInstance[]) => {
          const from = list.findIndex((i) => i.uid === uid)
          const to = from + delta
          if (from < 0 || to < 0 || to >= list.length) return list
          const next = [...list]
          ;[next[from], next[to]] = [next[to], next[from]]
          return next
        }
        return { widgets: shift(current.widgets), charts: shift(current.charts) }
      }),
    [change],
  )

  const reset = useCallback((place: WidgetPlace) => change(place, null), [change])

  return { read, add, remove, move, reset }
}
