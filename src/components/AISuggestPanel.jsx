import { useState, useEffect } from 'react'
import { AISuggestions } from '../utils/ai'

export const AISuggestPanel = ({ dateStr, existingTasks, onAdd, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [thinking, setThinking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      setThinking(true)
      setError(null)
      try {
        const res = await AISuggestions(dateStr, existingTasks)
        setSuggestions(res)
      } catch (err) {
        setError('Не удалось получить подсказки AI')
        console.error(err)
      } finally {
        setThinking(false)
      }
    }
    fetchSuggestions()
  }, [dateStr, existingTasks])

  return (
    <div
      className="ai-panel"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="ai-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="ai-icon">✨</span>
          <span className="ai-title">AI Планировщик</span>
        </div>
        <button onClick={onClose} className="ai-close">×</button>
      </div>

      <div className="ai-content">
        {thinking ? (
          <div className="ai-thinking">
            <div className="ai-spinner" />
            <span>Анализирую ваши задачи...</span>
          </div>
        ) : error ? (
          <div className="ai-error">{error}</div>
        ) : (
          <div className="ai-list">
            <div className="ai-label">Рекомендации для вас:</div>
            {suggestions.map((s, idx) => (
              <div key={idx} className="ai-item">
                <div className="ai-item-info">
                  <span className="ai-item-emoji">{s.emoji}</span>
                  <div>
                    <div className="ai-item-title">{s.title}</div>
                    {s.time && <div className="ai-item-time">{s.time}</div>}
                  </div>
                </div>
                <button
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true)
                    await onAdd(s)
                    setLoading(false)
                  }}
                  className="ai-add-btn"
                >
                  Добавить
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
