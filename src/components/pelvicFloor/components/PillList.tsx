import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PillList({
  title,
  items,
  icon,
  tone = "neutral",
  className,
}: {
  title: string;
  items: string[];
  icon?: ReactNode;
  tone?: "neutral" | "good" | "warn";
  className?: string;
}) {
  const classes =
    tone === "good"
      ? "border-green-500/25 bg-green-500/5"
      : tone === "warn"
        ? "border-orange-500/25 bg-orange-500/5"
        : "border-border/60 bg-muted/10";

  return (
    <div className={cn("rounded-xl border p-4", classes, className)}>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((t, i) => (
          <li key={`${title}:${i}`} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
