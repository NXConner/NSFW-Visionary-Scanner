/**
 * Social Sharing System
 * Handles sharing to social media platforms and tracking
 */

import { logger } from './logger'
import { toast } from 'sonner'

export interface ShareOptions {
  title?: string
  text?: string
  url?: string
  image?: string
}

/**
 * Share to native share API
 */
export async function shareToNative(options: ShareOptions): Promise<boolean> {
  try {
    if (!navigator.share) {
      return false
    }

    await navigator.share({
      title: options.title,
      text: options.text,
      url: options.url || window.location.href
    })

    trackShare('native', options)
    return true
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      logger.error('Error sharing:', error)
    }
    return false
  }
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(options: ShareOptions): void {
  const text = encodeURIComponent(options.text || options.title || '')
  const url = encodeURIComponent(options.url || window.location.href)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`
  
  window.open(twitterUrl, '_blank', 'width=550,height=420')
  trackShare('twitter', options)
}

/**
 * Share to Facebook
 */
export function shareToFacebook(options: ShareOptions): void {
  const url = encodeURIComponent(options.url || window.location.href)
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
  
  window.open(facebookUrl, '_blank', 'width=550,height=420')
  trackShare('facebook', options)
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(options: ShareOptions): void {
  const url = encodeURIComponent(options.url || window.location.href)
  const title = encodeURIComponent(options.title || '')
  const summary = encodeURIComponent(options.text || '')
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`
  
  window.open(linkedInUrl, '_blank', 'width=550,height=420')
  trackShare('linkedin', options)
}

/**
 * Share to Reddit
 */
export function shareToReddit(options: ShareOptions): void {
  const url = encodeURIComponent(options.url || window.location.href)
  const title = encodeURIComponent(options.title || '')
  const redditUrl = `https://reddit.com/submit?url=${url}&title=${title}`
  
  window.open(redditUrl, '_blank', 'width=550,height=420')
  trackShare('reddit', options)
}

/**
 * Share via email
 */
export function shareViaEmail(options: ShareOptions): void {
  const subject = encodeURIComponent(options.title || 'Check this out')
  const body = encodeURIComponent(`${options.text || ''}\n\n${options.url || window.location.href}`)
  const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
  
  window.location.href = mailtoUrl
  trackShare('email', options)
}

/**
 * Copy link to clipboard
 */
export async function copyLinkToClipboard(url?: string): Promise<boolean> {
  try {
    const link = url || window.location.href
    await navigator.clipboard.writeText(link)
    toast.success('Link copied to clipboard!')
    trackShare('clipboard', { url: link })
    return true
  } catch (error) {
    logger.error('Error copying to clipboard:', error)
    toast.error('Failed to copy link')
    return false
  }
}

/**
 * Track share event
 */
function trackShare(platform: string, options: ShareOptions): void {
  // Track in analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'share', {
      method: platform,
      content_type: 'app',
      item_id: options.url
    })
  }

  // Log to backend
  logger.info('Share tracked', { platform, options })
}

/**
 * Share progress/achievement
 */
export function shareProgress(
  type: 'achievement' | 'milestone' | 'progress' | 'streak',
  data: Record<string, any>
): void {
  const shareText = generateShareText(type, data)
  const shareOptions: ShareOptions = {
    title: `I just ${getActionText(type)}!`,
    text: shareText,
    url: window.location.origin
  }

  if (navigator.share) {
    shareToNative(shareOptions)
  } else {
    copyLinkToClipboard()
  }
}

function generateShareText(type: string, data: Record<string, any>): string {
  switch (type) {
    case 'achievement':
      return `I just unlocked the "${data.name}" achievement! 🎉`
    case 'milestone':
      return `I reached a new milestone: ${data.milestone}! 🎯`
    case 'progress':
      return `Check out my progress: ${data.description}! 📈`
    case 'streak':
      return `I'm on a ${data.days}-day streak! 🔥`
    default:
      return 'Check out my progress on this health tracking app!'
  }
}

function getActionText(type: string): string {
  switch (type) {
    case 'achievement':
      return 'unlocked an achievement'
    case 'milestone':
      return 'reached a milestone'
    case 'progress':
      return 'made progress'
    case 'streak':
      return 'extended my streak'
    default:
      return 'made progress'
  }
}

/**
 * Share referral code
 */
export function shareReferralCode(code: string): void {
  const shareText = `Join me on this amazing health tracking app! Use my referral code: ${code}`
  const shareUrl = `${window.location.origin}?ref=${code}`
  
  const shareOptions: ShareOptions = {
    title: 'Join me on this health app!',
    text: shareText,
    url: shareUrl
  }

  if (navigator.share) {
    shareToNative(shareOptions)
  } else {
    copyLinkToClipboard(shareUrl)
  }
}

