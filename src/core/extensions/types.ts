import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface ExtensionRoute {
  /** Mounted under /set-as-wish/<path>. */
  path: string
  label: string
  icon?: LucideIcon
  Component: LazyExoticComponent<ComponentType> | ComponentType
}

/**
 * What a client extension (src/extensions/<clientId>/index.ts) can add to the base.
 * Extensions import from the base; the base only ever sees this contract.
 */
export interface ClientExtension {
  clientId: string | null
  routes: ExtensionRoute[]
  /** Custom widgets by id — read by the &widgets& prompt. */
  widgets: Record<string, ComponentType>
  /** Label overrides merged over the base copy. */
  labels: Record<string, string>
}
