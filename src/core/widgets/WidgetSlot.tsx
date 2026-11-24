import { Component, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChartColumn, CircleSlash, Plus, Table2 } from 'lucide-react'
import { t } from '../i18n/pt-BR'
import { MODULE_ICONS } from '../modules/registry'
import { widgetDef } from './catalog'
import { useWidgetData } from './data'
import type { WidgetInstance, WidgetKind, WidgetPlace } from './types'

/** A widget's title: its name, plus the period when it has one. */
export function widgetTitle(instance: Pick<WidgetInstance, 'type' | 'period'>) {
  const def = widgetDef(instance.type)
  const name = t.widgets.types[instance.type]?.title ?? instance.type
  return def?.periodic ? `${name} · ${t.widgets.periodTitle[instance.period ?? 'daily']}` : name
}

/** One widget or chart in its glass card; charts can switch to their table. */
export function WidgetSlot({
  instance,
  extended = false,
  toolbar,
}: {
  instance: WidgetInstance
  extended?: boolean
  /** Organize mode controls. */
  toolbar?: ReactNode
}) {
  const data = useWidgetData()
  const [asTable, setAsTable] = useState(false)
  const def = widgetDef(instance.type)
  const reason = def ? (def.unavailable?.({ modules: data.modules, rules: data.rules }) ?? null) : t.widgets.unknown
  const title = widgetTitle(instance)

  if (!def || reason) {
    return (
      <div className={`widget-empty is-${instance.kind}`}>
        <CircleSlash aria-hidden="true" />
        <strong>{title}</strong>
        <span>{reason}</span>
        {toolbar}
      </div>
    )
  }

  const Icon = MODULE_ICONS[def.source]
  return (
    <article className={`glass card widget-card is-${instance.kind}`} aria-label={title}>
      <header className="widget-card-head">
        <Icon aria-hidden="true" />
        <h3 className="widget-card-title" title={title}>
          {title}
        </h3>
        {instance.kind === 'chart' && (
          <button
            type="button"
            className="btn btn-icon btn-ghost tactile"
            aria-pressed={asTable}
            aria-label={asTable ? t.finance.charts.showChart : t.finance.charts.showTable}
            onClick={() => setAsTable(!asTable)}
          >
            {asTable ? <ChartColumn /> : <Table2 />}
          </button>
        )}
      </header>
      {toolbar}
      <div className="widget-card-body">
        <WidgetBoundary>{def.render({ instance, data, extended, asTable })}</WidgetBoundary>
      </div>
    </article>
  )
}

/** An empty place on a dashboard: a shortcut to create the widget or chart that fills it. */
export function EmptySlot({ place, kind, page = 0 }: { place: WidgetPlace; kind: WidgetKind; page?: number }) {
  const query = `criar=${place}&tipo=${kind}${place === 'mainDashboard' ? `&pagina=${page + 1}` : ''}`
  return (
    <Link to={`/configuracoes/widgets?${query}`} className={`widget-empty is-${kind} tactile`}>
      <Plus aria-hidden="true" />
      {kind === 'chart' ? t.widgets.addChart : t.widgets.addWidget}
    </Link>
  )
}

/** One widget failing (odd data, a bug) shows a short note instead of taking the whole dashboard down. */
class WidgetBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <p className="wg-muted">{t.widgets.failed}</p> : this.props.children
  }
}
