import { useRef, useEffect } from 'react'

export const Modal = ({ editing, form, setForm, onSubmit, onClose }) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editing ? 'Редактировать задачу' : 'Новая задача'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Что нужно сделать?</label>
            <input
              ref={inputRef}
              type="text"
              placeholder="Название задачи... (можно со временем, например '14:00 Обед')"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Время</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Приоритет</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="deadline">Срочно</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Повтор</label>
            <select
              value={form.repeat}
              onChange={(e) => setForm({ ...form, repeat: e.target.value })}
            >
              <option value="none">Без повтора</option>
              <option value="daily">Каждый день</option>
              <option value="weekly">Раз в неделю</option>
            </select>
          </div>

          <div className="form-group">
            <label>Заметка</label>
            <textarea
              placeholder="Дополнительные детали..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Отмена</button>
          <button className="save-btn" onClick={onSubmit}>
            {editing ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  )
}
