import { CLIENT_ID } from '../../config/clientRegistry'
import { fileStore } from '../../data/fileStore'
import { localDb, newId } from '../../data/localDb'
import { useTable } from '../../data/useTable'
import { todayKey } from '../../lib/format'
import { leaveOn } from './rules'
import type { Absence, Employee, EmployeeFile, EmployeeLeave, EmployeeNote, Partner, ProductionRecord, Supplier } from './types'

export const TABLES = {
  employees: 'employees',
  absences: 'absences',
  notes: 'employee_notes',
  files: 'employee_files',
  partners: 'partners',
  suppliers: 'suppliers',
  leaves: 'employee_leaves',
  production: 'production_records',
} as const

export const useEmployees = () => useTable<Employee>(TABLES.employees)
export const useAbsences = () => useTable<Absence>(TABLES.absences)
export const useNotes = () => useTable<EmployeeNote>(TABLES.notes)
export const useFiles = () => useTable<EmployeeFile>(TABLES.files)
export const usePartners = () => useTable<Partner>(TABLES.partners)
export const useSuppliers = () => useTable<Supplier>(TABLES.suppliers)
export const useLeaves = () => useTable<EmployeeLeave>(TABLES.leaves)
export const useProduction = () => useTable<ProductionRecord>(TABLES.production)

export const save = <T extends { id: string; tenant_id: string }>(table: string, row: T) =>
  localDb.upsert<T>(table, row)

export function removeEmployee(employee: Employee) {
  const sameEmployee = (row: { employee_id: string }) => row.employee_id === employee.id
  const files = localDb.list<EmployeeFile>(TABLES.files, CLIENT_ID, sameEmployee)
  files.forEach((file) => void fileStore.remove(file.id))
  localDb.remove<EmployeeFile>(TABLES.files, CLIENT_ID, sameEmployee)
  localDb.remove<EmployeeNote>(TABLES.notes, CLIENT_ID, sameEmployee)
  localDb.remove<Absence>(TABLES.absences, CLIENT_ID, sameEmployee)
  localDb.remove<EmployeeLeave>(TABLES.leaves, CLIENT_ID, sameEmployee)
  localDb.remove<ProductionRecord>(TABLES.production, CLIENT_ID, sameEmployee)
  localDb.remove<Employee>(TABLES.employees, CLIENT_ID, (row) => row.id === employee.id)
}

export function removeRow(table: string, id: string) {
  localDb.remove(table, CLIENT_ID, (row) => row.id === id)
}

/** Marks or clears an absence for one employee on one day. */
export function setAbsent(scope: { tenant_id: string; business_id: string }, employeeId: string, date: string, absent: boolean) {
  const match = (row: Absence) =>
    row.business_id === scope.business_id && row.employee_id === employeeId && row.date === date
  if (absent) {
    if (localDb.list<Absence>(TABLES.absences, CLIENT_ID, match).length === 0) {
      localDb.upsert<Absence>(TABLES.absences, { id: newId('abs'), ...scope, employee_id: employeeId, date })
    }
  } else {
    localDb.remove<Absence>(TABLES.absences, CLIENT_ID, match)
  }
}

export async function attachFile(scope: { tenant_id: string; business_id: string }, employeeId: string, file: File) {
  const id = newId('file')
  await fileStore.put(id, file)
  localDb.upsert<EmployeeFile>(TABLES.files, {
    id,
    ...scope,
    employee_id: employeeId,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    createdAt: new Date().toISOString(),
  })
}

export async function removeFile(file: EmployeeFile) {
  await fileStore.remove(file.id)
  removeRow(TABLES.files, file.id)
}

/** Who was on the list on a given day: everyone except those taken off before it. */
export function wasOnList(employee: Employee, date: string) {
  return employee.status !== 'inactive' || (employee.removedOn !== null && employee.removedOn > date)
}

export function absencesFor(absences: Absence[], employeeId: string, monthKey = todayKey().slice(0, 7)) {
  const mine = absences.filter((a) => a.employee_id === employeeId)
  return {
    total: mine.length,
    month: mine.filter((a) => a.date.startsWith(monthKey)).length,
  }
}

/**
 * Numbers the main dashboard reads (&maindashboard&): only employees still on the list count, and a day
 * inside a special situation (rule book) is not an absence.
 */
export function collaboratorStats(employees: Employee[], absences: Absence[], day = todayKey(), leaves: EmployeeLeave[] = []) {
  const onList = employees.filter((e) => e.status !== 'inactive')
  const salaries = onList.map((e) => e.salary).filter((s): s is number => s != null)
  const totalSalary = salaries.reduce((sum, s) => sum + s, 0)
  const onListIds = new Set(onList.map((e) => e.id))
  const monthKey = day.slice(0, 7)
  const counts = (a: Absence) => onListIds.has(a.employee_id) && !leaveOn(leaves, a.employee_id, a.date)
  return {
    totalEmployees: onList.length,
    totalSalary,
    averageSalary: salaries.length ? totalSalary / salaries.length : null,
    absencesToday: absences.filter((a) => a.date === day && counts(a)).length,
    absencesMonth: absences.filter((a) => a.date.startsWith(monthKey) && counts(a)).length,
    onLeaveToday: onList.filter((e) => leaveOn(leaves, e.id, day)).length,
  }
}

export function saveLeave(leave: EmployeeLeave) {
  localDb.upsert<EmployeeLeave>(TABLES.leaves, leave)
}

/** Sets what an employee made of an item on a day; empty or zero removes the record. */
export function setProduction(
  scope: { tenant_id: string; business_id: string },
  employeeId: string,
  itemId: string,
  date: string,
  quantity: number | null,
) {
  const match = (row: ProductionRecord) =>
    row.business_id === scope.business_id && row.employee_id === employeeId && row.itemId === itemId && row.date === date
  const existing = localDb.list<ProductionRecord>(TABLES.production, CLIENT_ID, match)[0]
  if (!quantity || quantity <= 0) {
    if (existing) localDb.remove<ProductionRecord>(TABLES.production, CLIENT_ID, match)
    return
  }
  localDb.upsert<ProductionRecord>(TABLES.production, {
    id: existing?.id ?? newId('prod'),
    ...scope,
    employee_id: employeeId,
    itemId,
    date,
    quantity,
  })
}
