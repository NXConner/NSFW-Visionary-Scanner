/**
 * Premium Content Marketplace
 * Premium position packs, video content, educational courses, expert-created content, ratings, and purchases
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getPremiumContent,
  purchasePremiumContent,
  addToWishlist,
  getWishlist,
  createPremiumContentReview,
  type PremiumContentItem
} from '@/lib/premiumContentMarketplace'
import { hasNSFWContent, isSFW } from '@/lib/featureFlags'
import { ShoppingBag, Heart, Star, TrendingUp, Loader2, Lock, Search, Filter, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export const PremiumContentMarketplace = () => {
  const [activeTab, setActiveTab] = useState('browse')
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<PremiumContentItem[]>([])
  const [wishlist, setWishlist] = useState<PremiumContentItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [nsfwAvailable, setNsfwAvailable] = useState(false)
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true)

  const contentTypes = [
    { id: 'all', label: 'All Types' },
    { id: 'position_pack', label: 'Position Packs' },
    { id: 'video', label: 'Videos' },
    { id: 'course', label: 'Courses' },
    { id: 'expert_content', label: 'Expert Content' },
    { id: 'bundle', label: 'Bundles' }
  ]

  useEffect(() => {
    const checkNsfw = async () => {
      setIsCheckingNsfw(true)
      const available = await hasNSFWContent()
      setNsfwAvailable(available)
      setIsCheckingNsfw(false)
    }
    checkNsfw()
  }, [])

  useEffect(() => {
    if (nsfwAvailable) {
      loadData()
    }
  }, [activeTab, selectedCategory, selectedType, nsfwAvailable])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'browse': {
          const contentData = await getPremiumContent(
            selectedType === 'all' ? undefined : selectedType as any,
            selectedCategory === 'all' ? undefined : selectedCategory
          )
          setContent(contentData)
          break
        }
        case 'wishlist': {
          const wishlistData = await getWishlist()
          setWishlist(wishlistData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load content')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (contentId: string) => {
    try {
      const success = await purchasePremiumContent(contentId)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to start purchase')
    }
  }

  const handleAddToWishlist = async (contentId: string) => {
    try {
      const success = await addToWishlist(contentId)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to add to wishlist')
    }
  }

  if (isCheckingNsfw) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSFW() || !nsfwAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">NSFW Content Not Available</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Premium content marketplace is only available in the NSFW version or with a DLC upgrade.
            </p>
            <Badge variant="secondary">Requires NSFW Version or DLC</Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Premium Content Marketplace
          </CardTitle>
          <CardDescription>
            Browse and purchase premium position packs, videos, courses, and expert-created content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContent.map(item => (
                    <Card key={item.id} className="glass-card border-border/50 hover:border-primary/50 transition-colors">
                      <CardContent className="p-0">
                        <div className="relative aspect-video bg-muted/30 rounded-t-lg overflow-hidden">
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {item.is_featured && (
                            <Badge className="absolute top-2 left-2" variant="default">
                              Featured
                            </Badge>
                          )}
                          {item.is_verified && (
                            <Badge className="absolute top-2 right-2" variant="secondary">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                          {item.expert_name && (
                            <p className="text-xs text-muted-foreground">By {item.expert_name}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {item.average_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{item.average_rating.toFixed(1)}</span>
                                </div>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {item.purchase_count} purchases
                              </span>
                            </div>
                            <span className="text-lg font-semibold">${item.price.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handlePurchase(item.id)}
                            >
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              Purchase
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToWishlist(item.id)}
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredContent.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  No content found
                </div>
              )}
            </TabsContent>

            <TabsContent value="wishlist" className="space-y-4">
              {wishlist.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Your wishlist is empty
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map(item => (
                    <Card key={item.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold">${item.price.toFixed(2)}</span>
                          <Button size="sm" onClick={() => handlePurchase(item.id)}>
                            Purchase
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

