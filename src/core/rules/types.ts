/**
 * The Livro de regras: what each business decides about how ZeroX works for it.
 * Stored inside ClientConfig (data, never code), so every business — and later its own database — has its own book.
 * Each chapter belongs to one module and only shows when that module was chosen in the onboarding.
 */

/** How an absent day is charged on the employee's pay. salaryDay = salary ÷ 30 (Dahjon's 3,33% per day). */
export type AbsenceCharge = 'none' | 'fixed' | 'salaryDay'

/** A special situation in which the employee is away without it being an absence (maternity leave, illness…). */
export interface LeaveType {
  id: string
  name: string
  /** Usual length in days; null = chosen when the leave is registered. */
  days: number | null
}

/** goal = what should at least be made (meta). ceiling = the most that should be made (teto). */
export type TargetKind = 'goal' | 'ceiling'
export type ProductionPeriod = 'daily' | 'monthly' | 'yearly'

/** Something the employees produce, with its target per day, month and year. */
export interface ProductionItem {
  id: string
  name: string
  unit: string
  kind: TargetKind
  /** The target is for each employee or for the whole team. */
  per: 'employee' | 'team'
  daily: number | null
  monthly: number | null
  yearly: number | null
}

export interface CollaboratorRules {
  presenceList: boolean
  absenceCharge: AbsenceCharge
  /** R$ per absent day when absenceCharge is 'fixed'. */
  absenceValue: number | null
  /** Red ping in the presence list once an employee reaches this many absences in the month; null = off. */
  absenceAlert: number | null
  leaveTypes: LeaveType[]
  production: boolean
  productionItems: ProductionItem[]
}

/** Warns ahead of the due date of the bills (payable) or incomes (receivable) it matches. */
export interface FinanceAlarm {
  id: string
  name: string
  kind: 'payable' | 'receivable'
  /** Matches titles whose description or category contains this text; empty = every title of that kind. */
  match: string
  daysBefore: number
}

export interface PersonalFinanceRules {
  alarms: FinanceAlarm[]
}

/** A special value on the employees' payment: an addition (bonus, benefit) or a discount. */
export interface PayRule {
  id: string
  name: string
  kind: 'add' | 'discount'
  mode: 'fixed' | 'percent'
  /** R$ when fixed, % of the salary when percent. */
  value: number
  /** Empty = every employee. */
  employeeIds: string[]
}

export type MoneyMetric = 'balance' | 'revenue' | 'expenses' | 'result'

/** Fires when a money figure of the business is reached (above) or lost (below). */
export interface MoneyAlarm {
  id: string
  name: string
  metric: MoneyMetric
  when: 'above' | 'below'
  value: number
}

export interface BusinessFinanceRules {
  payRules: PayRule[]
  moneyAlarms: MoneyAlarm[]
}

/** A unit of the business's own, next to the standard ones (un, kg, L…). */
export interface CustomUnit {
  id: string
  name: string
  abbr: string
}

/** An extra label on every stock item (lot, expiry date, color…). */
export interface ItemField {
  id: string
  name: string
  type: 'text' | 'number' | 'date'
}

export interface StockRules {
  units: CustomUnit[]
  /** Items carry a unit value, and the stock shows its total value. */
  itemValue: boolean
  fields: ItemField[]
}

/** Each place on a dashboard holds a widget or is exchanged for a chart. */
export type SlotKind = 'widget' | 'chart'

export interface DashboardRules {
  slots: SlotKind[]
}

export interface RuleBook {
  collaborators: CollaboratorRules
  personalFinance: PersonalFinanceRules
  businessFinance: BusinessFinanceRules
  stock: StockRules
  dashboard: DashboardRules
  mainDashboard: DashboardRules
}

export type RuleChapter = keyof RuleBook

/** A client's preset rules (clients/<id>.json → defaultRules): any chapter, any field. */
export type RuleBookPreset = { [K in RuleChapter]?: Partial<RuleBook[K]> }
