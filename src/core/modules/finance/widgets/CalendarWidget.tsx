import { useMemo, useState } from 'react'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { t } from '../../../i18n/pt-BR'
import { formatDateKey, toDateKey } from '../../../lib/format'
import { MonthCalendar } from '../../../ui/MonthCalendar'
import { useFinanceContext } from '../FinanceContext'
import { dayKey, firstDay } from '../../../lib/month'
import { isOpen } from '../store'
import { TitleRow } from './TitleRow'
import { WidgetCard } from './WidgetCard'

/** Month calendar marking the days with open titles; pick a day to see or schedule bills on it. */
export function CalendarWidget() {
  const { data, month, setMonth, today, open } = useFinanceContext()
  const [picked, setPicked] = useState(today)
  // The picked day follows the page month: stay on it if it's inside, else today or the 1st.
  const selected = picked.startsWith(month) ? picked : today.startsWith(month) ? today : dayKey(month, 1)

  const marks = useMemo(() => {
    const counts: Record<string, number> = {}
    data.titles.filter(isOpen).forEach((title) => {
      counts[title.dueDate] = (counts[title.dueDate] ?? 0) + 1
    })
    return counts
  }, [data.titles])

  const dueOnDay = data.titles.filter((title) => title.dueDate === selected)

  return (
    <WidgetCard
      icon={CalendarDays}
      title={t.finance.widgets.calendar}
      footer={
        <button
          type="button"
          className="btn btn-secondary tactile"
          onClick={() => open({ type: 'title', kind: 'payable', dueDate: selected })}
        >
          <CalendarPlus />
          {t.finance.addOnDay}
        </button>
      }
    >
      <div className="fin-calendar">
        <MonthCalendar
          month={firstDay(month)}
          onMonthChange={(date) => setMonth(toDateKey(date).slice(0, 7))}
          selected={selected}
          onSelect={setPicked}
          marks={marks}
          markLabel={t.finance.dueCount}
        />
      </div>
      <p className="fin-label num">{formatDateKey(selected)}</p>
      {dueOnDay.length === 0 ? (
        <p className="fin-sub fin-muted">{t.finance.calendarEmpty}</p>
      ) : (
        <ul className="fin-title-list">
          {dueOnDay.map((title) => (
            <TitleRow key={title.id} title={title} showKind />
          ))}
        </ul>
      )}
    </WidgetCard>
  )
}
