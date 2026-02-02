import React from "react";

import { Switch } from "@/components/ui/switch";
import { GitCompare } from "lucide-react";

export function CompareToggle({
  show,
  onChange,
}: {
  show: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        <GitCompare className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Compare with previous period</span>
      </div>
      <Switch checked={show} onCheckedChange={onChange} />
    </div>
  );
}
