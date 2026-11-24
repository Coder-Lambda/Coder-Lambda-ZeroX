import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useSession } from '../auth/SessionProvider'
import type { ModuleFlags } from '../config/types'
import { todayKey } from '../lib/format'
import {
  useAbsences,
  useEmployees,
  useLeaves,
  usePartners,
  useProduction,
  useSuppliers,
} from '../modules/collaborators/store'
import type { Absence, Employee, EmployeeLeave, Partner, ProductionRecord, Supplier } from '../modules/collaborators/types'
import { useFinance } from '../modules/finance/store'
import type { FinanceBook, FinanceData } from '../modules/finance/types'
import { useStock } from '../modules/stock/store'
import type { StockData } from '../modules/stock/types'
import { readRules } from '../rules/defaults'
import type { RuleBook } from '../rules/types'

/** Everything a widget may read, loaded once per page instead of once per widget. */
export interface WidgetData {
  today: string
  modules: ModuleFlags
  rules: RuleBook
  employees: Employee[]
  absences: Absence[]
  leaves: EmployeeLeave[]
  production: ProductionRecord[]
  partners: Partner[]
  suppliers: Supplier[]
  finance: Record<FinanceBook, FinanceData>
  stock: StockData
}

const WidgetDataContext = createContext<WidgetData | null>(null)

export function WidgetDataProvider({ children }: { children: ReactNode }) {
  const { active } = useSession()
  const employees = useEmployees()
  const absences = useAbsences()
  const leaves = useLeaves()
  const production = useProduction()
  const partners = usePartners()
  const suppliers = useSuppliers()
  const personal = useFinance('personal')
  const business = useFinance('business')
  const stock = useStock()
  const today = todayKey()

  const value = useMemo<WidgetData | null>(
    () =>
      active
        ? {
            today,
            modules: active.modules,
            rules: readRules(active),
            employees,
            absences,
            leaves,
            production,
            partners,
            suppliers,
            finance: { personal, business },
            stock,
          }
        : null,
    [active, today, employees, absences, leaves, production, partners, suppliers, personal, business, stock],
  )

  return value ? <WidgetDataContext.Provider value={value}>{children}</WidgetDataContext.Provider> : null
}

export function useWidgetData() {
  const value = useContext(WidgetDataContext)
  if (!value) throw new Error('useWidgetData precisa estar dentro de <WidgetDataProvider>')
  return value
}
