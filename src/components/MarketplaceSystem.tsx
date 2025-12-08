/**
 * Marketplace System
 * Comprehensive marketplace for routines, expert consultations, custom reports, equipment, and supplements
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getMarketplaceItems,
  purchaseMarketplaceItem,
  getUserConsultations,
  bookExpertConsultation,
  generateCustomReport,
  getEquipmentRecommendations,
  getSupplementRecommendations,
  type MarketplaceItem,
  type ExpertConsultation,
  type EquipmentRecommendation,
  type SupplementRecommendation
} from '@/lib/marketplaceSystem'
import { ShoppingBag, Users, FileText, Dumbbell, Pill, Calendar, Search, Star, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const MarketplaceSystem = () => {
  const [activeTab, setActiveTab] = useState('routines')
  const [loading, setLoading] = useState(false)
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([])
  const [consultations, setConsultations] = useState<ExpertConsultation[]>([])
  const [equipment, setEquipment] = useState<EquipmentRecommendation[]>([])
  const [supplements, setSupplements] = useState<SupplementRecommendation[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab, selectedCategory])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'routines':
        case 'courses':
        case 'videos': {
          const items = await getMarketplaceItems(
            activeTab === 'routines' ? 'routine' :
            activeTab === 'courses' ? 'course' :
            'video'
          )
          setMarketplaceItems(items)
          break
        }
        case 'consultations': {
          const consultationsData = await getUserConsultations()
          setConsultations(consultationsData)
          break
        }
        case 'equipment': {
          const equipmentData = await getEquipmentRecommendations()
          setEquipment(equipmentData)
          break
        }
        case 'supplements': {
          const supplementsData = await getSupplementRecommendations()
          setSupplements(supplementsData)
          break
        }
      }
    } catch (error) {
      toast.error('Failed to load marketplace data')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (itemId: string) => {
    try {
      const success = await purchaseMarketplaceItem(itemId)
      if (success) {
        await loadData()
      }
    } catch (error) {
      toast.error('Failed to start purchase')
    }
  }

  const filteredItems = marketplaceItems.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            Marketplace
          </CardTitle>
          <CardDescription>
            Browse routines, courses, expert consultations, equipment, and supplements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="routines">Routines</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="consultations">Consultations</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="supplements">Supplements</TabsTrigger>
            </TabsList>

            <TabsContent value="routines" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search routines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map(item => (
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
                              <Dumbbell className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {item.is_featured && (
                            <Badge className="absolute top-2 left-2" variant="default">
                              Featured
                            </Badge>
                          )}
                          {item.is_verified && (
                            <Badge className="absolute top-2 right-2" variant="secondary">
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
                            <span className="text-lg font-semibold">
                              {item.is_free ? 'Free' : `$${item.price.toFixed(2)}`}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handlePurchase(item.id)}
                          >
                            {item.is_free ? 'Get Free' : 'Purchase'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredItems.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  No routines found
                </div>
              )}
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                Educational courses coming soon
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              <div className="text-center py-12 text-muted-foreground">
                Expert video content coming soon
              </div>
            </TabsContent>

            <TabsContent value="consultations" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Expert Consultations</h3>
                <Button size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Consultation
                </Button>
              </div>
              {consultations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No consultations booked yet
                </div>
              ) : (
                <div className="space-y-2">
                  {consultations.map(consultation => (
                    <Card key={consultation.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{consultation.consultation_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {consultation.scheduled_at
                                ? new Date(consultation.scheduled_at).toLocaleString()
                                : 'Not scheduled'}
                            </p>
                          </div>
                          <Badge variant={
                            consultation.consultation_status === 'completed' ? 'default' :
                            consultation.consultation_status === 'confirmed' ? 'secondary' :
                            'outline'
                          }>
                            {consultation.consultation_status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipment.map(item => (
                    <Card key={item.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.equipment_name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{item.equipment_name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {item.equipment_description}
                            </p>
                            <div className="flex items-center justify-between">
                              {item.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{item.rating.toFixed(1)}</span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(item.affiliate_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="supplements" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplements.map(item => (
                    <Card key={item.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.supplement_name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{item.supplement_name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {item.supplement_description}
                            </p>
                            <div className="flex items-center justify-between">
                              {item.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{item.rating.toFixed(1)}</span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(item.affiliate_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </div>
                          </div>
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

