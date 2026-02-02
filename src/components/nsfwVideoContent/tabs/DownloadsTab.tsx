import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Download, Play } from "lucide-react";
import type { NSFWVideoDownload } from "@/lib/nsfwVideoContent";
import type { VideoQuality } from "@/lib/offlineMedia/videoCache";

export type DownloadsTabProps = {
  downloads: NSFWVideoDownload[];
  cachedMap: Record<string, boolean>;
  onClearAllOffline: () => void;
  onPlay: (videoId: string, quality: VideoQuality) => void;
  onRedownload: (videoId: string, quality: VideoQuality) => void;
  onDeleteOffline: (videoId: string, quality: VideoQuality) => void;
};

export function DownloadsTab(props: DownloadsTabProps): JSX.Element {
  const { downloads, cachedMap, onClearAllOffline, onPlay, onRedownload, onDeleteOffline } = props;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Downloads</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onClearAllOffline}
          disabled={downloads.length === 0}
        >
          Clear all offline
        </Button>
      </div>

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
                    <p className="text-xs text-muted-foreground">
                      Offline cached:{" "}
                      {cachedMap[`${download.video_id}:${download.quality}`] ? "Yes" : "No"}
                    </p>
                    {download.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(download.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {download.download_status === "completed" && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {download.download_status === "downloading" && (
                      <div className="w-32">
                        <Progress value={download.download_progress} />
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPlay(download.video_id, download.quality as VideoQuality)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onRedownload(download.video_id, download.quality as VideoQuality)
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Re-download
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onDeleteOffline(download.video_id, download.quality as VideoQuality)
                      }
                    >
                      Delete offline
                    </Button>

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
    </div>
  );
}
