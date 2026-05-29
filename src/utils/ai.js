const MOCK_SUGGESTIONS = [
  { title: 'Запланировать дела на неделю', emoji: '📅', time: '09:00', priority: 'medium' },
  { title: 'Заняться спортом (30 мин)', emoji: '💪', time: '18:00', priority: 'high' },
  { title: 'Почитать книгу', emoji: '📚', time: '21:00', priority: 'low' },
  { title: 'Выпить стакан воды', emoji: '💧', time: '08:00', priority: 'medium' },
  { title: 'Сделать перерыв и размяться', emoji: '🧘', time: '14:30', priority: 'medium' },
]

/**
 * Mock AI suggestions generator.
 * In a real app, this would call an LLM API.
 */
export async function AISuggestions(dateStr, existingTasks = []) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Basic logic to filter out already existing tasks by title
  const existingTitles = new Set(existingTasks.map(t => t.title.toLowerCase()))

  return MOCK_SUGGESTIONS.filter(s => !existingTitles.has(s.title.toLowerCase()))
}
