import * as React from "react";
import { Link } from "react-router-dom";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadLastScanSnapshot } from "@/scanner/ui/state/lastScanStore";
import { Activity, CheckCircle2, Ruler, CircleDot, Target } from "lucide-react";

export function ScannerResultsScreen(): React.ReactElement {
  const [snapshot, setSnapshot] = React.useState<Awaited<
    ReturnType<typeof loadLastScanSnapshot>
  > | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await loadLastScanSnapshot();
      if (cancelled) return;
      setSnapshot(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav title="Scanner Results" backTo="/scanner" backLabel="Scanner" />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {!snapshot ? (
          <Card variant="glass" className="border-border/50">
            <CardContent className="p-8 text-center space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center">
                <Activity className="w-7 h-7 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">No recent scan found</div>
              <div className="text-sm text-muted-foreground">
                Run a scan first, then come back to view the latest results here.
              </div>
              <Button asChild variant="hero" className="mt-2">
                <Link to="/scanner">Go to Scanner</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card variant="glass" className="border-border/50 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Latest Result
                  <Badge variant="outline" className="ml-auto">
                    {new Date(snapshot.createdAt).toLocaleString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <Ruler className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-semibold">
                      {typeof snapshot.measurements.lengthCm === "number"
                        ? snapshot.measurements.lengthCm.toFixed(1)
                        : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Length (cm)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-center">
                    <CircleDot className="w-5 h-5 mx-auto mb-1 text-accent" />
                    <div className="text-lg font-semibold">
                      {typeof snapshot.measurements.circumferenceCm === "number"
                        ? snapshot.measurements.circumferenceCm.toFixed(1)
                        : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Circ (cm)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-center">
                    <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <div className="text-lg font-semibold">
                      {typeof snapshot.measurements.curvatureAngleDeg === "number"
                        ? `${Math.round(snapshot.measurements.curvatureAngleDeg)}°`
                        : "—"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Curvature</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Confidence:{" "}
                  <span className="font-medium text-foreground">
                    {typeof snapshot.measurements.confidence === "number"
                      ? `${Math.round(snapshot.measurements.confidence)}%`
                      : "—"}
                  </span>
                </div>

                {snapshot.calibration?.pixelsPerMm ? (
                  <div className="text-xs text-muted-foreground">
                    Calibration:{" "}
                    <span className="text-foreground font-mono">
                      {snapshot.calibration.pixelsPerMm.toFixed(3)} px/mm
                    </span>
                    {typeof snapshot.calibration.calibrationConfidence === "number" ? (
                      <>
                        {" "}
                        ·{" "}
                        <span className="text-foreground">
                          {(snapshot.calibration.calibrationConfidence * 100).toFixed(0)}% quality
                        </span>
                      </>
                    ) : null}
                    {typeof snapshot.calibration.skewPercent === "number" ? (
                      <>
                        {" "}
                        ·{" "}
                        <span className="text-foreground">
                          {snapshot.calibration.skewPercent}% skew
                        </span>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Calibration: <span className="text-warning">not available</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="glass" className="border-border/50 overflow-hidden">
              <CardHeader>
                <CardTitle>Annotated Image</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshot.annotatedImageDataUrl ? (
                  <img
                    src={snapshot.annotatedImageDataUrl}
                    alt="Annotated scan"
                    className="w-full h-auto object-contain"
                  />
                ) : snapshot.rawImageDataUrl ? (
                  <img
                    src={snapshot.rawImageDataUrl}
                    alt="Scan"
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No image available for this scan.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
