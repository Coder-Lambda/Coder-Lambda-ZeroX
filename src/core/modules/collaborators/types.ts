import type { BusinessRow } from '../../data/useTable'

export type EmployeeStatus = 'active' | 'inactive' | 'vacation'

export interface Employee extends BusinessRow {
  name: string
  phone: string
  email: string
  pixKey: string
  /** YYYY-MM-DD */
  birthday: string | null
  salary: number | null
  /** Formally registered (carteira assinada). null = not informed. */
  registered: boolean | null
  status: EmployeeStatus
  /** YYYY-MM-DD the employee was taken off the list. */
  removedOn: string | null
  source: 'manual' | 'import'
  createdAt: string
}

export interface Absence extends BusinessRow {
  employee_id: string
  /** YYYY-MM-DD */
  date: string
}

export interface EmployeeNote extends BusinessRow {
  employee_id: string
  kind: 'warning' | 'incident'
  /** YYYY-MM-DD */
  date: string
  text: string
  createdAt: string
}

/** Metadata only; the bytes live in fileStore (IndexedDB) under the same id. */
export interface EmployeeFile extends BusinessRow {
  employee_id: string
  name: string
  type: string
  size: number
  createdAt: string
}

export interface CustomSection {
  id: string
  title: string
  content: string
}

export interface Partner extends BusinessRow {
  name: string
  email: string
  phone: string
  pixKey: string
  /** What the partner does, written by the client. */
  summary: string
  sections: CustomSection[]
  createdAt: string
}

export interface Supplier extends BusinessRow {
  name: string
  email: string
  phone: string
  pixKey: string
  /** What the supplier provides. */
  supplies: string
  monthlyAmount: number | null
  sections: CustomSection[]
  createdAt: string
}

/** The mini widgets that can appear on an employee card (up to 7). */
export const EMPLOYEE_WIDGETS = ['phone', 'email', 'pixKey', 'birthday', 'salary', 'registered', 'absences'] as const
export type EmployeeWidget = (typeof EMPLOYEE_WIDGETS)[number]
