/**
 * Upgrade Prompt Component
 * Shows upgrade/purchase prompt for DLC content
 */

import React from "react";
import { Lock, Crown, Sparkles, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface UpgradePromptProps {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  packName?: string;
  features?: string[];
  onUpgrade?: () => void;
  onLearnMore?: () => void;
  variant?: "default" | "inline" | "modal" | "banner";
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  title = "Unlock Premium Content",
  description = "Get access to exclusive content and features",
  price,
  currency = "USD",
  packName,
  features = [],
  onUpgrade,
  onLearnMore,
  variant = "default",
  className,
}) => {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button onClick={onUpgrade} size="sm">
          Unlock
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 p-6",
          className,
        )}
      >
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
              {price && (
                <p className="text-lg font-semibold text-primary mt-1">{formatPrice(price)}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {onLearnMore && (
              <Button variant="outline" onClick={onLearnMore}>
                Learn More
              </Button>
            )}
            <Button onClick={onUpgrade}>
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-gradient-to-br from-primary to-purple-500">
            <Crown className="h-6 w-6 text-white" />
          </div>
          {packName && (
            <span className="text-sm font-medium text-muted-foreground">{packName}</span>
          )}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="relative">
        {features.length > 0 && (
          <ul className="space-y-2 mb-4">
            {features.map(feature => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {price && (
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Starting at</p>
            <p className="text-3xl font-bold text-primary">{formatPrice(price)}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="relative flex gap-2">
        {onLearnMore && (
          <Button variant="outline" className="flex-1" onClick={onLearnMore}>
            Learn More
          </Button>
        )}
        <Button className="flex-1" onClick={onUpgrade}>
          <Sparkles className="mr-2 h-4 w-4" />
          Unlock Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UpgradePrompt;
