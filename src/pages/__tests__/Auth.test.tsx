import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Auth from '../Auth'
import { AuthProvider } from '@/contexts/AuthContext'

// Mock the auth context
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: mockSignIn,
    signUp: mockSignUp,
    signOut: vi.fn(),
    loading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn()
    }
  }
}))

const renderAuth = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Auth />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form by default', () => {
    renderAuth()

    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('switches to signup mode', async () => {
    renderAuth()

    const signupLink = screen.getByText(/create account/i)
    fireEvent.click(signupLink)

    await waitFor(() => {
      expect(screen.getByText(/sign up/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    renderAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    renderAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('calls signIn with correct credentials', async () => {
    renderAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('toggles remember me checkbox', () => {
    renderAuth()

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i)
    expect(rememberMeCheckbox).not.toBeChecked()

    fireEvent.click(rememberMeCheckbox)
    expect(rememberMeCheckbox).toBeChecked()
  })

  it('switches to forgot password mode', async () => {
    renderAuth()

    const forgotLink = screen.getByText(/forgot password/i)
    fireEvent.click(forgotLink)

    await waitFor(() => {
      expect(screen.getByText(/reset password/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
    })
  })

  it('loads remembered email on mount', () => {
    localStorage.setItem('remembered_email', 'remembered@example.com')
    renderAuth()

    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveValue('remembered@example.com')
  })

  it('shows loading state during authentication', async () => {
    // Mock a delayed response
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderAuth()

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent(/signing in/i)
  })
})
