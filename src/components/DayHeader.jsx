import { MONTHS_GEN, DAYS_FULL } from '../constants'

export const DayHeader = ({ date, today, dayTasks }) => {
  const d = new Date(date)
  const isPast = date < today
  const rel = date === today ? 'Сегодня' : '' // simplified for now

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 3,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 38,
            fontWeight: 700,
            color: 'var(--text-bright)',
            lineHeight: 1,
          }}
        >
          {d.getDate()} {MONTHS_GEN[d.getMonth()]}
        </h1>
        {rel && (
          <span
            style={{
              padding: '3px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              fontWeight: 500,
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-border)',
            }}
          >
            {rel}
          </span>
        )}
        {isPast && dayTasks.some((t) => !t.completed) && (
          <span
            style={{
              padding: '3px 12px',
              borderRadius: 20,
              fontSize: 11.5,
              background: 'var(--error-bg)',
              color: 'var(--error)',
              border: '1px solid rgba(255,112,112,0.2)',
            }}
          >
            ⚠ Есть незавершённые
          </span>
        )}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dark)', textTransform: 'capitalize' }}>
        {DAYS_FULL[(d.getDay() + 6) % 7]}, {d.getFullYear()} г.
      </div>
    </div>
  )
}
