import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useData } from "@/contexts/DataContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import type { UnitSystem } from "@/lib/measurementsComparison";
import { formatLength, round1 } from "@/lib/measurementsComparison";
import { summarizeGrowersVsShowers, GVS_KEY_TOPICS, GVS_RESOURCES } from "@/lib/growersVsShowers";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { GrowersVsShowersCard } from "@/components/growersVsShowers/GrowersVsShowersCard";
import { GrowthVisuals } from "./components/GrowthVisuals";
import { KeyTopicsSection } from "./components/KeyTopicsSection";
import { ResourceSection } from "./components/ResourceSection";
import { TrendingUp, Info } from "lucide-react";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { GrowersVsShowersIllustrations } from "./components/GrowersVsShowersIllustrations";
import { GrowersVsShowersExamples } from "./components/GrowersVsShowersExamples";

function StatPill(props: { label: string; value: string; hint?: string }) {
  const { label, value, hint } = props;
  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export default function GrowersVsShowersPage() {
  const flagEnabled = useFeatureFlag("growers_vs_showers", false);
  const { scans, isLoading } = useData();
  const { measurementUnits } = useSettings();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const { isSuperAdmin: isSuperAdminRole, isLoading: rolesLoading } = useUserRoles();
  const unitSystem: UnitSystem = measurementUnits ?? "dual";

  const summary = useMemo(() => summarizeGrowersVsShowers(scans || []), [scans]);

  // Wait for role checks to complete before showing restricted message
  const stillCheckingAccess = authLoading || rolesLoading;
  const enabled = Boolean(flagEnabled || isSuperAdmin || isSuperAdminRole);

  // Show loading while checking access
  if (stillCheckingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Growers vs Showers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This feature is currently{" "}
              <span className="font-medium">restricted to Super Admin</span>.
              <div className="mt-2 text-xs text-muted-foreground">
                If you are the super admin, sign in with your super admin account and refresh.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const flLen = summary.averages.flaccidLengthCm;
  const erLen = summary.averages.erectLengthCm;
  const flG = summary.averages.flaccidGirthCm;
  const erG = summary.averages.erectGirthCm;
  const dLen = summary.deltas.lengthCm;
  const dG = summary.deltas.girthCm;

  const lengthDeltaLabel =
    dLen != null && flLen != null
      ? `${round1(dLen)} cm (${round1(dLen / 2.54)} in) • ${summary.deltas.lengthPercent != null ? `${round1(summary.deltas.lengthPercent)}%` : "—"}`
      : "—";
  const girthDeltaLabel =
    dG != null && flG != null
      ? `${round1(dG)} cm (${round1(dG / 2.54)} in) • ${summary.deltas.girthPercent != null ? `${round1(summary.deltas.girthPercent)}%` : "—"}`
      : "—";

  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav
        title="Growers vs Showers"
        badge="beta"
        backTo="/"
        backLabel="Home"
        showFullNavigation={true}
        actions={[
          {
            key: "unit",
            kind: "custom",
            node: (
              <Badge variant="outline" className="whitespace-nowrap">
                {unitSystem === "dual" ? "cm + in" : unitSystem === "imperial" ? "in" : "cm"}
              </Badge>
            ),
          },
        ]}
      />

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <ScrollArea className="h-[calc(100vh-110px)] pr-3">
          <div className="space-y-6">
            <GrowersVsShowersCard unitSystem={unitSystem} />

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Educational overview (non-explicit)
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Clear definitions, examples, and safe diagrams to reduce confusion and measurement
                  anxiety.
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  “Grower” vs “shower” describes{" "}
                  <span className="font-medium">how much size changes</span> from flaccid → erect.
                  It does <span className="font-medium">not</span> rank anyone as better/worse, and
                  it does <span className="font-medium">not</span> reliably predict confidence,
                  sexual satisfaction, or relationship outcomes.
                </p>
                <p>
                  The key reason this topic feels confusing is that{" "}
                  <span className="font-medium">flaccid size is highly variable</span> (temperature,
                  stress, activity, hydration), while{" "}
                  <span className="font-medium">erect size is usually more stable</span> (though
                  erection quality still varies).
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Your numbers (summary)
                </CardTitle>
                <div className="text-xs text-muted-foreground">
                  Based on your labeled measurements. Best accuracy comes from paired entries.
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading your history…</div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-3 gap-3">
                      <StatPill
                        label="Avg flaccid length"
                        value={flLen != null ? formatLength(flLen, unitSystem) : "—"}
                        hint={`n=${summary.sample.flaccidCount}`}
                      />
                      <StatPill
                        label="Avg erect length"
                        value={erLen != null ? formatLength(erLen, unitSystem) : "—"}
                        hint={`n=${summary.sample.erectCount}`}
                      />
                      <StatPill
                        label="Length delta (erect - flaccid)"
                        value={lengthDeltaLabel}
                        hint={`thresholds: shower ≤ ${round1(summary.thresholds.showerMaxDeltaCm)} cm • grower ≥ ${round1(summary.thresholds.growerMinDeltaCm)} cm`}
                      />
                      <StatPill
                        label="Avg flaccid girth"
                        value={flG != null ? formatLength(flG, unitSystem) : "—"}
                        hint={`n=${summary.sample.flaccidCount}`}
                      />
                      <StatPill
                        label="Avg erect girth"
                        value={erG != null ? formatLength(erG, unitSystem) : "—"}
                        hint={`n=${summary.sample.erectCount}`}
                      />
                      <StatPill
                        label="Girth delta (erect - flaccid)"
                        value={girthDeltaLabel}
                        hint="Girth deltas can be noisier; use consistent tape tension."
                      />
                    </div>

                    {summary.warnings.length > 0 && (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
                        <div className="font-medium text-warning">Data quality notes</div>
                        <ul className="mt-1 space-y-1 list-disc pl-4">
                          {summary.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <GrowthVisuals
              unitSystem={unitSystem}
              flaccidLengthCm={flLen}
              erectLengthCm={erLen}
              flaccidGirthCm={flG}
              erectGirthCm={erG}
            />

            <GrowersVsShowersIllustrations />
            <GrowersVsShowersExamples unitSystem={unitSystem} />

            <Separator />
            <KeyTopicsSection topics={GVS_KEY_TOPICS} />

            <Separator />
            <div className="space-y-4">
              <ResourceSection
                title="Research references"
                subtitle="Peer-reviewed or research-indexed sources for population statistics and measurement context."
                resources={GVS_RESOURCES.research}
              />
              <ResourceSection
                title="Measurement & consistency guides"
                subtitle="Use consistent protocol and avoid chasing single measurements."
                resources={GVS_RESOURCES.measurementGuides}
              />
              <ResourceSection
                title="Body image & anxiety support"
                subtitle="If tracking becomes stressful, these are solid starting points."
                resources={GVS_RESOURCES.bodyImageAndAnxiety}
              />
              <ResourceSection
                title="Videos & playlists (non-explicit)"
                subtitle="Educational searches—stick to clinician/academic content and avoid explicit material."
                resources={GVS_RESOURCES.videosAndPlaylists}
              />
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
