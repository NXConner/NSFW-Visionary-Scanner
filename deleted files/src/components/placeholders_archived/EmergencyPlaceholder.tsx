/**
 * Emergency Placeholder - SFW version for app stores
 * Shows upgrade prompt for emergency guidance features
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Lock, Sparkles, Phone, MapPin, ChevronRight } from "lucide-react";

export const EmergencyPlaceholder: React.FC = () => {
  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Premium Feature
          </Badge>
          <h1 className="text-3xl font-bold gradient-text mb-4">Emergency Resources</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Quick access to emergency health resources and guidance.
          </p>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <AlertCircle className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Emergency Health Guide</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Access emergency protocols, first aid guides, and healthcare provider locator.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
              {[
                { icon: AlertCircle, label: "Emergency Protocols" },
                { icon: Phone, label: "Hotline Access" },
                { icon: MapPin, label: "Provider Locator" },
                { icon: Lock, label: "Premium Feature" },
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
    </section>
  );
};

export default EmergencyPlaceholder;
