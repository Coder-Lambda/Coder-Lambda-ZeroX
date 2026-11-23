import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface WidgetCardProps {
  icon: LucideIcon
  title: string
  /** Small mark linking the widget to its chart series. */
  seriesColor?: string
  action?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/** A medium finance widget: title row, the number first, a short list, actions at the bottom. */
export function WidgetCard({ icon: Icon, title, seriesColor, action, footer, children }: WidgetCardProps) {
  return (
    <section className="glass card fin-widget" aria-label={title}>
      <header className="fin-widget-head">
        <span className="fin-widget-icon" aria-hidden="true">
          <Icon />
        </span>
        <h2 className="fin-widget-title">
          {title}
          {seriesColor && <span className="chart-key is-rect" style={{ color: seriesColor }} aria-hidden="true" />}
        </h2>
        {action}
      </header>
      <div className="fin-widget-body">{children}</div>
      {footer && <footer className="fin-widget-foot">{footer}</footer>}
    </section>
  )
}

export function Money({ value, className = '' }: { value: number; className?: string }) {
  const formatted = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return <span className={`${className}${value < 0 ? ' is-negative' : ''}`}>{formatted}</span>
}
