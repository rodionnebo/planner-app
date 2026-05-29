import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
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
import { WeekStrip } from './components/WeekStrip'
import { DayHeader } from './components/DayHeader'
import { Toolbar } from './components/Toolbar'
import { EMPTY_FORM, PRIORITY_ORDER } from './constants'
import { todayStr, addDays, parseQuickAdd } from './utils/date'
import { requestNotificationPermission, scheduleTaskNotifications } from './utils/notifications'

// Lazy components
const Modal = lazy(() => import('./components/Modal').then(m => ({ default: m.Modal })))
const AISuggestPanel = lazy(() => import('./components/AISuggestPanel').then(m => ({ default: m.AISuggestPanel })))
const Statistics = lazy(() => import('./components/Statistics').then(m => ({ default: m.Statistics })))
const ConfirmModal = lazy(() => import('./components/ConfirmModal').then(m => ({ default: m.ConfirmModal })))

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showCal, setShowCal] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('planner_theme') || 'dark')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem('planner_sidebar_collapsed') === 'true'
  )
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

  useEffect(() => {
    localStorage.setItem('planner_sidebar_collapsed', isSidebarCollapsed)
  }, [isSidebarCollapsed])

  // Notification permission
  useEffect(() => {
    requestNotificationPermission()
  }, [])

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
    syncing,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    moveTask,
    clearCompleted,
    getTasksForDate,
  } = useTasks(user)

  // Notification scheduling
  useEffect(() => {
    scheduleTaskNotifications(tasks)
  }, [tasks])

  const { selectedDate, setSelectedDate, calMonth, setCalMonth, navigateMonth } = useCalendar()

  const handleCloseModal = useCallback(() => {
    setModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }, [])

  const handleSignOut = async () => {
    if (window.confirm('Вы уверены, что хотите выйти?')) {
      await supabase.auth.signOut()
      setUser(null)
    }
  }

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
    return filteredTasks
  }, [filteredTasks, searchQuery])

  const total = dayTasks.length
  const done = dayTasks.filter((t) => t.completed).length

  // Confetti effect
  useEffect(() => {
    const lastDone = localStorage.getItem(`done_confetti_${selectedDate}`)
    if (total > 0 && done === total && lastDone !== 'true') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E8A87C', '#6DBF7E', '#7CA8E8'],
      })
      localStorage.setItem(`done_confetti_${selectedDate}`, 'true')
    }
  }, [done, total, selectedDate])

  const overdueCount = useMemo(() => {
    return Object.entries(tasks).reduce((acc, [date, list]) => {
      if (date < today) {
        return acc + list.filter((t) => !t.completed).length
      }
      return acc
    }, 0)
  }, [tasks, today])

  // Reset scroll on date change
  useEffect(() => {
    const mainArea = document.querySelector('.main-area')
    if (mainArea) mainArea.scrollTop = 0
  }, [selectedDate])

  const handleSubmit = useCallback(() => {
    if (!form.title.trim()) return

    const finalForm = editing ? form : { ...form, ...parseQuickAdd(form.title) }

    if (editing) {
      if (finalForm.date && finalForm.date !== editing.date) {
        moveTask(editing.date, finalForm.date, editing.id)
        editTask(finalForm.date, editing.id, finalForm)
      } else {
        editTask(editing.date, editing.id, finalForm)
      }
    } else {
      const targetDate = finalForm.date || selectedDate
      const id = addTask(targetDate, finalForm)
      setNewTaskId(id)
      setTimeout(() => setNewTaskId(null), 800)
    }
    handleCloseModal()
  }, [form, editing, selectedDate, editTask, addTask, moveTask, handleCloseModal])

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = sortedTasks.findIndex((t) => t.id === active.id)
      const newIndex = sortedTasks.findIndex((t) => t.id === over.id)
      const newList = arrayMove(sortedTasks, oldIndex, newIndex)

      const newTasks = { ...tasks }
      newTasks[selectedDate] = newList
      setTasks(newTasks)
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
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
              title={isSidebarCollapsed ? 'Развернуть сайдбар' : 'Свернуть сайдбар'}
            >
              {isSidebarCollapsed ? '»' : '«'}
            </button>
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
            {syncing && (
               <span
                 style={{ fontSize: 12, marginLeft: 8, opacity: 0.5, animation: 'spin 2s linear infinite' }}
                 title="Синхронизация..."
               >
                 ☁️
               </span>
            )}
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginLeft: 15,
                paddingLeft: 15,
                borderLeft: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--text-dim)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-light)',
                  borderRadius: 6,
                  color: 'var(--text-dim)',
                  fontSize: 11,
                  padding: '4px 8px',
                  cursor: 'pointer',
                }}
              >
                Выйти
              </button>
            </div>
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
          </div>
        </header>

        {/* ── Body ── */}
        <div className="layout" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* ── Sidebar Desktop ── */}
          <div
            className="sidebar-desktop"
            style={{
              width: isSidebarCollapsed ? 0 : 252,
              borderRight: isSidebarCollapsed ? 'none' : '1px solid var(--border)',
              background: 'var(--bg-surface)',
              flexShrink: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
            <DayHeader date={selectedDate} today={today} dayTasks={dayTasks} />

            <WeekStrip
               selectedDate={selectedDate}
               today={today}
               tasks={tasks}
               setSelectedDate={setSelectedDate}
            />

            <Toolbar
               total={total}
               done={done}
               onClearCompleted={() => clearCompleted(selectedDate)}
               setShowStats={setShowStats}
               setShowAI={setShowAI}
               onAddTask={() => {
                 setForm(EMPTY_FORM)
                 setEditing(null)
                 setModal(true)
               }}
            />

            {/* Task list with DND */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingBottom: 90 }}>
              {sortedTasks.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '56px 20px',
                    opacity: 0.6,
                    animation: 'taskIn 0.5s ease',
                  }}
                >
                  <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 24,
                      marginBottom: 8,
                      color: 'var(--text-bright)',
                    }}
                  >
                    {selectedDate < today ? 'День прошёл чисто' : 'Начни свой день'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-dim)', maxWidth: 300, margin: '0 auto' }}>
                    {selectedDate < today
                      ? 'Нечего переносить — отличная работа!'
                      : 'Нажми кнопку + внизу, чтобы добавить свою первую задачу.'}
                  </div>
                  {selectedDate >= today && (
                    <div style={{ marginTop: 24, fontSize: 24, animation: 'spin 4s linear infinite' }}>
                      ✦
                    </div>
                  )}
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

        <Suspense fallback={null}>
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
        </Suspense>
      </div>
    </>
  )
}
