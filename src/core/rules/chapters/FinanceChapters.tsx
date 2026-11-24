import { useState } from 'react'
import { Info } from 'lucide-react'
import { newId } from '../../data/localDb'
import { t } from '../../i18n/pt-BR'
import { compareNames, formatMoney, moneyInputValue, parseDecimal, parseMoney } from '../../lib/format'
import { useEmployees } from '../../modules/collaborators/store'
import { Segmented } from '../../ui/Segmented'
import { TextInput } from '../../ui/TextInput'
import { RuleDialog, RuleList, useEditor } from '../parts'
import type { FinanceAlarm, MoneyAlarm, MoneyMetric, PayRule } from '../types'
import { useChapter, useRules } from '../useRules'

const personal = t.rules.personalFinance.alarms
const pay = t.rules.businessFinance.payRules
const money = t.rules.businessFinance.moneyAlarms

/** Upsert by id, the way every list rule is saved. */
function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item]
}

function useFail() {
  const [error, setError] = useState<string | null>(null)
  const fail = (message: string) => {
    setError(message)
    return false
  }
  return { error, clear: () => setError(null), fail }
}

export function PersonalFinanceChapter() {
  const { chapter: rules, update } = useChapter('personalFinance')
  const editor = useEditor(rules.alarms)
  return (
    <>
      <RuleList
        title={personal.title}
        hint={personal.hint}
        addLabel={personal.add}
        onAdd={editor.add}
        onEdit={editor.edit}
        items={rules.alarms.map((a) => ({
          id: a.id,
          title: a.name,
          sub: personal.summary(personal.kinds[a.kind], a.match.trim() ? `"${a.match.trim()}"` : personal.all, a.daysBefore),
        }))}
      />
      <FinanceAlarmDialog
        key={`alarm-${editor.item?.id ?? 'new'}-${editor.open}`}
        open={editor.open}
        alarm={editor.item}
        onClose={editor.close}
        onSave={(alarm) => update((c) => ({ alarms: upsert(c.alarms, alarm) }))}
        onRemove={(id) => update((c) => ({ alarms: c.alarms.filter((a) => a.id !== id) }))}
      />
    </>
  )
}

interface DialogProps<T> {
  open: boolean
  onClose: () => void
  onSave: (value: T) => void
  onRemove: (id: string) => void
}

const ALARM_KINDS: FinanceAlarm['kind'][] = ['payable', 'receivable']

function FinanceAlarmDialog({ open, alarm, onClose, onSave, onRemove }: DialogProps<FinanceAlarm> & { alarm?: FinanceAlarm }) {
  const [name, setName] = useState(alarm?.name ?? '')
  const [kind, setKind] = useState<FinanceAlarm['kind']>(alarm?.kind ?? 'payable')
  const [match, setMatch] = useState(alarm?.match ?? '')
  const [days, setDays] = useState(String(alarm?.daysBefore ?? 3))
  const { error, clear, fail } = useFail()

  return (
    <RuleDialog
      open={open}
      title={alarm ? personal.editTitle : personal.newTitle}
      onClose={onClose}
      error={error}
      removeName={alarm?.name}
      onRemove={alarm ? () => onRemove(alarm.id) : undefined}
      onSubmit={() => {
        const before = parseDecimal(days, 0)
        if (!name.trim()) return fail(t.rules.nameRequired)
        if (before == null || before < 0 || before > 365) return fail(t.rules.valueInvalid)
        onSave({ id: alarm?.id ?? newId('fal'), name: name.trim(), kind, match: match.trim(), daysBefore: before })
        return true
      }}
    >
      <div className="span-2">
        <TextInput
          id="alarm-name"
          label={personal.name}
          value={name}
          onChange={(v) => {
            setName(v)
            clear()
          }}
          placeholder={personal.namePlaceholder}
          autoFocus
        />
      </div>
      <div className="field span-2">
        <span className="field-label">{personal.kind}</span>
        <Segmented
          label={personal.kind}
          options={ALARM_KINDS.map((k) => personal.kinds[k])}
          value={ALARM_KINDS.indexOf(kind)}
          onChange={(i) => setKind(ALARM_KINDS[i])}
        />
      </div>
      <div>
        <TextInput id="alarm-match" label={personal.match} value={match} onChange={setMatch} placeholder={personal.matchPlaceholder} />
        <p className="rule-hint mt-1">{personal.matchHint}</p>
      </div>
      <TextInput
        id="alarm-days"
        label={personal.daysBefore}
        value={days}
        onChange={(v) => {
          setDays(v)
          clear()
        }}
        inputMode="decimal"
      />
    </RuleDialog>
  )
}

