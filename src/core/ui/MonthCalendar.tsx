import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateKey } from '../lib/format'
import { t } from '../i18n/pt-BR'

interface MonthCalendarProps {
  /** First day of the visible month. */
  month: Date
  onMonthChange: (month: Date) => void
  selected: string
  onSelect: (dateKey: string) => void
  /** Days after this key can't be picked. */
  maxDate?: string
  /** Small count shown under a day (e.g. absences). */
  marks?: Record<string, number>
}

export function MonthCalendar({ month, onMonthChange, selected, onSelect, maxDate, marks = {} }: MonthCalendarProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const today = toDateKey(new Date())
  const nextMonth = new Date(year, monthIndex + 1, 1)
  const canGoNext = !maxDate || toDateKey(nextMonth) <= maxDate

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button
          type="button"
          className="btn btn-icon btn-ghost tactile"
          aria-label={t.calendar.previous}
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
        >
          <ChevronLeft />
        </button>
        <span className="calendar-title">
          {t.calendar.months[monthIndex]} {year}
        </span>
        <button
          type="button"
          className="btn btn-icon btn-ghost tactile"
          aria-label={t.calendar.next}
          disabled={!canGoNext}
          onClick={() => onMonthChange(nextMonth)}
        >
          <ChevronRight />
        </button>
      </div>
      <div className="calendar-grid" role="grid">
        {t.calendar.weekdays.map((day, index) => (
          <span key={index} className="calendar-weekday" aria-hidden="true">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} />
          const key = toDateKey(new Date(year, monthIndex, day))
          const count = marks[key] ?? 0
          const disabled = Boolean(maxDate && key > maxDate)
          return (
            <button
              key={key}
              type="button"
              className={`calendar-day num${key === today ? ' is-today' : ''}`}
              aria-pressed={key === selected}
              aria-label={`${day} ${t.calendar.months[monthIndex]}${count ? ` · ${t.collab.presence.absencesCount(count)}` : ''}`}
              disabled={disabled}
              onClick={() => onSelect(key)}
            >
              {day}
              {count > 0 && <span className="calendar-mark">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
