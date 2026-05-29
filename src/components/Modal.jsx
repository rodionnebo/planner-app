import { useRef, useEffect, useState } from 'react'

export const Modal = ({ editing, form, setForm, onSubmit, onClose }) => {
  const inputRef = useRef(null)
  const [tagInput, setTagInput] = useState('')
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  const addTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...(form.tags || []), tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) })
  }

  const handleSave = () => {
    if (!form.title.trim()) {
      setAttemptedSubmit(true)
      return
    }
    onSubmit()
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
    }}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-modal)', border: '1px solid var(--border-modal)', borderRadius: 24, width: '100%', maxWidth: 480, padding: 24,
        maxHeight: '90vh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 24px)'
      }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, color: 'var(--accent)' }}>{editing ? 'Редактировать задачу' : 'Новая задача'}</h3>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Что нужно сделать?</label>
            <input
              ref={inputRef}
              type="text"
              placeholder={attemptedSubmit ? 'Название обязательно!' : 'Название задачи...'}
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value })
                if (e.target.value.trim()) setAttemptedSubmit(false)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: attemptedSubmit ? '1px solid var(--error)' : '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 14px',
                color: '#fff',
                transition: 'border 0.2s'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Время</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', color: '#fff' }}
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Приоритет</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px', color: '#fff' }}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="deadline">Срочно</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Теги</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {form.tags?.map(tag => (
                <span key={tag} onClick={() => removeTag(tag)} style={{ fontSize: 11, background: 'var(--accent-muted)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}>
                  #{tag} ×
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Добавить тег..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#fff' }}
              />
              <button onClick={addTag} style={{ background: 'var(--border)', color: '#fff', border: 'none', borderRadius: 10, padding: '0 15px', cursor: 'pointer' }}>+</button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>Заметка</label>
            <textarea
              placeholder="Дополнительные детали..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', color: '#fff', minHeight: 80, resize: 'none' }}
            />
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="cancel-btn" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'none', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', fontWeight: 600 }}>Отмена</button>
          <button
            className="save-btn"
            onClick={handleSave}
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: 14,
              background: 'var(--accent)',
              border: 'none',
              color: '#0C0C0C',
              cursor: 'pointer',
              fontWeight: 700,
              opacity: !form.title.trim() && attemptedSubmit ? 0.6 : 1
            }}
          >
            {editing ? 'Сохранить изменения' : 'Добавить задачу'}
          </button>
        </div>
      </div>
    </div>
  )
}
