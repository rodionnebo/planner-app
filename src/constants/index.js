export const PRIORITY = {
  deadline: {
    label: 'Дедлайн',
    color: 'var(--priority-deadline)',
    bg: 'rgba(255,112,112,0.12)',
    icon: '🔥',
  },
  high: {
    label: 'Важное',
    color: 'var(--priority-high)',
    bg: 'rgba(232,168,124,0.13)',
    icon: '⚡',
  },
  medium: {
    label: 'Обычное',
    color: 'var(--priority-medium)',
    bg: 'rgba(124,168,232,0.12)',
    icon: '📌',
  },
  low: {
    label: 'Потом',
    color: 'var(--priority-low)',
    bg: 'rgba(140,140,140,0.10)',
    icon: '🌱',
  },
}

export const PRIORITY_ORDER = { deadline: 0, high: 1, medium: 2, low: 3 }

export const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
export const MONTHS_GEN = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]
export const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const DAYS_FULL = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
]

export const REPEAT_OPTIONS = [
  { value: 'none', label: 'Не повторять' },
  { value: 'daily', label: 'Каждый день' },
  { value: 'weekly', label: 'Каждую неделю' },
]

export const TASK_EMOJIS = ['📌', '✨', '🍎', '💻', '📚', '🏃', '💊', '🏠', '🧹', '🎨', '🛠️', '🛒']

export const EMPTY_FORM = {
  title: '',
  note: '',
  time: '',
  date: '',
  priority: 'medium',
  repeat: 'none',
  emoji: '📌',
}
