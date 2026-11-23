import { t } from '../../i18n/pt-BR'
import { FinancePage } from './FinancePage'

export default function PersonalFinanceModule() {
  return <FinancePage book="personal" title={t.modules.personalFinance.label} sub={t.modules.personalFinance.description} />
}
