import { useState } from 'react'

export const TaskCard = ({ task, onToggle, onEdit, onDelete, onMove, isNew }) => {
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
      <div className="task-main">
        <button className={`check-btn ${task.completed ? 'checked' : ''}`} onClick={onToggle}>
          {task.completed && '✓'}
        </button>

        <div className="task-info" onClick={onEdit}>
          <div className="task-top">
            <span className="task-emoji">{task.emoji || '📌'}</span>
            <span className="task-title">{task.title}</span>
            {task.time && <span className="task-time">{task.time}</span>}
            <div
              className="priority-dot"
              style={{ background: priorityColors[task.priority] }}
              title={`Приоритет: ${task.priority}`}
            />
          </div>

          {task.note && (
             <div className="task-note-container">
                <button
                  className="note-toggle"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsNoteExpanded(!isNoteExpanded)
                  }}
                >
                  {isNoteExpanded ? '收起' : '...'}
                </button>
                {isNoteExpanded && <div className="task-note">{task.note}</div>}
             </div>
          )}
        </div>

        <div className="task-actions">
           <button className="act-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
           {showMenu && (
             <div className="task-menu">
                <button onClick={onEdit}>Изменить</button>
                <button onClick={onDelete} style={{ color: 'var(--error)' }}>Удалить</button>
                <div className="menu-divider" />
                <button onClick={() => onMove('tomorrow')}>На завтра</button>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
