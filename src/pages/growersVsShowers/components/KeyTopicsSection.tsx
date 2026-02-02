import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GVS_KEY_TOPICS } from "@/lib/growersVsShowers";

type Topic = (typeof GVS_KEY_TOPICS)[number];

export function KeyTopicsSection({ topics }: { topics: Topic[] }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="text-base font-semibold">Key topics (quick, practical)</div>
        <div className="text-xs text-muted-foreground">
          This is educational context. It’s not a diagnosis and it’s not a value judgment.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        {topics.map(t => (
          <Card key={t.id} className="glass border-border/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{t.title}</div>
              <Badge variant="outline" className="text-[10px]">
                topic
              </Badge>
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {t.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}

