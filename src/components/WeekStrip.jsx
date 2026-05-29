import { useMemo } from 'react'
import { strToDate, addDays } from '../utils/date'
import { DAYS_SHORT } from '../constants'

export const WeekStrip = ({ selectedDate, today, tasks, setSelectedDate }) => {
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedDate, -3 + i))
  }, [selectedDate])

  return (
    <div
      style={{ display: 'flex', gap: 5, marginBottom: 22, overflowX: 'auto', paddingBottom: 2 }}
    >
      {weekDays.map((ds) => {
        const dd = strToDate(ds)
        const isSel = ds === selectedDate
        const isT = ds === today
        const wTasks = tasks[ds] || []
        const wDone = wTasks.filter((t) => t.completed).length
        const wOverdue = ds < today && wTasks.length > 0 && wDone < wTasks.length
        return (
          <button
            key={ds}
            onClick={() => setSelectedDate(ds)}
            className="week-btn"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '9px 12px',
              borderRadius: 12,
              cursor: 'pointer',
              flexShrink: 0,
              border: `1px solid ${isSel ? 'rgba(232,168,124,0.6)' : isT ? 'var(--accent-border)' : '#1e1e1e'}`,
              background: isSel ? 'var(--accent-muted)' : isT ? 'rgba(232,168,124,0.04)' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <span
              className="week-label"
              style={{ fontSize: 9.5, color: 'var(--text-dark)', letterSpacing: 0.5, fontWeight: 700 }}
            >
              {DAYS_SHORT[(dd.getDay() + 6) % 7]}
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: isSel ? 'var(--accent)' : isT ? 'var(--accent)' : wOverdue ? 'var(--error)' : 'var(--text-dim)',
              }}
            >
              {dd.getDate()}
            </span>
            {wTasks.length > 0 ? (
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: wOverdue ? 'var(--error)' : wDone === wTasks.length ? 'var(--success)' : 'var(--accent)',
                }}
              />
            ) : (
              <div style={{ width: 5, height: 5 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
