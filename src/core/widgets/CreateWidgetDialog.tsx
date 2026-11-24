import { useState } from 'react'
import { ArrowLeft, Check, CircleAlert, Plus } from 'lucide-react'
import { useSession } from '../auth/SessionProvider'
import type { ModuleId } from '../config/types'
import { t } from '../i18n/pt-BR'
import { haptic } from '../lib/haptic'
import { MODULE_ICONS } from '../modules/registry'
import { pageName, readRules } from '../rules/defaults'
import { Dialog } from '../ui/Dialog'
import { Segmented } from '../ui/Segmented'
import { toast } from '../ui/Toaster'
import { offeredIn, useWidgetCatalog, widgetCopy } from './catalog'
import { capacity, onPage, pagesOf, PLACES, readPlace, useWidgetLayout } from './store'
import type { Period, WidgetKind, WidgetPlace, WidgetSource } from './types'

const copy = t.widgets.wizard
const PERIODS: Period[] = ['daily', 'monthly', 'yearly']
const SOURCES: WidgetSource[] = ['collaborators', 'personalFinance', 'stock', 'businessFinance', 'setAsWish']

export const placeLabel = (place: ModuleId, labels: Record<string, string>) => labels[place] ?? t.modules[place].label

/**
 * Criar widget: first the part of the app, then the widget and how it shows (widget or chart, period,
 * production item). The dashboards only take what fits in the rule book's places.
 */
