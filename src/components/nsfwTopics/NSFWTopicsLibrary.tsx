import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink } from "@/components/NavLink";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { useDLC, useDLCFeature, useNSFWAvailable } from "@/dlc/context/DLCContext";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import { NsfwConsentGate } from "@/components/nsfw/NsfwConsentGate";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";

import { BookOpen, ExternalLink, Loader2, Lock, RefreshCcw, Tag } from "lucide-react";
import { fetchNsfwTopics, fetchTopicLibraryItems } from "./db";
import type { NsfwTopic, NsfwTopicLibraryItem } from "./types";

function normalizeUrl(u: string): string | null {
  const s = String(u || "").trim();
  if (!s) return null;
  try {
    const url = new URL(s);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function NSFWTopicsLibrary(): React.ReactElement {
  const consentEnabled = useFeatureFlag("nsfw_consent_gate", true);
  const { isAgeVerified, hasFeature, isLoading: dlcContextLoading } = useDLC();
  const nsfw = useNSFWAvailable();
  const topicsLibrary = useDLCFeature("topics_library");
  const { settings: privacy } = useNsfwPrivacySettings();
  const incognito = Boolean(privacy.incognitoMode);

  const [showAgeModal, setShowAgeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<NsfwTopic[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<string>("all");
  const [items, setItems] = useState<NsfwTopicLibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NsfwTopicLibraryItem | null>(null);
  const [revealSelected, setRevealSelected] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<"all" | "educational" | "demonstrative" | "explicit">("all");

  // Wait for DLC context to load before showing any restriction UI
  const stillCheckingAccess = dlcContextLoading || topicsLibrary.isLoading;

  useEffect(() => {
    setRevealSelected(false);
  }, [selectedItem?.id]);

  const unlockedTopics = useMemo(() => {
    return topics.filter(t => hasFeature(t.requiresFeatureId));
  }, [topics, hasFeature]);

  const allowedFeatureIds = useMemo(
    () => unlockedTopics.map(t => t.requiresFeatureId),
    [unlockedTopics],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await fetchNsfwTopics();
      setTopics(t);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load topics";
      setError(msg);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const topicId = activeTopicId === "all" ? null : activeTopicId;
      const rows = await fetchTopicLibraryItems({
        topicId,
        requiresFeatureIds: allowedFeatureIds,
        contentRating: ratingFilter,
      });
      setItems(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load topic items";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTopicId, allowedFeatureIds, ratingFilter]);

  useEffect(() => {
    if (stillCheckingAccess) return;
    void load();
  }, [load, stillCheckingAccess]);

  useEffect(() => {
    if (stillCheckingAccess) return;
    if (!isAgeVerified) return;
    if (!nsfw.isAvailable) return;
    if (!topicsLibrary.isAvailable) return;
    void loadItems();
  }, [isAgeVerified, nsfw.isAvailable, topicsLibrary.isAvailable, loadItems, stillCheckingAccess]);

  const topicTabs = useMemo(() => {
    const sorted = [...unlockedTopics].sort((a, b) => a.sortOrder - b.sortOrder);
    return [
      {
        topicId: "all",
        displayName: "All",
        description: null,
        requiresFeatureId: "topics_library",
        sortOrder: 0,
      },
    ].concat(sorted);
  }, [unlockedTopics]);

  if (stillCheckingAccess) {
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

  // Gate: must have NSFW availability (DLC) and age verified.
  if (!isAgeVerified || nsfw.requiresAgeVerification) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          onVerified={() => {
            setShowAgeModal(false);
          }}
        />
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Age Verification Required</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              This library contains adult-only educational content. Verify you are 18+ to continue.
            </p>
            <Button onClick={() => setShowAgeModal(true)} className="gap-2">
              <Lock className="w-4 h-4" /> Verify Age
            </Button>
            <Badge variant="secondary" className="mt-3">
              18+ Required
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nsfw.isAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">NSFW DLC Required</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Open the store to purchase an NSFW DLC upgrade and topic packs.
            </p>
            <Button asChild className="gap-2">
              <NavLink to="/store">Open DLC Store</NavLink>
            </Button>
            <Badge variant="secondary" className="mt-3">
              Requires NSFW DLC
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!topicsLibrary.isAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Topics Library Locked</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Purchase any Topic Pack to unlock the Topics Library module.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild>
                <NavLink to="/store">Open DLC Store</NavLink>
              </Button>
              <Button variant="outline" onClick={() => void load()}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3">
              Requires Topic Pack
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const content = (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <Dialog open={!!selectedItem} onOpenChange={open => (!open ? setSelectedItem(null) : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {incognito && !revealSelected ? "Private Topic" : (selectedItem?.title ?? "Topic")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {incognito && !revealSelected ? (
              <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  Content is hidden in incognito mode. Tap Reveal to view this entry.
                </div>
                <Button type="button" variant="outline" onClick={() => setRevealSelected(true)}>
                  Reveal
                </Button>
              </div>
            ) : (
              <>
                {selectedItem?.summary ? (
                  <p className="text-sm text-muted-foreground">{selectedItem.summary}</p>
                ) : null}
                {selectedItem?.body ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedItem.body}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No content has been imported yet for this entry.
                  </div>
                )}
              </>
            )}
            {selectedItem?.resources && selectedItem.resources.length > 0 ? (
              <div className="pt-2 border-t border-border/50">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Resources</div>
                <div className="space-y-2">
                  {selectedItem.resources.map(r => {
                    const url = normalizeUrl(r.url);
                    if (!url) return null;
                    return (
                      <a
                        key={`${r.label}:${url}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" /> {r.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-2xl font-bold gradient-text flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Topics Library
              </CardTitle>
              <div className="text-muted-foreground mt-1">
                DLC-backed topic packs. Content appears here after admin import.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={ratingFilter} onValueChange={v => setRatingFilter(v as typeof ratingFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Rating tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="demonstrative">Demonstrative</SelectItem>
                  <SelectItem value="explicit">Explicit</SelectItem>
                </SelectContent>
              </Select>
              {incognito ? <Badge variant="secondary">Incognito</Badge> : null}
              <Button variant="outline" onClick={() => void load()} className="gap-2">
                <RefreshCcw className="w-4 h-4" /> Refresh Topics
              </Button>
              <Button variant="outline" onClick={() => void loadItems()} className="gap-2">
                <RefreshCcw className="w-4 h-4" /> Refresh Items
              </Button>
              <Button asChild>
                <NavLink to="/store">Store</NavLink>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <div className="text-sm text-destructive">{error}</div> : null}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : null}

          <Tabs value={activeTopicId} onValueChange={setActiveTopicId} className="space-y-4">
            <ScrollArea className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                {topicTabs.map(t => (
                  <TabsTrigger key={t.topicId} value={t.topicId} className="gap-2">
                    <Tag className="w-4 h-4" />
                    {t.displayName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>

            {topicTabs.map(t => (
              <TabsContent key={t.topicId} value={t.topicId} className="space-y-4">
                {t.topicId !== "all" ? (
                  <Card className="bg-secondary/20 border-border/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{t.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            {t.description ?? "No description."}
                          </div>
                        </div>
                        <Badge variant="secondary">18+</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="grid md:grid-cols-2 gap-4">
                  {items
                    .filter(it => (t.topicId === "all" ? true : it.topicId === t.topicId))
                    .map(it => (
                      <Card key={it.id} className="bg-background/40 border-border/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {incognito ? "Private Topic" : it.title}
                          </CardTitle>
                          {incognito ? (
                            <div className="text-sm text-muted-foreground">
                              Preview hidden in incognito mode.
                            </div>
                          ) : it.summary ? (
                            <div className="text-sm text-muted-foreground">{it.summary}</div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Imported content will appear here.
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{it.topicId}</Badge>
                            <Badge variant="secondary">{it.contentRating}</Badge>
                            {it.tags.slice(0, 4).map(tag => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button variant="outline" onClick={() => setSelectedItem(it)}>
                            Open
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {!loading &&
                items.filter(it => (t.topicId === "all" ? true : it.topicId === t.topicId))
                  .length === 0 ? (
                  <Card className="bg-secondary/20 border-border/50">
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">
                        No items yet. Import content via Admin → DLC Content Import (topics).
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
  return consentEnabled ? (
    <NsfwConsentGate featureIds={["nsfw", "topics_library"]}>{content}</NsfwConsentGate>
  ) : (
    content
  );
}

export default NSFWTopicsLibrary;
