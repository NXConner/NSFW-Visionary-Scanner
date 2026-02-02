import React from "react";
import { Link } from "react-router-dom";
import { NSFWDashboard } from "@/components/nsfwDashboard/NSFWDashboard";
import { useDLC, useNSFWAvailable } from "@/dlc/context/DLCContext";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock } from "lucide-react";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";

export default function NSFWDashboardPage(): React.ReactElement {
  const { isInitialized, isLoading } = useDLC();
  const nsfw = useNSFWAvailable();

  if (!isInitialized || isLoading || nsfw.isLoading) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="NSFW Hub" showFullNavigation={true} />
        <div className="flex items-center justify-center px-4 py-10">
          <Card className="glass-card border-border/50 w-full max-w-md">
            <CardContent className="py-12 flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-3" />
              <div className="text-muted-foreground">Loading NSFW hub…</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Only show the hub when NSFW DLC add-ons exist and age is verified.
  // If DLC exists but age isn’t verified, we still render the hub but it will prompt verification.
  if (!nsfw.isAvailable && !nsfw.requiresAgeVerification) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="NSFW Hub" showFullNavigation={true} />
        <div className="flex items-center justify-center px-4 py-20">
          <Card className="glass-card border-border/50 w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" /> NSFW Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-muted-foreground">
                This page only loads when NSFW DLC add-ons are detected on your account.
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild>
                  <Link to="/store">Open DLC Store</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
              <Badge variant="secondary">Requires NSFW DLC + Age Verification</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RouteTopNav title="NSFW Hub" showFullNavigation={true} />
      <div className="min-h-[calc(100vh-56px)]">
        <NsfwSessionGate>
          <NSFWDashboard />
        </NsfwSessionGate>
      </div>
    </div>
  );
}
