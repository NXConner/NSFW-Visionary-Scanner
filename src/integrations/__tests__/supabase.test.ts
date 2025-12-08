import { describe, it, expect, vi, beforeEach } from 'vitest'
import { supabase } from '../supabase/client'

// Mock fetch globally
global.fetch = vi.fn()

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be configured with correct URL', () => {
    expect(supabase.supabaseUrl).toBeDefined()
    expect(supabase.supabaseUrl).toContain('supabase.co')
  })

  it('should have auth methods available', () => {
    expect(supabase.auth).toBeDefined()
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
    expect(typeof supabase.auth.signUp).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
  })

  it('should have database methods available', () => {
    expect(supabase.from).toBeDefined()
    expect(typeof supabase.from).toBe('function')
  })

  it('should handle auth state changes', async () => {
    const mockCallback = vi.fn()
    const mockUnsubscribe = vi.fn()

    // Mock the onAuthStateChange method
    supabase.auth.onAuthStateChange = vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    const { data } = supabase.auth.onAuthStateChange(mockCallback)

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
    expect(data.subscription.unsubscribe).toBe(mockUnsubscribe)
  })
})

describe('Supabase Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should query profiles table', async () => {
    const mockResponse = {
      data: [{ id: '1', email: 'test@example.com' }],
      error: null
    }

    // Mock the from method chain
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue(mockResponse)
    })

    supabase.from = vi.fn().mockReturnValue({
      select: mockSelect
    })

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '1')

    expect(data).toEqual(mockResponse.data)
    expect(error).toBeNull()
  })

  it('should handle database errors', async () => {
    const mockError = { message: 'Database error' }

    supabase.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: mockError })
      })
    })

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '1')

    expect(data).toBeNull()
    expect(error).toEqual(mockError)
  })

  it('should insert health diary entries', async () => {
    const newEntry = {
      user_id: 'user-1',
      entry_date: '2024-01-01',
      notes: 'Test entry'
    }

    const mockResponse = {
      data: [{ id: 'entry-1', ...newEntry }],
      error: null
    }

    supabase.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue(mockResponse)
    })

    const { data, error } = await supabase
      .from('health_diary')
      .insert(newEntry)

    expect(data).toEqual(mockResponse.data)
    expect(error).toBeNull()
  })
})