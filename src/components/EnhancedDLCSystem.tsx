/**
 * Enhanced DLC System
 * Modular DLC, bundles, previews, streaming, downloads, content library organization, updates, and backups
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getDLCPacks,
  getDLCBundles,
  purchaseDLC,
  getDLCPurchases,
  getDownloadQueue,
  getDLCUpdates,
  type DLCPack,
  type DLCBundle,
  type DLCPurchase,
  type DLCDownloadQueueItem,
  type DLCUpdate,
} from "@/lib/enhancedDLCSystem";
import { hasNSFWContent, isSFW } from "@/lib/featureFlags";
import {
  Package,
  ShoppingCart,
  Download,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Lock,
  Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const EnhancedDLCSystem = () => {
  const [activeTab, setActiveTab] = useState("packs");
  const [loading, setLoading] = useState(false);
  const [packs, setPacks] = useState<DLCPack[]>([]);
  const [bundles, setBundles] = useState<DLCBundle[]>([]);
  const [purchases, setPurchases] = useState<DLCPurchase[]>([]);
  const [downloadQueue, setDownloadQueue] = useState<DLCDownloadQueueItem[]>([]);
  const [updates, setUpdates] = useState<DLCUpdate[]>([]);
  const [nsfwAvailable, setNsfwAvailable] = useState(false);
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "packs": {
          const packsData = await getDLCPacks();
          setPacks(packsData);
          break;
        }
        case "bundles": {
          const bundlesData = await getDLCBundles();
          setBundles(bundlesData);
          break;
        }
        case "purchases": {
          const purchasesData = await getDLCPurchases();
          setPurchases(purchasesData);
          break;
        }
        case "downloads": {
          const queueData = await getDownloadQueue();
          setDownloadQueue(queueData);
          break;
        }
        case "updates": {
          const updatesData = await getDLCUpdates();
          setUpdates(updatesData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load DLC data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const checkNsfw = async () => {
      setIsCheckingNsfw(true);
      const available = await hasNSFWContent();
      setNsfwAvailable(available);
      setIsCheckingNsfw(false);
    };
    void checkNsfw();
  }, []);

  useEffect(() => {
    if (nsfwAvailable) {
      void loadData();
    }
  }, [activeTab, nsfwAvailable, loadData]);

  const handlePurchase = async (packId: string) => {
    try {
      const success = await purchaseDLC(packId);
      if (success) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to start purchase");
    }
  };

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
    );
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
              DLC content is only available in the NSFW version or with a DLC upgrade.
            </p>
            <Badge variant="secondary">Requires NSFW Version or DLC</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            Enhanced DLC System
          </CardTitle>
          <CardDescription>
            Browse and purchase downloadable content packs, bundles, and premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="packs">Packs</TabsTrigger>
              <TabsTrigger value="bundles">Bundles</TabsTrigger>
              <TabsTrigger value="purchases">My Purchases</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="packs" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packs.map(pack => (
                    <Card
                      key={pack.id}
                      className="glass-card border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{pack.pack_name}</CardTitle>
                          {pack.is_featured && <Badge variant="default">Featured</Badge>}
                        </div>
                        <CardDescription>{pack.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {pack.item_count} items
                          </span>
                          <span className="text-lg font-semibold">${pack.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {pack.average_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{pack.average_rating.toFixed(1)}</span>
                            </div>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {pack.sales_count} sales
                          </span>
                        </div>
                        <Button className="w-full" onClick={() => handlePurchase(pack.id)}>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Purchase
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bundles" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bundles.map(bundle => (
                    <Card key={bundle.id} className="glass-card border-border/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle>{bundle.bundle_name}</CardTitle>
                          {bundle.discount_percentage && (
                            <Badge variant="default">{bundle.discount_percentage}% OFF</Badge>
                          )}
                        </div>
                        <CardDescription>{bundle.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {bundle.pack_count} packs
                          </span>
                          <div className="flex items-center gap-2">
                            {bundle.original_price && (
                              <span className="text-sm line-through text-muted-foreground">
                                ${bundle.original_price.toFixed(2)}
                              </span>
                            )}
                            <span className="text-lg font-semibold">
                              ${bundle.bundle_price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <Button className="w-full">Purchase Bundle</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4">
              {purchases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No purchases yet</div>
              ) : (
                <div className="space-y-2">
                  {purchases.map(purchase => (
                    <Card key={purchase.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Pack ID: {purchase.pack_id}</p>
                            <p className="text-sm text-muted-foreground">
                              Purchased: {new Date(purchase.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={purchase.is_active ? "default" : "secondary"}>
                            {purchase.is_active ? "Active" : "Expired"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="downloads" className="space-y-4">
              {downloadQueue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No downloads in queue</div>
              ) : (
                <div className="space-y-2">
                  {downloadQueue.map(item => (
                    <Card key={item.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.content_item_id}</p>
                            <p className="text-sm text-muted-foreground">{item.content_type}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.download_status === "downloading" && (
                              <div className="w-32">
                                <Progress value={item.download_progress} />
                              </div>
                            )}
                            {item.download_status === "completed" && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                            <Badge
                              variant={
                                item.download_status === "completed"
                                  ? "default"
                                  : item.download_status === "downloading"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {item.download_status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="updates" className="space-y-4">
              {updates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No updates available</div>
              ) : (
                <div className="space-y-2">
                  {updates.map(update => (
                    <Card key={update.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Version {update.version_number}</p>
                            <p className="text-sm text-muted-foreground">{update.update_type}</p>
                          </div>
                          {update.is_required && <Badge variant="default">Required</Badge>}
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
  );
};
