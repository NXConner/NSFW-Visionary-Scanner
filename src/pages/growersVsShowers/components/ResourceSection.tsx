import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { ExternalResource } from "@/lib/growersVsShowers";

function ResourceCard({ r }: { r: ExternalResource }) {
  return (
    <Card className="glass border-border/50 p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold leading-snug">{r.title}</div>
          <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
        </div>
        <Button asChild variant="outline" size="sm" className="flex-shrink-0">
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-2 inline-flex items-center"
          >
            Open <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {r.provider ? (
          <Badge variant="secondary" className="text-[10px]">
            {r.provider}
          </Badge>
        ) : null}
        {r.tags.map(t => (
          <Badge key={t} variant="outline" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>

      {r.cautionNote ? (
        <div className="text-[11px] text-muted-foreground border-l-2 border-warning/40 pl-2">
          {r.cautionNote}
        </div>
      ) : null}
    </Card>
  );
}

export function ResourceSection(props: {
  title: string;
  subtitle?: string;
  resources: ExternalResource[];
}) {
  const { title, subtitle, resources } = props;
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="text-base font-semibold">{title}</div>
        {subtitle ? <div className="text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        {resources.map(r => (
          <ResourceCard key={r.id} r={r} />
        ))}
      </div>
    </section>
  );
}
