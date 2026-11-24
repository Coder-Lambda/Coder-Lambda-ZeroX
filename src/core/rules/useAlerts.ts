import { useMemo } from 'react'
import { useSession } from '../auth/SessionProvider'
import type { BaseModuleId } from '../config/types'
import { t } from '../i18n/pt-BR'
import { formatMoney, todayKey } from '../lib/format'
import { countedAbsences, reachedAbsenceAlert } from '../modules/collaborators/rules'
import { useAbsences, useEmployees, useLeaves, useProduction } from '../modules/collaborators/store'
import { PERIODS, teamTotal, totalsByEmployee } from '../modules/collaborators/production/production'
import { moneyAlarmFired, ringingTitles } from '../modules/finance/alarms'
import { balanceAt, monthTotals, useFinance } from '../modules/finance/store'
import { readRules } from './defaults'

export interface RuleAlert {
  id: string
  module: BaseModuleId
  text: string
  to: string
}

const qty = (value: number, unit: string) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} ${unit}`

/** Everything the rule book is warning about right now, for the modules this business uses. */
export function useAlerts(): RuleAlert[] {
  const { active } = useSession()
  const employees = useEmployees()
  const absences = useAbsences()
  const leaves = useLeaves()
  const production = useProduction()
  const personal = useFinance('personal')
  const business = useFinance('business')

  return useMemo(() => {
    if (!active) return []
    const rules = readRules(active)
    const modules = active.modules
    const today = todayKey()
    const month = today.slice(0, 7)
    const alerts: RuleAlert[] = []
    const onList = employees.filter((e) => e.status !== 'inactive')
    const names = new Map(employees.map((e) => [e.id, e.name]))

    if (modules.collaborators) {
      const collab = rules.collaborators
      for (const employee of onList) {
        const count = countedAbsences(absences, leaves, employee.id, month)
        if (reachedAbsenceAlert(count, collab)) {
          alerts.push({
            id: `abs-${employee.id}`,
            module: 'collaborators',
            text: t.alerts.absences(employee.name, count),
            to: `/colaboradores/funcionarios/${employee.id}`,
          })
        }
      }
      if (collab.production) {
        for (const item of collab.productionItems.filter((i) => i.kind === 'ceiling')) {
          for (const period of PERIODS) {
            const target = item[period]
            if (target == null) continue
            const over =
              item.per === 'team'
                ? [{ id: 'team', name: null as string | null, value: teamTotal(production, item.id, period, today) }]
                : [...totalsByEmployee(production, item.id, period, today)].map(([id, value]) => ({
                    id,
                    name: names.get(id) ?? null,
                    value,
                  }))
            for (const row of over.filter((r) => r.value > target)) {
              alerts.push({
                id: `ceil-${item.id}-${period}-${row.id}`,
                module: 'collaborators',
                text:
                  (row.name ? `${row.name} · ` : '') +
                  t.alerts.ceiling(item.name, t.alerts.periodWhen[period], qty(row.value, item.unit), qty(target, item.unit)),
                to: '/colaboradores/funcionarios/producao',
              })
            }
          }
        }
      }
    }

    if (modules.personalFinance) {
      for (const { title, daysLeft } of ringingTitles(personal.titles, rules.personalFinance.alarms, today)) {
        alerts.push({
          id: `due-${title.id}`,
          module: 'personalFinance',
          text: `${t.alerts.due(title.kind, title.description, daysLeft)} · ${formatMoney(title.amount)}`,
          to: '/financas-pessoais',
        })
      }
    }

    if (modules.businessFinance && rules.businessFinance.moneyAlarms.length > 0) {
      const totals = monthTotals(business.entries, month)
      const figures = {
        balance: balanceAt(business, today),
        revenue: totals.incomes,
        expenses: totals.outcomes,
        result: Math.round((totals.incomes - totals.outcomes) * 100) / 100,
      }
      for (const alarm of rules.businessFinance.moneyAlarms.filter((a) => moneyAlarmFired(a, figures))) {
        alerts.push({
          id: `money-${alarm.id}`,
          module: 'businessFinance',
          text: t.alerts.money(
            alarm.name,
            t.rules.businessFinance.moneyAlarms.metrics[alarm.metric],
            formatMoney(figures[alarm.metric]),
          ),
          to: '/financas-empresa/receitas-despesas',
        })
      }
    }

    return alerts
  }, [active, employees, absences, leaves, production, personal, business])
}

