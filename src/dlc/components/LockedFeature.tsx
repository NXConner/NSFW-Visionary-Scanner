/**
 * Locked Feature Component
 * Displays a placeholder for locked DLC content
 */

import React from "react";
import { motion } from "framer-motion";
import { Lock, ArrowRight, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDLC } from "../context/DLCContext";
import type { DLCPackage, DLCFeature } from "../core/types";

interface LockedFeatureProps {
  featureId?: string;
  packageId?: string;
  title?: string;
  description?: string;
  onUnlock?: () => void;
  showPreview?: boolean;
  previewContent?: React.ReactNode;
}

export function LockedFeature({
  featureId,
  packageId,
  title,
  description,
  onUnlock,
  showPreview = true,
  previewContent,
}: LockedFeatureProps): React.ReactElement {
  const { packages } = useDLC();

  // Find the package that contains this feature
  const relevantPackage = React.useMemo(() => {
    if (packageId) {
      return packages.find(p => p.packageId === packageId);
    }
    if (featureId) {
      return packages.find(p => p.features.some(f => f.id === featureId));
    }
    return undefined;
  }, [packages, packageId, featureId]);

  const feature = relevantPackage?.features.find(f => f.id === featureId);

  const displayTitle = title || feature?.name || "Premium Feature";
  const displayDescription =
    description ||
    feature?.description ||
    relevantPackage?.safeDescription ||
    "This feature requires a premium add-on.";

  const handleUnlock = () => {
    if (onUnlock) {
      onUnlock();
    } else if (relevantPackage) {
      // Navigate to DLC store with package selected
      window.location.href = `/store?package=${relevantPackage.packageId}`;
    }
  };

  return (
    <Card className="relative overflow-hidden border-dashed border-2">
      {/* Blurred Preview */}
      {showPreview && previewContent && (
        <div className="absolute inset-0 blur-md opacity-30 pointer-events-none">
          {previewContent}
        </div>
      )}

      {/* Locked Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 min-h-[300px] text-center">
        {/* Lock Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10 }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50" />
            <div className="relative p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-bold mb-2">{displayTitle}</h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-md">{displayDescription}</p>

        {/* Package Info */}
        {relevantPackage && (
          <div className="mb-6 space-y-2">
            <Badge variant="secondary" className="text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              {relevantPackage.packageName}
            </Badge>
            {relevantPackage.isFeatured && (
              <Badge className="ml-2 bg-purple-500">
                <Crown className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            <div className="text-lg font-bold text-primary">
              ${relevantPackage.priceUsd.toFixed(2)}
              {relevantPackage.priceType === "subscription" && (
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              )}
            </div>
          </div>
        )}

        {/* Unlock Button */}
        <Button
          onClick={handleUnlock}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          Unlock Now
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {/* Features List */}
        {relevantPackage && relevantPackage.features.length > 0 && (
          <div className="mt-6 pt-6 border-t w-full max-w-sm">
            <p className="text-xs text-muted-foreground mb-2">Includes:</p>
            <div className="flex flex-wrap justify-center gap-1">
              {relevantPackage.features.slice(0, 4).map(f => (
                <Badge key={f.id} variant="outline" className="text-xs">
                  {f.name}
                </Badge>
              ))}
              {relevantPackage.features.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{relevantPackage.features.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Feature Gate Component
 * Renders children if feature is available, otherwise shows LockedFeature
 */
interface FeatureGateProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  featureId,
  children,
  fallback,
}: FeatureGateProps): React.ReactElement {
  const { hasFeature, isInitialized, isLoading } = useDLC();

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!hasFeature(featureId)) {
    return fallback ? <>{fallback}</> : <LockedFeature featureId={featureId} />;
  }

  return <>{children}</>;
}
