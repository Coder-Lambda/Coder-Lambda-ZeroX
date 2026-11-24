import { useMemo } from 'react'
import { useRules } from '../../../rules/useRules'
import { useAbsences, useLeaves } from '../../collaborators/store'
import type { PayrollRules } from './payroll'

/** Absences, leaves and the rule book chapters the payroll needs (special values and absence discount). */
export function usePayrollRules(): PayrollRules {
  const { rules } = useRules()
  const absences = useAbsences()
  const leaves = useLeaves()
  return useMemo(
    () => ({ absences, leaves, collaborators: rules.collaborators, payRules: rules.businessFinance.payRules }),
    [absences, leaves, rules],
  )
}
