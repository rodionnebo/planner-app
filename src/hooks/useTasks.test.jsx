import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks } from './useTasks'
import { supabase } from '../supabaseClient'

vi.mock('../supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn(() => ({ in: vi.fn().mockResolvedValue({ error: null }) })),
      select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }))
    })),
  }
}))

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('does not call supabase for guest user', async () => {
    const guestUser = { id: 'guest', isGuest: true }
    const { result } = renderHook(() => useTasks(guestUser))

    await act(async () => {
      result.current.addTask('2026-05-29', { title: 'Guest Task' })
    })

    expect(supabase.from).not.toHaveBeenCalledWith('tasks')
  })

  it('calls upsert for authenticated user', async () => {
    const authUser = { id: 'real-user', email: 'test@test.com' }
    const { result } = renderHook(() => useTasks(authUser))

    // Trigger useEffect/loadTasks or wait
    await act(async () => {
        result.current.addTask('2026-05-29', { title: 'Auth Task' })
    })

    expect(supabase.from).toHaveBeenCalledWith('tasks')
  })
})
