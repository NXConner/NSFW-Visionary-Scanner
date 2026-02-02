/**
 * DLC Package Card Component
 * Displays a single DLC package with purchase/install options
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Video,
  BarChart,
  Users,
  Sparkles,
  BookOpen,
  Check,
  Download,
  Lock,
  Crown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TiltCard } from "@/components/premium";
import { useDLC } from "../context/DLCContext";
import { useDownloadProgress } from "../hooks/useDLCContent";
import type { DLCPackage, DLCFeature } from "../core/types";
import { createDLCCheckoutSession } from "@/lib/dlcCheckout";
import { toast } from "sonner";

// Feature category icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  positions: <Heart className="h-4 w-4" />,
  videos: <Video className="h-4 w-4" />,
  analytics: <BarChart className="h-4 w-4" />,
  community: <Users className="h-4 w-4" />,
  advanced: <Sparkles className="h-4 w-4" />,
  topics: <BookOpen className="h-4 w-4" />,
  marketplace: <Star className="h-4 w-4" />,
};

interface DLCPackageCardProps {
  package: DLCPackage;
  onAction?: () => boolean;
  showSavings?: boolean;
  promoCode?: string;
}

export function DLCPackageCard({
  package: pkg,
  onAction,
  showSavings = false,
  promoCode,
}: DLCPackageCardProps): React.ReactElement {
  const { ownsPackage, isPackageInstalled, installPackage, calculateUpgradePrice } = useDLC();
  const downloadProgress = useDownloadProgress(pkg.packageId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const isOwned = ownsPackage(pkg.packageId);
  const isInstalled = isPackageInstalled(pkg.packageId);
  const upgradePrice = calculateUpgradePrice(pkg.packageId);
  const hasUpgradeDiscount = upgradePrice < pkg.priceUsd && upgradePrice > 0;

  // Calculate savings for bundles
  const bundleSavings =
    showSavings && pkg.includedPackages
      ? Math.round((1 - pkg.priceUsd / (pkg.features.length * 9.99)) * 100)
      : 0;

  const handleAction = async () => {
    if (onAction && !onAction()) return;

    if (isOwned && !isInstalled) {
      setIsInstalling(true);
      try {
        await installPackage(pkg.packageId);
      } finally {
        setIsInstalling(false);
      }
    } else if (!isOwned) {
      const url = await createDLCCheckoutSession(pkg.packageId, { promoCode });
      if (!url) {
        toast.error("Unable to start checkout. Please try again.");
        return;
      }
      window.location.href = url;
    }
  };

  return (
    <TiltCard
      variant="interactive"
      maxTilt={pkg.isFeatured ? 12 : 8}
      glow={Boolean(pkg.isFeatured)}
      className={`relative overflow-hidden transition-all duration-300 ${
        pkg.isFeatured ? "border-purple-500 shadow-lg shadow-purple-500/20" : ""
      }`}
    >
      {/* Featured Badge */}
      {pkg.isFeatured && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-purple-500">
            <Crown className="h-3 w-3 mr-1" /> Featured
          </Badge>
        </div>
      )}

      {/* Owned Badge */}
      {isOwned && (
        <div className="absolute top-0 left-0">
          <Badge className="rounded-none rounded-br-lg bg-green-500">
            <Check className="h-3 w-3 mr-1" /> Owned
          </Badge>
        </div>
      )}

      <CardHeader className={pkg.isFeatured || isOwned ? "pt-8" : ""}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{pkg.packageName}</CardTitle>
            <CardDescription className="mt-1">{pkg.safeDescription}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          {hasUpgradeDiscount ? (
            <>
              <span className="text-2xl font-bold text-green-500">${upgradePrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">
                ${pkg.priceUsd.toFixed(2)}
              </span>
              <Badge variant="secondary" className="text-xs">
                Upgrade Price
              </Badge>
            </>
          ) : (
            <span className="text-2xl font-bold">${pkg.priceUsd.toFixed(2)}</span>
          )}

          {pkg.priceType === "subscription" && (
            <span className="text-sm text-muted-foreground">/month</span>
          )}

          {bundleSavings > 0 && (
            <Badge className="bg-green-500 text-white text-xs">Save {bundleSavings}%</Badge>
          )}
        </div>

        {/* Features Preview */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Includes:</h4>
          <div className="flex flex-wrap gap-2">
            {pkg.features.slice(0, 3).map(feature => (
              <Badge key={feature.id} variant="outline" className="text-xs">
                {CATEGORY_ICONS[feature.category]}
                <span className="ml-1">{feature.name}</span>
              </Badge>
            ))}
            {pkg.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{pkg.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Expandable Features */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View All Features
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {pkg.features.map(feature => (
              <div key={feature.id} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{feature.name}</span>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}

            {pkg.includedPackages && pkg.includedPackages.length > 0 && (
              <div className="pt-2 border-t">
                <h5 className="text-xs font-medium text-muted-foreground mb-1">
                  Includes packages:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {pkg.includedPackages.map(id => (
                    <Badge key={id} variant="secondary" className="text-xs">
                      {id.replace("dlc-", "")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Download Progress */}
        {downloadProgress && downloadProgress.status === "downloading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Downloading...</span>
              <span>{downloadProgress.progress}%</span>
            </div>
            <Progress value={downloadProgress.progress} />
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isInstalled ? (
          <Button className="w-full" variant="secondary" disabled>
            <Check className="h-4 w-4 mr-2" />
            Installed
          </Button>
        ) : isOwned ? (
          <Button className="w-full" onClick={handleAction} disabled={isInstalling}>
            {isInstalling ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Download className="h-4 w-4 mr-2" />
                </motion.div>
                Installing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Install
              </>
            )}
          </Button>
        ) : (
          <Button className="w-full" onClick={handleAction}>
            <ExternalLink className="h-4 w-4 mr-2" />
            {hasUpgradeDiscount ? "Upgrade" : "Purchase"}
          </Button>
        )}
      </CardFooter>
    </TiltCard>
  );
}
