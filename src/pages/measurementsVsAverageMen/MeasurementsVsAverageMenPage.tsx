import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { MeasurementsComparisonCard } from "@/components/measurementsComparison";
import { Shield, Info, Ruler } from "lucide-react";

export default function MeasurementsVsAverageMenPage() {
  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav
        title="Size Comparison"
        badge="beta"
        backTo="/"
        backLabel="Home"
        showFullNavigation={true}
      />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <ScrollArea className="h-[calc(100vh-110px)] pr-3">
          <div className="space-y-6">
            <MeasurementsComparisonCard />

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  How to read this page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  This compares your latest measurement to three baselines: your personal on-device
                  average, the anonymized app user base average (if available), and a published
                  population mean (“average man”).
                </p>
                <p>
                  Use the percentile gauge to understand where your number sits within a typical
                  population range (p5–p95). Percentiles are not “scores” and don’t predict health,
                  performance, satisfaction, or outcomes.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-primary" />
                  Measurement consistency tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    Use the same protocol each time (same position, same tool, similar time of day).
                  </li>
                  <li>
                    Record multiple entries over time; ignore single outliers caused by stress,
                    temperature, hydration, or sleep.
                  </li>
                  <li>
                    For girth, apply consistent tape tension and measure at a consistent location.
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Separator />

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Your personal averages are computed on-device. Community averages only appear once
                  the app has enough samples to meet privacy thresholds (k-anonymity).
                </p>
                <p>
                  If community averages are unavailable, the page still works using your personal
                  history and the built-in research baseline.
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

