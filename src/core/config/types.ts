import type { RuleBookPreset } from '../rules/types'

export type PaletteThemeId = 'dolphin' | 'blackwidow' | 'frog' | 'wolf'
export type ThemeId = 'mono' | PaletteThemeId

/** Order matters: it is the order of the onboarding pages and of the navigation. */
export const MODULE_IDS = [
  'dashboard',
  'collaborators',
  'personalFinance',
  'stock',
  'businessFinance',
  'mainDashboard',
  'setAsWish',
] as const

export type ModuleId = (typeof MODULE_IDS)[number]
export type BaseModuleId = Exclude<ModuleId, 'setAsWish'>
export type ModuleFlags = Record<ModuleId, boolean>

export interface DatabaseChoice {
  hasExisting: boolean
  /** Only which provider — keys and URLs are never stored by the app. */
  provider: 'supabase' | 'other' | null
}

/** What a set-as-wish client asks the ZeroX team to build: a new part, a rule, or a compartment in a module. */
export type WishKind = 'part' | 'rule' | 'compartment'

export interface Wish {
  id: string
  kind: WishKind
  text: string
  createdAt: string
}

/** One per business. Written by the onboarding; this is data, never code. */
export interface ClientConfig {
  clientId: string
  businessId: string
  ownerAccountId: string
  userName: string
  theme: PaletteThemeId
  businessType: string
  database: DatabaseChoice
  modules: ModuleFlags
  /** Widget/chart layout — filled by the &widgets& prompt. */
  layout: Record<string, unknown>
  /** Per-client label overrides. */
  labels: Record<string, string>
  /** The Livro de regras (src/core/rules). Read it with readRules(), which fills what is missing. */
  rules?: RuleBookPreset
  /** Set-as-wish requests to the ZeroX team (onboarding or Configurações). */
  wishes?: Wish[]
  createdAt: string
}

/** clients/<clientId>.json — deployment metadata, no secrets. */
export interface ClientRegistryEntry {
  clientId: string
  name: string
  theme: PaletteThemeId
  /** Modules this client can use. The onboarding only asks about these. */
  enabledModules: ModuleId[]
  hostingUrl: string
  supabaseProjectRef: string
  baseVersion: string
  notes: string
  /** Rules every new business of this client starts with (its niche's usual rules). */
  defaultRules?: RuleBookPreset
}
