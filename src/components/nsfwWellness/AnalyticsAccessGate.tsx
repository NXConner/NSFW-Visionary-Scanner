import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { useDLC, useDLCFeature } from "@/dlc/context/DLCContext";

export function AnalyticsAccessGate({ children }: { children: React.ReactNode }) {
  const { isAgeVerified } = useDLC();
  const { isAvailable: hasAnalyticsDLC, isLoading: dlcLoading } =
    useDLCFeature("wellness_analytics");
  const [showAgeModal, setShowAgeModal] = useState(false);

  if (dlcLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAgeVerified || !hasAnalyticsDLC) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {!isAgeVerified ? "Age Verification Required" : "Analytics Add-On Not Available"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {!isAgeVerified
                ? "Please verify you are 18+ to access analytics."
                : "This feature requires the Intimate/Analytics add-on (or a bundle that includes it)."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isAgeVerified ? (
                <Button onClick={() => setShowAgeModal(true)} className="gap-2">
                  <Shield className="w-4 h-4" />
                  Verify Age
                </Button>
              ) : (
                <Button asChild className="gap-2">
                  <Link to="/store">
                    <Lock className="w-4 h-4" />
                    Open DLC Store
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3">
              {!isAgeVerified ? "18+ Required" : "Requires Analytics"}
            </Badge>
          </CardContent>
        </Card>
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          onVerified={() => setShowAgeModal(false)}
        />
      </div>
    );
  }

  return <div className="container mx-auto px-4 py-8 max-w-6xl">{children}</div>;
}
