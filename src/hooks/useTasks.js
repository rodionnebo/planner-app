import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { generateId } from '../utils/date'
import toast from 'react-hot-toast'

export function useTasks(user) {
  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)

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
    if (!user) {
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
        })
      })
      setTasks(grouped)
      setLoading(false)
    }

    loadTasks()
  }, [user])

  const saveToSupabase = useCallback(
    async (newTasks) => {
      if (!user || user.id === 'guest') return

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
      if (!user || user.id === 'guest' || ids.length === 0) return
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
      saveToSupabase(newTasks)
      if (idsToDelete.length > 0) {
        removeFromSupabase(idsToDelete)
      }
    },
    [saveToSupabase, removeFromSupabase]
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

  const clearCompleted = useCallback(
    (date) => {
      const newTasks = { ...tasks }
      if (newTasks[date]) {
        const idsToDelete = newTasks[date].filter((t) => t.completed).map((t) => t.id)
        newTasks[date] = newTasks[date].filter((t) => !t.completed)
        updateTasks(newTasks, idsToDelete)
      }
    },
    [tasks, updateTasks]
  )

  return {
    tasks,
    loading,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    clearCompleted,
  }
}
