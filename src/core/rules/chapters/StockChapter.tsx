import { useState } from 'react'
import { newId } from '../../data/localDb'
import { t } from '../../i18n/pt-BR'
import { normalize } from '../../lib/format'
import { UNITS } from '../../modules/stock/types'
import { Segmented } from '../../ui/Segmented'
import { TextInput } from '../../ui/TextInput'
import { Toggle } from '../../ui/Toggle'
import { RuleDialog, RuleList, RuleRow, useEditor } from '../parts'
import type { CustomUnit, ItemField } from '../types'
import { useChapter } from '../useRules'

const copy = t.rules.stock

function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item]
}

export function StockChapter() {
  const { chapter: rules, save, update } = useChapter('stock')
  const units = useEditor(rules.units)
  const fields = useEditor(rules.fields)

  return (
    <>
      <RuleList
        title={copy.units.title}
        hint={copy.units.hint}
        addLabel={copy.units.add}
        onAdd={units.add}
        onEdit={units.edit}
        items={rules.units.map((u) => ({ id: u.id, title: `${u.name} (${u.abbr})` }))}
      />
      <RuleRow title={copy.value.title} hint={copy.value.hint}>
        <Toggle checked={rules.itemValue} label={copy.value.title} onChange={(on) => save({ itemValue: on })} />
      </RuleRow>
      <RuleList
        title={copy.fields.title}
        hint={copy.fields.hint}
        addLabel={copy.fields.add}
        onAdd={fields.add}
        onEdit={fields.edit}
        items={rules.fields.map((f) => ({ id: f.id, title: f.name, sub: copy.fields.types[f.type] }))}
      />

      <UnitDialog
        key={`unit-${units.item?.id ?? 'new'}-${units.open}`}
        open={units.open}
        unit={units.item}
        taken={(abbr, id) =>
          (UNITS as readonly string[]).some((u) => normalize(u) === normalize(abbr)) ||
          rules.units.some((u) => u.id !== id && normalize(u.abbr) === normalize(abbr))
        }
        onClose={units.close}
        onSave={(unit) => update((c) => ({ units: upsert(c.units, unit) }))}
        onRemove={(id) => update((c) => ({ units: c.units.filter((u) => u.id !== id) }))}
      />
      <FieldDialog
        key={`field-${fields.item?.id ?? 'new'}-${fields.open}`}
        open={fields.open}
        field={fields.item}
        onClose={fields.close}
        onSave={(field) => update((c) => ({ fields: upsert(c.fields, field) }))}
        onRemove={(id) => update((c) => ({ fields: c.fields.filter((f) => f.id !== id) }))}
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

function UnitDialog({
  open,
  unit,
  taken,
  onClose,
  onSave,
  onRemove,
}: DialogProps<CustomUnit> & { unit?: CustomUnit; taken: (abbr: string, id?: string) => boolean }) {
  const [name, setName] = useState(unit?.name ?? '')
  const [abbr, setAbbr] = useState(unit?.abbr ?? '')
  const [error, setError] = useState<string | null>(null)
  const fail = (message: string) => {
    setError(message)
    return false
  }

  return (
    <RuleDialog
      open={open}
      title={unit ? copy.units.editTitle : copy.units.newTitle}
      onClose={onClose}
      error={error}
      removeName={unit?.name}
      onRemove={unit ? () => onRemove(unit.id) : undefined}
      onSubmit={() => {
        const short = abbr.trim() || name.trim().slice(0, 3).toLowerCase()
        if (!name.trim()) return fail(t.rules.nameRequired)
        if (taken(short, unit?.id)) return fail(copy.units.abbrTaken)
        onSave({ id: unit?.id ?? newId('unt'), name: name.trim(), abbr: short.slice(0, 12) })
        return true
      }}
    >
      <TextInput
        id="unit-name"
        label={copy.units.name}
        value={name}
        onChange={(v) => {
          setName(v)
          setError(null)
        }}
        placeholder={copy.units.namePlaceholder}
        autoFocus
      />
      <TextInput
        id="unit-abbr"
        label={copy.units.abbr}
        value={abbr}
        onChange={(v) => {
          setAbbr(v)
          setError(null)
        }}
        placeholder={copy.units.abbrPlaceholder}
      />
    </RuleDialog>
  )
}

const FIELD_TYPES: ItemField['type'][] = ['text', 'number', 'date']

function FieldDialog({ open, field, onClose, onSave, onRemove }: DialogProps<ItemField> & { field?: ItemField }) {
  const [name, setName] = useState(field?.name ?? '')
  const [type, setType] = useState<ItemField['type']>(field?.type ?? 'text')
  const [error, setError] = useState<string | null>(null)

  return (
    <RuleDialog
      open={open}
      title={field ? copy.fields.editTitle : copy.fields.newTitle}
      onClose={onClose}
      error={error}
      removeName={field?.name}
      onRemove={field ? () => onRemove(field.id) : undefined}
      onSubmit={() => {
        if (!name.trim()) {
          setError(t.rules.nameRequired)
          return false
        }
        onSave({ id: field?.id ?? newId('fld'), name: name.trim(), type })
        return true
      }}
    >
      <div className="span-2">
        <TextInput
          id="field-name"
          label={copy.fields.name}
          value={name}
          onChange={(v) => {
            setName(v)
            setError(null)
          }}
          placeholder={copy.fields.namePlaceholder}
          autoFocus
        />
      </div>
      <div className="field span-2">
        <span className="field-label">{copy.fields.type}</span>
        <Segmented
          label={copy.fields.type}
          options={FIELD_TYPES.map((f) => copy.fields.types[f])}
          value={FIELD_TYPES.indexOf(type)}
          onChange={(i) => setType(FIELD_TYPES[i])}
        />
      </div>
    </RuleDialog>
  )
}
