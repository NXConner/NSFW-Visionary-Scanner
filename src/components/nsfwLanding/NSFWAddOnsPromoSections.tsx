import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDLC, useNSFWAvailable } from "@/dlc/context/DLCContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flame, LibraryBig, LockKeyhole, MessageSquare, Shield, Video } from "lucide-react";

type Variant = "home" | "page";

export function NSFWAddOnsPromoSections({
  variant = "home",
}: {
  variant?: Variant;
}): React.ReactElement | null {
  const { ownedPackages, installedPackages } = useDLC();
  const nsfw = useNSFWAvailable();

  const entitled = !nsfw.isLoading && !nsfw.requiresDLC;
  const show = entitled;

  const nsfwPackages = useMemo(() => {
    const merged = [...ownedPackages, ...installedPackages];
    const map = new Map<string, { packageId: string; packageName: string }>();
    for (const p of merged) {
      if (!(p.contentRating === "18+" || p.contentRating === "adult")) continue;
      map.set(p.packageId, { packageId: p.packageId, packageName: p.packageName });
    }
    return Array.from(map.values()).sort((a, b) => a.packageName.localeCompare(b.packageName));
  }, [ownedPackages, installedPackages]);

  if (!show) return null;

  const title =
    variant === "page" ? "NSFW Add-ons — Unlocked" : "NSFW Add-ons Unlocked on Your Account";

  const subtitle = nsfw.requiresAgeVerification
    ? "Age verification is required before adult content can display. Your DLC entitlement is already active."
    : "Your NSFW DLC add-ons are enabled. Explore the hub, topics library, and unlocked modules.";

  return (
    <section className={variant === "page" ? "py-10" : "py-16"}>
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <Card className="glass-card border-border/50 overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-red-600/10" />
            <CardHeader className="relative">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-pink-500" />
                    {title}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground max-w-2xl">{subtitle}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant={nsfw.requiresAgeVerification ? "default" : "outline"}>
                    <Link to="/nsfw">
                      {nsfw.requiresAgeVerification ? "Verify Age & Open Hub" : "Open NSFW Hub"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/nsfw/topics">Topics Library</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/store">DLC Store</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </div>

          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <Shield className="w-3 h-3" />
                Private by default
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <LockKeyhole className="w-3 h-3" />
                Controlled access + age gate
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Video className="w-3 h-3" />
                Video modules
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <LibraryBig className="w-3 h-3" />
                Topics library
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <MessageSquare className="w-3 h-3" />
                Community modules
              </Badge>
            </div>

            <Separator className="bg-border/50" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50 bg-background/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">What unlocked</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div>- NSFW Hub experience + gated entry</div>
                  <div>- Topics Library (packs + quick navigation)</div>
                  <div>- NSFW videos / forums / analytics modules (where available)</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-background/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Safety / compliance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <div>- 18+ age verification is enforced before rendering adult content</div>
                  <div>- You control access (master toggle + per-package toggle)</div>
                  <div>- If master toggle is OFF, everything behaves locked</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-background/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Enabled packages</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {nsfwPackages.length === 0 ? (
                    <div>No adult-rated packages detected (unexpected for entitlement).</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {nsfwPackages.map(p => (
                        <Badge key={p.packageId} variant="outline" className="border-border/60">
                          {p.packageName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default NSFWAddOnsPromoSections;
