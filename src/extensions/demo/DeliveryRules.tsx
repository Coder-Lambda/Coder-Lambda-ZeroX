import { NumberRule, RuleRow } from '../../core/rules/parts'
import { useCustomRules } from '../../core/rules/useRules'

export const DELIVERY_DEFAULTS = { perKm: 2, maxKm: 30 }

/** Rule book chapter ordered by the demo client: what each delivery kilometre is worth and how far they go. */
export default function DeliveryRules() {
  const [rules, save] = useCustomRules('entregas', DELIVERY_DEFAULTS)
  return (
    <>
      <RuleRow title="Valor por quilômetro" hint="Quanto o entregador recebe por quilômetro rodado.">
        <NumberRule id="demo-per-km" label="Valor por quilômetro" prefix="R$" decimals={2} value={rules.perKm} onCommit={(v) => save({ perKm: v ?? 0 })} />
      </RuleRow>
      <RuleRow title="Raio de entrega" hint="Até que distância a empresa entrega.">
        <NumberRule id="demo-max-km" label="Raio de entrega" suffix="km" value={rules.maxKm} onCommit={(v) => save({ maxKm: v ?? 0 })} />
      </RuleRow>
    </>
  )
}
