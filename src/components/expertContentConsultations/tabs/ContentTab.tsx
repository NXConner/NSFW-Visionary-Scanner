import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { BookOpen, Video } from "lucide-react";
import {
  getExpertArticles,
  getExpertVideos,
  type ExpertArticle,
  type ExpertProfile,
  type ExpertVideo,
} from "@/lib/expertContentConsultations";

export function ContentTab({
  isActive,
  expert,
}: {
  isActive: boolean;
  expert: ExpertProfile | null;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<ExpertArticle[]>([]);
  const [videos, setVideos] = useState<ExpertVideo[]>([]);

  const load = useCallback(async () => {
    if (!expert) return;
    setLoading(true);
    try {
      const [articlesData, videosData] = await Promise.all([
        getExpertArticles(expert.id),
        getExpertVideos(expert.id),
      ]);
      setArticles(articlesData);
      setVideos(videosData);
    } catch {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [expert]);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  if (!expert)
    return (
      <p className="text-center py-8 text-muted-foreground">
        Select an expert to view their content
      </p>
    );
  if (loading)
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">Loading…</div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5" />
          Articles
        </h3>
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-sm">No articles available</p>
        ) : (
          <div className="grid gap-4">
            {articles.map(article => (
              <Card key={article.id}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{article.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {article.content?.substring(0, 150)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold flex items-center gap-2 mb-4">
          <Video className="h-5 w-5" />
          Videos
        </h3>
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-sm">No videos available</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {videos.map(video => (
              <Card key={video.id}>
                <CardContent className="p-4">
                  <h4 className="font-medium">{video.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
