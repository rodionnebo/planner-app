import { describe, it, expect } from 'vitest'
import { addDays, relLabel, todayStr, generateId } from './date'

describe('Date Utils', () => {
  it('should add days correctly', () => {
    expect(addDays('2023-01-01', 1)).toBe('2023-01-02')
    expect(addDays('2023-01-31', 1)).toBe('2023-02-01')
  })

  it('should return correct relative labels', () => {
    const today = todayStr()
    expect(relLabel(today)).toBe('Сегодня')
    expect(relLabel(addDays(today, 1))).toBe('Завтра')
    expect(relLabel(addDays(today, -1))).toBe('Вчера')
  })

  it('should generate a valid looking ID', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(5)
  })
})
