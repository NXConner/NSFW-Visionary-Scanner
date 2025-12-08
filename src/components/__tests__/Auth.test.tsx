import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Auth } from '../Auth'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock Supabase client
vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    }
  }
}))

describe('Auth', () => {
  it('renders login form by default', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('toggles between login and signup', () => {
    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    const toggleButton = screen.getByRole('button', { name: /sign up/i })
    fireEvent.click(toggleButton)

    expect(screen.getByText(/create account/i)).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null })
    const { supabase } = await import('../../integrations/supabase/client')
    supabase.auth.signInWithPassword = mockSignIn

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  it('displays error messages', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    })
    const { supabase } = await import('../../integrations/supabase/client')
    supabase.auth.signInWithPassword = mockSignIn

    render(
      <AuthProvider>
        <Auth />
      </AuthProvider>
    )

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})
