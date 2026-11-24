import { clientRegistry } from '../config/clientRegistry'
import { t } from '../i18n/pt-BR'
import type { ClientConfig } from '../config/types'
import type { DashboardRules, MainDashboardRules, RuleBook, RuleBookPreset, RuleChapter, SlotKind } from './types'

const slots = (widgets: number, charts: number): SlotKind[] => [
  ...Array<SlotKind>(widgets).fill('widget'),
  ...Array<SlotKind>(charts).fill('chart'),
]

/**
 * How many places each dashboard can have: the dashboard up to 9, at most 2 of them charts
 * (7 widgets + 2 charts, or 9 widgets); each of the main dashboard's 3 pages up to 5 widgets and 2 charts
 * (15 widgets and 6 charts in all).
 */
export const SLOT_LIMITS = {
  dashboard: { min: 1, max: 9, maxWidgets: 9, maxCharts: 2 },
  mainDashboard: { min: 1, max: 7, maxWidgets: 5, maxCharts: 2 },
} as const

export const MAIN_DASHBOARD_PAGES = 3

type SlotLimit = (typeof SLOT_LIMITS)[keyof typeof SLOT_LIMITS]

/**
 * The book every business starts with. The absence alert at 3 comes from Dahjon; everything else is off
 * until the business writes its own rule.
 */
export const DEFAULT_RULES: RuleBook = {
  collaborators: {
    presenceList: true,
    absenceCharge: 'none',
    absenceValue: null,
    absenceAlert: 3,
    leaveTypes: [],
    production: false,
    productionItems: [],
  },
  personalFinance: { alarms: [] },
  businessFinance: { payRules: [], moneyAlarms: [] },
  stock: { units: [], itemValue: false, fields: [] },
  dashboard: { slots: slots(7, 2) },
  mainDashboard: { pages: Array.from({ length: MAIN_DASHBOARD_PAGES }, () => ({ name: '', slots: slots(5, 2) })) },
  custom: {},
}

const CHAPTERS = Object.keys(DEFAULT_RULES) as RuleChapter[]

function merge(base: RuleBook, preset: RuleBookPreset | undefined): RuleBook {
  if (!preset) return base
  const next = { ...base } as Record<RuleChapter, unknown>
  for (const chapter of CHAPTERS) {
    const patch = preset[chapter]
    if (patch && typeof patch === 'object') next[chapter] = { ...base[chapter], ...patch }
  }
  return next as RuleBook
}

/** Keeps a saved layout inside the limits: extra charts become widgets while there is room, the rest is cut. */
function validSlots(rules: DashboardRules, limit: SlotLimit, fallback: DashboardRules) {
  const list = Array.isArray(rules.slots) ? rules.slots.filter((s) => s === 'widget' || s === 'chart') : []
  if (list.length < limit.min) return fallback
  let widgets = 0
  let charts = 0
  const kept: SlotKind[] = []
  for (const slot of list) {
    const kind: SlotKind | null =
      slot === 'chart' && charts < limit.maxCharts ? 'chart' : widgets < limit.maxWidgets ? 'widget' : null
    if (!kind || kept.length >= limit.max) continue
    if (kind === 'chart') charts += 1
    else widgets += 1
    kept.push(kind)
  }
  return { slots: kept }
}

/** Always 3 pages, each inside its limits; a book saved before the pages existed gets the default pages. */
function validPages(rules: MainDashboardRules): MainDashboardRules {
  const saved = Array.isArray(rules.pages) ? rules.pages : []
  return {
    pages: DEFAULT_RULES.mainDashboard.pages.map((fallback, i) => {
      const page = saved[i]
      if (!page || typeof page !== 'object') return fallback
      return {
        name: typeof page.name === 'string' ? page.name.slice(0, 40) : '',
        slots: validSlots({ slots: page.slots }, SLOT_LIMITS.mainDashboard, fallback).slots,
      }
    }),
  }
}

/** A main dashboard page's name: the client's, or "Página n". */
export const pageName = (rules: MainDashboardRules, index: number) =>
  rules.pages[index]?.name.trim() || t.page(index + 1)

/** Base defaults ← the client's preset (clients/<id>.json) ← what this business wrote. Old configs have no book yet. */
export function readRules(config: Pick<ClientConfig, 'rules'> | null | undefined): RuleBook {
  const book = merge(merge(DEFAULT_RULES, clientRegistry.defaultRules), config?.rules)
  return {
    ...book,
    dashboard: validSlots(book.dashboard, SLOT_LIMITS.dashboard, DEFAULT_RULES.dashboard),
    mainDashboard: validPages(book.mainDashboard),
  }
}
