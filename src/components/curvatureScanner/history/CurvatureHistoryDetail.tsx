import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CurvatureScanSession } from "@/scanner/curvature/types";
import { CurvatureMiniPlot } from "../CurvatureMiniPlot";

export function CurvatureHistoryDetail({ session }: { session: CurvatureScanSession | null }) {
  if (!session) {
    return (
      <Card variant="glass">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Select a session to view details.
        </CardContent>
      </Card>
    );
  }

  const dorsal = session.dorsal?.curvatureAngleDeg ?? 0;
  const lateral = session.lateral?.curvatureAngleDeg ?? 0;
  const dorsalDir = session.dorsal?.curvatureDirection ?? "unknown";
  const lateralDir = session.lateral?.curvatureDirection ?? "unknown";
  const interp = session.interpretation;

  return (
    <Card variant="glow">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="flex items-center justify-between">
          <span>Session details</span>
          {session.overallConfidence != null ? (
            <Badge variant="outline" className="bg-background/60">
              {session.overallConfidence}% conf
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
            <div className="text-xs text-muted-foreground">Dorsal angle</div>
            <div className="text-2xl font-bold">{dorsal ? `${dorsal}°` : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Direction: {dorsalDir}</div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
            <div className="text-xs text-muted-foreground">Lateral angle</div>
            <div className="text-2xl font-bold">{lateral ? `${lateral}°` : "—"}</div>
            <div className="text-xs text-muted-foreground mt-1">Direction: {lateralDir}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
          <div className="text-xs text-muted-foreground">Estimated length</div>
          <div className="text-2xl font-bold">
            {session.estimatedLengthCm != null ? `${session.estimatedLengthCm.toFixed(1)} cm` : "—"}
          </div>
        </div>

        <CurvatureMiniPlot angleDeg={dorsal} label="Dorsal curve" />
        <CurvatureMiniPlot angleDeg={lateral} label="Lateral curve" />

        {interp ? (
          <div className="rounded-xl border border-border/50 bg-secondary/15 p-4">
            <div className="text-sm font-medium mb-2">Interpretation settings</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Flip left/right (top view): {interp.flipTopViewLeftRight ? "on" : "off"}</div>
              <div>Flip dorsal/ventral (side view): {interp.flipSideViewDorsalVentral ? "on" : "off"}</div>
            </div>
          </div>
        ) : null}

        {session.images?.dorsalAnnotated || session.images?.lateralAnnotated ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.images?.dorsalAnnotated ? (
              <div className="rounded-xl border border-border/50 bg-black/20 overflow-hidden">
                <img src={session.images.dorsalAnnotated} alt="Dorsal annotated" className="w-full h-full object-contain" />
              </div>
            ) : null}
            {session.images?.lateralAnnotated ? (
              <div className="rounded-xl border border-border/50 bg-black/20 overflow-hidden">
                <img src={session.images.lateralAnnotated} alt="Lateral annotated" className="w-full h-full object-contain" />
              </div>
            ) : null}
          </div>
        ) : null}

        {(session.warnings?.dorsal?.length || session.warnings?.lateral?.length) ? (
          <div className="rounded-xl border border-border/50 bg-secondary/15 p-4">
            <div className="text-sm font-medium mb-2">Warnings</div>
            <div className="text-xs text-muted-foreground space-y-2">
              {session.warnings?.dorsal?.length ? (
                <div>
                  <div className="font-medium text-foreground/80">Dorsal</div>
                  <ul className="list-disc ml-4">
                    {session.warnings.dorsal.slice(0, 6).map((w, i) => (
                      <li key={`d-${i}`}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {session.warnings?.lateral?.length ? (
                <div>
                  <div className="font-medium text-foreground/80">Lateral</div>
                  <ul className="list-disc ml-4">
                    {session.warnings.lateral.slice(0, 6).map((w, i) => (
                      <li key={`l-${i}`}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

