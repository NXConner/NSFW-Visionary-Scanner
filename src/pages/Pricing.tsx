import { useState, useEffect } from 'react'
import { PricingCard } from '@/components/PricingCard'
import { getPricingTiers, getDLCOptions, formatPrice, type PricingTier } from '@/lib/pricing'
import { useAuth } from '@/contexts/AuthContext'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { isHybrid, getDistributionChannel } from '@/lib/featureFlags'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Star, Zap, Crown, Key, Download, Store, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

const Pricing = () => {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month')
  const [priceType, setPriceType] = useState<'subscription' | 'one-time'>('subscription')
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [dlcOptions, setDlcOptions] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { tier: currentTier } = useFeatureAccess()
  const navigate = useNavigate()
  const channel = getDistributionChannel()
  const isHybridVersion = isHybrid()

  useEffect(() => {
    const loadPricing = async () => {
      setLoading(true)
      try {
        const tiers = await getPricingTiers()
        setPricingTiers(tiers)
        
        if (isHybridVersion) {
          const dlc = await getDLCOptions()
          setDlcOptions(dlc)
        }
      } catch (error) {
        console.error('Failed to load pricing', error)
      } finally {
        setLoading(false)
      }
    }
    loadPricing()
  }, [isHybridVersion])

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Unlock the full potential of your health journey
            </p>
            <Button onClick={() => navigate('/auth')} size="lg">
              Sign In to Get Started
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Filter tiers based on selected price type and billing interval
  const filteredTiers = pricingTiers.filter(tier => {
    if (priceType === 'subscription') {
      return (tier.priceType === 'monthly' || tier.priceType === 'yearly') &&
             (billingInterval === 'month' ? tier.priceType === 'monthly' : tier.priceType === 'yearly')
    } else {
      return tier.priceType === 'one-time' || tier.priceType === 'lifetime'
    }
  })

  // Group tiers by name for display
  const groupedTiers = filteredTiers.reduce((acc, tier) => {
    const key = tier.name
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(tier)
    return acc
  }, {} as Record<string, PricingTier[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock advanced AI features and comprehensive health tracking
          </p>

          {/* Distribution Channel Badge */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {channel === 'store' ? (
              <Badge variant="outline" className="gap-2">
                <Store className="w-4 h-4" />
                Store Version
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-2">
                <Globe className="w-4 h-4" />
                Direct Download
              </Badge>
            )}
          </div>

          {/* Price Type Tabs */}
          <Tabs value={priceType} onValueChange={(v) => setPriceType(v as 'subscription' | 'one-time')} className="mb-8">
            <TabsList className="inline-flex">
              <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
              <TabsTrigger value="one-time">One-Time Purchases</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Billing Toggle (only for subscriptions) */}
          {priceType === 'subscription' && (
            <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm mb-8">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
                  billingInterval === 'year'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                }`}
              >
                Yearly
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-xs">
                  Save 20%
                </Badge>
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading pricing...</p>
          </div>
        ) : (
          <>
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
              {Object.values(groupedTiers).map((tierGroup, index) => {
                const tier = tierGroup[0] // Use first tier for display
                const isPopular = tier.popular || false
                
                return (
                  <PricingCard
                    key={tier.id}
                    plan={{
                      id: tier.id,
                      name: tier.name,
                      price: tier.price,
                      interval: tier.priceType === 'yearly' ? 'year' : tier.priceType === 'monthly' ? 'month' : 'one-time',
                      stripePriceId: tier.stripePriceId || '',
                      features: tier.features,
                      popular: isPopular
                    }}
                    isPopular={isPopular}
                    currentPlan={currentTier}
                  />
                )
              })}
            </div>

            {/* DLC Upgrade Section (Hybrid Version Only) */}
            {isHybridVersion && dlcOptions.length > 0 && (
              <Card className="max-w-4xl mx-auto mb-16 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    NSFW Content Upgrade (DLC)
                  </CardTitle>
                  <CardDescription>
                    Unlock adult content and features with a one-time DLC purchase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {dlcOptions.map((dlc) => (
                      <Card key={dlc.id} className="border-2">
                        <CardHeader>
                          <CardTitle className="text-xl">{dlc.name}</CardTitle>
                          <div className="text-3xl font-bold gradient-text mt-2">
                            {formatPrice(dlc.price)}
                          </div>
                          <Badge variant="outline" className="mt-2">
                            {dlc.distributionChannel === 'store' ? 'Store User' : 'Direct User'}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 mb-4">
                            {dlc.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-green-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button asChild className="w-full" variant="gradient">
                            <Link to="/dlc">
                              Purchase DLC
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Feature Comparison */}
            <Card className="max-w-6xl mx-auto mb-16">
              <CardHeader>
                <CardTitle className="text-center">Compare All Features</CardTitle>
                <CardDescription className="text-center">
                  Everything you need for comprehensive men's health tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-4 px-6 font-semibold">Features</th>
                        <th className="text-center py-4 px-6 font-semibold">Free</th>
                        <th className="text-center py-4 px-6 font-semibold">Pro</th>
                        <th className="text-center py-4 px-6 font-semibold">Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-4 px-6 font-medium">3D/2D Morphology Scanner</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="py-4 px-6 font-medium">Health Diary & Calendar</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium">Education Center</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="py-4 px-6 font-medium">Emergency Guidance</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-500" />
                          Positions Gallery
                        </td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="py-4 px-6 font-medium">PE Progress Photos</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium">Cloud Backup & Sync</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="py-4 px-6 font-medium flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          AI Health Chatbot
                        </td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium flex items-center gap-2">
                          <Crown className="h-4 w-4 text-purple-500" />
                          AI Scan Analysis
                        </td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td className="py-4 px-6 font-medium">Medical Export (HL7 FHIR)</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 font-medium">Priority Support</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4">—</td>
                        <td className="text-center py-4"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div className="max-w-4xl mx-auto mt-16">
              <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your current billing period for downgrades.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Is my data secure?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Absolutely. All health data is encrypted with AES-256-GCM encryption. We follow HIPAA guidelines and GDPR compliance standards.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      We accept all major credit cards, PayPal, and digital wallets through our secure Stripe integration.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Yes, you can cancel your subscription at any time. You'll retain access to premium features until the end of your billing period.
                    </p>
                  </CardContent>
                </Card>

                {isHybridVersion && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">What is the DLC upgrade?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          The DLC upgrade unlocks all NSFW content and features. It's a one-time purchase that requires the base SFW app. Purchase from our website after installing the app.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">How do I activate my DLC license?</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          After purchasing, you'll receive a license key via email. Go to the DLC page in the app and enter your license key to unlock NSFW content.
                        </p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Pricing
