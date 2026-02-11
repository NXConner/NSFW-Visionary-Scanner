import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, Clock, Download, Eye, Loader2, Play, Search, Star } from "lucide-react";
import type { NSFWVideoContent as NSFWVideoType } from "@/lib/nsfwVideoContent";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";

export type BrowseTabProps = {
  loading: boolean;
  videos: NSFWVideoType[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (v: string) => void;
  selectedRating: string;
  setSelectedRating: (v: string) => void;
  categories: Array<{ id: string; label: string }>;
  difficultyLevels: Array<{ id: string; label: string }>;
  ratingLevels: Array<{ id: string; label: string }>;
  downloadQuality: VideoQuality;
  setDownloadQuality: (q: VideoQuality) => void;
  downloadProgress: Record<string, number>;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (videoId: string, nextState: boolean) => void;
  onPlay: (video: NSFWVideoType) => void;
  onDownload: (video: NSFWVideoType, quality: VideoQuality) => void;
  privacy: {
    incognitoMode: boolean;
    blurThumbnails: boolean;
    hideTitles: boolean;
  };
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function BrowseTab(props: BrowseTabProps): JSX.Element {
  const {
    loading,
    videos,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedRating,
    setSelectedRating,
    categories,
    difficultyLevels,
    ratingLevels,
    downloadQuality,
    setDownloadQuality,
    downloadProgress,
    bookmarkedIds,
    onToggleBookmark,
    onPlay,
    onDownload,
    privacy,
  } = props;

  const filteredVideos = videos.filter(video => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return video.title.toLowerCase().includes(q) || video.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
          {filteredVideos.map(video => {
            const isBookmarked = bookmarkedIds.has(video.id);
            return (
              <Card
                key={video.id}
                className="glass-card border-border/50 hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-muted/30 rounded-t-lg overflow-hidden">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={
                          privacy.hideTitles || privacy.incognitoMode
                            ? "Video thumbnail"
                            : video.title
                        }
                        className={[
                          "w-full h-full object-cover",
                          privacy.blurThumbnails || privacy.incognitoMode
                            ? "blur-md scale-105"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {(privacy.blurThumbnails || privacy.incognitoMode) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Badge variant="secondary" className="gap-1">
                          <Eye className="w-3 h-3" />
                          Tap Play to reveal
                        </Badge>
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
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute bottom-2 right-2 bg-background/70 hover:bg-background"
                      onClick={() => onToggleBookmark(video.id, !isBookmarked)}
                      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark video"}
                    >
                      <Bookmark
                        className={isBookmarked ? "w-4 h-4 fill-primary text-primary" : "w-4 h-4"}
                      />
                    </Button>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold line-clamp-2">
                      {privacy.hideTitles || privacy.incognitoMode ? "Private Video" : video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {privacy.incognitoMode
                        ? "Description hidden in incognito mode."
                        : video.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.video_duration_seconds)}
                      </span>
                      {!privacy.incognitoMode && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {video.view_count}
                        </span>
                      )}
                      {!privacy.incognitoMode && video.average_rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {video.average_rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => onPlay(video)}>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(video, downloadQuality)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2 gap-2">
                      <Select
                        value={downloadQuality}
                        onValueChange={v => setDownloadQuality(v as VideoQuality)}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="Quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sd">SD</SelectItem>
                          <SelectItem value="hd">HD</SelectItem>
                          <SelectItem value="4k">4K</SelectItem>
                        </SelectContent>
                      </Select>

                      {downloadProgress[`${video.id}:${downloadQuality}`] != null &&
                        downloadProgress[`${video.id}:${downloadQuality}`] > 0 &&
                        downloadProgress[`${video.id}:${downloadQuality}`] < 100 && (
                          <div className="flex-1">
                            <Progress value={downloadProgress[`${video.id}:${downloadQuality}`]} />
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredVideos.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">No videos found</div>
      )}
    </div>
  );
}
