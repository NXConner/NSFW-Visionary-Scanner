import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurvatureScanSession } from "@/scanner/curvature/types";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function stat(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const mid = sorted[Math.floor(sorted.length / 2)]!;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, mid, avg };
}

function Sparkline({
  values,
  color = "rgba(56,189,248,0.92)",
  label,
  unit,
}: {
  values: number[];
  color?: string;
  label: string;
  unit: string;
}) {
  const w = 260;
  const h = 72;
  const pad = 6;

  const s = stat(values);
  const min = s?.min ?? 0;
  const max = s?.max ?? 0;
  const range = Math.max(1e-6, max - min);

  const pts = values.map((v, i) => {
    const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <div className="rounded-xl border border-border/50 bg-black/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs font-mono text-muted-foreground">
          {s ? `${s.avg.toFixed(1)}${unit} avg` : "—"}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[72px] mt-2">
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={values.length ? 1 : 0.25}
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{values.length ? `${min.toFixed(1)}${unit} min` : "—"}</span>
        <span>{values.length ? `${max.toFixed(1)}${unit} max` : "—"}</span>
      </div>
    </div>
  );
}

export function CurvatureTrends({ sessions }: { sessions: CurvatureScanSession[] }) {
  const last = sessions.slice(0, 30).reverse(); // oldest -> newest for plotting

  const dorsalAngles = last
    .map(s => s.dorsal?.curvatureAngleDeg)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .map(v => clamp(v, 0, 90));

  const lateralAngles = last
    .map(s => s.lateral?.curvatureAngleDeg)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .map(v => clamp(v, 0, 90));

  const lengths = last
    .map(s => s.estimatedLengthCm)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    .map(v => clamp(v, 0, 60));

  return (
    <Card variant="glass">
      <CardHeader className="border-b border-border/50">
        <CardTitle className="text-lg">Trends (last {Math.min(30, sessions.length)})</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <Sparkline
          values={dorsalAngles}
          label="Dorsal angle"
          unit="°"
          color="rgba(56,189,248,0.92)"
        />
        <Sparkline
          values={lateralAngles}
          label="Lateral angle"
          unit="°"
          color="rgba(167,139,250,0.82)"
        />
        <Sparkline values={lengths} label="Length" unit="cm" color="rgba(34,197,94,0.80)" />
      </CardContent>
    </Card>
  );
}
