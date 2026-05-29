import { useMemo } from 'react'
import { MONTHS_GEN, PRIORITY_ORDER } from '../constants'

export const Statistics = ({ tasks, onClose }) => {
  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    const chartData = last7Days.map((date) => {
      const dayTasks = tasks[date] || []
      return {
        date,
        total: dayTasks.length,
        done: dayTasks.filter((t) => t.completed).length,
      }
    })

    const allTasks = Object.values(tasks).flat()
    const total = allTasks.length
    const completed = allTasks.filter((t) => t.completed).length
    const priorityStats = allTasks.reduce((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1
      return acc
    }, {})

    return { chartData, total, completed, priorityStats }
  }, [tasks])

  const maxVal = Math.max(...stats.chartData.map((d) => d.total), 1)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Статистика продуктивности</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val">{stats.total}</div>
            <div className="stat-label">Всего задач</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: 'var(--success)' }}>
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </div>
            <div className="stat-label">Выполнено</div>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-title">Активность за 7 дней</div>
          <div className="chart">
            {stats.chartData.map((d) => {
              const dateObj = new Date(d.date)
              return (
                <div key={d.date} className="chart-col">
                  <div className="chart-bars">
                    <div
                      className="chart-bar total"
                      style={{ height: `${(d.total / maxVal) * 100}%` }}
                    />
                    <div
                      className="chart-bar done"
                      style={{ height: `${(d.done / maxVal) * 100}%` }}
                    />
                  </div>
                  <div className="chart-label">
                    {dateObj.getDate()} {MONTHS_GEN[dateObj.getMonth()].slice(0, 3)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="priority-stats">
          <div className="chart-title">По приоритетам</div>
          {Object.keys(PRIORITY_ORDER).map((p) => (
            <div key={p} className="priority-row">
              <span style={{ textTransform: 'capitalize', fontSize: 13, color: 'var(--text-dim)' }}>
                {p === 'deadline' ? 'Срочно' : p === 'high' ? 'Высокий' : p === 'medium' ? 'Средний' : 'Низкий'}
              </span>
              <div className="priority-bar-bg">
                <div
                  className={`priority-bar ${p}`}
                  style={{ width: `${(stats.priorityStats[p] || 0) / (stats.total || 1) * 100}%` }}
                />
              </div>
              <span style={{ fontSize: 13, width: 25, textAlign: 'right' }}>
                {stats.priorityStats[p] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
