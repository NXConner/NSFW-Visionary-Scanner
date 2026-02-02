import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  BookOpen,
  Users,
  BarChart3,
} from "lucide-react";
import { useOptionalDLC } from "@/dlc/context/DLCContext";
import { dlcRegistry } from "@/dlc/core/DLCRegistry";
import type { DLCPackage } from "@/dlc/core/types";
import { cn } from "@/lib/utils";

const NewDLCShowcase = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const dlc = useOptionalDLC();
  const packages = dlc?.packages ?? dlcRegistry.getAllPackages();
  const ownedPackages = dlc?.ownedPackages ?? [];
  const isLoading = Boolean(dlc?.isLoading);
  const isInitialized = Boolean(dlc?.isInitialized);

  const spotlightPackageIds = useMemo(
    () =>
      new Set<string>([
        "dlc-nsfw-scanner",
        "dlc-topics-library",
        "dlc-analytics",
        "dlc-community",
        "dlc-advanced-nsfw-detection",
      ]),
    [],
  );

  const showcasePackages = useMemo<DLCPackage[]>(() => {
    // Focus this page on the NSFW DLC add-ons and their "new" standalone modules.
    const nsfw = (packages || []).filter(
      p => (p.contentRating === "18+" || p.contentRating === "adult") && p.isActive,
    );
    const spotlight = nsfw.filter(p => spotlightPackageIds.has(p.packageId));
    // Fall back to other active NSFW packages if spotlight is empty (older catalogs).
    return (spotlight.length ? spotlight : nsfw).sort((a, b) => a.displayOrder - b.displayOrder);
  }, [packages, spotlightPackageIds]);

  const categories = [
    { id: "all", label: "All NSFW Add-Ons", icon: Sparkles },
    { id: "scanner", label: "Scanner", icon: Shield },
    { id: "topics", label: "Topics", icon: BookOpen },
    { id: "community", label: "Community", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const filteredPackages = useMemo(() => {
    if (selectedCategory === "all") return showcasePackages;
    if (selectedCategory === "scanner")
      return showcasePackages.filter(p => p.packageId === "dlc-nsfw-scanner");
    if (selectedCategory === "topics") {
      return showcasePackages.filter(
        p => p.packageId === "dlc-topics-library" || p.packageId.startsWith("dlc-topic-"),
      );
    }
    if (selectedCategory === "community") {
      return showcasePackages.filter(
        p => p.packageId === "dlc-community" || p.features.some(f => f.category === "community"),
      );
    }
    if (selectedCategory === "analytics") {
      return showcasePackages.filter(
        p => p.packageId === "dlc-analytics" || p.features.some(f => f.category === "analytics"),
      );
    }
    return showcasePackages;
  }, [selectedCategory, showcasePackages]);

  const formatPrice = (pkg: DLCPackage) => {
    const base = `$${pkg.priceUsd.toFixed(2)}`;
    if (pkg.priceType === "subscription") return `${base}/month`;
    return base;
  };

  const handleSubscribe = (pkg: DLCPackage) => {
    // Route through the DLC store so it can enforce age verification and show Stripe mapping status.
    navigate(`/store?package=${encodeURIComponent(pkg.packageId)}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">NSFW DLC ADD-ONS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold">NSFW Add-Ons Showcase</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse the adult-rated DLC add-ons: scanner controls, topics library, private community,
          and analytics modules. Purchases are routed through the in-app store (age gate enforced).
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span>
              <strong>Modular NSFW add-ons</strong> with strict gating
            </span>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-8">
          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPackages.map(pkg => {
              const isOwned = ownedPackages.some(o => o.packageId === pkg.packageId);
              return (
                <Card
                  key={pkg.packageId}
                  className={cn(
                    "glass-card border-border/50 hover:border-primary/50 transition-all relative",
                    isOwned && "border-green-500/40",
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{pkg.packageName}</CardTitle>
                          <div className="mt-1 flex gap-2">
                            {isOwned ? (
                              <Badge className="bg-green-600">Owned</Badge>
                            ) : (
                              <Badge variant="secondary">Store</Badge>
                            )}
                            {pkg.packageType === "subscription" ? (
                              <Badge variant="outline">Subscription</Badge>
                            ) : (
                              <Badge variant="outline">One-time</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-3">{pkg.safeDescription}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Pricing */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-3xl font-bold">{formatPrice(pkg)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {pkg.marketingTagline}
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2">
                      {pkg.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature.name}</span>
                        </li>
                      ))}
                      {pkg.features.length > 5 && (
                        <li className="text-sm text-muted-foreground pl-6">
                          +{pkg.features.length - 5} more features...
                        </li>
                      )}
                    </ul>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleSubscribe(pkg)}
                      className="w-full"
                      variant={isOwned ? "outline" : "default"}
                    >
                      {isOwned ? "View in Store" : "Open in Store"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        navigate(`/store?package=${encodeURIComponent(pkg.packageId)}`)
                      }
                    >
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Call to Action */}
      <div className="mt-16 text-center glass-card border-border/50 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Ready to unlock premium features?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Browse the DLC store for full package details, Stripe mappings, and installation status.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/store")}
            disabled={!isInitialized || isLoading}
          >
            Open DLC Store
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/nsfw/landing")}>
            NSFW Add-ons Landing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewDLCShowcase;
