import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { UnitSystem } from "@/lib/measurementsComparison";
import { formatLength, round1 } from "@/lib/measurementsComparison";

type Example = {
  id: string;
  title: string;
  label: "Grower" | "Shower" | "Hybrid";
  flaccidLengthCm: number;
  erectLengthCm: number;
  note: string;
};

const EXAMPLES: Example[] = [
  {
    id: "grower-example",
    title: "Example A: “Grower” pattern",
    label: "Grower",
    flaccidLengthCm: 7.0,
    erectLengthCm: 14.0,
    note: "Small flaccid baseline, large change. This can be especially noticeable when cold or stressed.",
  },
  {
    id: "shower-example",
    title: "Example B: “Shower” pattern",
    label: "Shower",
    flaccidLengthCm: 11.5,
    erectLengthCm: 13.0,
    note: "Larger flaccid baseline, smaller change. The erect size may still be similar to other patterns.",
  },
  {
    id: "hybrid-example",
    title: "Example C: “Hybrid” pattern",
    label: "Hybrid",
    flaccidLengthCm: 9.0,
    erectLengthCm: 13.5,
    note: "Middle range. Many people fall here; day-to-day context can shift which label ‘fits’ if data is limited.",
  },
];

function LabelBadge({ label }: { label: Example["label"] }) {
  if (label === "Grower")
    return <Badge className="bg-success/20 text-success border border-success/30">Grower</Badge>;
  if (label === "Shower")
    return <Badge className="bg-primary/20 text-primary border border-primary/30">Shower</Badge>;
  return <Badge variant="secondary">Hybrid</Badge>;
}

export function GrowersVsShowersExamples({ unitSystem }: { unitSystem: UnitSystem }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <div className="text-base font-semibold">Examples (hypothetical)</div>
        <div className="text-xs text-muted-foreground">
          These are made-up numbers to show how the labels can work. Real people vary a lot and
          labels are not a value judgment.
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        {EXAMPLES.map(e => {
          const delta = e.erectLengthCm - e.flaccidLengthCm;
          const pct = (delta / e.flaccidLengthCm) * 100;
          return (
            <Card key={e.id} className="glass border-border/50 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{e.title}</div>
                <LabelBadge label={e.label} />
              </div>
              <div className="text-sm text-muted-foreground">
                Flaccid:{" "}
                <span className="font-mono">{formatLength(e.flaccidLengthCm, unitSystem)}</span>
                <br />
                Erect:{" "}
                <span className="font-mono">{formatLength(e.erectLengthCm, unitSystem)}</span>
                <br />Δ length:{" "}
                <span className="font-mono">
                  {round1(delta)} cm ({round1(delta / 2.54)} in) • {round1(pct)}%
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{e.note}</div>
            </Card>
          );
        })}
      </div>

      <Card className="glass border-border/50 p-4">
        <div className="text-sm font-medium">About “preference” and “enhancement potential”</div>
        <div className="mt-2 text-sm text-muted-foreground space-y-2">
          <p>
            <span className="font-medium">Preference</span>: there isn’t a strong scientific basis
            that one pattern is “more preferred.” Survey results depend heavily on culture,
            relationship context, and what’s being asked. Many partners report that comfort,
            communication, and arousal quality matter more than any label.
          </p>
          <p>
            <span className="font-medium">Enhancement potential</span>: there’s also no robust
            evidence that being a grower/shower reliably predicts who will see better outcomes from
            safe, conservative training. What does matter more is consistent technique, recovery,
            avoiding injury, and measuring the same way each time.
          </p>
        </div>
      </Card>
    </section>
  );
}
