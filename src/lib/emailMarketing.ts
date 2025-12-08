/**
 * Email Marketing System
 * Handles email campaigns, automation, segmentation, and analytics
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  content: string
  segment: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused'
  scheduled_at: string | null
  sent_at: string | null
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  category: 'welcome' | 'onboarding' | 'engagement' | 'retention' | 'promotional' | 'transactional'
  variables: string[]
  created_at: string
}

export interface EmailSegment {
  id: string
  name: string
  criteria: Record<string, any>
  user_count: number
  created_at: string
}

/**
 * Initialize email service (SendGrid/Mailchimp)
 */
export async function initializeEmailService(): Promise<boolean> {
  try {
    // Check if email service is configured
    const emailApiKey = import.meta.env.VITE_EMAIL_SERVICE_API_KEY
    if (!emailApiKey) {
      logger.warn('Email service API key not configured')
      return false
    }

    // Test connection
    const { error } = await supabase.functions.invoke('test-email-service', {
      body: { test: true }
    })

    if (error) {
      logger.error('Email service connection failed:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error initializing email service:', error)
    return false
  }
}

/**
 * Send email via service
 */
export async function sendEmail(
  to: string,
  subject: string,
  content: string,
  templateId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        content,
        template_id: templateId
      }
    })

    if (error) {
      logger.error('Error sending email:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in sendEmail:', error)
    return false
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userEmail: string, userName?: string): Promise<boolean> {
  const subject = 'Welcome to our Health Tracking App!'
  const content = `
    <h1>Welcome${userName ? `, ${userName}` : ''}!</h1>
    <p>Thank you for joining our health tracking community.</p>
    <p>Get started by:</p>
    <ul>
      <li>Completing your first scan</li>
      <li>Setting up your health diary</li>
      <li>Exploring our education center</li>
    </ul>
    <p>If you have any questions, feel free to reach out!</p>
  `

  return await sendEmail(userEmail, subject, content, 'welcome')
}

/**
 * Send onboarding email sequence
 */
export async function sendOnboardingEmail(day: number, userEmail: string): Promise<boolean> {
  const templates = {
    1: {
      subject: 'Day 1: Getting Started',
      content: 'Welcome! Here\'s how to get started...'
    },
    3: {
      subject: 'Day 3: Explore Features',
      content: 'Discover our key features...'
    },
    7: {
      subject: 'Day 7: Unlock Premium',
      content: 'Ready to unlock premium features?'
    }
  }

  const template = templates[day as keyof typeof templates]
  if (!template) return false

  return await sendEmail(userEmail, template.subject, template.content, `onboarding-day-${day}`)
}

/**
 * Send re-engagement email
 */
export async function sendReEngagementEmail(userEmail: string, daysInactive: number): Promise<boolean> {
  const subject = `We miss you! It's been ${daysInactive} days`
  const content = `
    <h1>We miss you!</h1>
    <p>It's been ${daysInactive} days since your last activity.</p>
    <p>Come back and continue your health journey!</p>
    <a href="${window.location.origin}">Return to App</a>
  `

  return await sendEmail(userEmail, subject, content, 're-engagement')
}

/**
 * Send upgrade prompt email
 */
export async function sendUpgradeEmail(
  userEmail: string,
  currentTier: string,
  targetTier: string
): Promise<boolean> {
  const subject = `Unlock ${targetTier} Features`
  const content = `
    <h1>Unlock ${targetTier} Features</h1>
    <p>Upgrade from ${currentTier} to ${targetTier} and get access to:</p>
    <ul>
      <li>Advanced features</li>
      <li>Premium content</li>
      <li>Priority support</li>
    </ul>
    <a href="${window.location.origin}/pricing">Upgrade Now</a>
  `

  return await sendEmail(userEmail, subject, content, 'upgrade')
}

/**
 * Get email analytics
 */
export async function getEmailAnalytics(): Promise<{
  total_sent: number
  total_opened: number
  total_clicked: number
  open_rate: number
  click_rate: number
} | null> {
  try {
    const { data, error } = await supabase
      .from('email_analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      logger.error('Error fetching email analytics:', error)
      return null
    }

    return {
      total_sent: data?.total_sent || 0,
      total_opened: data?.total_opened || 0,
      total_clicked: data?.total_clicked || 0,
      open_rate: data?.total_sent > 0 ? (data.total_opened / data.total_sent) * 100 : 0,
      click_rate: data?.total_sent > 0 ? (data.total_clicked / data.total_sent) * 100 : 0
    }
  } catch (error) {
    logger.error('Error getting email analytics:', error)
    return null
  }
}

