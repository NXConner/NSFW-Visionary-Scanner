import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AgeVerificationModal } from "@/dlc/components/AgeVerificationModal";
import { NavLink } from "@/components/NavLink";
import { Loader2, Lock, Shield, Video } from "lucide-react";
import { toast } from "sonner";
import { NsfwConsentGate } from "@/components/nsfw/NsfwConsentGate";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import {
  getNSFWVideos,
  getVideoDownloads,
  requestVideoDownload,
  type NSFWVideoContent as NSFWVideoType,
  type NSFWVideoDownload,
} from "@/lib/nsfwVideoContent";
import { useDLC, useDLCFeature } from "@/dlc/context/DLCContext";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";
import { deleteCachedVideo, isVideoCached } from "@/lib/offlineMedia/videoCache";
import { getNSFWVideoPlaybackUrl, type VideoPlaybackMode } from "@/lib/nsfwVideoDelivery";
import { BrowseTab } from "@/components/nsfwVideoContent/tabs/BrowseTab";
import { DownloadsTab } from "@/components/nsfwVideoContent/tabs/DownloadsTab";
import { PlaylistsTab } from "@/components/nsfwVideoContent/tabs/PlaylistsTab";
import { HistoryTab } from "@/components/nsfwVideoContent/tabs/HistoryTab";
import { BookmarksTab } from "@/components/nsfwVideoContent/tabs/BookmarksTab";
import { PlayerDialog } from "@/components/nsfwVideoContent/components/PlayerDialog";
import {
  VIDEO_CATEGORIES,
  VIDEO_DIFFICULTY_LEVELS,
  VIDEO_RATING_LEVELS,
} from "@/components/nsfwVideoContent/constants";
import { useNsfwPrivacySettings } from "@/lib/nsfwPrivacySettings";
import {
  getNsfwContinueWatching,
  getNsfwRecentlyWatched,
  recordNsfwWatchHistory,
  updateNsfwVideoProgress,
} from "@/lib/nsfwVideoProgress";
import {
  getNsfwBookmarkedVideos,
  getNsfwVideoBookmarks,
  setNsfwVideoBookmark,
} from "@/lib/nsfwVideoBookmarks";

