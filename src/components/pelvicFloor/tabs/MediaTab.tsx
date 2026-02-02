import { ExternalLink, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { VideoEmbed } from "@/components/pelvicFloor/components/VideoEmbed";
import { PELVIC_FLOOR_RESOURCES } from "@/components/pelvicFloor/data/kegelHubContent";

export function MediaTab({
  videoUrl,
  onChangeVideoUrl,
}: {
  videoUrl: string;
  onChangeVideoUrl: (next: string) => void;
}): JSX.Element {
  return (
    <div className="space-y-4">
      <VideoEmbed url={videoUrl} onChangeUrl={onChangeVideoUrl} />

      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Trusted resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use reputable medical sources for technique refinement and condition-specific guidance.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {PELVIC_FLOOR_RESOURCES.map(r => (
              <div
                key={r.id}
                className="rounded-lg border border-border/60 bg-muted/10 p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-sm text-foreground">{r.title}</div>
                  <Badge variant="outline" className="text-[10px]">
                    {r.kind}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <a href={r.href} target="_blank" rel="noopener noreferrer">
                      Open
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
