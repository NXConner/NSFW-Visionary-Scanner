import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CurvatureScanSession } from "@/scanner/curvature/types";
import { Trash2 } from "lucide-react";

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export function CurvatureHistoryList({
  sessions,
  selectedId,
  onSelect,
  onDelete,
}: {
  sessions: CurvatureScanSession[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (!sessions.length) {
    return (
      <Card variant="glass">
        <CardContent className="p-6 text-sm text-muted-foreground">
          No curvature sessions yet. Run a scan and save to create history.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map(s => {
        const active = s.id === selectedId;
        const dorsal = s.dorsal?.curvatureAngleDeg ?? null;
        const lateral = s.lateral?.curvatureAngleDeg ?? null;
        const conf = s.overallConfidence ?? null;
        return (
          <Card
            key={s.id}
            variant={active ? "glow" : "glass"}
            className={active ? "border-primary/30" : ""}
          >
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <button type="button" className="text-left flex-1" onClick={() => onSelect(s.id)}>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">Curvature Session</div>
                  {conf != null ? (
                    <Badge variant="outline" className="bg-background/60">
                      {conf}% conf
                    </Badge>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{fmtDate(s.createdAt)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">Dorsal: {dorsal != null ? `${dorsal}°` : "—"}</Badge>
                  <Badge variant="secondary">
                    Lateral: {lateral != null ? `${lateral}°` : "—"}
                  </Badge>
                  <Badge variant="secondary">
                    Length:{" "}
                    {s.estimatedLengthCm != null ? `${s.estimatedLengthCm.toFixed(1)} cm` : "—"}
                  </Badge>
                </div>
              </button>

              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => onDelete(s.id)}
                aria-label="Delete session"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
