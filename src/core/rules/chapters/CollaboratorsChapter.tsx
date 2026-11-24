import { useState } from 'react'
import { Plus } from 'lucide-react'
import { newId } from '../../data/localDb'
import { t } from '../../i18n/pt-BR'
import { Segmented } from '../../ui/Segmented'
import { TextInput } from '../../ui/TextInput'
import { Toggle } from '../../ui/Toggle'
import { NumberRule, parseOptional, RuleDialog, RuleList, RuleRow, useEditor } from '../parts'
import type { AbsenceCharge, LeaveType, ProductionItem, ProductionPeriod, TargetKind } from '../types'
import { useChapter } from '../useRules'

const copy = t.rules.collaborators
const CHARGES: AbsenceCharge[] = ['none', 'fixed', 'salaryDay']
const PERIODS: ProductionPeriod[] = ['daily', 'monthly', 'yearly']
const LEAVE_PRESETS = [
  { key: 'maternity', days: 120 },
  { key: 'paternity', days: 5 },
  { key: 'medical', days: null },
  { key: 'illness', days: null },
] as const

const qty = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })

/** "Meta: 200 un/dia · 4.000 un/mês · cada funcionário" */
export function targetSummary(item: ProductionItem) {
  const parts = PERIODS.filter((p) => item[p] != null).map(
    (p) => `${qty(item[p] as number)} ${item.unit}/${copy.items.periodShort[p]}`,
  )
  if (parts.length === 0) return copy.items.noTarget
  return `${copy.items.kinds[item.kind]}: ${parts.join(' · ')} · ${copy.items.pers[item.per].toLowerCase()}`
}

