import { useState, useEffect, useMemo, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import confetti from 'canvas-confetti'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import { useTasks } from './hooks/useTasks.jsx'
import { useCalendar } from './hooks/useCalendar'
import { TaskCard } from './components/TaskCard'
import { SidebarContent } from './components/SidebarContent'
import { Modal } from './components/Modal'
import { AISuggestPanel } from './components/AISuggestPanel'
import { Statistics } from './components/Statistics'
import { ConfirmModal } from './components/ConfirmModal'
import { EMPTY_FORM, DAYS_FULL, MONTHS_GEN, DAYS_SHORT, PRIORITY_ORDER } from './constants'
import { todayStr, addDays, strToDate, relLabel, parseQuickAdd } from './utils/date'

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showCal, setShowCal] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('planner_theme') || 'dark')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [searchQuery, setSearchQuery] = useState('')
  const [newTaskId, setNewTaskId] = useState(null)
  const [today, setToday] = useState(todayStr())
  const [confirmDelete, setConfirmDelete] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Theme effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
    }
    localStorage.setItem('planner_theme', theme)
  }, [theme])

  // Dynamic today update
  useEffect(() => {
    const timer = setInterval(() => {
      const now = todayStr()
      if (now !== today) setToday(now)
    }, 60000)
    return () => clearInterval(timer)
  }, [today])

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const {
    tasks,
    setTasks,
    loading,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    moveTask,
    clearCompleted,
    getTasksForDate,
  } = useTasks(user)

  const { selectedDate, setSelectedDate, calMonth, setCalMonth, navigateMonth } = useCalendar()

  const handleCloseModal = useCallback(() => {
    setModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if ((e.key === 'n' || e.key === 'N') && !modal && !showAI) {
        setForm(EMPTY_FORM)
        setEditing(null)
        setModal(true)
      }
      if (e.key === 'ArrowLeft') setSelectedDate((s) => addDays(s, -1))
      if (e.key === 'ArrowRight') setSelectedDate((s) => addDays(s, 1))
      if (e.key === 'Escape') {
        handleCloseModal()
        setShowAI(false)
        setShowCal(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, showAI, setSelectedDate, handleCloseModal])

  const dayTasks = useMemo(() => getTasksForDate(selectedDate), [getTasksForDate, selectedDate])

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return dayTasks

    const results = []
    const query = searchQuery.toLowerCase()

    Object.entries(tasks).forEach(([date, list]) => {
      list.forEach((t) => {
        if (
          t.title.toLowerCase().includes(query) ||
          (t.note && t.note.toLowerCase().includes(query))
        ) {
          results.push({ ...t, date })
        }
      })
    })

    return results
  }, [dayTasks, searchQuery, tasks])

  const sortedTasks = useMemo(() => {
    if (searchQuery.trim()) {
      return [...filteredTasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      })
    }
    // If not searching, we use the order from the tasks array (DND order)
    return filteredTasks
  }, [filteredTasks, searchQuery])

  const total = dayTasks.length
  const done = dayTasks.filter((t) => t.completed).length
  const isPast = selectedDate < today
  const rel = relLabel(selectedDate)
  const d = strToDate(selectedDate)

  // Confetti effect
  useEffect(() => {
    if (total > 0 && done === total) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E8A87C', '#6DBF7E', '#7CA8E8'],
      })
    }
  }, [done, total])

  const overdueCount = useMemo(() => {
    return Object.entries(tasks).reduce((acc, [date, list]) => {
      if (date < today) {
        return acc + list.filter((t) => !t.completed).length
      }
      return acc
    }, 0)
  }, [tasks, today])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, -3 + i))
  }, [today])

  const handleSubmit = useCallback(() => {
    if (!form.title.trim()) return

    const finalForm = editing ? form : { ...form, ...parseQuickAdd(form.title) }

    if (editing) {
      editTask(editing.date, editing.id, finalForm)
    } else {
      const id = addTask(selectedDate, finalForm)
      setNewTaskId(id)
      setTimeout(() => setNewTaskId(null), 800)
    }
    handleCloseModal()
  }, [form, editing, selectedDate, editTask, addTask, handleCloseModal])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id)
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id)
      const newList = arrayMove(sortedTasks, oldIndex, newIndex)

      const newTasks = { ...tasks }
      newTasks[selectedDate] = newList
      setTasks(newTasks)
      // Save order to Supabase could be implemented here as well
    }
  }

  if (authLoading || loading) {
    return (
      <div
        style={{
          background: 'var(--bg-main)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.6 }}>✦</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Загрузка...</div>
        </div>
      </div>
    )
  }

  if (!user) return <Auth onAuthSuccess={(u) => setUser(u)} />

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #222' } }}
      />
      <div
        style={{
          background: 'var(--bg-main)',
          minHeight: '100vh',
          color: 'var(--text-main)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <header
          style={{
            borderBottom: '1px solid var(--border)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 21,
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: 0.3,
              }}
            >
              Планер
            </span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                marginLeft: 5,
              }}
              title="Переключить тему"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>
            {overdueCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: 'var(--error-bg)',
                  color: 'var(--error)',
                  border: '1px solid rgba(255,112,112,0.2)',
                }}
              >
                {overdueCount} просрочено
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
            {selectedDate !== today && (
              <button
                onClick={() => setSelectedDate(today)}
                style={{
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 20,
                  padding: '5px 13px',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-main)',
                  transition: 'background 0.15s',
                }}
              >
                Сегодня
              </button>
            )}
            <button
              className="cal-toggle"
              onClick={() => setShowCal((v) => !v)}
              style={{
                background: showCal ? 'var(--accent-muted)' : 'transparent',
                border: '1px solid #242424',
                borderRadius: 8,
                padding: '5px 9px',
                color: showCal ? 'var(--accent)' : 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: 15,
                lineHeight: 1,
                transition: 'all 0.15s',
              }}
            >
              📅
            </button>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid #222',
                  borderRadius: 8,
                  padding: '5px 10px',
                  color: 'var(--text-highlight)',
                  fontSize: 13,
                  width: 150,
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#555',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div
              className="keyboard-hints"
              style={{
                fontSize: 11,
                color: 'var(--text-dark)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 1,
              }}
            >
              <span style={{ letterSpacing: 0.5 }}>N — добавить</span>
              <span style={{ letterSpacing: 0.5 }}>← → — навигация</span>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="layout" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* ── Sidebar Desktop ── */}
          <div
            className="sidebar-desktop"
            style={{
              width: 252,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              flexShrink: 0,
              overflowY: 'auto',
            }}
          >
            <SidebarContent
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              selected={selectedDate}
              setSelected={setSelectedDate}
              tasks={tasks}
              today={today}
              onNavigateMonth={navigateMonth}
              onClose={null}
            />
          </div>

          {/* ── Sidebar Mobile Bottom Sheet ── */}
          <div className={`bottom-sheet${showCal ? ' open' : ''}`}>
            <div className="sheet-handle" onClick={() => setShowCal(false)} />
            <SidebarContent
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              selected={selectedDate}
              setSelected={setSelectedDate}
              tasks={tasks}
              today={today}
              onNavigateMonth={navigateMonth}
              onClose={() => setShowCal(false)}
            />
          </div>
          {showCal && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
              onClick={() => setShowCal(false)}
            />
          )}

          {/* ── Main ── */}
          <div
            className="main-area"
            style={{ flex: 1, padding: '22px 26px', overflowY: 'auto', minWidth: 0 }}
          >
            {/* Date header */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 3,
                }}
              >
                <h1
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 38,
                    fontWeight: 700,
                    color: 'var(--text-bright)',
                    lineHeight: 1,
                  }}
                >
                  {d.getDate()} {MONTHS_GEN[d.getMonth()]}
                </h1>
                {rel && (
                  <span
                    style={{
                      padding: '3px 12px',
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 500,
                      background: rel === 'Сегодня' ? 'var(--accent-muted)' : 'rgba(255,255,255,0.04)',
                      color: rel === 'Сегодня' ? 'var(--accent)' : 'var(--text-dim)',
                      border: `1px solid ${rel === 'Сегодня' ? 'var(--accent-border)' : '#222'}`,
                    }}
                  >
                    {rel}
                  </span>
                )}
                {isPast && dayTasks.some((t) => !t.completed) && (
                  <span
                    style={{
                      padding: '3px 12px',
                      borderRadius: 20,
                      fontSize: 11.5,
                      background: 'var(--error-bg)',
                      color: 'var(--error)',
                      border: '1px solid rgba(255,112,112,0.2)',
                    }}
                  >
                    ⚠ Есть незавершённые
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dark)', textTransform: 'capitalize' }}>
                {DAYS_FULL[(d.getDay() + 6) % 7]}, {d.getFullYear()} г.
              </div>
            </div>

            {/* Week strip */}
            <div
              style={{ display: 'flex', gap: 5, marginBottom: 22, overflowX: 'auto', paddingBottom: 2 }}
            >
              {weekDays.map((ds) => {
                const dd = strToDate(ds)
                const isSel = ds === selectedDate
                const isT = ds === today
                const wTasks = tasks[ds] || []
                const wDone = wTasks.filter((t) => t.completed).length
                const wOverdue = ds < today && wTasks.length > 0 && wDone < wTasks.length
                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDate(ds)}
                    className="week-btn"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      padding: '9px 12px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      flexShrink: 0,
                      border: `1px solid ${isSel ? 'rgba(232,168,124,0.6)' : isT ? 'var(--accent-border)' : '#1e1e1e'}`,
                      background: isSel ? 'var(--accent-muted)' : isT ? 'rgba(232,168,124,0.04)' : 'transparent',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span
                      className="week-label"
                      style={{ fontSize: 9.5, color: 'var(--text-dark)', letterSpacing: 0.5, fontWeight: 700 }}
                    >
                      {DAYS_SHORT[(dd.getDay() + 6) % 7]}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: isSel ? 'var(--accent)' : isT ? 'var(--accent)' : wOverdue ? 'var(--error)' : 'var(--text-dim)',
                      }}
                    >
                      {dd.getDate()}
                    </span>
                    {wTasks.length > 0 ? (
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: wOverdue ? 'var(--error)' : wDone === wTasks.length ? 'var(--success)' : 'var(--accent)',
                        }}
                      />
                    ) : (
                      <div style={{ width: 5, height: 5 }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Toolbar */}
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
                    onClick={() => clearCompleted(selectedDate)}
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
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    border: '1px solid #242424',
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
                  onClick={() => {
                    setForm(EMPTY_FORM)
                    setEditing(null)
                    setModal(true)
                  }}
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

            {/* Task list with DND */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingBottom: 90 }}>
              {sortedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '56px 20px', opacity: 0.25 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, marginBottom: 5 }}>
                    {isPast ? 'День прошёл чисто' : 'Задач нет'}
                  </div>
                  <div style={{ fontSize: 12.5 }}>
                    {isPast
                      ? 'Нечего переносить — отличная работа'
                      : 'Нажми + или N чтобы добавить задачу'}
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sortedTasks} strategy={verticalListSortingStrategy}>
                    {sortedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isNew={task.id === newTaskId}
                        onToggle={() => toggleTask(selectedDate, task.id)}
                        onMove={(newDate) => moveTask(selectedDate, newDate, task.id)}
                        onEdit={() => {
                          setForm({
                            title: task.title,
                            note: task.note || '',
                            time: task.time || '',
                            priority: task.priority,
                            repeat: task.repeat || 'none',
                            emoji: task.emoji || '📌',
                          })
                          setEditing({ ...task, date: selectedDate })
                          setModal(true)
                        }}
                        onDelete={() => setConfirmDelete(task.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* FAB */}
            <button
              onClick={() => {
                setForm(EMPTY_FORM)
                setEditing(null)
                setModal(true)
              }}
              title="Добавить задачу (N)"
              className="fab-btn"
              style={{
                position: 'fixed',
                bottom: 26,
                right: 26,
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#0C0C0C',
                border: 'none',
                fontSize: 26,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 22px rgba(232,168,124,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
                fontWeight: 300,
                lineHeight: 1,
                zIndex: 80,
              }}
            >
              +
            </button>
          </div>
        </div>

        {modal && (
          <Modal
            editing={editing}
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            onClose={handleCloseModal}
            selectedDate={selectedDate}
          />
        )}
        {showAI && (
          <AISuggestPanel
            dateStr={selectedDate}
            existingTasks={dayTasks}
            onAdd={(s) => addTask(selectedDate, s)}
            onClose={() => setShowAI(false)}
          />
        )}
        {showStats && <Statistics tasks={tasks} onClose={() => setShowStats(false)} />}
        {confirmDelete && (
          <ConfirmModal
            title="Удалить задачу?"
            message="Это действие нельзя будет отменить."
            onConfirm={() => {
              deleteTask(selectedDate, confirmDelete)
              setConfirmDelete(null)
            }}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </div>
    </>
  )
}
