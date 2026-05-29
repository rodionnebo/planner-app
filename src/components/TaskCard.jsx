import React from 'react'
import { PRIORITY } from '../constants'

export const TaskCard = React.memo(({ task, onToggle, onEdit, onDelete, isNew }) => {
  const p = PRIORITY[task.priority]
  return (
    <div
      className={`task-card${isNew ? ' task-new' : ''}`}
      style={{
        background: task.completed ? 'rgba(255,255,255,0.015)' : 'var(--bg-card)',
        border: `1px solid ${task.completed ? '#1e1e1e' : 'var(--border-light)'}`,
        borderLeft: `3px solid ${task.completed ? '#252525' : p.color}`,
        borderRadius: 14,
        padding: '13px 13px 13px 15px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        opacity: task.completed ? 0.5 : 1,
        transition: 'opacity 0.25s, border-color 0.25s, background 0.25s, transform 0.2s',
      }}
    >
      <button
        onClick={onToggle}
        className="check-btn"
        aria-label={task.completed ? 'Отменить выполнение' : 'Выполнить задачу'}
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          flexShrink: 0,
          marginTop: 1,
          border: `2px solid ${task.completed ? 'var(--success)' : p.color}`,
          background: task.completed ? 'var(--success-bg)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          padding: 0,
        }}
      >
        {task.completed && (
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1"
              stroke="var(--success)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            marginBottom: task.note ? 4 : 0,
          }}
        >
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 500,
              lineHeight: 1.35,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'var(--text-dark)' : 'var(--text-highlight)',
              wordBreak: 'break-word',
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 99,
              background: p.bg,
              color: p.color,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              letterSpacing: 0.2,
            }}
          >
            {p.icon} {p.label}
          </span>
          {task.time && (
            <span style={{ fontSize: 11, opacity: 0.35, whiteSpace: 'nowrap' }}>
              🕐 {task.time}
            </span>
          )}
        </div>
        {task.note && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-dim)',
              lineHeight: 1.5,
              wordBreak: 'break-word',
            }}
          >
            {task.note}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        <button onClick={onEdit} className="act-btn" title="Редактировать" aria-label="Редактировать">
          ✏️
        </button>
        <button onClick={onDelete} className="act-btn" title="Удалить" aria-label="Удалить">
          🗑
        </button>
      </div>
    </div>
  )
})

TaskCard.displayName = 'TaskCard'