export function BusinessFinanceChapter() {
  const { rules } = useRules()
  const { chapter, update } = useChapter('businessFinance')
  const employees = useEmployees()
  const payEditor = useEditor(chapter.payRules)
  const moneyEditor = useEditor(chapter.moneyAlarms)
  const collab = rules.collaborators
  const absencesCharged = collab.presenceList && collab.absenceCharge !== 'none'

  const paySub = (rule: PayRule) => {
    const amount = rule.mode === 'percent' ? `${rule.value.toLocaleString('pt-BR')}% do salário` : formatMoney(rule.value)
    const who = rule.employeeIds.length === 0 ? pay.everyoneShort : pay.count(rule.employeeIds.length)
    return `${pay.kinds[rule.kind]} · ${amount} · ${who}`
  }

  return (
    <>
      <RuleList
        title={pay.title}
        hint={pay.hint}
        addLabel={pay.add}
        onAdd={payEditor.add}
        onEdit={payEditor.edit}
        items={chapter.payRules.map((r) => ({ id: r.id, title: r.name, sub: paySub(r) }))}
        footer={
          absencesCharged && (
            <p className="rule-note">
              <Info aria-hidden="true" />
              {pay.absencesNote}
            </p>
          )
        }
      />
      <RuleList
        title={money.title}
        hint={money.hint}
        addLabel={money.add}
        onAdd={moneyEditor.add}
        onEdit={moneyEditor.edit}
        items={chapter.moneyAlarms.map((a) => ({
          id: a.id,
          title: a.name,
          sub: money.summary(money.metrics[a.metric], money.whens[a.when], formatMoney(a.value)),
        }))}
      />

      <PayRuleDialog
        key={`pay-${payEditor.item?.id ?? 'new'}-${payEditor.open}`}
        open={payEditor.open}
        rule={payEditor.item}
        employees={employees
          .filter((e) => e.status !== 'inactive')
          .sort((a, b) => compareNames(a.name, b.name))
          .map((e) => ({ id: e.id, name: e.name }))}
        onClose={payEditor.close}
        onSave={(rule) => update((c) => ({ payRules: upsert(c.payRules, rule) }))}
        onRemove={(id) => update((c) => ({ payRules: c.payRules.filter((r) => r.id !== id) }))}
      />
      <MoneyAlarmDialog
        key={`money-${moneyEditor.item?.id ?? 'new'}-${moneyEditor.open}`}
        open={moneyEditor.open}
        alarm={moneyEditor.item}
        onClose={moneyEditor.close}
        onSave={(alarm) => update((c) => ({ moneyAlarms: upsert(c.moneyAlarms, alarm) }))}
        onRemove={(id) => update((c) => ({ moneyAlarms: c.moneyAlarms.filter((a) => a.id !== id) }))}
      />
    </>
  )
}

const PAY_KINDS: PayRule['kind'][] = ['add', 'discount']
const PAY_MODES: PayRule['mode'][] = ['fixed', 'percent']