export function CreateWidgetDialog({
  open,
  onClose,
  initialPlace,
  initialKind,
  initialPage = 0,
}: {
  open: boolean
  onClose: () => void
  initialPlace?: WidgetPlace
  initialKind?: WidgetKind
  /** Main dashboard page (0–2). */
  initialPage?: number
}) {
  const { active } = useSession()
  const { add } = useWidgetLayout()
  const [place, setPlace] = useState<WidgetPlace | null>(initialPlace ?? null)
  const [type, setType] = useState<string | null>(null)
  const [kind, setKind] = useState<WidgetKind>(initialKind ?? 'widget')
  const [period, setPeriod] = useState<Period>('daily')
  const [itemId, setItemId] = useState('')
  const [page, setPage] = useState(initialPage)
  useWidgetCatalog()
  if (!active) return null

  const rules = readRules(active)
  const ctx = { modules: active.modules, rules }
  const places = PLACES.filter((p) => active.modules[p])
  const offered = place ? offeredIn(place) : []
  const chosen = offered.find((o) => o.def.type === type)
  const onMain = place === 'mainDashboard'
  const targetPage = onMain ? page : 0
  const room = place ? capacity(place, rules, targetPage) : { widgets: 0, charts: 0 }
  const used = place ? onPage(readPlace(active, place), targetPage) : { widgets: [], charts: [] }
  const kindOptions = chosen?.kinds ?? []
  const actualKind: WidgetKind = kindOptions.includes(kind) ? kind : (kindOptions[0] ?? 'widget')
  const full = place != null && (actualKind === 'chart' ? used.charts.length >= room.charts : used.widgets.length >= room.widgets)
  const items = rules.collaborators.productionItems

  const choosePlace = (next: WidgetPlace) => {
    setPlace(next)
    setType(null)
  }

  const submit = () => {
    if (!place || !chosen || full) {
      haptic('error')
      return
    }
    add(place, {
      type: chosen.def.type,
      kind: actualKind,
      period: chosen.def.periodic ? period : undefined,
      itemId: chosen.def.itemOption ? itemId || items[0]?.id : undefined,
      page: onMain ? targetPage : undefined,
    })
    haptic('success')
    toast(t.widgets.added(onMain ? `${placeLabel(place, active.labels)} · ${pageName(rules.mainDashboard, targetPage)}` : placeLabel(place, active.labels)))
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={copy.title} size="lg">
      {!place ? (
        <>
          <p className="text-2 mb-3">{copy.placeStep}</p>
          <div className="wz-places">
            {places.map((p) => {
              const Icon = MODULE_ICONS[p]
              const count = offeredIn(p).filter((o) => !o.def.unavailable?.(ctx)).length
              return (
                <button key={p} type="button" className="wz-place well tactile" onClick={() => choosePlace(p)} data-autofocus={p === places[0] || undefined}>
                  <Icon aria-hidden="true" />
                  <span className="person-main">
                    <span className="person-name">{placeLabel(p, active.labels)}</span>
                    <span className="person-sub">{copy.placeHint[p]}</span>
                  </span>
                  <span className="badge num">{copy.available(count)}</span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <button type="button" className="back-link mb-3" onClick={() => setPlace(null)}>
            <ArrowLeft />
            {copy.back}
          </button>
          <p className="text-2 mb-3">{copy.widgetStep(placeLabel(place, active.labels))}</p>

          {SOURCES.map((source) => {
            const group = offered.filter((o) => o.def.source === source)
            if (group.length === 0) return null
            const Icon = MODULE_ICONS[source]
            return (
              <section key={source} className="wz-group" aria-label={t.modules[source].label}>
                <h3 className="alert-group-title">
                  <Icon aria-hidden="true" />
                  {placeLabel(source, active.labels)}
                </h3>
                <div className="wz-options" role="radiogroup" aria-label={t.modules[source].label}>
                  {group.map(({ def }) => {
                    const reason = def.unavailable?.(ctx) ?? null
                    const selected = type === def.type
                    return (
                      <button
                        key={def.type}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={reason != null}
                        className={`wz-option tactile${selected ? ' is-selected' : ''}`}
                        onClick={() => setType(def.type)}
                      >
                        <span className="person-main">
                          <span className="person-name">{widgetCopy(def.type).title}</span>
                          <span className="person-sub">{reason ?? widgetCopy(def.type).description}</span>
                        </span>
                        {selected && <Check className="wz-check" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {chosen && (
            <div className="wz-settings well">
              {onMain && (
                <div className="field">
                  <span className="field-label">{t.widgets.page}</span>
                  <Segmented
                    label={t.widgets.page}
                    options={pagesOf('mainDashboard').map((p) => pageName(rules.mainDashboard, p))}
                    value={targetPage}
                    onChange={setPage}
                  />
                </div>
              )}
              {kindOptions.length > 1 && (
                <div className="field">
                  <span className="field-label">{copy.show}</span>
                  <Segmented
                    label={copy.show}
                    options={kindOptions.map((k) => copy.kinds[k])}
                    value={kindOptions.indexOf(actualKind)}
                    onChange={(i) => setKind(kindOptions[i])}
                  />
                </div>
              )}
              {chosen.def.periodic && (
                <div className="field">
                  <span className="field-label">{copy.period}</span>
                  <Segmented
                    label={copy.period}
                    options={PERIODS.map((p) => copy.periods[p])}
                    value={PERIODS.indexOf(period)}
                    onChange={(i) => setPeriod(PERIODS[i])}
                  />
                </div>
              )}
              {chosen.def.itemOption && items.length > 1 && (
                <div className="field">
                  <label className="field-label" htmlFor="wz-item">
                    {copy.item}
                  </label>
                  <select id="wz-item" className="input select" value={itemId || items[0].id} onChange={(e) => setItemId(e.target.value)}>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {full && (
                <p className="field-error" role="alert">
                  <CircleAlert size={14} />
                  {copy.full(
                    actualKind,
                    onMain ? pageName(rules.mainDashboard, targetPage) : placeLabel(place, active.labels),
                    actualKind === 'chart' ? room.charts : room.widgets,
                  )}
                </p>
              )}
            </div>
          )}

          <div className="form-actions mt-4">
            <button type="button" className="btn btn-secondary tactile" onClick={onClose}>
              {t.common.cancel}
            </button>
            <button type="button" className="btn btn-primary tactile" disabled={!chosen || full} onClick={submit}>
              <Plus />
              {copy.add}
            </button>
          </div>
        </>
      )}
    </Dialog>
  )
}
