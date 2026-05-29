/**
 * Exports all tasks to a JSON file.
 */
export function exportTasks(tasks) {
  const data = JSON.stringify(tasks, null, 2)
  downloadBlob(data, `planner-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json')
}

/**
 * Exports tasks to a CSV file.
 * @param {Object} tasks - The tasks object.
 */
export function exportToCSV(tasks) {
  const rows = [['Дата', 'Задача', 'Время', 'Приоритет', 'Выполнено', 'Заметка']]

  Object.entries(tasks).forEach(([date, list]) => {
    list.forEach(t => {
      rows.push([
        date,
        t.title,
        t.time || '',
        t.priority,
        t.completed ? 'Да' : 'Нет',
        t.note || ''
      ])
    })
  })

  const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  downloadBlob(csvContent, `planner-tasks-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function importTasks(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result)
        resolve(json)
      } catch {
        reject(new Error('Invalid JSON format'))
      }
    }
    reader.readAsText(file)
  })
}
