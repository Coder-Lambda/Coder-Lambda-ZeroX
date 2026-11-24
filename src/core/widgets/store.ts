import { useCallback } from 'react'
import { useSession } from '../auth/SessionProvider'
import type { ClientConfig } from '../config/types'
import { newId } from '../data/localDb'
import { MAIN_DASHBOARD_PAGES, readRules } from '../rules/defaults'
import type { RuleBook } from '../rules/types'
import { widgetDef } from './catalog'
import type { DashboardPlace, Period, PlaceWidgets, WidgetContext, WidgetInstance, WidgetKind, WidgetPlace } from './types'

/** In onboarding order. */
export const PLACES: WidgetPlace[] = ['dashboard', 'collaborators', 'personalFinance', 'stock', 'businessFinance', 'mainDashboard']

/** Small widgets a module strip can hold. */
export const MODULE_STRIP_LIMIT = 4

export const isDashboard = (place: WidgetPlace): place is DashboardPlace => place === 'dashboard' || place === 'mainDashboard'

/** The pages of a place: the main dashboard has 3, everything else 1. */
export const pagesOf = (place: WidgetPlace) =>
  place === 'mainDashboard' ? Array.from({ length: MAIN_DASHBOARD_PAGES }, (_, i) => i) : [0]

/** The rule book's places of a dashboard (page). */
export function slotsOf(place: DashboardPlace, rules: RuleBook, page = 0) {
  return place === 'mainDashboard' ? (rules.mainDashboard.pages[page]?.slots ?? []) : rules.dashboard.slots
}

/** How many widgets and charts a place (or main dashboard page) has room for. */
export function capacity(place: WidgetPlace, rules: RuleBook, page = 0) {
  if (!isDashboard(place)) return { widgets: MODULE_STRIP_LIMIT, charts: 0 }
  const slots = slotsOf(place, rules, page)
  const charts = slots.filter((s) => s === 'chart').length
  return { widgets: slots.length - charts, charts }
}

/** The widgets and charts on one page of a place. */
export function onPage(place: PlaceWidgets, page: number) {
  const here = (i: WidgetInstance) => (i.page ?? 0) === page
  return { widgets: place.widgets.filter(here), charts: place.charts.filter(here) }
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

/** The available seeds, in order, spread over the place's pages until each page is full. */
function preset(place: DashboardPlace, ctx: WidgetContext): PlaceWidgets {
  const spread = (seeds: Seed[], kind: WidgetKind) => {
    const queue = seeds.filter((s) => isAvailable(s.type, ctx))
    return pagesOf(place).flatMap((page) => {
      const room = capacity(place, ctx.rules, page)[kind === 'chart' ? 'charts' : 'widgets']
      return queue.splice(0, room).map(
        (s): WidgetInstance => ({
          uid: `preset-${s.type}-${s.kind}`,
          type: s.type,
          kind: s.kind,
          period: s.period,
          page: place === 'mainDashboard' ? page : undefined,
        }),
      )
    })
  }
  return { widgets: spread(PRESETS[place].widgets, 'widget'), charts: spread(PRESETS[place].charts, 'chart') }
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
    page: typeof v.page === 'number' && v.page >= 0 && v.page < MAIN_DASHBOARD_PAGES ? Math.floor(v.page) : undefined,
  }
}

/** Main dashboard widgets saved before the pages existed go to the first page that still has room. */
function withPages(list: WidgetInstance[], kind: WidgetKind, rules: RuleBook): WidgetInstance[] {
  const used = pagesOf('mainDashboard').map((page) => list.filter((i) => i.page === page).length)
  return list.map((instance) => {
    if (instance.page !== undefined) return instance
    const room = (page: number) => capacity('mainDashboard', rules, page)[kind === 'chart' ? 'charts' : 'widgets']
    const page = used.findIndex((n, p) => n < room(p))
    const target = page < 0 ? MAIN_DASHBOARD_PAGES - 1 : page
    used[target] += 1
    return { ...instance, page: target }
  })
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
  if (saved && place === 'mainDashboard') {
    const rules = readRules(config)
    return { widgets: withPages(saved.widgets, 'widget', rules), charts: withPages(saved.charts, 'chart', rules), preset: false }
  }
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

  /** Swaps a widget with its neighbour of the same kind on the same page. */
  const move = useCallback(
    (place: WidgetPlace, uid: string, delta: -1 | 1) =>
      change(place, (current) => {
        const shift = (list: WidgetInstance[]) => {
          const from = list.findIndex((i) => i.uid === uid)
          if (from < 0) return list
          const page = list[from].page ?? 0
          const samePage = list.map((i, index) => ({ i, index })).filter(({ i }) => (i.page ?? 0) === page)
          const at = samePage.findIndex(({ index }) => index === from)
          const neighbour = samePage[at + delta]
          if (!neighbour) return list
          const next = [...list]
          ;[next[from], next[neighbour.index]] = [next[neighbour.index], next[from]]
          return next
        }
        return { widgets: shift(current.widgets), charts: shift(current.charts) }
      }),
    [change],
  )

  /** Main dashboard: sends a widget to the end of another page. */
  const moveToPage = useCallback(
    (uid: string, page: number) =>
      change('mainDashboard', (current) => {
        const relocate = (list: WidgetInstance[]) => {
          const instance = list.find((i) => i.uid === uid)
          return instance ? [...list.filter((i) => i.uid !== uid), { ...instance, page }] : list
        }
        return { widgets: relocate(current.widgets), charts: relocate(current.charts) }
      }),
    [change],
  )

  const reset = useCallback((place: WidgetPlace) => change(place, null), [change])

  return { read, add, remove, move, moveToPage, reset }
}
