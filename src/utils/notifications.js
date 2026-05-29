import { strToDate, todayStr } from './date'

export function requestNotificationPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

const scheduledNotifications = new Set()

export function scheduleTaskNotifications(tasks) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const today = todayStr()
  const todayTasks = tasks[today] || []

  todayTasks.forEach((task) => {
    if (!task.time || task.completed) return

    const [hours, minutes] = task.time.split(':').map(Number)
    const taskDate = strToDate(today)
    taskDate.setHours(hours, minutes, 0, 0)

    const now = new Date()
    const diffMs = taskDate - now
    const fifteenMinutesInMs = 15 * 60 * 1000

    // Schedule only if the task is in the future and less than 24 hours away
    if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
      const notificationTime = diffMs - fifteenMinutesInMs
      const notificationId = `notify-${task.id}-${task.time}`

      if (notificationTime > 0 && !scheduledNotifications.has(notificationId)) {
        setTimeout(() => {
          new Notification('Напоминание о задаче', {
            body: `${task.emoji || '📌'} ${task.title} начнется через 15 минут (${task.time})`,
            icon: 'https://cdn-icons-png.flaticon.com/512/906/906334.png',
          })
          scheduledNotifications.delete(notificationId)
        }, notificationTime)

        scheduledNotifications.add(notificationId)
      }
    }
  })
}