export function CollaboratorsChapter() {
  const { chapter: rules, save, update } = useChapter('collaborators')
  const leaves = useEditor(rules.leaveTypes)
  const items = useEditor(rules.productionItems)
  const presenceOff = !rules.presenceList
  const missingPresets = LEAVE_PRESETS.filter(
    (p) => !rules.leaveTypes.some((l) => l.name.toLowerCase() === copy.leaves.presets[p.key].toLowerCase()),
  )

  return (
    <>
      <RuleRow title={copy.presence.title} hint={copy.presence.hint}>
        <Toggle checked={rules.presenceList} label={copy.presence.title} onChange={(on) => save({ presenceList: on })} />
      </RuleRow>

      <RuleRow
        title={copy.absenceValue.title}
        hint={copy.absenceValue.hint}
        disabled={presenceOff}
        below={
          <div className="rule-inline">
            <div className="rule-segmented">
              <Segmented
                label={copy.absenceValue.title}
                options={CHARGES.map((c) => copy.absenceValue.options[c])}
                value={CHARGES.indexOf(rules.absenceCharge)}
                onChange={(i) => save({ absenceCharge: CHARGES[i] })}
              />
            </div>
            {rules.absenceCharge === 'fixed' && (
              <NumberRule
                id="rule-absence-value"
                label={copy.absenceValue.fixedLabel}
                prefix="R$"
                decimals={2}
                value={rules.absenceValue}
                onCommit={(v) => save({ absenceValue: v })}
              />
            )}
            {rules.absenceCharge === 'salaryDay' && <p className="rule-hint">{copy.absenceValue.salaryDayHint}</p>}
          </div>
        }
      />

      <RuleRow title={copy.absenceAlert.title} hint={copy.absenceAlert.hint} disabled={presenceOff}>
        {!presenceOff && (
          <div className="rule-inline">
            {rules.absenceAlert != null && (
              <NumberRule
                id="rule-absence-alert"
                label={copy.absenceAlert.label}
                suffix={copy.absenceAlert.label.toLowerCase()}
                min={1}
                value={rules.absenceAlert}
                onCommit={(v) => save({ absenceAlert: v ?? 3 })}
              />
            )}
            <Toggle
              checked={rules.absenceAlert != null}
              label={copy.absenceAlert.title}
              onChange={(on) => save({ absenceAlert: on ? 3 : null })}
            />
          </div>
        )}
      </RuleRow>

      <RuleList
        title={copy.leaves.title}
        hint={copy.leaves.hint}
        addLabel={copy.leaves.add}
        onAdd={leaves.add}
        onEdit={leaves.edit}
        items={rules.leaveTypes.map((l) => ({ id: l.id, title: l.name, sub: copy.leaves.daysLabel(l.days) }))}
        footer={
          missingPresets.length > 0 && (
            <div className="rule-suggestions">
              <span className="rule-hint">{t.rules.suggestions}</span>
              {missingPresets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className="chip tactile"
                  onClick={() =>
                    update((c) => ({
                      leaveTypes: [...c.leaveTypes, { id: newId('lvt'), name: copy.leaves.presets[p.key], days: p.days }],
                    }))
                  }
                >
                  <Plus size={14} />
                  {copy.leaves.presets[p.key]}
                </button>
              ))}
            </div>
          )
        }
      />

      <RuleRow title={copy.production.title} hint={copy.production.hint}>
        <Toggle checked={rules.production} label={copy.production.title} onChange={(on) => save({ production: on })} />
      </RuleRow>

      {rules.production && (
        <RuleList
          title={copy.items.title}
          hint={copy.items.hint}
          addLabel={copy.items.add}
          onAdd={items.add}
          onEdit={items.edit}
          items={rules.productionItems.map((i) => ({ id: i.id, title: i.name, sub: targetSummary(i) }))}
        />
      )}

      <LeaveTypeDialog
        key={`leave-${leaves.item?.id ?? 'new'}-${leaves.open}`}
        open={leaves.open}
        leave={leaves.item}
        onClose={leaves.close}
        onSave={(leave) =>
          update((c) => ({
            leaveTypes: c.leaveTypes.some((l) => l.id === leave.id)
              ? c.leaveTypes.map((l) => (l.id === leave.id ? leave : l))
              : [...c.leaveTypes, leave],
          }))
        }
        onRemove={(id) => update((c) => ({ leaveTypes: c.leaveTypes.filter((l) => l.id !== id) }))}
      />

      <ProductionItemDialog
        key={`item-${items.item?.id ?? 'new'}-${items.open}`}
        open={items.open}
        item={items.item}
        onClose={items.close}
        onSave={(item) =>
          update((c) => ({
            productionItems: c.productionItems.some((i) => i.id === item.id)
              ? c.productionItems.map((i) => (i.id === item.id ? item : i))
              : [...c.productionItems, item],
          }))
        }
        onRemove={(id) => update((c) => ({ productionItems: c.productionItems.filter((i) => i.id !== id) }))}
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

function LeaveTypeDialog({ open, leave, onClose, onSave, onRemove }: DialogProps<LeaveType> & { leave?: LeaveType }) {
  const [name, setName] = useState(leave?.name ?? '')
  const [days, setDays] = useState(leave?.days == null ? '' : String(leave.days))
  const [error, setError] = useState<string | null>(null)
  const fail = (message: string) => {
    setError(message)
    return false
  }

  return (
    <RuleDialog
      open={open}
      title={leave ? copy.leaves.editTitle : copy.leaves.newTitle}
      onClose={onClose}
      error={error}
      removeName={leave?.name}
      onRemove={leave ? () => onRemove(leave.id) : undefined}
      onSubmit={() => {
        const length = parseOptional(days)
        if (!name.trim()) return fail(t.rules.nameRequired)
        if (days.trim() && (length == null || length < 1)) return fail(t.rules.valueInvalid)
        onSave({ id: leave?.id ?? newId('lvt'), name: name.trim(), days: length })
        return true
      }}
    >
      <div className="span-2">
        <TextInput
          id="leave-name"
          label={copy.leaves.name}
          value={name}
          onChange={(v) => {
            setName(v)
            setError(null)
          }}
          placeholder={copy.leaves.namePlaceholder}
          autoFocus
        />
      </div>
      <div className="span-2">
        <TextInput id="leave-days" label={copy.leaves.days} value={days} onChange={setDays} inputMode="decimal" />
        <p className="rule-hint mt-1">{copy.leaves.daysHint}</p>
      </div>
    </RuleDialog>
  )
}

