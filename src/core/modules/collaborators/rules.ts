import { toDateKey } from '../../lib/format'
import type { CollaboratorRules } from '../../rules/types'
import type { Absence, Employee, EmployeeLeave } from './types'

const round = (value: number) => Math.round(value * 100) / 100

/** The special situation an employee is in on a day, if any. */
export function leaveOn(leaves: EmployeeLeave[], employeeId: string, day: string) {
  return leaves.find((l) => l.employee_id === employeeId && l.start <= day && day <= l.end)
}

/** Absences of the month that count: a day inside a special situation is not an absence (Dahjon's atestado rule). */
export function countedAbsences(absences: Absence[], leaves: EmployeeLeave[], employeeId: string, month: string) {
  return absences.filter(
    (a) => a.employee_id === employeeId && a.date.startsWith(month) && !leaveOn(leaves, employeeId, a.date),
  ).length
}

/** What one absent day costs this employee under the rule book. */
export function absenceDayValue(employee: Pick<Employee, 'salary'>, rules: CollaboratorRules) {
  if (!rules.presenceList) return 0
  if (rules.absenceCharge === 'fixed') return rules.absenceValue ?? 0
  if (rules.absenceCharge === 'salaryDay') return (employee.salary ?? 0) / 30
  return 0
}

export function absenceDeduction(employee: Pick<Employee, 'salary'>, count: number, rules: CollaboratorRules) {
  return round(count * absenceDayValue(employee, rules))
}

/** The red ping: this many absences in the month or more. */
export const reachedAbsenceAlert = (count: number, rules: CollaboratorRules) =>
  rules.presenceList && rules.absenceAlert != null && count > 0 && count >= rules.absenceAlert

/** Last day of a leave that starts on `start` and lasts `days` days. */
export function leaveEnd(start: string, days: number) {
  const [y, m, d] = start.split('-').map(Number)
  return toDateKey(new Date(y, m - 1, d + Math.max(1, Math.round(days)) - 1))
}

export function leaveDays(leave: Pick<EmployeeLeave, 'start' | 'end'>) {
  const [ys, ms, ds] = leave.start.split('-').map(Number)
  const [ye, me, de] = leave.end.split('-').map(Number)
  return Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000) + 1
}
