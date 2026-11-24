import type { ReactNode } from 'react'
import type { BaseModuleId, ModuleFlags } from '../config/types'
import type { RuleBook } from '../rules/types'
import type { WidgetData } from './data'

/** Where a widget can live: the two dashboards, or the small strip at the top of a module. */
export type WidgetPlace = Exclude<BaseModuleId, never>
export type DashboardPlace = 'dashboard' | 'mainDashboard'
export type ModulePlace = Exclude<WidgetPlace, DashboardPlace>

/** A widget place shows a number/text; a chart place shows a chart (dashboards only). */
export type WidgetKind = 'widget' | 'chart'

/** The window a fluctuation widget looks at: today vs yesterday, this month vs last, this year vs last. */
export type Period = 'daily' | 'monthly' | 'yearly'

/** The module whose data a widget reads. */
export type WidgetSource = 'collaborators' | 'personalFinance' | 'businessFinance' | 'stock'

/** One widget the business added somewhere. */
export interface WidgetInstance {
  uid: string
  type: string
  kind: WidgetKind
  period?: Period
  /** Production item (rule book) for production widgets. */
  itemId?: string
}

/** What a place holds: widgets fill its widget places, charts its chart places, in order. */
export interface PlaceWidgets {
  widgets: WidgetInstance[]
  charts: WidgetInstance[]
}

export interface WidgetContext {
  modules: ModuleFlags
  rules: RuleBook
}

export interface WidgetProps {
  instance: WidgetInstance
  data: WidgetData
  /** On the main dashboard widgets show more detail. */
  extended: boolean
  /** Charts: show the data as a table instead. */
  asTable: boolean
}

export interface WidgetDef {
  type: string
  source: WidgetSource
  /** Widget (number/text), chart, or both (the business picks). */
  kinds: WidgetKind[]
  places: WidgetPlace[]
  /** Has a day / month / year choice. */
  periodic?: boolean
  /** Picks one of the rule book's production items. */
  itemOption?: boolean
  /** Why it can't be used right now (a module or a rule is off), or null. */
  unavailable?: (ctx: WidgetContext) => string | null
  render: (props: WidgetProps) => ReactNode
}
