/**
 * Premium Add-Ons System
 * UI component for viewing and subscribing to premium add-ons
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Loader2, BarChart3, Cloud, Headphones, Database, Code, Building2, Palette } from 'lucide-react'
import {
  getPremiumAddOns,
  getUserAddOns,
  subscribeToAddOn,
  cancelAddOn,
  type PremiumAddOn,
  type UserAddOn
} from '@/lib/premiumAddOns'
import { toast } from 'sonner'

export const PremiumAddOns = () => {
  const [loading, setLoading] = useState(false)
  const [addOns, setAddOns] = useState<PremiumAddOn[]>([])
  const [userAddOns, setUserAddOns] = useState<UserAddOn[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPlanType, setSelectedPlanType] = useState<'monthly' | 'annual' | 'lifetime'>('monthly')

  const categories = [
    { id: 'all', label: 'All Add-Ons' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'storage', label: 'Storage' },
    { id: 'support', label: 'Support' },
    { id: 'api', label: 'API' },
    { id: 'clinic', label: 'Clinic' }
  ]

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      const [addOnsData, userAddOnsData] = await Promise.all([
        getPremiumAddOns(selectedCategory === 'all' ? undefined : selectedCategory),
        getUserAddOns()
      ])
      setAddOns(addOnsData)
      setUserAddOns(userAddOnsData)
    } catch (error) {
      toast.error('Failed to load add-ons')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (addonId: string) => {
    try {
      const success = await subscribeToAddOn(addonId, selectedPlanType)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to start subscription')
    }
  }

  const handleCancel = async (addonId: string) => {
    try {
      const success = await cancelAddOn(addonId)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to cancel add-on')
    }
  }

  const getAddOnIcon = (category: string | null) => {
    switch (category) {
      case 'analytics': return <BarChart3 className="w-5 h-5" />
      case 'storage': return <Cloud className="w-5 h-5" />
      case 'support': return <Headphones className="w-5 h-5" />
      case 'api': return <Code className="w-5 h-5" />
      case 'clinic': return <Building2 className="w-5 h-5" />
      default: return <Check className="w-5 h-5" />
    }
  }

  const getPrice = (addon: PremiumAddOn) => {
    switch (selectedPlanType) {
      case 'monthly':
        return addon.monthly_price
      case 'annual':
        return addon.annual_price || addon.monthly_price * 12
      case 'lifetime':
        return addon.lifetime_price || addon.monthly_price * 60
    }
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`
  }

  const getBillingPeriod = () => {
    switch (selectedPlanType) {
      case 'monthly': return '/month'
      case 'annual': return '/year'
      case 'lifetime': return ' (one-time)'
    }
  }

  const isUserSubscribed = (addonId: string) => {
    return userAddOns.some(addon => addon.addon_id === addonId && addon.status === 'active')
  }

  const getUserAddOn = (addonId: string) => {
    return userAddOns.find(addon => addon.addon_id === addonId && addon.status === 'active')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading premium add-ons...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center mb-2">
            Premium Add-Ons
          </CardTitle>
          <CardDescription className="text-center">
            Enhance your subscription with powerful add-ons. Mix and match to create your perfect plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Type Selector */}
          <div className="flex justify-center gap-2 mb-4">
            <Button
              variant={selectedPlanType === 'monthly' ? 'default' : 'outline'}
              onClick={() => setSelectedPlanType('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={selectedPlanType === 'annual' ? 'default' : 'outline'}
              onClick={() => setSelectedPlanType('annual')}
            >
              Annual
              {selectedPlanType === 'annual' && (
                <Badge variant="secondary" className="ml-2">Save 20%</Badge>
              )}
            </Button>
            <Button
              variant={selectedPlanType === 'lifetime' ? 'default' : 'outline'}
              onClick={() => setSelectedPlanType('lifetime')}
            >
              Lifetime
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* My Add-Ons Section */}
          {userAddOns.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">My Active Add-Ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAddOns.map(userAddon => {
                  const addon = addOns.find(a => a.addon_id === userAddon.addon_id)
                  if (!addon) return null

                  return (
                    <Card key={userAddon.id} className="glass-card border-green-500/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getAddOnIcon(addon.category)}
                            <CardTitle className="text-lg">{addon.addon_name}</CardTitle>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{addon.addon_description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleCancel(addon.addon_id)}
                        >
                          Cancel Add-On
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available Add-Ons */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Available Add-Ons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addOns.map(addon => {
                const price = getPrice(addon)
                const subscribed = isUserSubscribed(addon.addon_id)
                const Icon = getAddOnIcon(addon.category)

                return (
                  <Card
                    key={addon.id}
                    className={`glass-card border-border/50 ${
                      addon.is_popular ? 'border-primary ring-2 ring-primary/20' : ''
                    } ${subscribed ? 'border-green-500' : ''}`}
                  >
                    {addon.is_popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge variant="default" className="px-3 py-1">
                          Popular
                        </Badge>
                      </div>
                    )}
                    {subscribed && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="secondary" className="px-3 py-1">
                          Active
                        </Badge>
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        {Icon}
                        <CardTitle className="text-xl">{addon.addon_name}</CardTitle>
                      </div>
                      <CardDescription>{addon.addon_description}</CardDescription>
                      <div className="mt-4">
                        <div className="text-3xl font-bold">
                          {formatPrice(price)}
                          {price > 0 && (
                            <span className="text-lg font-normal text-muted-foreground">
                              {getBillingPeriod()}
                            </span>
                          )}
                        </div>
                        {selectedPlanType === 'annual' && addon.annual_discount_percentage > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Save {addon.annual_discount_percentage}% vs monthly
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {addon.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {addon.requires_tier.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Requires:</p>
                          <div className="flex flex-wrap gap-1">
                            {addon.requires_tier.map(tier => (
                              <Badge key={tier} variant="outline" className="text-xs">
                                {tier}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button
                        className="w-full"
                        variant={addon.is_popular ? 'default' : 'outline'}
                        onClick={() => handleSubscribe(addon.addon_id)}
                        disabled={subscribed}
                      >
                        {subscribed ? 'Active' : 'Subscribe'}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

