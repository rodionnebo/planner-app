import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { generateId, strToDate, dateToStr, addDays } from '../utils/date'
import toast from 'react-hot-toast'

export function useTasks(user) {
  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const undoTimeoutRef = useRef(null)

  // Load from localStorage initially
  useEffect(() => {
    try {
      const saved = localStorage.getItem('planner_v2')
      if (saved) setTasks(JSON.parse(saved))
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e)
    }
  }, [])

  // Sync with Supabase
  useEffect(() => {
    if (!user || user.isGuest || !user.id) {
      setLoading(false)
      return
    }

    async function loadTasks() {
      setLoading(true)
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id)

      if (error) {
        toast.error('Ошибка загрузки задач')
        setLoading(false)
        return
      }

      if (data.length === 0) {
        const localData = localStorage.getItem('planner_v2')
        if (localData) {
          const parsed = JSON.parse(localData)
          const localTaskCount = Object.values(parsed).flat().length
          if (localTaskCount > 0) {
            const recover = window.confirm(
              `В облаке нет данных, но найдено ${localTaskCount} задач локально. Восстановить их в облако?`
            )
            if (recover) {
              setTasks(parsed)
              setLoading(false)
              return
            }
          }
        }
      }

      const grouped = {}
      data.forEach((row) => {
        if (!grouped[row.date_str]) grouped[row.date_str] = []
        grouped[row.date_str].push({
          id: row.task_id,
          title: row.title,
          note: row.note,
          time: row.time,
          priority: row.priority,
          completed: row.completed,
          createdAt: row.created_at,
          repeat: row.repeat || 'none',
        })
      })

      try {
        localStorage.setItem(
          'planner_backup',
          JSON.stringify({ tasks: grouped, timestamp: new Date().toISOString() })
        )
      } catch (e) {
        console.error('Backup failed', e)
      }

      setTasks(grouped)
      setLoading(false)
    }

    loadTasks()
  }, [user])

  const saveToSupabase = useCallback(
    async (newTasks) => {
      if (!user || user.isGuest || !user.id || user.id === 'guest') return

      try {
        const allRows = []
        Object.entries(newTasks).forEach(([date, list]) => {
          list.forEach((t) => {
            allRows.push({
              user_id: user.id,
              task_id: t.id,
              date_str: date,
              title: t.title,
              note: t.note || '',
              time: t.time || '',
              priority: t.priority,
              completed: t.completed,
              created_at: t.createdAt || new Date().toISOString(),
              repeat: t.repeat || 'none',
            })
          })
        })

        if (allRows.length > 0) {
          const { error } = await supabase.from('tasks').upsert(allRows, { onConflict: 'task_id' })
          if (error) throw error
        }
      } catch (e) {
        console.error('Sync failed', e)
        toast.error('Ошибка синхронизации с облаком')
      }
    },
    [user]
  )

  const removeFromSupabase = useCallback(
    async (ids) => {
      if (!user || user.isGuest || !user.id || user.id === 'guest' || ids.length === 0) return
      try {
        const { error } = await supabase.from('tasks').delete().in('task_id', ids)
        if (error) throw error
      } catch (e) {
        console.error('Delete failed', e)
        toast.error('Ошибка удаления из облака')
      }
    },
    [user]
  )

  const updateTasks = useCallback(
    (newTasks, idsToDelete = []) => {
      setTasks(newTasks)
      try {
        localStorage.setItem('planner_v2', JSON.stringify(newTasks))
      } catch (e) {
        console.error('Failed to save to localStorage', e)
      }

      if (user && !user.isGuest && user.id && user.id !== 'guest') {
        saveToSupabase(newTasks)
        if (idsToDelete.length > 0) {
          removeFromSupabase(idsToDelete)
        }
      }
    },
    [user, saveToSupabase, removeFromSupabase]
  )

  const addTask = useCallback(
    (date, taskData) => {
      const newId = generateId()
      const newTask = {
        id: newId,
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      const newTasks = { ...tasks }
      newTasks[date] = [...(newTasks[date] || []), newTask]
      updateTasks(newTasks)
      return newId
    },
    [tasks, updateTasks]
  )

  const editTask = useCallback(
    (date, id, taskData) => {
      const newTasks = { ...tasks }
      if (newTasks[date]) {
        newTasks[date] = newTasks[date].map((t) => (t.id === id ? { ...t, ...taskData } : t))
        updateTasks(newTasks)
      }
    },
    [tasks, updateTasks]
  )

  const deleteTask = useCallback(
    (date, id) => {
      const newTasks = { ...tasks }
      if (newTasks[date]) {
        newTasks[date] = newTasks[date].filter((t) => t.id !== id)
        updateTasks(newTasks, [id])
      }
    },
    [tasks, updateTasks]
  )

  const toggleTask = useCallback(
    (date, id) => {
      const newTasks = { ...tasks }
      if (newTasks[date]) {
        newTasks[date] = newTasks[date].map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
        updateTasks(newTasks)
      }
    },
    [tasks, updateTasks]
  )

  const moveTask = useCallback(
    (oldDate, newDate, id) => {
      const newTasks = { ...tasks }
      const task = newTasks[oldDate]?.find((t) => t.id === id)
      if (task) {
        newTasks[oldDate] = newTasks[oldDate].filter((t) => t.id !== id)
        newTasks[newDate] = [...(newTasks[newDate] || []), { ...task }]
        updateTasks(newTasks)
      }
    },
    [tasks, updateTasks]
  )

  const clearCompleted = useCallback(
    (date) => {
      const oldTasks = { ...tasks }
      const newTasks = { ...tasks }
      if (newTasks[date]) {
        const completedTasks = newTasks[date].filter((t) => t.completed)
        const idsToDelete = completedTasks.map((t) => t.id)

        if (idsToDelete.length === 0) return

        newTasks[date] = newTasks[date].filter((t) => !t.completed)

        setTasks(newTasks)

        const handleUndo = () => {
          if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
            undoTimeoutRef.current = null
          }
          setTasks(oldTasks)
          toast.success('Удаление отменено')
        }

        toast(
          (t) => (
            <span>
              Удалено задач: {idsToDelete.length}{' '}
              <button
                onClick={() => {
                  handleUndo()
                  toast.dismiss(t.id)
                }}
                style={{
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: 'none',
                  borderRadius: 4,
                  padding: '2px 8px',
                  marginLeft: 10,
                  cursor: 'pointer',
                }}
              >
                Отменить
              </button>
            </span>
          ),
          { duration: 5000 }
        )

        undoTimeoutRef.current = setTimeout(() => {
          updateTasks(newTasks, idsToDelete)
          undoTimeoutRef.current = null
        }, 5000)
      }
    },
    [tasks, updateTasks]
  )

  // Recurring tasks generator
  const getTasksForDate = useCallback(
    (dateStr) => {
      const dayTasks = tasks[dateStr] || []
      const recurringTasks = []

      // This is a simple implementation of recurring tasks
      // In a real app, you would want to calculate this more efficiently
      Object.entries(tasks).forEach(([d, list]) => {
        if (d >= dateStr) return // Only check past tasks for recurrence
        list.forEach((t) => {
          if (t.repeat === 'none') return

          const taskDate = strToDate(d)
          const targetDate = strToDate(dateStr)
          const diffDays = Math.floor((targetDate - taskDate) / (1000 * 60 * 60 * 24))

          if (diffDays <= 0) return

          let isMatch = false
          if (t.repeat === 'daily') isMatch = true
          if (t.repeat === 'weekly' && diffDays % 7 === 0) isMatch = true

          if (isMatch) {
            // Check if this instance already exists or is completed on target date
            const alreadyExists = dayTasks.some((dt) => dt.title === t.title)
            if (!alreadyExists) {
              recurringTasks.push({
                ...t,
                id: `rec-${t.id}-${dateStr}`,
                isRecurringInstance: true,
                originalId: t.id,
              })
            }
          }
        })
      })

      return [...dayTasks, ...recurringTasks]
    },
    [tasks]
  )

  return {
    setTasks,
    tasks,
    loading,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    moveTask,
    clearCompleted,
    getTasksForDate,
  }
}
