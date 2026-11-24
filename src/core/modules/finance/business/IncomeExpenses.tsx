import { useState } from 'react'
import { BellRing, ChevronDown, CircleCheck, HandCoins, Package, Plus, Receipt, Users } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { compareNames, formatDateKey, formatMoney, normalize } from '../../../lib/format'
import { monthLabel } from '../../../lib/month'
import { StatTile } from '../../../ui/StatTile'
import { useEmployees } from '../../collaborators/store'
import { formatQty } from '../../stock/format'
import { useStock } from '../../stock/store'
import { useFinanceContext } from '../FinanceContext'
import { categoryTotals } from '../store'
import type { FinCategory, FinEntry } from '../types'
import { useRules } from '../../../rules/useRules'
import { moneyAlarmFired } from '../alarms'
import { payroll, type PayrollRules } from './payroll'
import { businessSummary, stockPurchases } from './summary'
import { usePayrollRules } from './usePayrollRules'

/** Parts 2 and 3 on one screen: income/expense labels and the money that came in and went out. */
export function IncomeExpenses() {
  const { data, month, today } = useFinanceContext()
  const employees = useEmployees()
  const stock = useStock()
  const payrollRules = usePayrollRules()
  const summary = businessSummary(data, month, today, employees, stock.moves, payrollRules)
  const { moneyAlarms } = useRules().rules.businessFinance
  const figures = { balance: summary.balance, revenue: summary.revenue, expenses: summary.expenses, result: summary.result }
  const fired = moneyAlarms.filter((a) => moneyAlarmFired(a, figures))

  return (
    <div className="module-body">
      {fired.length > 0 && (
        <div className="biz-alarms" role="status" aria-label={t.business.flows.alarmsTitle}>
          {fired.map((alarm) => (
            <p key={alarm.id} className="biz-alarm glass">
              <BellRing aria-hidden="true" />
              {t.business.flows.alarm(
                alarm.name,
                t.rules.businessFinance.moneyAlarms.metrics[alarm.metric],
                formatMoney(figures[alarm.metric]),
              )}
            </p>
          ))}
        </div>
      )}
      <div className="stat-row">
        <StatTile value={formatMoney(summary.revenue)} label={t.business.flows.stats.revenue} />
        <StatTile value={formatMoney(summary.expenses)} label={t.business.flows.stats.expenses} />
        <StatTile
          value={<span className={summary.result < 0 ? 'is-negative' : undefined}>{formatMoney(summary.result)}</span>}
          label={t.business.flows.stats.result}
        />
        <StatTile value={formatMoney(summary.balance)} label={t.business.flows.stats.balance} />
      </div>

      <div className="biz-columns">
        <section className="biz-column" aria-label={t.business.flows.revenueTitle}>
          <ColumnHead title={t.business.flows.revenueTitle} total={summary.revenue} />
          <div className="glass card">
            <LabelsBlock type="in" />
          </div>
          <div className="glass card">
            <EntriesBlock type="in" />
          </div>
        </section>

        <section className="biz-column" aria-label={t.business.flows.expensesTitle}>
          <ColumnHead title={t.business.flows.expensesTitle} total={summary.expenses} />
          <PayrollCard rules={payrollRules} expected={summary.payrollExpected} paid={summary.payrollPaid} employees={summary.employees} />
          <StockCard stock={stock} />
          <div className="glass card">
            <h3 className="biz-card-title">
              <Receipt aria-hidden="true" />
              {t.business.flows.other.title}
            </h3>
            <LabelsBlock type="out" />
            <EntriesBlock type="out" />
          </div>
        </section>
      </div>
    </div>
  )
}

function ColumnHead({ title, total }: { title: string; total: number }) {
  const { month } = useFinanceContext()
  return (
    <div className="biz-column-head">
      <h2>{title}</h2>
      <span className="text-2 num">{t.business.flows.monthTotal(formatMoney(total))} · {monthLabel(month)}</span>
    </div>
  )
}

