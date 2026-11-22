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
}
