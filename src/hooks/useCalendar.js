import { useState, useCallback } from 'react'
import { strToDate, dateToStr } from '../utils/date'

export function useCalendar() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return dateToStr(d)
  })

  const d = strToDate(selectedDate)
  const [calMonth, setCalMonth] = useState({ y: d.getFullYear(), m: d.getMonth() })

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
