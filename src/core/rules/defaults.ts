import { clientRegistry } from '../config/clientRegistry'
import type { ClientConfig } from '../config/types'
import type { DashboardRules, RuleBook, RuleBookPreset, RuleChapter, SlotKind } from './types'

const slots = (widgets: number, charts: number): SlotKind[] => [
  ...Array<SlotKind>(widgets).fill('widget'),
  ...Array<SlotKind>(charts).fill('chart'),
]

/**
 * How many places each dashboard can have: the dashboard up to 9, at most 2 of them charts
 * (7 widgets + 2 charts, or 9 widgets); the main dashboard up to 15 widgets and 6 charts.
 */
export const SLOT_LIMITS = {
  dashboard: { min: 1, max: 9, maxWidgets: 9, maxCharts: 2 },
  mainDashboard: { min: 1, max: 21, maxWidgets: 15, maxCharts: 6 },
} as const

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
  mainDashboard: { slots: slots(8, 4) },
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

/** Base defaults ← the client's preset (clients/<id>.json) ← what this business wrote. Old configs have no book yet. */
export function readRules(config: Pick<ClientConfig, 'rules'> | null | undefined): RuleBook {
  const book = merge(merge(DEFAULT_RULES, clientRegistry.defaultRules), config?.rules)
  return {
    ...book,
    dashboard: validSlots(book.dashboard, SLOT_LIMITS.dashboard, DEFAULT_RULES.dashboard),
    mainDashboard: validSlots(book.mainDashboard, SLOT_LIMITS.mainDashboard, DEFAULT_RULES.mainDashboard),
  }
}
