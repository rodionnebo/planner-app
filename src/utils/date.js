export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function dateToStr(d) {
  return d.toISOString().split('T')[0]
}

export function strToDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function addDays(s, n) {
  const d = strToDate(s)
  d.setDate(d.getDate() + n)
  return dateToStr(d)
}

export function getFirstDayMon(y, m) {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export function getDaysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate()
}

export function relLabel(s) {
  const t = todayStr()
  if (s === t) return 'Сегодня'
  if (s === addDays(t, 1)) return 'Завтра'
  if (s === addDays(t, -1)) return 'Вчера'
  return null
}
