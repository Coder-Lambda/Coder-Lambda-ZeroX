import type { CollaboratorRules, PayRule } from '../../../rules/types'
import { absenceDeduction, countedAbsences } from '../../collaborators/rules'
import type { Absence, Employee, EmployeeLeave } from '../../collaborators/types'

const round = (value: number) => Math.round(value * 100) / 100

/** What the payroll needs besides the employees: their absences and leaves, and the rule book. */
export interface PayrollRules {
  absences: Absence[]
  leaves: EmployeeLeave[]
  collaborators: CollaboratorRules
  payRules: PayRule[]
}

export const appliesTo = (rule: PayRule, employeeId: string) =>
  rule.employeeIds.length === 0 || rule.employeeIds.includes(employeeId)

export function ruleAmount(rule: PayRule, salary: number) {
  return round(rule.mode === 'percent' ? (salary * rule.value) / 100 : rule.value)
}

/** One employee's pay for the month: salary, special values from the rule book, and the absence discount. */
export function employeePay(employee: Employee, month: string, rules?: PayrollRules) {
  const salary = employee.salary ?? 0
  const applied = (rules?.payRules ?? [])
    .filter((r) => appliesTo(r, employee.id))
    .map((rule) => ({ rule, amount: ruleAmount(rule, salary) }))
  const additions = round(applied.filter((a) => a.rule.kind === 'add').reduce((s, a) => s + a.amount, 0))
  const discounts = round(applied.filter((a) => a.rule.kind === 'discount').reduce((s, a) => s + a.amount, 0))
  const absences = rules ? countedAbsences(rules.absences, rules.leaves, employee.id, month) : 0
  const absenceDiscount = rules ? absenceDeduction(employee, absences, rules.collaborators) : 0
  return {
    employee,
    salary,
    applied,
    additions,
    discounts,
    absences,
    absenceDiscount,
    total: Math.max(0, round(salary + additions - discounts - absenceDiscount)),
  }
}

/** The month's payroll of everyone still on the list, with the totals of each part. */
export function payroll(employees: Employee[], month: string, rules?: PayrollRules) {
  const rows = employees.filter((e) => e.status !== 'inactive').map((e) => employeePay(e, month, rules))
  const sum = (pick: (row: (typeof rows)[number]) => number) => round(rows.reduce((s, r) => s + pick(r), 0))
  return {
    rows,
    salaries: sum((r) => r.salary),
    additions: sum((r) => r.additions),
    discounts: sum((r) => r.discounts),
    absenceDiscount: sum((r) => r.absenceDiscount),
    total: sum((r) => r.total),
  }
}
