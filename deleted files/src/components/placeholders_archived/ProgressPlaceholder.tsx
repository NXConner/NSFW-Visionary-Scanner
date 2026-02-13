/**
 * Progress Placeholder - SFW version for app stores
 * Shows upgrade prompt for progress tracking features
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Lock, Sparkles, TrendingUp, BarChart3, ChevronRight } from "lucide-react";

export const ProgressPlaceholder: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">
          Premium Feature
        </Badge>
        <h1 className="text-3xl font-bold gradient-text mb-4">Progress Tracking</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track your journey with photos, measurements, and detailed analytics.
        </p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 rounded-full bg-primary/10 mb-6">
            <Camera className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Visual Progress Tracker</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Document your progress with secure photo comparisons and measurement tracking.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
            {[
              { icon: TrendingUp, label: "Progress Charts" },
              { icon: BarChart3, label: "Analytics" },
              { icon: Camera, label: "Photo Comparison" },
              { icon: Lock, label: "Encrypted Storage" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>

          <Button size="lg" className="gap-2">
            <Sparkles className="w-5 h-5" />
            Unlock Premium
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressPlaceholder;
