import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { generateId, strToDate } from '../utils/date'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'planner_v2'

export function useTasks(user) {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return {}
      const parsed = JSON.parse(saved)
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Invalid format')
      return parsed
    } catch (err) {
      console.error('Failed to load tasks from localStorage', err)
      return {}
    }
  })

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncQueue, setSyncQueue] = useState([])
  const undoTimeoutRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) JSON.parse(saved)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      toast.error('Локальные данные были повреждены и сброшены')
    }
  }, [])

  const syncRows = useCallback(
    async (rows) => {
      if (!user || user.isGuest || !user.id || user.id === 'guest' || rows.length === 0) return
      setSyncing(true)
      try {
        const allRows = rows.map(t => ({
          user_id: user.id,
          task_id: t.id,
          date_str: t.date_str,
          title: t.title,
          note: t.note || '',
          time: t.time || '',
          priority: t.priority,
          completed: t.completed,
          created_at: t.createdAt || new Date().toISOString(),
          repeat: t.repeat || 'none',
        }))

        const { error } = await supabase.from('tasks').upsert(allRows, { onConflict: 'task_id' })
        if (error) throw error

        const syncedIds = new Set(rows.map(r => r.id))
        setSyncQueue(prev => prev.filter(r => !syncedIds.has(r.id)))
      } catch (err) {
        console.error('Sync failed', err)
        setSyncQueue(prev => {
          const newQueue = [...prev]
          rows.forEach(row => {
            if (!newQueue.find(q => q.id === row.id)) newQueue.push(row)
          })
          return newQueue
        })
        toast.error('Ошибка синхронизации. Попробуем позже.')
      } finally {
        setSyncing(false)
      }
    },
    [user]
  )

  const removeFromSupabase = useCallback(
    async (ids) => {
      if (!user || user.isGuest || !user.id || user.id === 'guest' || ids.length === 0) return
      setSyncing(true)
      try {
        const { error } = await supabase.from('tasks').delete().in('task_id', ids)
        if (error) throw error
      } catch (err) {
        console.error('Delete failed', err)
        toast.error('Не удалось удалить из облака')
      } finally {
        setSyncing(false)
      }
    },
    [user]
  )

  const updateLocalAndCloud = useCallback(
    (newTasks, rowsToSync = [], idsToDelete = []) => {
      setTasks(newTasks)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
      } catch (err) {
        console.error('Failed to save to localStorage', err)
        if (err.name === 'QuotaExceededError') {
          toast.error('Память переполнена. Не удалось сохранить локально.')
        }
      }

      if (rowsToSync.length > 0) syncRows(rowsToSync)
      if (idsToDelete.length > 0) removeFromSupabase(idsToDelete)
    },
    [syncRows, removeFromSupabase]
  )

  useEffect(() => {
    const handleOnline = () => {
      if (syncQueue.length > 0) {
        toast.success('Соединение восстановлено. Синхронизирую...')
        syncRows(syncQueue)
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncQueue, syncRows])

  useEffect(() => {
    let isMounted = true

    async function loadTasks() {
      if (!user || user.isGuest || !user.id || user.id === 'guest') {
        if (isMounted) setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id)

        if (!isMounted) return

        if (error) throw error

        if (data.length === 0) {
          const localData = localStorage.getItem(STORAGE_KEY)
          if (localData) {
            const parsed = JSON.parse(localData)
            const localTaskCount = Object.values(parsed).flat().length
            if (localTaskCount > 0) {
              const recover = window.confirm(
                `В облаке нет данных, но найдено ${localTaskCount} задач локально. Восстановить их в облако?`
              )
              if (recover) {
                setTasks(parsed)
                syncRows(Object.entries(parsed).flatMap(([date, list]) =>
                  list.map(t => ({ ...t, date_str: date }))
                ))
                setLoading(false)
                return
              }
            }
          }
        }

        const grouped = {}
        data.forEach((row) => {
          if (!row.task_id || !row.title || !row.date_str) return
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

        localStorage.setItem('planner_backup', JSON.stringify({ tasks: grouped, ts: Date.now() }))
        setTasks(grouped)
      } catch (err) {
        console.error('Cloud load failed', err)
        toast('Работаем в офлайне (облако недоступно)', { icon: '📴' })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadTasks()
    return () => { isMounted = false }
  }, [user, syncRows])

  const getTasksForDate = useCallback(
    (dateStr) => {
      const dayTasks = tasks[dateStr] || []
      const recurringTasks = []

      Object.entries(tasks).forEach(([d, list]) => {
        if (d >= dateStr) return
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

  const addTask = useCallback(
    (date, taskData) => {
      const newId = generateId()
      const newTask = {
        id: newId,
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
      }

      setTasks(prev => {
        const next = { ...prev, [date]: [...(prev[date] || []), newTask] }
        updateLocalAndCloud(next, [{ ...newTask, date_str: date }])
        return next
      })
      return newId
    },
    [updateLocalAndCloud]
  )

  const editTask = useCallback(
    (date, id, taskData) => {
      setTasks(prev => {
        const idStr = id.toString()
        const next = { ...prev }

        if (idStr.startsWith('rec-')) {
          const virtualTasks = getTasksForDate(date)
          const vTask = virtualTasks.find((t) => t.id === id)
          if (vTask) {
            const newTask = {
              ...vTask,
              ...taskData,
              id: generateId(),
              isRecurringInstance: false,
              originalId: undefined,
            }
            next[date] = [...(next[date] || []), newTask]
            updateLocalAndCloud(next, [{ ...newTask, date_str: date }])
            return next
          }
        }

        if (next[date]) {
          let updatedTask = null
          next[date] = next[date].map((t) => {
            if (t.id === id) {
              updatedTask = { ...t, ...taskData }
              return updatedTask
            }
            return t
          })
          if (updatedTask) {
            updateLocalAndCloud(next, [{ ...updatedTask, date_str: date }])
          }
        }
        return next
      })
    },
    [getTasksForDate, updateLocalAndCloud]
  )

  const deleteTask = useCallback(
    (date, id) => {
      setTasks(prev => {
        const next = { ...prev }
        if (next[date]) {
          next[date] = next[date].filter((t) => t.id !== id)
          updateLocalAndCloud(next, [], [id])
        }
        return next
      })
    },
    [updateLocalAndCloud]
  )

  const toggleTask = useCallback(
    (date, id) => {
      setTasks(prev => {
        const idStr = id.toString()
        const next = { ...prev }

        if (idStr.startsWith('rec-')) {
          const virtualTasks = getTasksForDate(date)
          const vTask = virtualTasks.find((t) => t.id === id)
          if (vTask) {
            const newTask = {
              ...vTask,
              id: generateId(),
              completed: !vTask.completed,
              isRecurringInstance: false,
              originalId: undefined,
            }
            next[date] = [...(next[date] || []), newTask]
            updateLocalAndCloud(next, [{ ...newTask, date_str: date }])
            return next
          }
        }

        if (next[date]) {
          let updatedTask = null
          next[date] = next[date].map((t) => {
            if (t.id === id) {
              updatedTask = { ...t, completed: !t.completed }
              return updatedTask
            }
            return t
          })
          if (updatedTask) {
            updateLocalAndCloud(next, [{ ...updatedTask, date_str: date }])
          }
        }
        return next
      })
    },
    [getTasksForDate, updateLocalAndCloud]
  )

  const moveTask = useCallback(
    (oldDate, newDate, id) => {
      setTasks(prev => {
        const idStr = id.toString()
        const next = { ...prev }

        if (idStr.startsWith('rec-')) {
          const virtualTasks = getTasksForDate(oldDate)
          const vTask = virtualTasks.find((t) => t.id === id)
          if (vTask) {
            const newTask = {
              ...vTask,
              id: generateId(),
              isRecurringInstance: false,
              originalId: undefined,
            }
            next[newDate] = [...(next[newDate] || []), newTask]
            updateLocalAndCloud(next, [{ ...newTask, date_str: newDate }])
            return next
          }
        }

        const task = next[oldDate]?.find((t) => t.id === id)
        if (task) {
          next[oldDate] = next[oldDate].filter((t) => t.id !== id)
          const updatedTask = { ...task }
          next[newDate] = [...(next[newDate] || []), updatedTask]
          updateLocalAndCloud(next, [{ ...updatedTask, date_str: newDate }])
        }
        return next
      })
    },
    [getTasksForDate, updateLocalAndCloud]
  )

  const clearCompleted = useCallback(
    (date) => {
      setTasks(prev => {
        const next = { ...prev }
        if (next[date]) {
          const completedTasks = next[date].filter((t) => t.completed)
          const idsToDelete = completedTasks.map((t) => t.id)

          if (idsToDelete.length === 0) return prev

          next[date] = next[date].filter((t) => !t.completed)

          const handleUndo = () => {
            if (undoTimeoutRef.current) {
              clearTimeout(undoTimeoutRef.current)
              undoTimeoutRef.current = null
            }
            setTasks(prev)
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
            updateLocalAndCloud(next, [], idsToDelete)
            undoTimeoutRef.current = null
          }, 5000)
        }
        return next
      })
    },
    [updateLocalAndCloud]
  )

  return {
    setTasks,
    tasks,
    loading,
    syncing,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    moveTask,
    clearCompleted,
    getTasksForDate,
  }
}