export const NSFWVideoContent = ({
  initialTab,
  initialVideoId,
}: {
  initialTab?: "browse" | "playlists" | "downloads" | "history" | "bookmarks";
  initialVideoId?: string;
} = {}): JSX.Element => {
  const consentEnabled = useFeatureFlag("nsfw_consent_gate", true);
  const { settings: privacy } = useNsfwPrivacySettings();
  const [activeTab, setActiveTab] = useState<
    "browse" | "playlists" | "downloads" | "history" | "bookmarks"
  >(
    initialTab ?? "browse",
  );
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<NSFWVideoType[]>([]);
  const [downloads, setDownloads] = useState<NSFWVideoDownload[]>([]);
  const [downloadQuality, setDownloadQuality] = useState<VideoQuality>("2k");
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [cachedMap, setCachedMap] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [continueWatching, setContinueWatching] = useState<NSFWVideoType[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<NSFWVideoType[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkedVideos, setBookmarkedVideos] = useState<NSFWVideoType[]>([]);

  const [selectedVideo, setSelectedVideo] = useState<NSFWVideoType | null>(null);
  const [playerQuality, setPlayerQuality] = useState<VideoQuality>("2k");
  const [playerMode, setPlayerMode] = useState<VideoPlaybackMode>("cache_first");
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerRefreshToken, setPlayerRefreshToken] = useState(0);
  const progressRef = useRef<{ videoId: string; current: number; duration: number }>({
    videoId: "",
    current: 0,
    duration: 0,
  });
  const lastProgressSentMs = useRef(0);
  const lastRefreshMs = useRef(0);
  const forceRefreshRef = useRef(false);

  const { isAgeVerified } = useDLC();
  const { isAvailable: hasVideoDLC, isLoading: dlcLoading } = useDLCFeature("video_library");
  const [showAgeModal, setShowAgeModal] = useState(false);

  const categories = VIDEO_CATEGORIES;
  const difficultyLevels = VIDEO_DIFFICULTY_LEVELS;
  const ratingLevels = VIDEO_RATING_LEVELS;

  const selectedCategoryTyped = useMemo(() => {
    return selectedCategory === "all" ? undefined : (selectedCategory as NSFWVideoType["category"]);
  }, [selectedCategory]);

  const selectedDifficultyTyped = useMemo(() => {
    return selectedDifficulty === "all"
      ? undefined
      : (selectedDifficulty as NSFWVideoType["difficulty_level"]);
  }, [selectedDifficulty]);

  const selectedRatingTyped = useMemo(() => {
    return selectedRating === "all"
      ? undefined
      : (selectedRating as NSFWVideoType["content_rating"]);
  }, [selectedRating]);

  const selectedVideoId = selectedVideo?.id ?? null;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "browse") {
        const videosData = await getNSFWVideos(
          selectedCategoryTyped,
          selectedDifficultyTyped,
          selectedRatingTyped,
        );
        setVideos(videosData);
      }

      if (activeTab === "downloads") {
        const downloadsData = await getVideoDownloads();
        setDownloads(downloadsData);
      }

      if (activeTab === "history") {
        const [continueRows, recentRows] = await Promise.all([
          getNsfwContinueWatching(8),
          getNsfwRecentlyWatched(8),
        ]);
        setContinueWatching(continueRows);
        setRecentlyWatched(recentRows);
      }

      if (activeTab === "bookmarks") {
        const rows = await getNsfwBookmarkedVideos(50);
        setBookmarkedVideos(rows);
      }
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategoryTyped, selectedDifficultyTyped, selectedRatingTyped]);

  const loadBookmarks = useCallback(async () => {
    const ids = await getNsfwVideoBookmarks();
    setBookmarkedIds(new Set(ids));
  }, []);

  useEffect(() => {
    if (!hasVideoDLC || !isAgeVerified) return;
    void loadData();
    void loadBookmarks();
  }, [hasVideoDLC, isAgeVerified, loadData, loadBookmarks]);

  useEffect(() => {
    if (!initialVideoId) return;
    const id = String(initialVideoId).trim();
    if (!id) return;
    // Prefer stream when deep-linking to a specific video.
    setPlayerMode("stream");
    setSelectedVideo({ id } as any);
  }, [initialVideoId]);

  useEffect(() => {
    const run = async () => {
      if (!selectedVideoId) return;
      setPlayerLoading(true);
      try {
        const res = await getNSFWVideoPlaybackUrl({
          videoId: selectedVideoId,
          quality: playerQuality,
          mode: playerMode,
          forceRefresh: forceRefreshRef.current,
        });
        forceRefreshRef.current = false;
        setPlayerUrl(res?.url ?? null);
      } finally {
        setPlayerLoading(false);
      }
    };
    void run();
  }, [selectedVideoId, playerQuality, playerMode, playerRefreshToken]);

  const refreshPlayerUrl = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshMs.current < 5000) return;
    lastRefreshMs.current = now;
    forceRefreshRef.current = true;
    setPlayerRefreshToken(t => t + 1);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (downloads.length === 0) {
        setCachedMap({});
        return;
      }

      const entries: Record<string, boolean> = {};
      await Promise.all(
        downloads.map(async d => {
          try {
            const expired = d.expires_at ? new Date(d.expires_at).getTime() < Date.now() : false;
            if (expired) {
              await deleteCachedVideo(d.video_id, d.quality as VideoQuality);
              entries[`${d.video_id}:${d.quality}`] = false;
              return;
            }
            entries[`${d.video_id}:${d.quality}`] = await isVideoCached(
              d.video_id,
              d.quality as VideoQuality,
            );
          } catch {
            entries[`${d.video_id}:${d.quality}`] = false;
          }
        }),
      );

      setCachedMap(entries);
    };

    void run();
  }, [downloads]);

  const flushWatchHistory = useCallback(async () => {
    const { videoId, current, duration } = progressRef.current;
    if (!videoId || duration <= 0 || current <= 0) return;
    const completion = Math.min(100, (current / duration) * 100);
    await recordNsfwWatchHistory({
      videoId,
      watchDurationSeconds: current,
      completionPercentage: completion,
      watchSource: "direct",
      referrerId: null,
    });
  }, []);

  const handleProgress = useCallback(
    async (payload: { videoId: string; currentTime: number; duration: number; ended?: boolean }) => {
      if (!payload.videoId) return;
      progressRef.current = {
        videoId: payload.videoId,
        current: payload.currentTime,
        duration: payload.duration,
      };
      const now = Date.now();
      const shouldSend = payload.ended || now - lastProgressSentMs.current > 15000;
      if (!shouldSend) return;
      lastProgressSentMs.current = now;
      await updateNsfwVideoProgress(payload.videoId, payload.currentTime, payload.duration);
      if (payload.ended) {
        await flushWatchHistory();
      }
    },
    [flushWatchHistory],
  );

  const handleDownload = async (video: NSFWVideoType, quality: VideoQuality) => {
    try {
      setDownloadProgress(p => ({ ...p, [`${video.id}:${quality}`]: 0 }));
      const download = await requestVideoDownload(video.id, quality);
      if (download) {
        setDownloadProgress(p => ({ ...p, [`${video.id}:${quality}`]: 100 }));
        await loadData();
      }
    } catch {
      toast.error("Failed to start download");
    }
  };

  const handleToggleBookmark = async (videoId: string, nextState: boolean) => {
    const ok = await setNsfwVideoBookmark(videoId, nextState);
    if (!ok) {
      toast.error("Failed to update bookmark");
      return;
    }
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (nextState) next.add(videoId);
      else next.delete(videoId);
      return next;
    });
    if (activeTab === "bookmarks") {
      const rows = await getNsfwBookmarkedVideos(50);
      setBookmarkedVideos(rows);
    }
  };

  const handleDeleteOffline = async (videoId: string, quality: VideoQuality) => {
    await deleteCachedVideo(videoId, quality);
    await loadData();
  };

  const handleClearAllOffline = async () => {
    await Promise.all(
      downloads.map(async d => deleteCachedVideo(d.video_id, d.quality as VideoQuality)),
    );
    await loadData();
  };

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

  if (!isAgeVerified || !hasVideoDLC) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {!isAgeVerified ? "Age Verification Required" : "Video Add-On Not Available"}
            </h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {!isAgeVerified
                ? "Please verify you are 18+ to access the video library."
                : "This feature requires the Video Library add-on (or a bundle that includes it)."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isAgeVerified ? (
                <Button onClick={() => setShowAgeModal(true)} className="gap-2">
                  <Shield className="w-4 h-4" />
                  Verify Age
                </Button>
              ) : (
                <Button asChild className="gap-2">
                  <NavLink to="/store">
                    <Lock className="w-4 h-4" />
                    Open DLC Store
                  </NavLink>
                </Button>
              )}
              <Button asChild variant="outline">
                <NavLink to="/pricing">View Pricing</NavLink>
              </Button>
            </div>
            <Badge variant="secondary" className="mt-3">
              {!isAgeVerified ? "18+ Required" : "Requires Video Library"}
            </Badge>
          </CardContent>
        </Card>
        <AgeVerificationModal
          isOpen={showAgeModal}
          onClose={() => setShowAgeModal(false)}
          onVerified={() => {
            setShowAgeModal(false);
          }}
        />
      </div>
    );
  }

  const selectedVideoTitle =
    privacy.hideTitles || privacy.incognitoMode
      ? "Video Player"
      : (selectedVideo?.title ?? "Video Player");

  const content = (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AgeVerificationModal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        onVerified={() => {
          setShowAgeModal(false);
        }}
      />

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-6 h-6" />
            NSFW Video Content
          </CardTitle>
          <CardDescription>
            Educational videos, technique demonstrations, expert interviews, and tutorials
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={v =>
              setActiveTab(v as "browse" | "playlists" | "downloads" | "history" | "bookmarks")
            }
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              <BrowseTab
                loading={loading}
                videos={videos}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
            selectedRating={selectedRating}
            setSelectedRating={setSelectedRating}
                categories={categories}
                difficultyLevels={difficultyLevels}
            ratingLevels={ratingLevels}
                downloadQuality={downloadQuality}
                setDownloadQuality={setDownloadQuality}
                downloadProgress={downloadProgress}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={(videoId, next) => void handleToggleBookmark(videoId, next)}
                privacy={privacy}
                onPlay={video => {
                  setPlayerMode("stream");
                  setSelectedVideo(video);
                }}
                onDownload={(video, q) => void handleDownload(video, q)}
              />
            </TabsContent>

            <TabsContent value="playlists" className="space-y-4">
              <PlaylistsTab
                onPlayVideo={videoId => {
                  setPlayerMode("stream");
                  setSelectedVideo({ id: videoId } as NSFWVideoType);
                }}
              />
            </TabsContent>

            <TabsContent value="downloads" className="space-y-4">
              <DownloadsTab
                downloads={downloads}
                cachedMap={cachedMap}
                onClearAllOffline={() => void handleClearAllOffline()}
                onPlay={(videoId, quality) => {
                  setPlayerQuality(quality);
                  setPlayerMode("cache_first");
                  setSelectedVideo({ id: videoId } as NSFWVideoType);
                }}
                onRedownload={(videoId, quality) =>
                  void handleDownload({ id: videoId } as NSFWVideoType, quality)
                }
                onDeleteOffline={(videoId, quality) => void handleDeleteOffline(videoId, quality)}
              />
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              <HistoryTab
                continueWatching={continueWatching}
                recentlyWatched={recentlyWatched}
                privacy={privacy}
                onPlay={video => {
                  setPlayerMode("stream");
                  setSelectedVideo(video);
                }}
              />
            </TabsContent>
            <TabsContent value="bookmarks" className="space-y-4">
              <BookmarksTab
                videos={bookmarkedVideos}
                privacy={privacy}
                onPlay={video => {
                  setPlayerMode("stream");
                  setSelectedVideo(video);
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <PlayerDialog
        open={!!selectedVideo}
        title={selectedVideoTitle}
        videoId={selectedVideo?.id ?? null}
        playerUrl={playerUrl}
        loading={playerLoading}
        playerMode={playerMode}
        setPlayerMode={setPlayerMode}
        playerQuality={playerQuality}
        setPlayerQuality={setPlayerQuality}
        onClose={() => {
          void flushWatchHistory();
          setSelectedVideo(null);
        }}
        onSaveOffline={() => {
          if (!selectedVideo) return;
          void handleDownload(selectedVideo, playerQuality);
        }}
        onProgress={payload => void handleProgress(payload)}
        onPlaybackEnded={() => {
          void flushWatchHistory();
          void loadData();
        }}
        onRequestRefresh={refreshPlayerUrl}
      />
    </div>
  );
  return consentEnabled ? (
    <NsfwConsentGate featureIds={["nsfw", "video_library"]}>{content}</NsfwConsentGate>
  ) : (
    content
  );
};
