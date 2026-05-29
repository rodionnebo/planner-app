import { MiniCalendar } from './MiniCalendar'
import { addDays, strToDate } from '../utils/date'
import { MONTHS_GEN } from '../constants'

export const SidebarContent = ({
  calMonth,
  selected,
  setSelected,
  tasks,
  today,
  onNavigateMonth,
  onClose,
}) => {
  const dayTasks = tasks[selected] || []
  const total = dayTasks.length
  const done = dayTasks.filter((t) => t.completed).length

  const dayNavSt = {
    flex: 1,
    padding: '7px',
    background: 'var(--bg-modal)',
    border: '1px solid var(--border-light)',
    borderRadius: 8,
    color: 'var(--text-dim)',
    cursor: 'pointer',
    fontSize: 11.5,
    fontFamily: 'var(--font-main)',
    transition: 'color 0.15s',
  }

  const secLabelSt = {
    fontSize: 9.5,
    color: 'var(--text-dark)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: 700,
  }

  return (
    <div>
      <MiniCalendar
        calMonth={calMonth}
        selected={selected}
        setSelected={setSelected}
        tasks={tasks}
        today={today}
        onNavigate={onNavigateMonth}
        onClose={onClose}
      />

      <div style={{ display: 'flex', gap: 7, padding: '0 14px 14px' }}>
        <button onClick={() => setSelected((s) => addDays(s, -1))} style={dayNavSt}>
          ‹ Пред.
        </button>
        <button onClick={() => setSelected((s) => addDays(s, 1))} style={dayNavSt}>
          След. ›
        </button>
      </div>

      <div
        style={{
          margin: '0 14px 18px',
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-light)',
          borderRadius: 13,
          padding: '14px 15px',
        }}
      >
        <div style={secLabelSt}>Прогресс дня</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
          <span style={{ color: 'var(--text-dark)' }}>Всего</span>
          <span style={{ fontWeight: 600, color: '#888' }}>{total}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 11 }}>
          <span style={{ color: 'var(--text-dark)' }}>Выполнено</span>
          <span style={{ fontWeight: 600, color: 'var(--success)' }}>{done}</span>
        </div>
        <div style={{ background: '#1a1a1a', borderRadius: 99, height: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${total > 0 ? (done / total) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--success))',
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        {total > 0 && done === total && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 9,
              fontSize: 11.5,
              color: 'var(--success)',
              opacity: 0.7,
            }}
          >
            ✓ Всё выполнено!
          </div>
        )}
      </div>

      {/* Upcoming deadlines */}
      {(() => {
        const upcoming = []
        for (let i = 1; i <= 7; i++) {
          const ds = addDays(today, i)
          ;(tasks[ds] || [])
            .filter((t) => t.priority === 'deadline' && !t.completed)
            .forEach((t) => upcoming.push({ date: ds, task: t }))
        }
        if (!upcoming.length) return null
        return (
          <div style={{ margin: '0 14px 18px' }}>
            <div style={secLabelSt}>Ближайшие дедлайны</div>
            {upcoming.slice(0, 3).map(({ date, task }) => {
              const dd = strToDate(date)
              return (
                <div
                  key={task.id}
                  onClick={() => setSelected(date)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255,112,112,0.06)',
                    border: '1px solid rgba(255,112,112,0.13)',
                    borderRadius: 10,
                    marginBottom: 5,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#FF8A8A', marginBottom: 1 }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dark)' }}>
                    {dd.getDate()} {MONTHS_GEN[dd.getMonth()]}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Overdue days */}
      {(() => {
        const overdue = Object.entries(tasks)
          .filter(([date, list]) => date < today && list.some((t) => !t.completed))
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 3)
        if (!overdue.length) return null
        return (
          <div style={{ margin: '0 14px 18px' }}>
            <div style={secLabelSt}>Просроченные</div>
            {overdue.map(([date, list]) => {
              const dd = strToDate(date)
              const cnt = list.filter((t) => !t.completed).length
              return (
                <div
                  key={date}
                  onClick={() => setSelected(date)}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(255,112,112,0.05)',
                    border: '1px solid rgba(255,112,112,0.1)',
                    borderRadius: 10,
                    marginBottom: 5,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {dd.getDate()} {MONTHS_GEN[dd.getMonth()]}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--error)' }}>{cnt} не выполн.</span>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
