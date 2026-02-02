import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Users } from "lucide-react";
import type { BookmarkContentType, ExpertContent } from "../types";

export function ExpertsTab({
  loading,
  expertContent,
  onBookmark,
}: {
  loading: boolean;
  expertContent: ExpertContent[];
  onBookmark: (contentType: BookmarkContentType, contentId: string) => void;
}): JSX.Element {
  return loading ? (
    <div className="text-center py-12 text-muted-foreground">Loading...</div>
  ) : expertContent.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {expertContent.map(expert => (
        <Card key={expert.id} variant="glass">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{expert.title}</CardTitle>
                <CardDescription>
                  {expert.expert_name} - {expert.expert_title}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBookmark("expert_content", expert.id!)}
              >
                Bookmark
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{expert.description}</p>
            {expert.video_url && (
              <Button variant="outline" className="w-full" asChild>
                <a href={expert.video_url} target="_blank" rel="noopener noreferrer">
                  <Play className="w-4 h-4 mr-2" />
                  Watch {expert.content_type}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  ) : (
    <div className="text-center py-12 text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No expert content available yet.</p>
    </div>
  );
}