function PayRuleDialog({
  open,
  rule,
  employees,
  onClose,
  onSave,
  onRemove,
}: DialogProps<PayRule> & { rule?: PayRule; employees: { id: string; name: string }[] }) {
  const [name, setName] = useState(rule?.name ?? '')
  const [kind, setKind] = useState<PayRule['kind']>(rule?.kind ?? 'add')
  const [mode, setMode] = useState<PayRule['mode']>(rule?.mode ?? 'fixed')
  const [value, setValue] = useState(
    rule == null ? '' : rule.mode === 'fixed' ? moneyInputValue(rule.value) : rule.value.toLocaleString('pt-BR'),
  )
  const [some, setSome] = useState((rule?.employeeIds.length ?? 0) > 0)
  const [picked, setPicked] = useState<string[]>(rule?.employeeIds ?? [])
  const { error, clear, fail } = useFail()

  return (
    <RuleDialog
      open={open}
      title={rule ? pay.editTitle : pay.newTitle}
      onClose={onClose}
      error={error}
      removeName={rule?.name}
      onRemove={rule ? () => onRemove(rule.id) : undefined}
      onSubmit={() => {
        const amount = mode === 'fixed' ? parseMoney(value) : parseDecimal(value, 2)
        if (!name.trim()) return fail(t.rules.nameRequired)
        if (amount == null || amount <= 0 || (mode === 'percent' && amount > 100)) return fail(t.rules.valueInvalid)
        const ids = some ? picked.filter((id) => employees.some((e) => e.id === id)) : []
        if (some && ids.length === 0) return fail(pay.pickOne)
        onSave({ id: rule?.id ?? newId('pay'), name: name.trim(), kind, mode, value: amount, employeeIds: ids })
        return true
      }}
    >
      <div className="span-2">
        <TextInput
          id="pay-name"
          label={pay.name}
          value={name}
          onChange={(v) => {
            setName(v)
            clear()
          }}
          placeholder={pay.namePlaceholder}
          autoFocus
        />
      </div>
      <div className="field">
        <span className="field-label">{pay.kind}</span>
        <Segmented label={pay.kind} options={PAY_KINDS.map((k) => pay.kinds[k])} value={PAY_KINDS.indexOf(kind)} onChange={(i) => setKind(PAY_KINDS[i])} />
      </div>
      <div className="field">
        <span className="field-label">{pay.mode}</span>
        <Segmented label={pay.mode} options={PAY_MODES.map((m) => pay.modes[m])} value={PAY_MODES.indexOf(mode)} onChange={(i) => setMode(PAY_MODES[i])} />
      </div>
      <div className="span-2">
        <TextInput
          id="pay-value"
          label={mode === 'fixed' ? pay.value : pay.percent}
          value={value}
          onChange={(v) => {
            setValue(v)
            clear()
          }}
          inputMode="decimal"
          prefix={mode === 'fixed' ? 'R$' : '%'}
        />
      </div>
      <div className="field span-2">
        <span className="field-label">{pay.who}</span>
        <Segmented
          label={pay.who}
          options={[pay.everyone, pay.some]}
          value={some ? 1 : 0}
          onChange={(i) => {
            setSome(i === 1)
            clear()
          }}
        />
        {some &&
          (employees.length === 0 ? (
            <p className="rule-hint mt-2">{pay.noEmployees}</p>
          ) : (
            <div className="ob-chips mt-2" role="group" aria-label={pay.some}>
              {employees.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="chip tactile"
                  aria-pressed={picked.includes(e.id)}
                  onClick={() => {
                    clear()
                    setPicked((cur) => (cur.includes(e.id) ? cur.filter((id) => id !== e.id) : [...cur, e.id]))
                  }}
                >
                  {e.name}
                </button>
              ))}
            </div>
          ))}
      </div>
    </RuleDialog>
  )
}

const METRICS: MoneyMetric[] = ['balance', 'revenue', 'expenses', 'result']
const WHENS: MoneyAlarm['when'][] = ['above', 'below']

function MoneyAlarmDialog({ open, alarm, onClose, onSave, onRemove }: DialogProps<MoneyAlarm> & { alarm?: MoneyAlarm }) {
  const [name, setName] = useState(alarm?.name ?? '')
  const [metric, setMetric] = useState<MoneyMetric>(alarm?.metric ?? 'balance')
  const [when, setWhen] = useState<MoneyAlarm['when']>(alarm?.when ?? 'below')
  const [value, setValue] = useState(alarm ? moneyInputValue(alarm.value) : '')
  const { error, clear, fail } = useFail()

  return (
    <RuleDialog
      open={open}
      title={alarm ? money.editTitle : money.newTitle}
      onClose={onClose}
      error={error}
      removeName={alarm?.name}
      onRemove={alarm ? () => onRemove(alarm.id) : undefined}
      onSubmit={() => {
        const amount = parseMoney(value)
        if (!name.trim()) return fail(t.rules.nameRequired)
        if (amount == null) return fail(t.rules.valueInvalid)
        onSave({ id: alarm?.id ?? newId('mal'), name: name.trim(), metric, when, value: amount })
        return true
      }}
    >
      <div className="span-2">
        <TextInput
          id="money-name"
          label={money.name}
          value={name}
          onChange={(v) => {
            setName(v)
            clear()
          }}
          placeholder={money.namePlaceholder}
          autoFocus
        />
      </div>
      <div className="field span-2">
        <label className="field-label" htmlFor="money-metric">
          {money.metric}
        </label>
        <select id="money-metric" className="input select" value={metric} onChange={(e) => setMetric(e.target.value as MoneyMetric)}>
          {METRICS.map((m) => (
            <option key={m} value={m}>
              {money.metrics[m]}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <span className="field-label">{money.when}</span>
        <Segmented label={money.when} options={WHENS.map((w) => money.whens[w])} value={WHENS.indexOf(when)} onChange={(i) => setWhen(WHENS[i])} />
      </div>
      <TextInput
        id="money-value"
        label={money.value}
        value={value}
        onChange={(v) => {
          setValue(v)
          clear()
        }}
        inputMode="decimal"
        prefix="R$"
      />
    </RuleDialog>
  )
}
