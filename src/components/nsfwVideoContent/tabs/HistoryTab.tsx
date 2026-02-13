import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import type { NSFWVideoContent as NSFWVideoType } from "@/lib/nsfwVideoContent";

type HistoryTabProps = {
  continueWatching: NSFWVideoType[];
  recentlyWatched: NSFWVideoType[];
  onPlay: (video: NSFWVideoType) => void;
  privacy: {
    incognitoMode: boolean;
    hideTitles: boolean;
  };
};

function Section({
  title,
  items,
  onPlay,
  privacy,
}: {
  title: string;
  items: NSFWVideoType[];
  onPlay: (video: NSFWVideoType) => void;
  privacy: HistoryTabProps["privacy"];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(video => (
          <Card key={video.id} className="border border-border/50">
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium">
                  {privacy.hideTitles || privacy.incognitoMode ? "Private Video" : video.title}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {privacy.incognitoMode ? "Description hidden." : video.description}
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{video.category}</Badge>
                  {video.difficulty_level ? (
                    <Badge variant="outline">{video.difficulty_level}</Badge>
                  ) : null}
                </div>
              </div>
              <Button size="sm" onClick={() => onPlay(video)}>
                <Play className="w-4 h-4 mr-1" />
                Play
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function HistoryTab({
  continueWatching,
  recentlyWatched,
  onPlay,
  privacy,
}: HistoryTabProps): JSX.Element {
  if (continueWatching.length === 0 && recentlyWatched.length === 0) {
    return <div className="text-sm text-muted-foreground">No watch history yet.</div>;
  }

  return (
    <div className="space-y-6">
      <Section
        title="Continue watching"
        items={continueWatching}
        onPlay={onPlay}
        privacy={privacy}
      />
      <Section
        title="Recently watched"
        items={recentlyWatched}
        onPlay={onPlay}
        privacy={privacy}
      />
    </div>
  );
}
