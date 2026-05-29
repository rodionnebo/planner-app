import { useMemo } from 'react'
import { addDays } from '../utils/date'

export function useWeekDays(selectedDate) {
  return useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(selectedDate, -3 + i))
  }, [selectedDate])
}
