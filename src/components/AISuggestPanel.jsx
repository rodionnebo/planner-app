import React, { useState, useEffect } from 'react'
import { PRIORITY } from '../constants'

async function fetchAISuggestions(dateStr, existingTasks) {
  // Симуляция "размышлений" ИИ
  await new Promise((r) => setTimeout(r, 1500))

  const suggestions = [
    {
      title: 'Прогулка на свежем воздухе 🌿',
      priority: 'medium',
      note: 'Минимум 30 минут для ясности ума.',
    },
    {
      title: 'Заняться самообразованием 📚',
      priority: 'high',
      note: 'Прочитать главу книги или посмотреть урок.',
    },
    {
      title: 'Планирование следующей недели 🗓️',
      priority: 'medium',
      note: 'Записать ключевые цели и встречи.',
    },
    { title: 'Вечерний детокс 📵', priority: 'low', note: 'Без гаджетов за час до сна.' },
    { title: 'Сделать зарядку 🤸', priority: 'high', note: 'Разминка на 10-15 минут.' },
    {
      title: 'Уборка рабочего места ✨',
      priority: 'medium',
      note: 'Чистота вокруг — чистота в мыслях.',
    },
  ]

  const existingTitles = new Set(existingTasks.map((t) => t.title))
  return suggestions
    .filter((s) => !existingTitles.has(s.title))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
}

export const AISuggestPanel = ({ dateStr, existingTasks, onAdd, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [suggestions, setSuggestions] = useState([])
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    let isMounted = true
    fetchAISuggestions(dateStr, existingTasks)
      .then((s) => {
        if (isMounted) {
          setSuggestions(s)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Не удалось получить подсказки.')
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [dateStr, existingTasks])

  function toggleSel(i) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  function addSelected() {
    suggestions.filter((_, i) => selected.has(i)).forEach((s) => onAdd(s))
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: 'var(--bg-modal)',
          borderRadius: 22,
          padding: '24px',
          width: '100%',
          maxWidth: 460,
          border: '1px solid var(--border-modal)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 20,
                color: 'var(--text-bright)',
                fontWeight: 600,
              }}
            >
              ✨ AI-подсказки
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
              Выбери задачи для добавления
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 20,
              cursor: 'pointer',
            }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {loading && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div className="ai-spinner" />
            <p style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 12 }}>Думаю...</p>
          </div>
        )}
        {error && <p style={{ color: 'var(--error)', fontSize: 13, padding: '16px 0' }}>{error}</p>}
        {!loading && !error && (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginBottom: 18,
              }}
            >
              {suggestions.map((s, i) => {
                const p = PRIORITY[s.priority] || PRIORITY.medium
                const isSel = selected.has(i)
                return (
                  <div
                    key={i}
                    onClick={() => toggleSel(i)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: isSel ? 'rgba(232,168,124,0.1)' : '#0E0E0E',
                      border: `1px solid ${isSel ? 'rgba(232,168,124,0.4)' : '#222'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          border: `2px solid ${isSel ? 'var(--accent)' : '#333'}`,
                          background: isSel ? 'rgba(232,168,124,0.25)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isSel && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="var(--accent)"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 13.5,
                          color: isSel ? 'var(--text-highlight)' : 'var(--text-dim)',
                          fontWeight: 500,
                          flex: 1,
                        }}
                      >
                        {s.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 7px',
                          borderRadius: 99,
                          background: p.bg,
                          color: p.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.icon} {p.label}
                      </span>
                    </div>
                    {s.note && (
                      <p
                        style={{
                          fontSize: 11.5,
                          color: 'var(--text-dark)',
                          marginTop: 5,
                          paddingLeft: 26,
                        }}
                      >
                        {s.note}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: 10,
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                  fontSize: 13,
                }}
              >
                Отмена
              </button>
              <button
                onClick={addSelected}
                disabled={selected.size === 0}
                style={{
                  flex: 2,
                  padding: '11px',
                  borderRadius: 10,
                  fontWeight: 600,
                  background: selected.size > 0 ? 'rgba(232,168,124,0.15)' : '#1a1a1a',
                  color: selected.size > 0 ? 'var(--accent)' : 'var(--text-dim)',
                  border: `1px solid ${selected.size > 0 ? 'rgba(232,168,124,0.35)' : '#222'}`,
                  cursor: selected.size > 0 ? 'pointer' : 'default',
                  fontFamily: 'var(--font-main)',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                {selected.size > 0 ? `Добавить (${selected.size})` : 'Ничего не выбрано'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
