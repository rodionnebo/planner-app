import React from 'react'
import { getFirstDayMon, getDaysInMonth } from '../utils/date'
import { MONTHS, DAYS_SHORT } from '../constants'

export const MiniCalendar = React.memo(
  ({ calMonth, selected, setSelected, tasks, today, onNavigate, onClose }) => {
    const { y, m } = calMonth
    const firstDay = getFirstDayMon(y, m)
    const days = getDaysInMonth(y, m)
    const cells = Array(firstDay).fill(null)
    for (let i = 1; i <= days; i++) cells.push(i)

    const navBtnStyle = {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-dim)',
      fontSize: 18,
      cursor: 'pointer',
      padding: '2px 8px',
      lineHeight: 1,
    }

    return (
      <div style={{ padding: '16px 14px 10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <button onClick={() => onNavigate(-1)} style={navBtnStyle} aria-label="Предыдущий месяц">
            ‹
          </button>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              opacity: 0.7,
              letterSpacing: 0.5,
              color: 'var(--text-main)',
            }}
          >
            {MONTHS[m]} {y}
          </span>
          <button onClick={() => onNavigate(1)} style={navBtnStyle} aria-label="Следующий месяц">
            ›
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px' }}>
          {DAYS_SHORT.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: 9.5,
                opacity: 0.3,
                padding: '4px 0',
                fontWeight: 700,
                letterSpacing: 0.5,
                color: 'var(--text-main)',
              }}
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isSel = ds === selected
            const isT = ds === today
            const isPast = ds < today && ds !== today
            const dayTasks = tasks[ds] || []
            const hasTasks = dayTasks.length > 0
            const allDone = hasTasks && dayTasks.every((t) => t.completed)
            const hasDeadline = dayTasks.some((t) => t.priority === 'deadline' && !t.completed)
            const hasOverdue = isPast && hasTasks && !allDone

            return (
              <div
                key={day}
                onClick={() => {
                  setSelected(ds)
                  onClose && onClose()
                }}
                style={{
                  textAlign: 'center',
                  padding: '6px 0',
                  cursor: 'pointer',
                  borderRadius: 7,
                  fontSize: 11.5,
                  fontWeight: isT || isSel ? 700 : 400,
                  background: isSel
                    ? 'var(--accent)'
                    : isT
                      ? 'var(--accent-muted)'
                      : 'transparent',
                  color: isSel
                    ? '#0C0C0C'
                    : isT
                      ? 'var(--accent)'
                      : hasOverdue
                        ? 'var(--error)'
                        : isPast
                          ? 'var(--text-dark)'
                          : 'var(--text-main)',
                  transition: 'background 0.15s',
                }}
              >
                {day}
                {hasTasks && !isSel && (
                  <div
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      margin: '2px auto 0',
                      background: hasDeadline
                        ? 'var(--error)'
                        : allDone
                          ? 'var(--success)'
                          : hasOverdue
                            ? 'var(--error)'
                            : 'var(--accent)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

MiniCalendar.displayName = 'MiniCalendar'
