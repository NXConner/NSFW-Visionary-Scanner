import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import type { BookmarkContentType, ResearchUpdate } from "../types";

export function ResearchTab({
  loading,
  researchUpdates,
  onBookmark,
}: {
  loading: boolean;
  researchUpdates: ResearchUpdate[];
  onBookmark: (contentType: BookmarkContentType, contentId: string) => void;
}): JSX.Element {
  return loading ? (
    <div className="text-center py-12 text-muted-foreground">Loading...</div>
  ) : researchUpdates.length > 0 ? (
    <div className="space-y-4">
      {researchUpdates.map(update => (
        <Card key={update.id} variant="glass">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{update.title}</CardTitle>
                <CardDescription>
                  {update.source_name} •{" "}
                  {update.published_date && new Date(update.published_date).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onBookmark("research_update", update.id!)}
              >
                Bookmark
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{update.summary}</p>
            {update.source_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={update.source_url} target="_blank" rel="noopener noreferrer">
                  Read Full Article
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  ) : (
    <div className="text-center py-12 text-muted-foreground">
      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No research updates available yet.</p>
    </div>
  );
}
