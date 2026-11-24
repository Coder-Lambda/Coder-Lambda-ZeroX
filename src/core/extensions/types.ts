import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { BaseModuleId } from '../config/types'
import type { WidgetDef } from '../widgets/types'

export interface ExtensionRoute {
  /** Mounted under /set-as-wish/<path> (routes) or /<module>/x/<path> (module tabs). */
  path: string
  label: string
  icon?: LucideIcon
  Component: LazyExoticComponent<ComponentType> | ComponentType
}

/**
 * A chapter of the Livro de regras built for one client. Its component reads and writes its own values with
 * `useCustomRules(id, defaults)` (src/core/rules/useRules.ts); the base stores them in `rules.custom[id]`.
 */
export interface ExtensionRuleChapter {
  id: string
  title: string
  sub: string
  icon?: LucideIcon
  Component: LazyExoticComponent<ComponentType> | ComponentType
}

/** A widget built for one client: the base catalog's shape, with its own title and description. */
export type ExtensionWidget = Omit<WidgetDef, 'source'> & { title: string; description: string }

/**
 * What a client extension (src/extensions/<clientId>/index.ts) can add to the base: the client's set-as-wish
 * parts. Extensions import from the base; the base only ever sees this contract. Everything here shows only for
 * businesses that said yes to set-as-wish in the onboarding.
 */
export interface ClientExtension {
  clientId: string | null
  /** New parts of the app, listed in the sidebar under Set-as-wish. */
  routes: ExtensionRoute[]
  /** Extra compartments inside a base module's navbar (Colaboradores, Estoque, Finanças da empresa). */
  moduleTabs?: Partial<Record<BaseModuleId, ExtensionRoute[]>>
  /** Extra chapters of the Livro de regras. */
  ruleChapters?: ExtensionRuleChapter[]
  /** Extra widgets, offered in Criar widget next to the base ones. */
  widgets?: ExtensionWidget[]
  /** Label overrides merged over the base copy. */
  labels: Record<string, string>
}
