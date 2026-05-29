import { useState, useCallback, useEffect } from 'react'
import { todayStr, strToDate } from '../utils/date'

export function useCalendar() {
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date()
    return { y: n.getFullYear(), m: n.getMonth() }
  })

  useEffect(() => {
    const d = strToDate(selectedDate)
    setCalMonth({ y: d.getFullYear(), m: d.getMonth() })
  }, [selectedDate])

  const navigateMonth = useCallback((delta) => {
    setCalMonth((prev) => {
      let nm = prev.m + delta
      let ny = prev.y
      if (nm < 0) {
        nm = 11
        ny--
      } else if (nm > 11) {
        nm = 0
        ny++
      }
      return { y: ny, m: nm }
    })
  }, [])

  return {
    selectedDate,
    setSelectedDate,
    calMonth,
    setCalMonth,
    navigateMonth,
  }
}
