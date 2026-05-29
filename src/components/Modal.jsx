import React, { useEffect, useRef } from 'react'
import { strToDate } from '../utils/date'
import { MONTHS_GEN, PRIORITY } from '../constants'

export const Modal = ({ editing, form, setForm, onSubmit, onClose, selectedDate }) => {
  const d = strToDate(selectedDate)
  const title = editing ? 'Редактировать задачу' : `Задача на ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [])

  const inputSt = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid #222',
    borderRadius: 10,
    padding: '11px 13px',
    color: 'var(--text-highlight)',
    fontSize: 14.5,
    fontFamily: 'var(--font-main)',
    marginBottom: 11,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelSt = {
    fontSize: 10.5,
    color: 'var(--text-dark)',
    marginBottom: 6,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal-box"
        style={{
          background: 'var(--bg-modal)',
          borderRadius: 22,
          padding: '24px 22px',
          width: '100%',
          maxWidth: 480,
          border: '1px solid var(--border-modal)',
          boxShadow: '0 28px 80px rgba(0,0,0,0.65)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 21,
              color: 'var(--text-bright)',
              fontWeight: 600,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 6px',
            }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <input
          ref={inputRef}
          placeholder="Название задачи *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) onSubmit()
            if (e.key === 'Escape') onClose()
          }}
          style={inputSt}
          required
        />

        <textarea
          placeholder="Заметка (необязательно)..."
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          rows={3}
          style={{ ...inputSt, resize: 'vertical', minHeight: 76 }}
        />

        <div style={{ marginBottom: 14 }}>
          <div style={labelSt}>Время</div>
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            style={{ ...inputSt, marginBottom: 0, width: 'auto' }}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={labelSt}>Приоритет</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {Object.entries(PRIORITY).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setForm({ ...form, priority: key })}
                style={{
                  padding: '5px 13px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontFamily: 'var(--font-main)',
                  transition: 'all 0.15s',
                  border: `1px solid ${form.priority === key ? p.color : 'var(--border-light)'}`,
                  background: form.priority === key ? p.bg : 'transparent',
                  color: form.priority === key ? p.color : 'var(--text-dim)',
                }}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 9 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 11,
              background: 'transparent',
              border: '1px solid var(--border-light)',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: 'var(--font-main)',
              fontSize: 13.5,
            }}
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            disabled={!form.title.trim()}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: 11,
              background: form.title.trim() ? 'var(--accent)' : '#1e1e1e',
              color: form.title.trim() ? '#0C0C0C' : 'var(--text-dim)',
              border: 'none',
              cursor: form.title.trim() ? 'pointer' : 'default',
              fontWeight: 600,
              fontFamily: 'var(--font-main)',
              fontSize: 13.5,
              transition: 'all 0.2s',
            }}
          >
            {editing ? 'Сохранить' : 'Добавить задачу'}
          </button>
        </div>
      </div>
    </div>
  )
}
