/**
 * Lazy Component Loading System
 * Implements code splitting and lazy loading for optimal bundle size
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react'
import { logger } from './logger'

// Retry loading configuration
interface LazyLoadOptions {
  retries?: number
  retryDelay?: number
  onError?: (error: Error) => void
}

/**
 * Enhanced lazy loading with retry logic and error handling
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const { retries = 3, retryDelay = 1000, onError } = options

  return lazy(async () => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await importFn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Failed to load component')
        
        logger.warn('Component lazy load failed, retrying...', {
          attempt: attempt + 1,
          maxRetries: retries,
          error: lastError.message
        })

        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        }
      }
    }

    logger.error('Component lazy load failed after retries', {
      retries,
      error: lastError?.message
    })

    onError?.(lastError || new Error('Failed to load component'))
    throw lastError
  })
}

/**
 * Preload a lazy component
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
  return importFn()
}

// ============================================================================
// Heavy Components - Lazy Load These
// ============================================================================

// 3D Viewer - Heavy Three.js dependency
export const LazyModel3DViewer = lazyWithRetry(
  () => import('@/components/Model3DViewer').then(m => ({ default: m.Model3DViewer }))
)

// AI Health Chatbot - Complex chat functionality
export const LazyAIHealthChatbot = lazyWithRetry(
  () => import('@/components/AIHealthChatbot').then(m => ({ default: m.AIHealthChatbot }))
)

// Analytics Dashboard - Heavy charts
export const LazyAnalyticsDashboard = lazyWithRetry(
  () => import('@/components/analytics').then(m => ({ default: m.AnalyticsDashboard }))
)

// Video Player - Media playback
export const LazyVideoPlayer = lazyWithRetry(
  () => import('@/components/VideoPlayer').then(m => ({ default: m.VideoPlayer }))
)

// Video Library - Media browsing
export const LazyVideoLibrary = lazyWithRetry(
  () => import('@/components/VideoLibrary').then(m => ({ default: m.VideoLibrary }))
)

// Community Forum - Large feature
export const LazyCommunityForum = lazyWithRetry(
  () => import('@/components/CommunityForum').then(m => ({ default: m.CommunityForum }))
)

// Advanced Scanner Features
export const LazyAdvancedScannerFeatures = lazyWithRetry(
  () => import('@/components/AdvancedScannerFeatures').then(m => ({ default: m.AdvancedScannerFeatures }))
)

// PE Routine Builder - Complex form
export const LazyPERoutineBuilder = lazyWithRetry(
  () => import('@/components/PERoutineBuilder').then(m => ({ default: m.PERoutineBuilder }))
)

// Progress Charts - Recharts heavy
export const LazyProgressCharts = lazyWithRetry(
  () => import('@/components/ProgressCharts').then(m => ({ default: m.ProgressCharts }))
)

// Advanced Reporting System
export const LazyAdvancedReportingSystem = lazyWithRetry(
  () => import('@/components/AdvancedReportingSystem').then(m => ({ default: m.AdvancedReportingSystem }))
)

// DLC System - Premium features
export const LazyEnhancedDLCSystem = lazyWithRetry(
  () => import('@/components/EnhancedDLCSystem').then(m => ({ default: m.EnhancedDLCSystem }))
)

// Marketplace - Large feature
export const LazyMarketplaceSystem = lazyWithRetry(
  () => import('@/components/MarketplaceSystem').then(m => ({ default: m.MarketplaceSystem }))
)

// NSFW Features - Premium
export const LazyNSFWAdvancedFeatures = lazyWithRetry(
  () => import('@/components/NSFWAdvancedFeatures').then(m => ({ default: m.NSFWAdvancedFeatures }))
)

// NSFW Video Content
export const LazyNSFWVideoContent = lazyWithRetry(
  () => import('@/components/NSFWVideoContent').then(m => ({ default: m.NSFWVideoContent }))
)

// Sexual Wellness Analytics
export const LazyNSFWSexualWellnessAnalytics = lazyWithRetry(
  () => import('@/components/NSFWSexualWellnessAnalytics').then(m => ({ default: m.NSFWSexualWellnessAnalytics }))
)

// Expert Content
export const LazyExpertContentConsultations = lazyWithRetry(
  () => import('@/components/ExpertContentConsultations').then(m => ({ default: m.ExpertContentConsultations }))
)

// Settings Panel
export const LazySettingsPanel = lazyWithRetry(
  () => import('@/components/SettingsPanel').then(m => ({ default: m.SettingsPanel }))
)

// Health Integrations
export const LazyHealthAppIntegrations = lazyWithRetry(
  () => import('@/components/HealthAppIntegrations').then(m => ({ default: m.HealthAppIntegrations }))
)

// ============================================================================
// Route-based Code Splitting
// ============================================================================

// Page-level lazy loading for routes
export const pages = {
  Index: lazyWithRetry(() => import('@/pages/Index').then(m => ({ default: m.default ?? m.Index }))),
  Auth: lazyWithRetry(() => import('@/pages/Auth').then(m => ({ default: m.default ?? m.Auth }))),
  AuthCallback: lazyWithRetry(() =>
    import('@/pages/AuthCallback').then(m => ({ default: m.AuthCallback }))
  ),
  Pricing: lazyWithRetry(() => import('@/pages/Pricing').then(m => ({ default: m.default ?? m.Pricing }))),
  PrivacyPolicy: lazyWithRetry(() =>
    import('@/pages/PrivacyPolicy').then(m => ({ default: m.default ?? m.PrivacyPolicy }))
  ),
  TermsOfService: lazyWithRetry(() =>
    import('@/pages/TermsOfService').then(m => ({ default: m.default ?? m.TermsOfService }))
  ),
  NotFound: lazyWithRetry(() => import('@/pages/NotFound').then(m => ({ default: m.default ?? m.NotFound })))
}

// ============================================================================
// Preloading Utilities
// ============================================================================

/**
 * Preload critical components on idle
 */
