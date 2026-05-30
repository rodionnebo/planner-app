let cachedToday = null
let lastUpdate = 0

export function todayStr() {
  const now = Date.now()
  // Cache for 10 seconds
  if (cachedToday && now - lastUpdate < 10000) {
    return cachedToday
  }
  cachedToday = new Date().toLocaleDateString('en-CA')
  lastUpdate = now
  return cachedToday
}

export function dateToStr(d) {
  return d.toLocaleDateString('en-CA')
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

export function parseQuickAdd(text) {
  let title = text
  let time = ''
  let priority = 'medium'

  // Parse time (e.g. 14:00 or 14-00)
  const timeMatch = title.match(/\b(\d{1,2}[:-]\d{2})\b/)
  if (timeMatch) {
    time = timeMatch[1].replace('-', ':')
    title = title.replace(timeMatch[0], '')
  }

  // Parse priority
  if (title.toLowerCase().includes('срочно') || title.toLowerCase().includes('дедлайн')) {
    priority = 'deadline'
    title = title.replace(/срочно|дедлайн/gi, '')
  } else if (title.toLowerCase().includes('важно') || title.toLowerCase().includes('высокий')) {
    priority = 'high'
    title = title.replace(/важно|высокий/gi, '')
  } else if (title.toLowerCase().includes('потом') || title.toLowerCase().includes('низкий')) {
    priority = 'low'
    title = title.replace(/потом|низкий/gi, '')
  }

  return {
    title: title.trim().replace(/\s\s+/g, ' '),
    time,
    priority,
    note: '',
    repeat: 'none',
  }
}