/** Labels of one type with their month totals; tap one to edit it. */
function LabelsBlock({ type }: { type: FinCategory['type'] }) {
  const { data, month, open } = useFinanceContext()
  const labels = data.categories.filter((c) => c.type === type).sort((a, b) => compareNames(a.name, b.name))
  const totals = categoryTotals(data.entries, month, type)

  return (
    <div className="biz-block">
      <div className="section-head">
        <h4 className="biz-block-title">{t.business.flows.labelsTitle}</h4>
        <button type="button" className="btn btn-ghost tactile" onClick={() => open({ type: 'label', labelType: type })}>
          <Plus />
          {t.business.flows.addLabel}
        </button>
      </div>
      {labels.length === 0 ? (
        <p className="text-2 text-[13px]">{type === 'in' ? t.business.flows.noLabelsIn : t.business.flows.noLabelsOut}</p>
      ) : (
        <ul className="people-list">
          {labels.map((label) => (
            <li key={label.id}>
              <button type="button" className="biz-row well tactile" onClick={() => open({ type: 'label', labelType: type, label })}>
                <span className="person-main">
                  <span className="person-name">{label.name}</span>
                  {(label.description || label.origin) && (
                    <span className="person-sub">{[label.description, label.origin].filter(Boolean).join(' · ')}</span>
                  )}
                </span>
                <span className="num biz-row-amount">{formatMoney(totals.get(normalize(label.name)) ?? 0)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Entries of the month; on the expense side only the ones typed by the client (payroll and stock have their own cards). */
function EntriesBlock({ type }: { type: FinEntry['type'] }) {
  const { data, month, open } = useFinanceContext()
  const entries = data.entries
    .filter((e) => e.type === type && e.date.startsWith(month) && (type === 'in' || !e.source))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="biz-block">
      <div className="section-head">
        <h4 className="biz-block-title">{type === 'in' ? t.business.flows.entriesIn : t.finance.widgets.outcomes}</h4>
        <button type="button" className="btn btn-secondary tactile" onClick={() => open({ type: 'entry', entryType: type })}>
          <Plus />
          {type === 'in' ? t.business.flows.addIn : t.business.flows.addOut}
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-2 text-[13px]">{type === 'in' ? t.business.flows.noEntriesIn : t.business.flows.other.empty}</p>
      ) : (
        <ul className="people-list">
          {entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  )
}

function EntryRow({ entry }: { entry: FinEntry }) {
  const { data, open } = useFinanceContext()
  const account = data.accounts.find((a) => a.id === entry.accountId)?.name
  return (
    <li>
      <button type="button" className="fin-movement well tactile" onClick={() => open({ type: 'entry', entry })}>
        <span className="fin-movement-date num">{formatDateKey(entry.date, false)}</span>
        <span className="fin-movement-main">
          <span className="fin-mini-name">{entry.description || entry.category || '—'}</span>
          <span className="person-sub">{[entry.category, entry.party, account].filter(Boolean).join(' · ')}</span>
        </span>
        <span className={`fin-movement-amount num is-${entry.type}`}>
          {entry.type === 'in' ? '+' : '−'} {formatMoney(entry.amount)}
        </span>
      </button>
    </li>
  )
}

/**
 * Employees cost: the payroll from Colaboradores with the rule book applied (special values, absence discount),
 * and what was actually paid for this month.
 */
function PayrollCard({
  rules,
  expected,
  paid,
  employees,
}: {
  rules: PayrollRules
  expected: number
  paid: number
  employees: number
}) {
  const { data, month, open } = useFinanceContext()
  const staff = useEmployees()
  const [details, setDetails] = useState(false)
  const sheet = payroll(staff, month, rules)
  const payments = data.entries.filter((e) => e.source === 'payroll' && e.sourceRef === month)
  const remaining = Math.max(0, Math.round((expected - paid) * 100) / 100)
  const adjusted = sheet.additions > 0 || sheet.discounts > 0 || sheet.absenceDiscount > 0
  const absenceDays = sheet.rows.reduce((s, r) => s + (r.absenceDiscount > 0 ? r.absences : 0), 0)
  const copy = t.business.flows.payroll

  return (
    <div className="glass card">
      <h3 className="biz-card-title">
        <Users aria-hidden="true" />
        {t.business.flows.payroll.title}
      </h3>
      {expected === 0 && payments.length === 0 ? (
        <p className="text-2 text-[13px]">{t.business.flows.payroll.noEmployees}</p>
      ) : (
        <>
          <div className="biz-figures">
            <div>
              <span className="biz-figure-value">{formatMoney(expected)}</span>
              <span className="biz-figure-label">
                {t.business.flows.payroll.expected} · {t.business.flows.payroll.employees(employees)}
              </span>
            </div>
            <div>
              <span className="biz-figure-value">{formatMoney(paid)}</span>
              <span className="biz-figure-label">{t.business.flows.payroll.paid}</span>
            </div>
          </div>
          {adjusted && (
            <div className="biz-breakdown">
              <dl className="biz-lines">
                <div>
                  <dt>{copy.salaries}</dt>
                  <dd className="num">{formatMoney(sheet.salaries)}</dd>
                </div>
                {sheet.additions > 0 && (
                  <div>
                    <dt>{copy.additions}</dt>
                    <dd className="num">+ {formatMoney(sheet.additions)}</dd>
                  </div>
                )}
                {sheet.discounts > 0 && (
                  <div>
                    <dt>{copy.discounts}</dt>
                    <dd className="num">− {formatMoney(sheet.discounts)}</dd>
                  </div>
                )}
                {sheet.absenceDiscount > 0 && (
                  <div>
                    <dt>{copy.absences(absenceDays)}</dt>
                    <dd className="num">− {formatMoney(sheet.absenceDiscount)}</dd>
                  </div>
                )}
              </dl>
              <button type="button" className="btn btn-ghost tactile" aria-expanded={details} onClick={() => setDetails(!details)}>
                <ChevronDown className={details ? 'rotate-180' : undefined} />
                {details ? copy.hideBreakdown : copy.showBreakdown}
              </button>
              {details && (
                <ul className="people-list">
                  {sheet.rows.map((row) => (
                    <li key={row.employee.id} className="biz-row well">
                      <span className="person-main">
                        <span className="person-name">{row.employee.name}</span>
                        <span className="person-sub num">
                          {[
                            `${t.collab.widgets.salary}: ${formatMoney(row.salary)}`,
                            ...row.applied.map((a) => `${a.rule.name}: ${a.rule.kind === 'add' ? '+' : '−'} ${formatMoney(a.amount)}`),
                            row.absenceDiscount > 0 ? `${copy.absences(row.absences)}: − ${formatMoney(row.absenceDiscount)}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <span className="num biz-row-amount">{formatMoney(row.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-2 text-[12.5px]">{copy.rulesNote}</p>
            </div>
          )}
          {payments.length > 0 && (
            <ul className="people-list">
              {payments.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
          <div>
            {remaining > 0 ? (
              <button
                type="button"
                className="btn btn-primary tactile"
                onClick={() =>
                  open({
                    type: 'entry',
                    preset: {
                      type: 'out',
                      amount: remaining,
                      description: t.business.flows.payroll.description(monthLabel(month)),
                      category: t.business.flows.payroll.category,
                      source: 'payroll',
                      sourceRef: month,
                    },
                  })
                }
              >
                <HandCoins />
                {t.business.flows.payroll.pay}
              </button>
            ) : (
              <span className="tag tag-active">
                <CircleCheck size={14} className="mr-1" />
                {t.business.flows.payroll.paidAll}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Paid price in stock: receipts registered in Estoque with a price, and which ones finance already paid. */
function StockCard({ stock }: { stock: ReturnType<typeof useStock> }) {
  const { data, month, today, open } = useFinanceContext()
  const purchases = stockPurchases(data, stock.moves, month)
  const bought = purchases.reduce((s, p) => s + (p.move.price ?? 0), 0)
  const paid = purchases.reduce((s, p) => s + (p.payment?.amount ?? 0), 0)

  return (
    <div className="glass card">
      <h3 className="biz-card-title">
        <Package aria-hidden="true" />
        {t.business.flows.stock.title}
      </h3>
      {purchases.length === 0 ? (
        <p className="text-2 text-[13px]">{t.business.flows.stock.none}</p>
      ) : (
        <>
          <div className="biz-figures">
            <div>
              <span className="biz-figure-value">{formatMoney(bought)}</span>
              <span className="biz-figure-label">{t.business.flows.stock.bought}</span>
            </div>
            <div>
              <span className="biz-figure-value">{formatMoney(paid)}</span>
              <span className="biz-figure-label">{t.business.flows.stock.paid}</span>
            </div>
          </div>
          <ul className="people-list">
            {purchases.map(({ move, payment }) => {
              const product = stock.products.find((p) => p.id === move.productId)
              const what = product ? `${product.name} · ${formatQty(move.quantity, product.unit)}` : '—'
              return (
                <li key={move.id} className="biz-row well">
                  <span className="fin-movement-date num">{formatDateKey(move.date, false)}</span>
                  <span className="person-main">
                    <span className="person-name">{what}</span>
                    {move.party && <span className="person-sub">{move.party}</span>}
                  </span>
                  <span className="num biz-row-amount">{formatMoney(move.price)}</span>
                  {payment ? (
                    <button type="button" className="tag tag-active biz-paid" onClick={() => open({ type: 'entry', entry: payment })}>
                      {t.business.flows.stock.paidTag}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="chip tactile"
                      onClick={() =>
                        open({
                          type: 'entry',
                          preset: {
                            type: 'out',
                            amount: move.price ?? 0,
                            date: today,
                            description: what,
                            category: t.business.flows.stock.category,
                            party: move.party,
                            source: 'stock',
                            sourceRef: move.id,
                          },
                        })
                      }
                    >
                      {t.business.flows.stock.pay}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
