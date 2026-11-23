import { ChevronLeft, ChevronRight } from 'lucide-react'
import { t } from '../i18n/pt-BR'
import { addMonths, monthLabel } from '../lib/month'

interface MonthSwitchProps {
  /** 'YYYY-MM' */
  value: string
  onChange: (month: string) => void
  currentMonth: string
}

/** ‹ Novembro 2026 › with a "Hoje" shortcut when away from the current month. */
export function MonthSwitch({ value, onChange, currentMonth }: MonthSwitchProps) {
  return (
    <div className="month-switch glass" role="group" aria-label={t.finance.periodLabel}>
      <button
        type="button"
        className="btn btn-icon btn-ghost tactile"
        aria-label={t.finance.monthPrev}
        onClick={() => onChange(addMonths(value, -1))}
      >
        <ChevronLeft />
      </button>
      <span className="month-switch-label" aria-live="polite">
        {monthLabel(value)}
      </span>
      <button
        type="button"
        className="btn btn-icon btn-ghost tactile"
        aria-label={t.finance.monthNext}
        onClick={() => onChange(addMonths(value, 1))}
      >
        <ChevronRight />
      </button>
      {value !== currentMonth && (
        <button type="button" className="chip tactile" onClick={() => onChange(currentMonth)}>
          {t.finance.thisMonth}
        </button>
      )}
    </div>
  )
}
