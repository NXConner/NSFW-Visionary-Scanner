/**
 * DLC Store Component
 * Main storefront for browsing and purchasing DLC packages
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Video,
  BarChart,
  Users,
  BookOpen,
  Sparkles,
  Crown,
  Check,
  Download,
  Star,
  Lock,
  ArrowRight,
  Package,
  Zap,
  ShoppingCart,
  ExternalLink,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Reveal } from "@/components/premium/Reveal";
import { AnimatedNumber } from "@/components/premium/AnimatedNumber";
import { useDLC } from "../context/DLCContext";
import { DLCPackageCard } from "./DLCPackageCard";
import { AgeVerificationModal } from "./AgeVerificationModal";
import { UpdateSourceWarning } from "./UpdateSourceWarning";
import type { DLCPackage } from "../core/types";
import { createDLCCheckoutSession } from "@/lib/dlcCheckout";
import { toast } from "sonner";
import { useDLCStore } from "../hooks/useDLCStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  positions: <Heart className="h-5 w-5" />,
  videos: <Video className="h-5 w-5" />,
  analytics: <BarChart className="h-5 w-5" />,
  community: <Users className="h-5 w-5" />,
  topics: <BookOpen className="h-5 w-5" />,
  advanced: <Sparkles className="h-5 w-5" />,
};

export function DLCStore(): React.ReactElement {
  const {
    packages,
    featuredPackages,
    ownedPackages,
    installedPackages,
    isLoading,
    isAgeVerified,
    updateSource,
    isUpdateSourceAcknowledged,
  } = useDLC();

  const { promoCode, setPromoCode, promoDiscount, applyPromo } = useDLCStore();
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoStatus, setPromoStatus] = useState<"idle" | "applied" | "invalid">("idle");

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [showUpdateWarning, setShowUpdateWarning] = useState(false);

  // Filter packages by category
  const filteredPackages = useMemo(() => {
    if (selectedCategory === "all") return packages;
    if (selectedCategory === "owned") {
      return packages.filter(p => ownedPackages.some(o => o.packageId === p.packageId));
    }
    if (selectedCategory === "bundles") {
      return packages.filter(p => p.packageType === "bundle");
    }
    return packages.filter(p => p.features.some(f => f.category === selectedCategory));
  }, [packages, selectedCategory, ownedPackages]);

  // Separate individual and bundle packages
  const individualPackages = filteredPackages.filter(p => p.packageType === "individual");
  const bundlePackages = filteredPackages.filter(p => p.packageType === "bundle");
  const subscriptionPackages = packages.filter(p => p.packageType === "subscription");

  // Check if user needs age verification for any action
  const handlePackageAction = (pkg: DLCPackage) => {
    if (!isAgeVerified && pkg.contentRating === "18+") {
      setShowAgeVerification(true);
      return false;
    }

    // Check if this is first DLC purchase and show update source warning
    if (installedPackages.length === 0 && !isUpdateSourceAcknowledged) {
      setShowUpdateWarning(true);
      return false;
    }

    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <Reveal variant="fade-up" delay={0}>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            Premium Add-Ons
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unlock exclusive features and content to enhance your experience
          </p>
        </div>
      </Reveal>

      {/* Promo Code */}
      <Reveal variant="fade-up" delay={0.12}>
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promo code
            </CardTitle>
            <CardDescription>
              If you have a promo code, apply it here. Valid codes will also be passed into Stripe
              checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="dlcPromoCode">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="dlcPromoCode"
                  placeholder="SUMMER2024"
                  value={promoCode}
                  onChange={e => {
                    setPromoStatus("idle");
                    setPromoCode(e.target.value.toUpperCase());
                  }}
                  className="font-mono"
                  autoComplete="off"
                  inputMode="text"
                />
                <Button
                  variant="secondary"
                  disabled={!promoCode.trim() || isApplyingPromo}
                  onClick={async () => {
                    setIsApplyingPromo(true);
                    try {
                      const ok = await applyPromo();
                      setPromoStatus(ok ? "applied" : "invalid");
                      if (ok) {
                        toast.success(
                          promoDiscount > 0
                            ? `Promo applied (${Math.round(promoDiscount)}% off)`
                            : "Promo applied",
                        );
                      } else {
                        toast.error("Promo code invalid or not applicable");
                      }
                    } finally {
                      setIsApplyingPromo(false);
                    }
                  }}
                >
                  {isApplyingPromo ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="h-4 w-4 mr-2" />
                      </motion.div>
                      Checking
                    </>
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            </div>

            {promoStatus === "applied" && promoDiscount > 0 && (
              <div className="text-sm text-green-600">
                Active discount: <strong>{Math.round(promoDiscount)}%</strong>
              </div>
            )}
            {promoStatus === "invalid" && (
              <div className="text-sm text-destructive">That promo code is not valid.</div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* Featured Banner */}
      {featuredPackages.length > 0 && (
        <Reveal variant="fade-up" delay={0.1}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-8"
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <Badge className="mb-2 bg-yellow-500 text-black">
                  <Crown className="h-3 w-3 mr-1" /> BEST VALUE
                </Badge>
                <h2 className="text-3xl font-bold text-white mb-2">Ultimate Complete Pack</h2>
                <p className="text-white/80 max-w-md">
                  Get everything - all features, all content, lifetime access. The best value for
                  the complete experience.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-4xl font-bold text-white">
                    $<AnimatedNumber value={39.99} decimals={2} className="text-white" />
                  </span>
                  <span className="text-white/60 line-through">$69.99</span>
                  <Badge className="bg-green-500 text-white">Save 43%</Badge>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-white/90"
                onClick={async () => {
                  const pkg = packages.find(p => p.packageId === "dlc-complete");
                  if (pkg && handlePackageAction(pkg)) {
                    const url = await createDLCCheckoutSession("dlc-complete", { promoCode });
                    if (!url) {
                      toast.error("Unable to start checkout. Please try again.");
                      return;
                    }
                    window.location.href = url;
                  }
                }}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Get Complete Pack
              </Button>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          </motion.div>
        </Reveal>
      )}

      {/* Category Tabs */}
      <Reveal variant="fade-up" delay={0.2}>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary">
              <Package className="h-4 w-4 mr-2" />
              All Packages
            </TabsTrigger>
            <TabsTrigger value="bundles" className="data-[state=active]:bg-primary">
              <Zap className="h-4 w-4 mr-2" />
              Bundles
            </TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-primary">
              <Heart className="h-4 w-4 mr-2" />
              Positions
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary">
              <Video className="h-4 w-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="topics" className="data-[state=active]:bg-primary">
              <BookOpen className="h-4 w-4 mr-2" />
              Topics
            </TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-primary">
              <Users className="h-4 w-4 mr-2" />
              Community
            </TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-primary">
              <Sparkles className="h-4 w-4 mr-2" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="owned" className="data-[state=active]:bg-primary">
              <Check className="h-4 w-4 mr-2" />
              Owned (<AnimatedNumber value={ownedPackages.length} />)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Reveal>

      {/* Package Grid */}
      <div className="space-y-8">
        {/* Individual Packages */}
        {individualPackages.length > 0 && selectedCategory !== "bundles" && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Individual Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {individualPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.packageId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DLCPackageCard
                      package={pkg}
                      promoCode={promoCode}
                      onAction={() => handlePackageAction(pkg)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Bundle Packages */}
        {bundlePackages.length > 0 && selectedCategory !== "owned" && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Bundle Packages
              <Badge variant="secondary">Better Value</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {bundlePackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.packageId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <DLCPackageCard
                      package={pkg}
                      onAction={() => handlePackageAction(pkg)}
                      promoCode={promoCode}
                      showSavings
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Subscription Option */}
        {subscriptionPackages.length > 0 && selectedCategory === "all" && (
          <Reveal variant="fade-up" delay={0.3}>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-500" />
                Subscription
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {subscriptionPackages.map((pkg, index) => (
                    <motion.div
                      key={pkg.packageId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <DLCPackageCard
                        package={pkg}
                        promoCode={promoCode}
                        onAction={() => handlePackageAction(pkg)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        )}

        {/* Empty State */}
        {filteredPackages.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No packages found</h3>
            <p className="text-muted-foreground">
              {selectedCategory === "owned"
                ? "You don't own any packages yet"
                : "No packages match your filter"}
            </p>
            {selectedCategory === "owned" && (
              <Button className="mt-4" onClick={() => setSelectedCategory("all")}>
                Browse Packages
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground space-y-2 pt-8 border-t">
        <p>All purchases are processed securely through our official website.</p>
        <p className="flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          Your purchase includes lifetime updates for that package.
        </p>
        <Button variant="link" className="text-xs">
          <ExternalLink className="h-3 w-3 mr-1" />
          View on Official Website
        </Button>
      </div>

      {/* Age Verification Modal */}
      <AgeVerificationModal
        isOpen={showAgeVerification}
        onClose={() => setShowAgeVerification(false)}
      />

      {/* Update Source Warning */}
      <UpdateSourceWarning isOpen={showUpdateWarning} onClose={() => setShowUpdateWarning(false)} />
    </div>
  );
}
