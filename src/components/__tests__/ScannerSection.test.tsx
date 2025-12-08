import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ScannerSection } from '../ScannerSection'
import { useCamera } from '../../hooks/useCamera'
import { useUserRoles } from '../../hooks/useUserRoles'

// Mock the hooks
vi.mock('../../hooks/useCamera')
vi.mock('../../hooks/useUserRoles')
vi.mock('../../hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({
    canUseAI: true,
    canUseAdvanced: true,
    isPremium: true
  })
}))

const mockUseCamera = vi.mocked(useCamera)
const mockUseUserRoles = vi.mocked(useUserRoles)

describe('ScannerSection', () => {
  beforeEach(() => {
    mockUseCamera.mockReturnValue({
      stream: null,
      startCamera: vi.fn(),
      stopCamera: vi.fn(),
      captureImage: vi.fn(),
      isLoading: false,
      error: null,
      hasPermission: true
    })

    mockUseUserRoles.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      roles: ['user'],
      isAdmin: false,
      isPro: false,
      isPremium: false,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })
  })

  it('renders scanner interface', () => {
    render(<ScannerSection />)
    expect(screen.getByText(/scanner/i)).toBeInTheDocument()
  })

  it('shows camera permission request', () => {
    mockUseCamera.mockReturnValue({
      ...mockUseCamera(),
      hasPermission: false
    })

    render(<ScannerSection />)
    expect(screen.getByText(/camera permission/i)).toBeInTheDocument()
  })

  it('handles camera start', async () => {
    const mockStartCamera = vi.fn()
    mockUseCamera.mockReturnValue({
      ...mockUseCamera(),
      startCamera: mockStartCamera
    })

    render(<ScannerSection />)

    const startButton = screen.getByRole('button', { name: /start/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockStartCamera).toHaveBeenCalled()
    })
  })

  it('displays measurement results', () => {
    // Mock measurement data
    render(<ScannerSection />)

    // Should show measurement interface
    expect(screen.getByText(/measurement/i)).toBeInTheDocument()
  })

  it('handles premium features for free users', () => {
    mockUseUserRoles.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      roles: ['user'],
      isAdmin: false,
      isPro: false,
      isPremium: false,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    })

    render(<ScannerSection />)

    // Should show upgrade prompts for premium features
    expect(screen.getByText(/upgrade/i)).toBeInTheDocument()
  })
})