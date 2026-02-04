/**
 * NSFW Video Content System
 * Comprehensive video library for NSFW educational content, technique demonstrations, expert interviews, and tutorials
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNSFWVideos,
  getVideoDownloads,
  requestVideoDownload,
  updateVideoProgress as updateVideoProgressFn,
  type NSFWVideoContent as NSFWVideoItem,
  type NSFWVideoDownload,
} from "@/lib/nsfwVideoContent";
import { hasNSFWContent, isSFW } from "@/lib/featureFlags";
import {
  Play,
  Download,
  Star,
  Clock,
  Eye,
  Search,
  Plus,
  Loader2,
  Lock,
  CheckCircle2,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/VideoPlayer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const NSFWVideoContent = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<NSFWVideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<NSFWVideoItem | null>(null);
  const [downloads, setDownloads] = useState<NSFWVideoDownload[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [nsfwAvailable, setNsfwAvailable] = useState(false);
  const [isCheckingNsfw, setIsCheckingNsfw] = useState(true);

  const categories = [
    { id: "all", label: "All Videos" },
    { id: "technique", label: "Technique" },
    { id: "tutorial", label: "Tutorial" },
    { id: "expert_interview", label: "Expert Interviews" },
    { id: "educational", label: "Educational" },
    { id: "demonstration", label: "Demonstration" },
    { id: "advanced", label: "Advanced" },
    { id: "beginner", label: "Beginner" },
  ];

  const difficultyLevels = [
    { id: "all", label: "All Levels" },
    { id: "beginner", label: "Beginner" },
    { id: "intermediate", label: "Intermediate" },
    { id: "advanced", label: "Advanced" },
    { id: "expert", label: "Expert" },
  ];

  const ratingLevels = [
    { id: "all", label: "All Ratings" },
    { id: "educational", label: "Educational" },
    { id: "demonstrative", label: "Demonstrative" },
    { id: "explicit", label: "Explicit" },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "browse": {
          const videosData = await getNSFWVideos(
            selectedCategory === "all" ? undefined : (selectedCategory as any),
            selectedDifficulty === "all" ? undefined : (selectedDifficulty as any),
            selectedRating === "all" ? undefined : (selectedRating as any),
          );
          setVideos(videosData);
          break;
        }
        case "playlists": {
          // Load playlists
          break;
        }
        case "downloads": {
          const downloadsData = await getVideoDownloads();
          setDownloads(downloadsData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory, selectedDifficulty, selectedRating]);

  useEffect(() => {
    const checkNsfw = async () => {
      setIsCheckingNsfw(true);
      const available = await hasNSFWContent();
      setNsfwAvailable(available);
      setIsCheckingNsfw(false);
    };
    void checkNsfw();
  }, []);

  useEffect(() => {
    if (nsfwAvailable) {
      void loadData();
    }
  }, [activeTab, selectedCategory, selectedDifficulty, selectedRating, nsfwAvailable, loadData]);

  const handleDownload = async (
    video: NSFWVideoItem,
    quality: "sd" | "hd" | "2k" | "4k" = "hd",
  ) => {
    try {
      const download = await requestVideoDownload(video.id, quality);
      if (download) {
        await loadData();
      }
    } catch (error) {
      toast.error("Failed to start download");
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isCheckingNsfw) {
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

  if (isSFW() || !nsfwAvailable) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Lock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">NSFW Content Not Available</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              NSFW video content is only available in the NSFW version or with a DLC upgrade.
            </p>
            <Badge variant="secondary">Requires NSFW Version or DLC</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch =
      searchQuery === "" ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="browse">Browse</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyLevels.map(level => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Rating tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingLevels.map(level => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVideos.map(video => (
                    <Card
                      key={video.id}
                      className="glass-card border-border/50 hover:border-primary/50 transition-colors"
                    >
                      <CardContent className="p-0">
                        <div className="relative aspect-video bg-muted/30 rounded-t-lg overflow-hidden">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {video.is_premium && (
                            <Badge className="absolute top-2 right-2" variant="secondary">
                              Premium
                            </Badge>
                          )}
                          {video.is_featured && (
                            <Badge className="absolute top-2 left-2" variant="default">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {video.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(video.video_duration_seconds)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {video.view_count}
                            </span>
                            {video.average_rating && (
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {video.average_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedVideo(video)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Play
                            </Button>
                            <Select
                              onValueChange={quality =>
                                handleDownload(video, quality as "sd" | "hd" | "2k" | "4k")
                              }
                            >
                              <SelectTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Download className="w-4 h-4" />
                                </Button>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sd">SD (720p)</SelectItem>
                                <SelectItem value="hd">HD (1080p)</SelectItem>
                                <SelectItem value="2k">2K (1440p)</SelectItem>
                                <SelectItem value="4k">4K (2160p)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {filteredVideos.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">No videos found</div>
              )}
            </TabsContent>

            <TabsContent value="playlists" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">My Playlists</h3>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
              <div className="text-center py-12 text-muted-foreground">
                Playlist management coming soon
              </div>
            </TabsContent>

            <TabsContent value="downloads" className="space-y-4">
              <h3 className="text-lg font-semibold">Downloads</h3>
              {downloads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No downloads yet</div>
              ) : (
                <div className="space-y-2">
                  {downloads.map(download => (
                    <Card key={download.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">Video ID: {download.video_id}</p>
                            <p className="text-sm text-muted-foreground">
                              Quality: {download.quality.toUpperCase()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {download.download_status === "completed" && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                            {download.download_status === "downloading" && (
                              <div className="w-32">
                                <Progress value={download.download_progress} />
                              </div>
                            )}
                            <Badge
                              variant={
                                download.download_status === "completed"
                                  ? "default"
                                  : download.download_status === "downloading"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {download.download_status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {selectedVideo && (
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedVideo.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <VideoPlayer
                videoUrl={
                  selectedVideo.video_url_4k ||
                  selectedVideo.video_url_2k ||
                  selectedVideo.video_url_hd ||
                  selectedVideo.video_url_sd ||
                  ""
                }
                recordingId={selectedVideo.id}
                title={selectedVideo.title}
                showScreenshots={true}
                onProgress={async progress => {
                  if (selectedVideo) {
                    const currentTime =
                      (progress / 100) * (selectedVideo.video_duration_seconds || 0);
                    await updateVideoProgressFn(selectedVideo.id, currentTime, currentTime);
                  }
                }}
              />
              {selectedVideo.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                </div>
              )}
              {selectedVideo.key_points && selectedVideo.key_points.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Key Points</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {selectedVideo.key_points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
