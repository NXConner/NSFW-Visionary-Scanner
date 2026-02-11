import { formatLength } from "@/lib/measurementsComparison";
import type { UnitSystem } from "@/lib/measurementsComparison";
import { User, Users, Globe } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  metricLabel: string;
  unitSystem: UnitSystem;
  userValueCm: number;
  communityValueCm: number | null;
  averageManValueCm: number;
  isPlaceholderCommunity?: boolean;
};

type BarData = {
  label: string;
  shortLabel: string;
  valueCm: number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderClass: string;
};

export function TripleComparisonViz({
  metricLabel,
  unitSystem,
  userValueCm,
  communityValueCm,
  averageManValueCm,
  isPlaceholderCommunity = false,
}: Props) {
  // Use community or fall back to average man for display
  const effectiveCommunity = communityValueCm ?? averageManValueCm;

  const bars: BarData[] = [
    {
      label: "You",
      shortLabel: "You",
      valueCm: userValueCm,
      icon: <User className="w-3.5 h-3.5" />,
      colorClass: "text-primary",
      bgClass: "bg-primary",
      borderClass: "border-primary/30",
    },
    {
      label: isPlaceholderCommunity ? "Community*" : "Community",
      shortLabel: "Comm",
      valueCm: effectiveCommunity,
      icon: <Users className="w-3.5 h-3.5" />,
      colorClass: "text-accent-foreground",
      bgClass: "bg-accent",
      borderClass: "border-accent/30",
    },
    {
      label: "Avg Man",
      shortLabel: "Avg",
      valueCm: averageManValueCm,
      icon: <Globe className="w-3.5 h-3.5" />,
      colorClass: "text-secondary-foreground",
      bgClass: "bg-secondary",
      borderClass: "border-secondary-foreground/20",
    },
  ];

  // Calculate max for scaling bars
  const maxValue = Math.max(0.001, ...bars.map(b => b.valueCm));

  // Find the highest value bar for highlighting
  const maxBarValue = Math.max(...bars.map(b => b.valueCm));

  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-4">
      <div className="text-sm font-medium text-center">{metricLabel}</div>

      {/* Horizontal bar comparison */}
      <div className="space-y-3">
        {bars.map((bar, idx) => {
          const widthPct = Math.max(5, (bar.valueCm / maxValue) * 100);
          const isHighest = bar.valueCm === maxBarValue;

          return (
            <div key={bar.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className={`flex items-center gap-1.5 ${bar.colorClass}`}>
                  {bar.icon}
                  <span className="font-medium">{bar.label}</span>
                </div>
                <span className="font-mono text-muted-foreground">
                  {formatLength(bar.valueCm, unitSystem)}
                </span>
              </div>
              <div className="relative h-6 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-full ${bar.bgClass} ${bar.borderClass} border shadow-sm flex items-center justify-end pr-2`}
                >
                  {widthPct > 25 && (
                    <span className="text-[10px] font-mono text-primary-foreground/90">
                      {formatLength(bar.valueCm, unitSystem === "dual" ? "metric" : unitSystem)}
                    </span>
                  )}
                </motion.div>
                {isHighest && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <span className="text-[10px] font-semibold text-primary">★</span>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Vertical bar chart for visual impact */}
      <div className="pt-2 border-t border-border/30">
        <div className="flex items-end justify-center gap-4 h-28">
          {bars.map((bar, idx) => {
            const heightPct = Math.max(10, (bar.valueCm / maxValue) * 100);

            return (
              <div key={bar.label} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.7, delay: idx * 0.15, ease: "easeOut" }}
                  className={`w-10 sm:w-12 rounded-t-lg ${bar.bgClass} ${bar.borderClass} border border-b-0 shadow-sm relative overflow-hidden`}
                  style={{ minHeight: "12px" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </motion.div>
                <div className="flex flex-col items-center">
                  <div className={`${bar.colorClass}`}>{bar.icon}</div>
                  <span className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    {bar.shortLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPlaceholderCommunity && (
        <p className="text-[10px] text-muted-foreground text-center italic">
          *Community data uses research averages until sufficient real user data is collected.
        </p>
      )}
    </div>
  );
}
