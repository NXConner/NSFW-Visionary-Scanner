import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MeshGradient, Reveal } from "@/components/premium";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { NSFW_FEATURES } from "./features";
import { fetchNsfwStats, type NsfwStats } from "./stats";
import { useDLC, useDLCFeature } from "@/dlc/context/DLCContext";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { Lock, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import { clearNsfwSessionUnlocked, isNsfwSessionLocked } from "@/lib/nsfwSessionLock";

function navigateToTab(tabId: string, navigate: (to: string) => void): void {
  // Switch back to the main tabbed app and then select a specific tab.
  navigate("/");
  const fire = () => {
    window.dispatchEvent(new CustomEvent("navigate-tab", { detail: tabId }));
  };
  // Try a couple times to account for mount timing.
  requestAnimationFrame(() => {
    fire();
    setTimeout(fire, 150);
  });
}

export function NSFWDashboard(): React.ReactElement {
  const navigate = useNavigate();
  const premiumMesh = useFeatureFlag("premium_mesh");
  const {
    ownedPackages,
    installedPackages,
    isAgeVerified,
    refresh,
    isLoading: dlcLoading,
  } = useDLC();
  const { settings: privacy } = useNsfwPrivacySettings();
  const sessionLocked = useMemo(() => isNsfwSessionLocked(privacy), [privacy]);

  const video = useDLCFeature("video_library");
  const forum = useDLCFeature("private_forum");
  const analytics = useDLCFeature("wellness_analytics");
  const advanced = useDLCFeature("multi_camera");
  const topics = useDLCFeature("topics_library");
  const scanner = useDLCFeature("nsfw_scanner_mode");

  // Wait for DLC context to load before rendering entitlement checks
  const stillCheckingAccess =
    dlcLoading || video.isLoading || forum.isLoading || analytics.isLoading;

  const entitlementRows = useMemo(
    () => [
      { id: "nsfw-videos", label: "Video Library", feature: video, kind: "tab" as const },
      { id: "nsfw-forum", label: "Community Forum", feature: forum, kind: "tab" as const },
      {
        id: "nsfw-wellness-analytics",
        label: "Wellness Analytics",
        feature: analytics,
        kind: "tab" as const,
      },
      { id: "nsfw-advanced", label: "Advanced Features", feature: advanced, kind: "tab" as const },
      { id: "/nsfw/topics", label: "Topics Library", feature: topics, kind: "route" as const },
      { id: "settings", label: "NSFW Scanner (Settings)", feature: scanner, kind: "tab" as const },
    ],
    [advanced, analytics, forum, scanner, topics, video],
  );

  const [stats, setStats] = useState<NsfwStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);

  const nsfwPackages = useMemo(() => {
    const pkgs = [...ownedPackages, ...installedPackages].filter(
      p => p.contentRating === "18+" || p.contentRating === "adult",
    );
    const uniq = new Map(pkgs.map(p => [p.packageId, p]));
    return Array.from(uniq.values());
  }, [ownedPackages, installedPackages]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await fetchNsfwStats());
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stillCheckingAccess) return;
    void loadStats();
  }, [loadStats, stillCheckingAccess]);

  // Show loading state while checking access
  if (stillCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-20">
      {premiumMesh && <MeshGradient variant="dashboard" intensity="default" />}

      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => {
          // Refresh DLC context to update age verification status
          refresh();
          setShowAgeModal(false);
        }}
      />

      <div className="container mx-auto max-w-6xl space-y-8">
        <Reveal>
          <Card className="glass-card border-border/50 overflow-hidden">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-3xl font-bold gradient-text">
                    {privacy.incognitoMode ? "Private Hub" : "NSFW Hub"}
                  </CardTitle>
                  <div className="text-muted-foreground mt-1">
                    Your unlocked adult-only features, guides, and tools — all in one place.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Unlocked packages: {nsfwPackages.length}</Badge>
                  {privacy.incognitoMode ? <Badge variant="secondary">Incognito</Badge> : null}
                  {stats?.inProgressDownloads ? (
                    <Badge className="bg-amber-500 text-black">
                      Downloads in progress: {stats.inProgressDownloads}
                    </Badge>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => {
                      void refresh();
                      void loadStats();
                    }}
                    className="gap-2"
                  >
                    <RefreshCcw className="w-4 h-4" /> Refresh
                  </Button>
                  {privacy.sessionLockEnabled && !sessionLocked ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        clearNsfwSessionUnlocked();
                        navigate("/");
                      }}
                    >
                      Lock now
                    </Button>
                  ) : null}
                  <Button
                    variant="destructive"
                    onClick={() => {
                      clearNsfwSessionUnlocked();
                      navigate("/");
                    }}
                  >
                    Panic exit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card className="bg-secondary/20 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Entitlements & unlock status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground">
                    {privacy.sessionLockEnabled
                      ? `Session lock is ON (${privacy.sessionLockMinutes}m)${sessionLocked ? " — locked" : " — unlocked"}`
                      : "Session lock is OFF"}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {entitlementRows.map(r => {
                      const available = Boolean(r.feature.isAvailable && isAgeVerified);
                      const needsAge = !isAgeVerified;
                      const statusLabel = available
                        ? "Available"
                        : needsAge
                          ? "Age required"
                          : "Locked";
                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-background/40"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{r.label}</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {available
                                ? "Unlocked"
                                : needsAge
                                  ? "Verify age to unlock NSFW content"
                                  : "Purchase/activate DLC to unlock"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                available
                                  ? "border-success/40 text-success"
                                  : needsAge
                                    ? "border-warning/40 text-warning"
                                    : "border-border/50 text-muted-foreground"
                              }
                            >
                              {statusLabel}
                            </Badge>
                            <Button
                              size="sm"
                              variant={available ? "default" : "outline"}
                              onClick={() => {
                                if (needsAge) {
                                  setShowAgeModal(true);
                                  return;
                                }
                                if (!available) {
                                  navigate("/store");
                                  return;
                                }
                                if (r.kind === "route") {
                                  navigate(r.id);
                                } else {
                                  navigateToTab(r.id, navigate);
                                }
                              }}
                            >
                              {available ? "Open" : needsAge ? "Verify" : "Store"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {!isAgeVerified && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Lock className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <div className="font-semibold">Age verification required</div>
                        <div className="text-sm text-muted-foreground">
                          Verify once to access adult-only content and features.
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => setShowAgeModal(true)}>Verify Age</Button>
                      <Button variant="outline" onClick={() => navigate("/store")}>
                        Open Store
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-secondary/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Position favorites</div>
                    <div className="text-2xl font-bold">
                      {stats?.favoritesPositions ?? (statsLoading ? "…" : 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Videos downloaded</div>
                    <div className="text-2xl font-bold">
                      {stats?.downloadedVideos ?? (statsLoading ? "…" : 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Watch history</div>
                    <div className="text-2xl font-bold">
                      {stats?.watchHistoryCount ?? (statsLoading ? "…" : 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-secondary/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">Packages</div>
                    <div className="text-2xl font-bold">{nsfwPackages.length}</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {NSFW_FEATURES.map(f => (
                  <Button
                    key={f.id}
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigateToTab(f.tabId, navigate)}
                  >
                    <f.icon className="w-4 h-4" /> {f.title}
                  </Button>
                ))}
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/nsfw/topics">Topics Library</Link>
                </Button>
                <Button variant="outline" onClick={() => navigate("/store")}>
                  Open Store
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>All NSFW features</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {NSFW_FEATURES.map(f => (
                  <Card key={f.id} className="bg-background/40 border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <f.icon className="w-5 h-5 text-primary" />
                          <div className="font-semibold">{f.title}</div>
                        </div>
                        <Button size="sm" onClick={() => navigateToTab(f.tabId, navigate)}>
                          Open
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{f.summary}</div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="details">
                          <AccordionTrigger>Details</AccordionTrigger>
                          <AccordionContent>
                            <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
                              {f.details.map(d => (
                                <li key={d}>{d}</li>
                              ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="howto">
                          <AccordionTrigger>How to use</AccordionTrigger>
                          <AccordionContent>
                            <ol className="list-decimal ml-5 text-sm text-muted-foreground space-y-1">
                              {f.howTo.map(s => (
                                <li key={s}>{s}</li>
                              ))}
                            </ol>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Usage checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>- Verify age once, then all NSFW tabs unlock.</div>
                <div>- Use Video Library for streaming/downloads (signed URLs).</div>
                <div>- Use Positions for favorites and private per-position media overrides.</div>
                <div>- Use Analytics for trends; use Forum for community discussion.</div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Deep links</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {NSFW_FEATURES.map(f => (
                  <Button
                    key={f.id}
                    variant="outline"
                    className="justify-start gap-2"
                    onClick={() => navigateToTab(f.tabId, navigate)}
                  >
                    <f.icon className="w-4 h-4" /> {f.title}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
