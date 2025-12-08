// Security utilities and Content Security Policy configuration
import { safeLocalStorage } from './storageErrorHandler'

// Content Security Policy configuration
export const CSP_CONFIG = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' https://fonts.gstatic.com",
  'img-src': "'self' data: https: blob:",
  'connect-src': "'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com",
  'frame-src': "'self' https://js.stripe.com https://hooks.stripe.com",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'",
  'upgrade-insecure-requests': "",
}

export const generateCSPHeader = (): string => {
  return Object.entries(CSP_CONFIG)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ')
}

// Security headers for production
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

// Input sanitization utilities
export class InputSanitizer {
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, 1000) // Limit length
  }

  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().slice(0, 254)
  }

  static sanitizeMeasurement(value: number): number {
    // Ensure measurements are within reasonable bounds
    return Math.max(0, Math.min(1000, value))
  }

  static sanitizeNotes(notes: string): string {
    return notes
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove other HTML tags
      .trim()
      .slice(0, 5000) // Limit length
  }
}

// Rate limiting utilities
export class RateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>()

  checkLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }

    if (record.count >= maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  getRemainingAttempts(identifier: string, maxAttempts: number = 5): number {
    const record = this.attempts.get(identifier)
    if (!record) return maxAttempts
    return Math.max(0, maxAttempts - record.count)
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter()

// Initialize security measures
export const initializeSecurity = (): void => {
  // Set security headers via meta tags (client-side)
  const metaTags = [
    { 'http-equiv': 'X-Frame-Options', content: SECURITY_HEADERS['X-Frame-Options'] },
    { 'http-equiv': 'X-Content-Type-Options', content: SECURITY_HEADERS['X-Content-Type-Options'] },
    { 'http-equiv': 'X-XSS-Protection', content: SECURITY_HEADERS['X-XSS-Protection'] },
    { 'http-equiv': 'Referrer-Policy', content: SECURITY_HEADERS['Referrer-Policy'] },
  ]

  metaTags.forEach(tag => {
    let meta = document.querySelector(`meta[http-equiv="${tag['http-equiv']}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('http-equiv', tag['http-equiv'])
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', tag.content)
  })

  // Log security initialization
  if (typeof console !== 'undefined' && console.log) {
    console.log('Security measures initialized')
  }
}

// Data encryption utilities for sensitive data
export class DataEncryptor {
  private static algorithm = 'AES-GCM'
  private static keyLength = 256

  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encryptData(data: string, key: CryptoKey): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      dataBuffer
    )

    return { encrypted, iv }
  }

  static async decryptData(encrypted: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  static async exportKey(key: CryptoKey): Promise<JsonWebKey> {
    return await crypto.subtle.exportKey('jwk', key)
  }

  static async importKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    )
  }
}

// Import safe storage at module level
import { safeLocalStorage } from './storageErrorHandler'

// Secure storage wrapper
export class SecureStorage {
  private static readonly prefix = 'morphoscan_secure_'

  static async setItem(key: string, value: string): Promise<void> {
    try {
      const fullKey = this.prefix + key
      const salt = import.meta.env.VITE_CLIENT_ENCRYPTION_SALT

      if (!salt) {
        // Fallback to regular localStorage if no salt is configured
        // Use safe storage wrapper
        const success = safeLocalStorage.setItem(fullKey, value)
        if (!success) {
          throw new Error('Failed to store data')
        }
        return
      }

      // Derive key from salt
      const encoder = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(salt),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('morphoscan_salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
      )

      const { encrypted, iv } = await DataEncryptor.encryptData(value, key)

      // Store encrypted data and IV
      const encryptedData = {
        data: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv),
      }

      // Use safe storage wrapper
      const success = safeLocalStorage.setItem(fullKey, JSON.stringify(encryptedData))
      if (!success) {
        throw new Error('Failed to store encrypted data')
      }
    } catch (error) {
      console.error('Failed to securely store data:', error)
      // Fallback to regular localStorage with error handling
      safeLocalStorage.setItem(this.prefix + key, value)
    }
  }

  static async getItem(key: string): Promise<string | null> {
    try {
      const fullKey = this.prefix + key
      const stored = safeLocalStorage.getItem(fullKey)

      if (!stored) return null

      const salt = import.meta.env.VITE_CLIENT_ENCRYPTION_SALT

      if (!salt) {
        return stored
      }

      const encryptedData = JSON.parse(stored)
      const encrypted = new Uint8Array(encryptedData.data).buffer
      const iv = new Uint8Array(encryptedData.iv)

      // Derive key from salt
      const encoder = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(salt),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      )

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('morphoscan_salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )

      return await DataEncryptor.decryptData(encrypted, iv, key)
    } catch (error) {
      console.error('Failed to retrieve secure data:', error)
      // Try fallback to regular localStorage with error handling
      return safeLocalStorage.getItem(this.prefix + key)
    }
  }

  static removeItem(key: string): void {
    safeLocalStorage.removeItem(this.prefix + key)
  }

  static clear(): void {
    const keys = Object.keys(localStorage).filter(key =>
      key.startsWith(this.prefix)
    )
    keys.forEach(key => safeLocalStorage.removeItem(key))
  }
}