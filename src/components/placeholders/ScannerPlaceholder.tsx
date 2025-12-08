/**
 * Scanner Placeholder - SFW version for app stores
 * Shows upgrade prompt for premium health scanning features
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scan, Lock, Sparkles, Shield, Activity, ChevronRight } from "lucide-react";

export const ScannerPlaceholder: React.FC = () => {
  return (
    <section className="min-h-screen px-4 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            Premium Feature
          </Badge>
          <h1 className="text-3xl font-bold gradient-text mb-4">Health Scanner</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Advanced health monitoring and tracking features are available with the premium upgrade.
          </p>
        </div>

        <Card className="glass-card border-border/50 mb-6">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-6">
              <Scan className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Premium Health Features</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              Unlock advanced health tracking, progress monitoring, and personalized insights with
              our premium upgrade.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-sm">
              {[
                { icon: Activity, label: "Health Tracking" },
                { icon: Shield, label: "Secure & Private" },
                { icon: Sparkles, label: "AI Insights" },
                { icon: Lock, label: "Encrypted Data" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            <Button size="lg" className="gap-2">
              <Sparkles className="w-5 h-5" />
              Learn More About Premium
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <Shield className="w-4 h-4 inline mr-1" />
          All data is encrypted and stored securely on your device
        </div>
      </div>
    </section>
  );
};

export default ScannerPlaceholder;
