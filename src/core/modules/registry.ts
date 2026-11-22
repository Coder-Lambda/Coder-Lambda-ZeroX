import {
  Building2,
  ChartNoAxesCombined,
  LayoutDashboard,
  Package,
  Users,
  Wallet,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'
import type { BaseModuleId, ModuleId } from '../config/types'

/** Placeholder layout each module shows until its own prompt builds it. */
export type ModuleShell =
  | { kind: 'widgets'; widgets: number; charts: number; pages?: number }
  | { kind: 'sections' }

export interface ModuleDef {
  id: BaseModuleId
  path: string
  icon: LucideIcon
  shell: ModuleShell
}

export const BASE_MODULES: ModuleDef[] = [
  { id: 'dashboard', path: 'dashboard', icon: LayoutDashboard, shell: { kind: 'widgets', widgets: 6, charts: 1 } },
  { id: 'collaborators', path: 'colaboradores', icon: Users, shell: { kind: 'sections' } },
  { id: 'personalFinance', path: 'financas-pessoais', icon: Wallet, shell: { kind: 'sections' } },
  { id: 'stock', path: 'estoque', icon: Package, shell: { kind: 'widgets', widgets: 7, charts: 0 } },
  { id: 'businessFinance', path: 'financas-empresa', icon: Building2, shell: { kind: 'sections' } },
  {
    id: 'mainDashboard',
    path: 'dashboard-principal',
    icon: ChartNoAxesCombined,
    shell: { kind: 'widgets', widgets: 8, charts: 4, pages: 3 },
  },
]

export const SET_AS_WISH_PATH = 'set-as-wish'

export const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  ...(Object.fromEntries(BASE_MODULES.map((m) => [m.id, m.icon])) as Record<BaseModuleId, LucideIcon>),
  setAsWish: WandSparkles,
}
