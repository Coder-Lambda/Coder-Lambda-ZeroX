import { clientRegistry } from '../config/clientRegistry'
import type { ClientConfig } from '../config/types'
import type { DashboardRules, RuleBook, RuleBookPreset, RuleChapter, SlotKind } from './types'

const slots = (widgets: number, charts: number): SlotKind[] => [
  ...Array<SlotKind>(widgets).fill('widget'),
  ...Array<SlotKind>(charts).fill('chart'),
]

/** How many places each dashboard can have. */
export const SLOT_LIMITS = { dashboard: { min: 1, max: 9 }, mainDashboard: { min: 1, max: 12 } } as const

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
  dashboard: { slots: slots(6, 1) },
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

function validSlots(rules: DashboardRules, limit: { min: number; max: number }, fallback: DashboardRules) {
  const list = Array.isArray(rules.slots) ? rules.slots.filter((s) => s === 'widget' || s === 'chart') : []
  return list.length >= limit.min ? { slots: list.slice(0, limit.max) } : fallback
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