const KINDS: TargetKind[] = ['goal', 'ceiling']
const PERS: ProductionItem['per'][] = ['employee', 'team']

function ProductionItemDialog({ open, item, onClose, onSave, onRemove }: DialogProps<ProductionItem> & { item?: ProductionItem }) {
  const [name, setName] = useState(item?.name ?? '')
  const [unit, setUnit] = useState(item?.unit ?? 'un')
  const [kind, setKind] = useState<TargetKind>(item?.kind ?? 'goal')
  const [per, setPer] = useState<ProductionItem['per']>(item?.per ?? 'employee')
  const [targets, setTargets] = useState<Record<ProductionPeriod, string>>({
    daily: item?.daily == null ? '' : qty(item.daily),
    monthly: item?.monthly == null ? '' : qty(item.monthly),
    yearly: item?.yearly == null ? '' : qty(item.yearly),
  })
  const [error, setError] = useState<string | null>(null)
  const fail = (message: string) => {
    setError(message)
    return false
  }

  return (
    <RuleDialog
      open={open}
      title={item ? copy.items.editTitle : copy.items.newTitle}
      onClose={onClose}
      error={error}
      removeName={item?.name}
      onRemove={item ? () => onRemove(item.id) : undefined}
      onSubmit={() => {
        if (!name.trim()) return fail(t.rules.nameRequired)
        const parsed = Object.fromEntries(PERIODS.map((p) => [p, parseOptional(targets[p], 3)])) as Record<
          ProductionPeriod,
          number | null
        >
        const bad = PERIODS.some((p) => targets[p].trim() && (parsed[p] == null || (parsed[p] as number) <= 0))
        if (bad) return fail(t.rules.valueInvalid)
        onSave({ id: item?.id ?? newId('pit'), name: name.trim(), unit: unit.trim() || 'un', kind, per, ...parsed })
        return true
      }}
    >
      <TextInput
        id="item-name"
        label={copy.items.name}
        value={name}
        onChange={(v) => {
          setName(v)
          setError(null)
        }}
        placeholder={copy.items.namePlaceholder}
        autoFocus
      />
      <TextInput id="item-unit" label={copy.items.unit} value={unit} onChange={setUnit} placeholder={copy.items.unitPlaceholder} />
      <div className="field">
        <span className="field-label">{copy.items.kind}</span>
        <Segmented
          label={copy.items.kind}
          options={KINDS.map((k) => copy.items.kinds[k])}
          value={KINDS.indexOf(kind)}
          onChange={(i) => setKind(KINDS[i])}
        />
        <p className="rule-hint mt-1">{copy.items.kindHints[kind]}</p>
      </div>
      <div className="field">
        <span className="field-label">{copy.items.per}</span>
        <Segmented
          label={copy.items.per}
          options={PERS.map((p) => copy.items.pers[p])}
          value={PERS.indexOf(per)}
          onChange={(i) => setPer(PERS[i])}
        />
      </div>
      <div className="span-2 rule-target-grid">
        {PERIODS.map((p) => (
          <TextInput
            key={p}
            id={`item-${p}`}
            label={`${copy.items.periods[p]} (${unit.trim() || 'un'})`}
            value={targets[p]}
            onChange={(v) => {
              setTargets((cur) => ({ ...cur, [p]: v }))
              setError(null)
            }}
            inputMode="decimal"
            placeholder="—"
          />
        ))}
      </div>
    </RuleDialog>
  )
}
