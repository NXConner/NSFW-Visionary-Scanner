/**
 * Smart Upsell System Component
 * Context-aware upgrade prompts, feature teasers, and trial offers
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, Sparkles, Crown, Zap, ArrowRight, Lock } from 'lucide-react'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { createCheckoutSession } from '@/lib/stripe'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UpsellPrompt {
  id: string
  type: 'feature_teaser' | 'usage_based' | 'trial_offer' | 'contextual'
  title: string
  description: string
  feature?: string
  usage_percent?: number
  trial_days?: number
  discount_percent?: number
  cta_text: string
  cta_action: () => void
}

export const SmartUpsell = () => {
  const { tier, features, hasFeature } = useFeatureAccess()
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState<UpsellPrompt | null>(null)
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set())

  useEffect(() => {
    checkUpsellOpportunities()
  }, [tier, features])

  const checkUpsellOpportunities = () => {
    // Don't show upsells to premium users
    if (tier === 'premium') return

    // Check usage-based prompts
    const usagePrompts = checkUsageBasedPrompts()
    if (usagePrompts.length > 0 && !dismissedPrompts.has(usagePrompts[0].id)) {
      setCurrentPrompt(usagePrompts[0])
      setShowPrompt(true)
      return
    }

    // Check feature teasers
    const featurePrompts = checkFeatureTeasers()
    if (featurePrompts.length > 0 && !dismissedPrompts.has(featurePrompts[0].id)) {
      setCurrentPrompt(featurePrompts[0])
      setShowPrompt(true)
      return
    }

    // Check contextual prompts
    const contextualPrompts = checkContextualPrompts()
    if (contextualPrompts.length > 0 && !dismissedPrompts.has(contextualPrompts[0].id)) {
      setCurrentPrompt(contextualPrompts[0])
      setShowPrompt(true)
    }
  }

  const checkUsageBasedPrompts = (): UpsellPrompt[] => {
    const prompts: UpsellPrompt[] = []

    // Check scan usage (if free tier has limits)
    const scanUsage = 0.8 // Example: 80% of free tier used
    if (scanUsage >= 0.8 && tier === 'free') {
      prompts.push({
        id: 'usage-scans',
        type: 'usage_based',
        title: 'You\'ve used 80% of your free scans!',
        description: 'Upgrade to Premium for unlimited scans and advanced features.',
        usage_percent: scanUsage * 100,
        cta_text: 'Upgrade to Premium',
        cta_action: () => handleUpgrade('premium')
      })
    }

    return prompts
  }

  const checkFeatureTeasers = (): UpsellPrompt[] => {
    const prompts: UpsellPrompt[] = []

    // Check if user is trying to access locked features
    const lockedFeatures = [
      { id: 'positionsGallery', name: 'Positions Gallery' },
      { id: 'peProgressPhotos', name: 'PE Progress Photos' },
      { id: 'peRoutineBuilder', name: 'PE Routine Builder' },
      { id: 'aiHealthChatbot', name: 'AI Health Chatbot' }
    ]

    for (const feature of lockedFeatures) {
      if (!hasFeature(feature.id)) {
        prompts.push({
          id: `teaser-${feature.id}`,
          type: 'feature_teaser',
          title: `Unlock ${feature.name}`,
          description: `Get access to ${feature.name} and more with Premium.`,
          feature: feature.id,
          cta_text: 'Unlock Feature',
          cta_action: () => handleUpgrade('premium')
        })
        break // Show one at a time
      }
    }

    return prompts
  }

  const checkContextualPrompts = (): UpsellPrompt[] => {
    const prompts: UpsellPrompt[] = []

    // Check if user has been active for a while
    // This would check user activity data
    const daysActive = 7 // Example
    if (daysActive >= 7 && tier === 'free') {
      prompts.push({
        id: 'contextual-active-user',
        type: 'contextual',
        title: 'You\'re doing great!',
        description: 'You\'ve been active for 7 days. Unlock Premium features to maximize your progress.',
        cta_text: 'Upgrade Now',
        cta_action: () => handleUpgrade('premium')
      })
    }

    return prompts
  }

  const handleUpgrade = async (targetTier: 'pro' | 'premium') => {
    try {
      const priceId = targetTier === 'premium'
        ? import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID
        : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID

      if (!priceId) {
        toast.error('Pricing not configured. Please contact support.')
        return
      }

      const checkoutUrl = await createCheckoutSession(priceId)
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      }
    } catch (error) {
      logger.error('Error creating checkout session:', error)
      toast.error('Failed to start upgrade process')
    }
  }

  const handleDismiss = () => {
    if (currentPrompt) {
      setDismissedPrompts(prev => new Set([...prev, currentPrompt.id]))
    }
    setShowPrompt(false)
    setCurrentPrompt(null)
  }

  if (!showPrompt || !currentPrompt) return null

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentPrompt.type === 'feature_teaser' && <Lock className="w-5 h-5" />}
            {currentPrompt.type === 'usage_based' && <Zap className="w-5 h-5" />}
            {currentPrompt.type === 'trial_offer' && <Sparkles className="w-5 h-5" />}
            {currentPrompt.type === 'contextual' && <Crown className="w-5 h-5" />}
            {currentPrompt.title}
          </DialogTitle>
          <DialogDescription>{currentPrompt.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {currentPrompt.usage_percent && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Usage</span>
                <span>{currentPrompt.usage_percent.toFixed(0)}%</span>
              </div>
              <Progress value={currentPrompt.usage_percent} className="h-2" />
            </div>
          )}

          {currentPrompt.trial_days && (
            <Badge variant="outline" className="w-full justify-center py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              {currentPrompt.trial_days}-Day Free Trial
            </Badge>
          )}

          {currentPrompt.discount_percent && (
            <Badge variant="default" className="w-full justify-center py-2">
              {currentPrompt.discount_percent}% Off
            </Badge>
          )}

          <div className="flex gap-2">
            <Button
              onClick={currentPrompt.cta_action}
              className="flex-1"
              variant="gradient"
            >
              {currentPrompt.cta_text}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="icon"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            You can dismiss this prompt. We'll show it again later.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Inline Upsell Banner Component
 * Shows in specific contexts (e.g., locked features)
 */
export const InlineUpsellBanner = ({ feature, context }: { feature: string; context?: string }) => {
  const { tier } = useFeatureAccess()

  if (tier === 'premium') return null

  const handleUpgrade = async () => {
    const priceId = import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID
    if (!priceId) {
      toast.error('Pricing not configured')
      return
    }

    const checkoutUrl = await createCheckoutSession(priceId)
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold">Unlock {feature}</div>
              <div className="text-sm text-muted-foreground">
                {context || 'Upgrade to Premium to access this feature'}
              </div>
            </div>
          </div>
          <Button onClick={handleUpgrade} size="sm" variant="gradient">
            Upgrade
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

