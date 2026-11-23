import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { BaseModuleId } from '../config/types'

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
  /** Extra tabs a client ordered inside a base module's navbar (e.g. a 4th tab in Estoque). */
  moduleTabs?: Partial<Record<BaseModuleId, ExtensionRoute[]>>
  /** Custom widgets by id — read by the &widgets& prompt. */
  widgets: Record<string, ComponentType>
  /** Label overrides merged over the base copy. */
  labels: Record<string, string>
}
