
export const Toolbar = ({
  total,
  done,
  onClearCompleted,
  setShowStats,
  setShowAI,
  onAddTask
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 12.5, color: 'var(--text-dark)' }}>
        {total === 0 ? 'Задач нет' : `${total} ${total === 1 ? 'задача' : total < 5 ? 'задачи' : 'задач'}`}
        {done > 0 && ` · ${done} выполнено`}
      </span>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        {done > 0 && (
          <button
            onClick={onClearCompleted}
            style={{
              background: 'transparent',
              color: 'var(--text-dim)',
              border: '1px solid #242424',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              transition: 'all 0.15s',
            }}
          >
            Очистить выполненные
          </button>
        )}
        <button
          onClick={() => setShowStats(true)}
          style={{
            background: 'rgba(109,191,126,0.08)',
            color: 'var(--success)',
            border: '1px solid rgba(109,191,126,0.2)',
            borderRadius: 20,
            padding: '5px 13px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s',
          }}
        >
          📊 Статистика
        </button>
        <button
          onClick={() => setShowAI(true)}
          style={{
            background: 'rgba(124,168,232,0.08)',
            color: 'var(--priority-medium)',
            border: '1px solid rgba(124,168,232,0.2)',
            borderRadius: 20,
            padding: '5px 13px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s',
          }}
        >
          ✨ AI
        </button>
        <button
          onClick={onAddTask}
          style={{
            background: 'var(--accent-muted)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-border)',
            borderRadius: 20,
            padding: '5px 14px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'var(--font-main)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1, marginTop: -1 }}>+</span> Задача
        </button>
      </div>
    </div>
  )
}
