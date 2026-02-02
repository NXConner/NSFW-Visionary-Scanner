import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  getVideos,
  getVideo,
  updateVideoProgress,
  getUserVideoProgress,
  createPlaylist,
  getPlaylists,
  addVideoToPlaylist,
  getPlaylistVideos,
  bookmarkVideo,
  getBookmarkedVideos,
  rateVideo,
  getVideoRating,
  type Video,
  type VideoPlaylist,
  type VideoProgress,
} from "@/lib/videoLibrary";
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  Download,
  List,
  Clock,
  Eye,
  Search,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

export const VideoLibrary = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [playlists, setPlaylists] = useState<VideoPlaylist[]>([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: "All Videos" },
    { id: "education", label: "Education" },
    { id: "exercise", label: "Exercise" },
    { id: "technique", label: "Technique" },
    { id: "expert_interview", label: "Expert Interviews" },
    { id: "webinar", label: "Webinars" },
    { id: "tutorial", label: "Tutorials" },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "browse": {
          const videosData = await getVideos(
            selectedCategory === "all" ? undefined : selectedCategory,
            false,
            false,
          );
          setVideos(videosData);
          const progressData = await getUserVideoProgress();
          setVideoProgress(progressData);
          break;
        }
        case "playlists": {
          const playlistsData = await getPlaylists();
          setPlaylists(playlistsData);
          break;
        }
        case "bookmarks": {
          const bookmarkedData = await getBookmarkedVideos();
          setBookmarkedVideos(bookmarkedData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleVideoClick = async (video: Video) => {
    try {
      const videoData = await getVideo(video.id!);
      if (videoData) {
        setSelectedVideo(videoData);
      }
    } catch (error) {
      toast.error("Failed to load video");
    }
  };

  const handleVideoProgress = async (progressSeconds: number) => {
    if (!selectedVideo) return;

    try {
      await updateVideoProgress(selectedVideo.id!, progressSeconds, selectedVideo.duration_seconds);
      await loadData();
    } catch (error) {
      // Silent fail for progress updates
    }
  };

  const handleBookmark = async (videoId: string) => {
    try {
      await bookmarkVideo(videoId);
      toast.success("Video bookmarked!");
      await loadData();
    } catch (error) {
      toast.error("Failed to bookmark video");
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoProgress = (videoId: string): number => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    return progress?.progress_percentage || 0;
  };

  const isVideoCompleted = (videoId: string): boolean => {
    const progress = videoProgress.find(p => p.video_id === videoId);
    return progress?.is_completed || false;
  };

  if (selectedVideo) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedVideo(null)}>
          ← Back to Library
        </Button>

        <Card variant="glass">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{selectedVideo.title}</CardTitle>
                <CardDescription>{selectedVideo.description}</CardDescription>
                <div className="flex gap-2 mt-4">
                  <Badge variant="outline">{selectedVideo.category}</Badge>
                  {selectedVideo.difficulty_level && (
                    <Badge variant="outline">{selectedVideo.difficulty_level}</Badge>
                  )}
                  {selectedVideo.is_premium && <Badge className="bg-yellow-500">Premium</Badge>}
                  {selectedVideo.rating_average && (
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {selectedVideo.rating_average.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleBookmark(selectedVideo.id!)}>
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary mb-6">
              <video
                src={selectedVideo.video_url}
                controls
                className="w-full h-full"
                onTimeUpdate={e => {
                  const currentTime = e.currentTarget.currentTime;
                  handleVideoProgress(currentTime);
                }}
              >
                <track
                  kind="captions"
                  srcLang="en"
                  label="English"
                  src={"data:text/vtt,WEBVTT%0A%0A"}
                  default
                />
              </video>
            </div>

            {selectedVideo.instructor_name && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Instructor</p>
                <p className="font-semibold">{selectedVideo.instructor_name}</p>
                {selectedVideo.instructor_credentials && (
                  <p className="text-sm text-muted-foreground">
                    {selectedVideo.instructor_credentials}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(selectedVideo.duration_seconds)}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {selectedVideo.view_count || 0} views
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Video Library</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Video</span> Library
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Educational videos, tutorials, expert interviews, and instructional content.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map(video => {
                const progress = getVideoProgress(video.id!);
                const isCompleted = isVideoCompleted(video.id!);

                return (
                  <Card
                    key={video.id}
                    variant="glass"
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="relative aspect-video bg-secondary rounded-t-lg overflow-hidden">
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
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary/50">
                          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      {isCompleted && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500">Completed</Badge>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {video.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(video.duration_seconds)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.view_count || 0}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No videos available yet. Check back soon!</p>
            </div>
          )}
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Your Playlists</h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {playlists.map(playlist => (
                <Card key={playlist.id} variant="glass">
                  <CardHeader>
                    <CardTitle>{playlist.name}</CardTitle>
                    <CardDescription>{playlist.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <List className="w-4 h-4" />
                        {playlist.video_count || 0} videos
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No playlists yet. Create one to organize your favorite videos!</p>
            </div>
          )}
        </TabsContent>

        {/* Bookmarks Tab */}
        <TabsContent value="bookmarks" className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : bookmarkedVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedVideos.map(video => (
                <Card
                  key={video.id}
                  variant="glass"
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleVideoClick(video)}
                >
                  <div className="relative aspect-video bg-secondary rounded-t-lg overflow-hidden">
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
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bookmarked videos yet. Bookmark videos to watch later!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
