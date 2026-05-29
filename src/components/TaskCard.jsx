import { useState, memo } from 'react'
import confetti from 'canvas-confetti'

const TaskCardComponent = ({ task, onToggle, onEdit, onDelete, onMove, isNew }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isNoteExpanded, setIsNoteExpanded] = useState(false)

  const priorityColors = {
    deadline: 'var(--priority-deadline)',
    high: 'var(--priority-high)',
    medium: 'var(--priority-medium)',
    low: 'var(--priority-low)',
  }

  return (
    <div className={`task-card ${isNew ? 'task-new' : ''} ${task.completed ? 'completed' : ''}`}>
      <div className="task-main" style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 12 }}>
        <button
          className={`check-btn ${task.completed ? 'checked' : ''}`}
          onClick={() => {
            if (!task.completed) {
              confetti({
                particleCount: 40,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#E8A87C', '#6DBF7E', '#7CA8E8']
              });
              if ('vibrate' in navigator) navigator.vibrate(10);
            }
            onToggle();
          }}
          style={{
            width: 24,
            height: 24,
            minWidth: 24,
            borderRadius: '50%',
            border: '2px solid var(--accent)',
            background: task.completed ? 'var(--accent)' : 'transparent',
            color: '#0C0C0C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          {task.completed && '✓'}
        </button>

        <div className="task-info" onClick={onEdit} style={{ flex: 1, cursor: 'pointer' }}>
          <div className="task-top" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="task-emoji">{task.emoji || '📌'}</span>
            <span className="task-title" style={{
              fontSize: 15,
              color: task.completed ? 'var(--text-dark)' : 'var(--text-highlight)',
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.7 : 1
            }}>
              {task.title}
            </span>
            {task.time && <span className="task-time" style={{ fontSize: 12, color: 'var(--accent)', opacity: 0.8 }}>{task.time}</span>}
            <div
              className="priority-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: priorityColors[task.priority]
              }}
            />
          </div>

          {task.note && (
             <div className="task-note-container" style={{ marginTop: 4 }}>
                <button
                  className="note-toggle"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsNoteExpanded(!isNoteExpanded)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '4px 0'
                  }}
                >
                  {isNoteExpanded ? 'Скрыть заметку' : 'Показать заметку...'}
                </button>
                {isNoteExpanded && (
                  <div className="task-note" style={{ fontSize: 13, color: 'var(--text-main)', opacity: 0.8, marginTop: 4 }}>
                    {task.note}
                  </div>
                )}
             </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {task.tags.map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="task-actions" style={{ position: 'relative' }}>
           <button
             className="act-btn"
             onClick={() => setShowMenu(!showMenu)}
             style={{
               width: 44,
               height: 44,
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               background: 'transparent',
               border: 'none',
               color: 'var(--text-dim)',
               fontSize: 20,
               cursor: 'pointer'
             }}
           >
             ⋮
           </button>
           {showMenu && (
             <div className="task-menu" style={{
               position: 'absolute',
               right: 0,
               top: '100%',
               background: 'var(--bg-modal)',
               border: '1px solid var(--border)',
               borderRadius: 12,
               padding: 8,
               zIndex: 20,
               minWidth: 140,
               boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
             }}>
                <button
                  onClick={() => { onEdit(); setShowMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 6 }}
                >
                  Изменить
                </button>
                <button
                  onClick={() => { onDelete(); setShowMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', borderRadius: 6 }}
                >
                  Удалить
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // eslint-disable-next-line no-unused-vars
                    const { id, ...data } = task;
                    onMove(undefined, data);
                    setShowMenu(false);
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: 6 }}
                >
                  Дублировать
                </button>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <button
                  onClick={() => { onMove('tomorrow'); setShowMenu(false) }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 6 }}
                >
                  На завтра
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}

TaskCardComponent.displayName = 'TaskCard'
export const TaskCard = memo(TaskCardComponent)