export function preloadCriticalComponents(): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload commonly used components
      preloadComponent(() =>
        import('@/components/ProgressCharts').then(m => ({ default: m.ProgressCharts }))
      )
      preloadComponent(() =>
        import('@/components/HealthDiarySection').then(m => ({ default: m.HealthDiarySection }))
      )
    })
  }
}

/**
 * Preload components based on user navigation intent
 */
export function preloadOnHover(componentImport: () => Promise<any>): () => void {
  let preloaded = false
  
  return () => {
    if (!preloaded) {
      preloadComponent(componentImport)
      preloaded = true
    }
  }
}

/**
 * Preload components based on route
 */
export function preloadRouteComponents(route: string): void {
  switch (route) {
    case '/':
      preloadComponent(() =>
        import('@/components/ScannerSection').then(m => ({ default: m.ScannerSection }))
      )
      preloadComponent(() =>
        import('@/components/ProgressCharts').then(m => ({ default: m.ProgressCharts }))
      )
      break
    case '/settings':
      preloadComponent(() =>
        import('@/components/SettingsPanel').then(m => ({ default: m.SettingsPanel }))
      )
      break
    case '/pricing':
      preloadComponent(() =>
        import('@/components/SubscriptionTiers').then(m => ({ default: m.SubscriptionTiers }))
      )
      break
  }
}

// ============================================================================
// Dynamic Import Utilities
// ============================================================================

/**
 * Dynamically import a module with error handling
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await importFn()
  } catch (error) {
    logger.error('Dynamic import failed', { error })
    if (fallback !== undefined) {
      return fallback
    }
    throw error
  }
}

/**
 * Import a module only in development
 */
export async function devOnlyImport<T>(
  importFn: () => Promise<T>
): Promise<T | null> {
  if (import.meta.env.DEV) {
    return importFn()
  }
  return null
}

// Initialize preloading on module load
if (typeof window !== 'undefined') {
  // Preload critical components after initial render
  window.addEventListener('load', () => {
    setTimeout(preloadCriticalComponents, 2000)
  })
}
