import React from "react";
import { Info, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function FilterTab(props: {
  id: string;
  title: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onReset: () => void;
  infoText: string;
  children: React.ReactNode;
}): JSX.Element {
  const { id, title, enabled, onEnabledChange, onReset, infoText, children } = props;
  const disabled = !enabled;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${id}-enabled`} className="text-sm font-medium">
          {title}
        </Label>
        <Switch id={`${id}-enabled`} checked={enabled} onCheckedChange={onEnabledChange} />
      </div>

      <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
        <div className={disabled ? "pointer-events-none opacity-70 space-y-4" : "space-y-4"}>
          {children}
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full"
            disabled={disabled}
          >
            <RotateCcw className="w-3 h-3 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {infoText}
        </p>
      </div>
    </div>
  );
}
