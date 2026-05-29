import React, { useMemo } from 'react'

export const Statistics = ({ tasks, onClose }) => {
  const stats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    return last7Days.map((date) => {
      const dayTasks = tasks[date] || []
      const completed = dayTasks.filter((t) => t.completed).length
      const total = dayTasks.length
      return { date, completed, total }
    })
  }, [tasks])

  const maxTasks = Math.max(...stats.map((s) => s.total), 1)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 400,
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: 'var(--bg-modal)',
          borderRadius: 24,
          padding: 30,
          width: '100%',
          maxWidth: 600,
          border: '1px solid var(--border-modal)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 30,
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, color: 'var(--text-bright)' }}>
            Продуктивность
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: 200,
            gap: 15,
            marginBottom: 20,
            padding: '0 10px',
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.date}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div
                style={{
                  width: '100%',
                  background: '#1a1a1a',
                  borderRadius: 6,
                  height: 160,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Total bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${(s.total / maxTasks) * 100}%`,
                    background: 'var(--accent-muted)',
                    transition: 'height 0.5s ease',
                  }}
                />
                {/* Completed bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    width: '100%',
                    height: `${(s.completed / maxTasks) * 100}%`,
                    background: 'var(--success)',
                    transition: 'height 0.5s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-dark)', marginTop: 8 }}>
                {s.date.split('-').slice(1).reverse().join('.')}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Выполнено</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-muted)' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Всего задач</span>
          </div>
        </div>
      </div>
    </div>
  )
}
