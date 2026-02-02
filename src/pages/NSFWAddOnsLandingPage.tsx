import React from "react";
import { Link } from "react-router-dom";
import { useNSFWAvailable } from "@/dlc/context/DLCContext";
import { NSFWAddOnsPromoSections } from "@/components/nsfwLanding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";

export default function NSFWAddOnsLandingPage(): React.ReactElement {
  const nsfw = useNSFWAvailable();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <RouteTopNav
        title="NSFW Add-ons"
        backTo="/"
        backLabel="Home"
        showFullNavigation={true}
        actions={[
          { key: "store", kind: "link", to: "/store", label: "Store", variant: "outline" },
          { key: "hub", kind: "link", to: "/nsfw", label: "Open Hub", variant: "default" },
        ]}
      />

      <main className="container mx-auto px-4 py-10">
        {nsfw.isLoading ? (
          <Card className="glass-card border-border/50 max-w-2xl mx-auto">
            <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : nsfw.requiresDLC ? (
          <Card className="glass-card border-border/50 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" /> NSFW Add-ons are not enabled
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div>
                This page becomes available once at least one adult-rated DLC package is
                owned/installed.
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild>
                  <Link to="/store">Open DLC Store</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/admin/dlc">Admin DLC Toggles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <NSFWAddOnsPromoSections variant="page" />
        )}
      </main>
    </div>
  );
}
