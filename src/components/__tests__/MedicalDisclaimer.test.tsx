import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MedicalDisclaimer } from '../MedicalDisclaimer'

// Mock the useDisclaimer hook
const mockUseDisclaimer = vi.fn()
vi.mock('../MedicalDisclaimer', async () => {
  const actual = await vi.importActual('../MedicalDisclaimer')
  return {
    ...actual,
    useDisclaimer: () => ({
      hasAccepted: false,
      acceptDisclaimer: mockUseDisclaimer,
      isLoading: false
    })
  }
})

describe('MedicalDisclaimer', () => {
  it('renders disclaimer text', () => {
    render(<MedicalDisclaimer />)
    expect(screen.getByText(/medical disclaimer/i)).toBeInTheDocument()
  })

  it('shows accept button when not accepted', () => {
    render(<MedicalDisclaimer />)
    const acceptButton = screen.getByRole('button', { name: /accept/i })
    expect(acceptButton).toBeInTheDocument()
  })

  it('calls acceptDisclaimer when button is clicked', () => {
    render(<MedicalDisclaimer />)
    const acceptButton = screen.getByRole('button', { name: /accept/i })
    fireEvent.click(acceptButton)
    expect(mockUseDisclaimer).toHaveBeenCalled()
  })

  it('renders important medical information', () => {
    render(<MedicalDisclaimer />)
    expect(screen.getByText(/not a substitute for professional medical advice/i)).toBeInTheDocument()
  })
})
