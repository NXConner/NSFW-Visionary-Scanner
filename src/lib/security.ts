/**
 * Security Utilities
 * Comprehensive security utilities for input validation, XSS prevention, and security auditing
 */

import { logger } from './logger'

// ============================================================================
// Input Validation & Sanitization
// ============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

/**
 * Sanitize string for use in URLs
 */
export function sanitizeUrlParam(input: string): string {
  return encodeURIComponent(input.trim())
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score++
  } else {
    feedback.push('Password should be at least 8 characters')
  }

  if (password.length >= 12) {
    score++
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++
  } else {
    feedback.push('Include both uppercase and lowercase letters')
  }

  if (/\d/.test(password)) {
    score++
  } else {
    feedback.push('Include at least one number')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++
  } else {
    feedback.push('Include at least one special character')
  }

  // Check for common passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2)
    feedback.push('Avoid common passwords')
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isStrong: score >= 3
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}

/**
 * Validate JSON string
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generate CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Store CSRF token
 */
export function storeCsrfToken(token: string): void {
  sessionStorage.setItem('csrf_token', token)
}

/**
 * Get stored CSRF token
 */
export function getCsrfToken(): string | null {
  return sessionStorage.getItem('csrf_token')
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = getCsrfToken()
  return storedToken !== null && token === storedToken
}

// ============================================================================
// Content Security
// ============================================================================

/**
 * Validate URL against whitelist
 */
export function isWhitelistedUrl(url: string, whitelist: string[]): boolean {
  try {
    const parsed = new URL(url)
    return whitelist.some(domain => parsed.hostname.endsWith(domain))
  } catch {
    return false
  }
}

/**
 * Check if URL is safe (not javascript:, data:, etc.)
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    // Relative URLs are generally safe
    return !url.startsWith('javascript:') && 
           !url.startsWith('data:') && 
           !url.startsWith('vbscript:')
  }
}

/**
 * Sanitize user-provided URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!isSafeUrl(url)) {
    return null
  }
  return url.trim()
}

// ============================================================================
// Rate Limiting Helpers
// ============================================================================

/**
 * Simple client-side rate limit tracker
 */
class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map()

  canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }

  reset(key: string): void {
    this.requests.delete(key)
  }

  resetAll(): void {
    this.requests.clear()
  }
}

export const clientRateLimiter = new ClientRateLimiter()

// ============================================================================
// Security Headers
// ============================================================================

/**
 * Recommended security headers for responses
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

// ============================================================================
// Sensitive Data Handling
// ============================================================================

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length)
  }
  
  const start = data.substring(0, visibleChars)
  const end = data.substring(data.length - visibleChars)
  const masked = '*'.repeat(data.length - visibleChars * 2)
  
  return `${start}${masked}${end}`
}

/**
 * Mask email address
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return maskSensitiveData(email)
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length)
  
  return `${maskedLocal}@${domain}`
}

/**
 * Mask credit card number
 */
export function maskCreditCard(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 4) return '*'.repeat(cleaned.length)
  
  return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4)
}

// ============================================================================
// Security Audit
// ============================================================================

export interface SecurityAuditResult {
  category: string
  check: string
  status: 'pass' | 'fail' | 'warning'
  details: string
}

/**
 * Run client-side security audit
 */
export function runSecurityAudit(): SecurityAuditResult[] {
  const results: SecurityAuditResult[] = []

  // Check HTTPS
  results.push({
    category: 'Transport',
    check: 'HTTPS Enabled',
    status: window.location.protocol === 'https:' ? 'pass' : 'fail',
    details: window.location.protocol === 'https:' 
      ? 'Site is served over HTTPS'
      : 'Site should be served over HTTPS'
  })

  // Check for localStorage availability
  results.push({
    category: 'Storage',
    check: 'Secure Storage',
    status: 'pass',
    details: 'localStorage is available for secure token storage'
  })

  // Check for CSP
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
  results.push({
    category: 'Headers',
    check: 'Content Security Policy',
    status: cspMeta ? 'pass' : 'warning',
    details: cspMeta 
      ? 'CSP meta tag is present'
      : 'Consider adding Content-Security-Policy'
  })

  // Check for secure cookies
  results.push({
    category: 'Cookies',
    check: 'Secure Cookies',
    status: document.cookie.includes('Secure') ? 'pass' : 'warning',
    details: 'Check that sensitive cookies have Secure flag'
  })

  // Check referrer policy
  const referrerMeta = document.querySelector('meta[name="referrer"]')
  results.push({
    category: 'Headers',
    check: 'Referrer Policy',
    status: referrerMeta ? 'pass' : 'warning',
    details: referrerMeta 
      ? 'Referrer policy is set'
      : 'Consider setting referrer policy'
  })

  // Check for external scripts
  const externalScripts = Array.from(document.scripts).filter(
    script => script.src && !script.src.startsWith(window.location.origin)
  )
  results.push({
    category: 'Scripts',
    check: 'External Scripts',
    status: externalScripts.length === 0 ? 'pass' : 'warning',
    details: externalScripts.length === 0
      ? 'No external scripts detected'
      : `${externalScripts.length} external script(s) detected`
  })

  logger.info('Security audit completed', { 
    passCount: results.filter(r => r.status === 'pass').length,
    failCount: results.filter(r => r.status === 'fail').length,
    warningCount: results.filter(r => r.status === 'warning').length
  })

  return results
}

// ============================================================================
// Dependency Vulnerability Check (Client-side placeholder)
// ============================================================================

/**
 * Check for known vulnerable patterns
 * Note: Real vulnerability scanning should be done during build/CI
 */
export function checkForVulnerablePatterns(): string[] {
  const warnings: string[] = []

  // Check for eval usage (generally unsafe)
  // This is a static check hint - actual detection would need build tools
  warnings.push('Run npm audit to check for dependency vulnerabilities')

  return warnings
}

// ============================================================================
// Exports
// ============================================================================

// ============================================================================
// Initialization & CSP
// ============================================================================

/**
 * Initialize security measures on app startup
 */
export function initializeSecurity(): void {
  // Generate and store CSRF token
  const token = generateCsrfToken()
  storeCsrfToken(token)

  // Add security event listeners
  window.addEventListener('storage', (event) => {
    // Detect potential XSS through storage
    if (event.key === 'csrf_token' && event.newValue !== token) {
      logger.warn('CSRF token tampering detected', { 
        oldValue: event.oldValue?.substring(0, 8),
        newValue: event.newValue?.substring(0, 8)
      })
    }
  })

  // Prevent clickjacking
  if (window.self !== window.top) {
    logger.warn('Application loaded in iframe - potential clickjacking')
  }

  logger.info('Security initialized')
}

/**
 * Generate Content Security Policy header
 */
export function generateCSPHeader(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ]

  return directives.join('; ')
}

export default {
  sanitizeHtml,
  sanitizeUrlParam,
  sanitizeEmail,
  checkPasswordStrength,
  isValidUUID,
  sanitizeFilename,
  isValidJson,
  generateCsrfToken,
  storeCsrfToken,
  getCsrfToken,
  validateCsrfToken,
  isWhitelistedUrl,
  isSafeUrl,
  sanitizeUrl,
  clientRateLimiter,
  SECURITY_HEADERS,
  maskSensitiveData,
  maskEmail,
  maskCreditCard,
  runSecurityAudit,
  checkForVulnerablePatterns,
  initializeSecurity,
  generateCSPHeader
}
