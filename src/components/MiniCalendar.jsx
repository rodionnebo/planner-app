import { MONTHS_GEN, DAYS_SHORT } from '../constants'

export const MiniCalendar = ({ calMonth, selected, setSelected, tasks, today, onNavigate, onClose }) => {
  const { y, m } = calMonth
  const firstDay = new Date(y, m, 1).getDay()
  const startingDay = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const days = []
  for (let i = 0; i < startingDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  return (
    <div className="mini-cal">
      <div className="cal-header">
        <button onClick={() => onNavigate(-1)}>‹</button>
        <span>{MONTHS_GEN[m]} {y}</span>
        <button onClick={() => onNavigate(1)}>›</button>
      </div>
      <div className="cal-grid">
        {DAYS_SHORT.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />
          const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isSelected = dateStr === selected
          const isToday = dateStr === today
          const hasTasks = tasks[dateStr]?.length > 0

          return (
            <div
              key={d}
              className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => {
                setSelected(dateStr)
                if (onClose) onClose()
              }}
            >
              {d}
              {hasTasks && <div className="cal-dot" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
