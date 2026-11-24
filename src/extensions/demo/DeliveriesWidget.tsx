import type { WidgetProps } from '../../core/widgets/types'
import { Figure, Rows, tileMoney } from '../../core/widgets/parts'

/** Demo client's widget: today's deliveries (stock sent) and the delivery rule from its own rule book chapter. */
export function DeliveriesWidget({ data }: WidgetProps) {
  const rule = { perKm: 2, maxKm: 30, ...(data.rules.custom.entregas as { perKm?: number; maxKm?: number } | undefined) }
  const today = data.stock.moves.filter((m) => m.type === 'out' && m.date === data.today).length
  return (
    <>
      <Figure value={today} label="entregas hoje" />
      <Rows
        rows={[
          { label: 'Por quilômetro', value: tileMoney(rule.perKm) },
          { label: 'Raio de entrega', value: `${rule.maxKm} km` },
        ]}
      />
    </>
  )
}
