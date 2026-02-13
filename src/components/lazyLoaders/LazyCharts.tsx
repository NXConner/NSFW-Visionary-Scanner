/**
 * Lazy-loaded Chart Components
 * 
 * This module provides lazy-loaded versions of recharts components
 * to reduce initial bundle size.
 */

import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

function ChartFallback({ height = 200 }: { height?: number }) {
  return (
    <div 
      className="flex w-full items-center justify-center rounded-lg border bg-muted/30"
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-xs">Loading chart...</span>
      </div>
    </div>
  );
}

// Lazy load individual chart components
const LazyLineChartComponent = lazy(() => 
  import("recharts").then(m => ({ default: m.LineChart }))
);

const LazyAreaChartComponent = lazy(() => 
  import("recharts").then(m => ({ default: m.AreaChart }))
);

const LazyBarChartComponent = lazy(() => 
  import("recharts").then(m => ({ default: m.BarChart }))
);

const LazyPieChartComponent = lazy(() => 
  import("recharts").then(m => ({ default: m.PieChart }))
);

const LazyRadarChartComponent = lazy(() => 
  import("recharts").then(m => ({ default: m.RadarChart }))
);

// Re-export chart primitives that are needed alongside charts
// These are small and can be imported directly
export { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Line, 
  Area, 
  Bar, 
  Pie, 
  Cell,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

// Wrapper components with Suspense
export function LazyLineChart(props: React.ComponentProps<typeof LazyLineChartComponent>) {
  return (
    <Suspense fallback={<ChartFallback height={typeof props.height === "number" ? props.height : 200} />}>
      <LazyLineChartComponent {...props} />
    </Suspense>
  );
}

export function LazyAreaChart(props: React.ComponentProps<typeof LazyAreaChartComponent>) {
  return (
    <Suspense fallback={<ChartFallback height={typeof props.height === "number" ? props.height : 200} />}>
      <LazyAreaChartComponent {...props} />
    </Suspense>
  );
}

export function LazyBarChart(props: React.ComponentProps<typeof LazyBarChartComponent>) {
  return (
    <Suspense fallback={<ChartFallback height={typeof props.height === "number" ? props.height : 200} />}>
      <LazyBarChartComponent {...props} />
    </Suspense>
  );
}

export function LazyPieChart(props: React.ComponentProps<typeof LazyPieChartComponent>) {
  return (
    <Suspense fallback={<ChartFallback height={typeof props.height === "number" ? props.height : 200} />}>
      <LazyPieChartComponent {...props} />
    </Suspense>
  );
}

export function LazyRadarChart(props: React.ComponentProps<typeof LazyRadarChartComponent>) {
  return (
    <Suspense fallback={<ChartFallback height={typeof props.height === "number" ? props.height : 200} />}>
      <LazyRadarChartComponent {...props} />
    </Suspense>
  );
}
