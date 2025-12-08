/**
 * Expert Utilities
 * Helper functions for expert content operations
 */

import { type ExpertProfile, type ExpertConsultation } from './expertContent'

/**
 * Calculate consultation price
 */
export function calculateConsultationPrice(
  expert: ExpertProfile,
  type: 'individual' | 'group',
  durationMinutes: number
): number {
  const rate = type === 'individual'
    ? expert.consultation_rate_per_hour
    : expert.group_workshop_rate_per_person

  return (rate / 60) * durationMinutes
}

/**
 * Format consultation duration
 */
export function formatConsultationDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  return `${hours}h ${mins}m`
}

/**
 * Get expert availability status
 */
export function getExpertAvailability(expert: ExpertProfile): 'available' | 'busy' | 'unavailable' {
  if (!expert.is_available) return 'unavailable'
  if (!expert.is_verified) return 'unavailable'
  
  // Check schedule (simplified)
  const schedule = expert.availability_schedule as any
  if (schedule && typeof schedule === 'object') {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const hour = now.getHours()
    
    // Basic availability check
    if (schedule[dayOfWeek] && schedule[dayOfWeek].includes(hour)) {
      return 'available'
    }
  }
  
  return 'available' // Default to available if no schedule
}

/**
 * Format expert rating
 */
export function formatExpertRating(rating: number, reviewCount: number): string {
  return `${rating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`
}

/**
 * Get consultation status color
 */
export function getConsultationStatusColor(status: ExpertConsultation['status']): string {
  switch (status) {
    case 'pending':
      return 'yellow'
    case 'confirmed':
      return 'blue'
    case 'in_progress':
      return 'purple'
    case 'completed':
      return 'green'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

/**
 * Check if consultation can be cancelled
 */
export function canCancelConsultation(consultation: ExpertConsultation): boolean {
  const scheduledAt = new Date(consultation.scheduled_at)
  const now = new Date()
  const hoursUntil = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  return consultation.status === 'pending' || 
         consultation.status === 'confirmed' && hoursUntil > 24
}

/**
 * Get consultation time remaining
 */
export function getConsultationTimeRemaining(consultation: ExpertConsultation): string {
  const scheduledAt = new Date(consultation.scheduled_at)
  const now = new Date()
  const diff = scheduledAt.getTime() - now.getTime()
  
  if (diff < 0) {
    return 'Past'
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

