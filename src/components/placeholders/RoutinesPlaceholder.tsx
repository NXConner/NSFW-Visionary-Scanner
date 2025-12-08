/**
 * Routines Placeholder - SFW version for app stores
 * Shows upgrade prompt for workout routines features
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Lock, Sparkles, Calendar, Target, ChevronRight } from "lucide-react";

export const RoutinesPlaceholder: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">
          Premium Feature
        </Badge>
        <h1 className="text-3xl font-bold gradient-text mb-4">Workout Routines</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Build personalized workout plans and track your fitness progress.
        </p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-6 rounded-full bg-primary/10 mb-6">
            <Dumbbell className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Custom Workout Builder</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            Create personalized exercise routines, track your progress, and achieve your fitness
            goals.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
            {[
              { icon: Target, label: "Goal Setting" },
              { icon: Calendar, label: "Scheduling" },
              { icon: Sparkles, label: "AI Recommendations" },
              { icon: Lock, label: "Private Data" },
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

export default RoutinesPlaceholder;
