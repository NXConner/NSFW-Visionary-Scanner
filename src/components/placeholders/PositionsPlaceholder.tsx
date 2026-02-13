/**
 * Positions Placeholder - SFW version for app stores
 * Shows upgrade prompt for fitness positions guide
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Lock, BookOpen, Star } from "lucide-react";
import { UnlockPremiumCta } from "./UnlockPremiumCta";

export const PositionsPlaceholder: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">
          Premium Feature
        </Badge>
        <h1 className="text-3xl font-bold gradient-text mb-4">Wellness Guide</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive wellness and lifestyle guidance for better health.
        </p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 rounded-full bg-primary/10 mb-6">
            <Heart className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Lifestyle & Wellness</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Access expert guides for improving your overall health and lifestyle.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
            {[
              { icon: BookOpen, label: "Expert Guides" },
              { icon: Star, label: "Curated Content" },
              { icon: Heart, label: "Wellness Tips" },
              { icon: Lock, label: "Premium Access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>

          <UnlockPremiumCta />
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionsPlaceholder;
