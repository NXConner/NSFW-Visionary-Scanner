import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSubscriptionStatus } from '@/lib/stripe'
import { logger } from '@/lib/logger'

export type SubscriptionTier = 'free' | 'pro' | 'premium' | 'admin'

export interface FeatureAccess {
  // Scanner features
  unlimitedScans: boolean
  aiScanAnalysis: boolean
  advancedCalibration: boolean

  // Health features
  aiHealthChatbot: boolean
  predictiveAnalytics: boolean
  medicalExport: boolean

  // Content features
  positionsGallery: boolean
  peProgressPhotos: boolean
  customRoutines: boolean

  // Data features
  cloudBackup: boolean
  advancedAnalytics: boolean
  dataExport: boolean

  // Support features
  prioritySupport: boolean
  customWorkouts: boolean

  // Limits
  scanLimit: number
  aiQueriesLimit: number
}

const FREE_FEATURES: FeatureAccess = {
  unlimitedScans: false,
  aiScanAnalysis: false,
  advancedCalibration: false,
  aiHealthChatbot: false,
  predictiveAnalytics: false,
  medicalExport: false,
  positionsGallery: false,
  peProgressPhotos: false,
  customRoutines: false,
  cloudBackup: false,
  advancedAnalytics: false,
  dataExport: true, // Basic JSON export
  prioritySupport: false,
  customWorkouts: false,
  scanLimit: 10,
  aiQueriesLimit: 0,
}

const PRO_FEATURES: FeatureAccess = {
  ...FREE_FEATURES,
  unlimitedScans: false,
  positionsGallery: true,
  peProgressPhotos: true,
  customRoutines: true,
  cloudBackup: true,
  advancedAnalytics: true,
  scanLimit: 100,
  aiQueriesLimit: 50,
}

const PREMIUM_FEATURES: FeatureAccess = {
  unlimitedScans: true,
  aiScanAnalysis: true,
  advancedCalibration: true,
  aiHealthChatbot: true,
  predictiveAnalytics: true,
  medicalExport: true,
  positionsGallery: true,
  peProgressPhotos: true,
  customRoutines: true,
  cloudBackup: true,
  advancedAnalytics: true,
  dataExport: true,
  prioritySupport: true,
  customWorkouts: true,
  scanLimit: -1, // Unlimited
  aiQueriesLimit: -1, // Unlimited
}

export const useFeatureAccess = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free')
  const [features, setFeatures] = useState<FeatureAccess>(FREE_FEATURES)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadUserTier()
    } else {
      setTier('free')
      setFeatures(FREE_FEATURES)
      setLoading(false)
    }
  }, [user])

  const loadUserTier = async () => {
    if (!user) return

    try {
      // Check if user has admin role
      const userRoles = localStorage.getItem('user_roles') || '[]'
      const roles = JSON.parse(userRoles)
      if (roles.includes('admin') || roles.includes('super_admin')) {
        setTier('admin')
        setFeatures(PREMIUM_FEATURES)
        setLoading(false)
        return
      }

      // Check subscription status
      const subscription = await getSubscriptionStatus(user.id)

      if (!subscription || subscription.status !== 'active') {
        setTier('free')
        setFeatures(FREE_FEATURES)
      } else {
        // Determine tier based on price ID
        const priceId = subscription.stripe_price_id
        if (priceId && priceId.includes('premium')) {
          setTier('premium')
          setFeatures(PREMIUM_FEATURES)
        } else if (priceId && priceId.includes('pro')) {
          setTier('pro')
          setFeatures(PRO_FEATURES)
        } else {
          setTier('free')
          setFeatures(FREE_FEATURES)
        }
      }

      logger.info('User tier determined', { userId: user.id, tier, hasSubscription: !!subscription })

    } catch (error) {
      logger.error('Failed to load user tier', { userId: user.id, error })
      // Default to free tier on error
      setTier('free')
      setFeatures(FREE_FEATURES)
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (feature: keyof FeatureAccess): boolean => {
    if (loading) return false
    return features[feature] as boolean
  }

  const getLimit = (limitType: 'scanLimit' | 'aiQueriesLimit'): number => {
    if (loading) return 0
    return features[limitType] as number
  }

  const canUseFeature = (feature: keyof FeatureAccess, currentUsage?: number): boolean => {
    if (loading) return false

    const hasAccess = features[feature] as boolean
    if (!hasAccess) return false

    // Check usage limits
    if (feature === 'unlimitedScans' && currentUsage !== undefined) {
      const limit = features.scanLimit
      if (limit > 0 && currentUsage >= limit) return false
    }

    if (feature === 'aiHealthChatbot' && currentUsage !== undefined) {
      const limit = features.aiQueriesLimit
      if (limit > 0 && currentUsage >= limit) return false
    }

    return true
  }

  return {
    tier,
    features,
    loading,
    hasFeature,
    getLimit,
    canUseFeature,
    refreshTier: loadUserTier,
  }
}

// Feature toggles hook (for UI feature flags)
export const useFeatureToggles = () => {
  const { features } = useFeatureAccess()
  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Initialize toggles from features
    const initialToggles: Record<string, boolean> = {}
    Object.keys(features).forEach(key => {
      initialToggles[key] = features[key as keyof FeatureAccess] as boolean
    })
    setToggles(initialToggles)
  }, [features])

  const toggleFeature = (feature: string) => {
    setToggles(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  return { toggles, toggleFeature }
}

// Subscription hook
export const useSubscription = () => {
  const { tier, refreshTier } = useFeatureAccess()
  const [localTier, setLocalTier] = useState<SubscriptionTier>(tier)

  useEffect(() => {
    setLocalTier(tier)
  }, [tier])

  const setTier = (newTier: SubscriptionTier) => {
    setLocalTier(newTier)
    // Optionally refresh from server
    refreshTier()
  }

  return { tier: localTier, setTier }
}

// Get badge color for tier
export const getTierBadgeColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    case 'pro':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'premium':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'admin':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}