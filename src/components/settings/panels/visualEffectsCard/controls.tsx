import React, { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function normalizeHex(input: string): string | null {
  const s = String(input || "").trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(s);
  if (!m) return null;
  return `#${m[1]!.toUpperCase()}`;
}

export function SliderRow(props: {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}): JSX.Element {
  const { label, value, displayValue, min, max, step, disabled, onChange } = props;
  const safeValue = useMemo(() => clamp(value, min, max), [max, min, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs text-muted-foreground">{displayValue}</span>
      </div>
      <Slider
        value={[safeValue]}
        onValueChange={([v]) => onChange(v ?? safeValue)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
    </div>
  );
}

export function SwitchRow(props: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}): JSX.Element {
  const { id, label, checked, disabled, onCheckedChange } = props;
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function ColorRow(props: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (hex: string) => void;
}): JSX.Element {
  const { label, value, disabled, onChange } = props;
  const normalized = normalizeHex(value) ?? "#000000";
  const [text, setText] = useState<string>(normalized);

  // Keep controlled text in sync when value changes externally.
  React.useEffect(() => {
    setText(normalized);
  }, [normalized]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{label}</Label>
        <div className="flex items-center gap-2">
          <Input
            aria-label={`${label} color picker`}
            type="color"
            value={normalized}
            disabled={disabled}
            className="w-12 h-9 p-1 cursor-pointer"
            onChange={e => {
              const hex = normalizeHex(e.target.value);
              if (hex) onChange(hex);
            }}
          />
          <Input
            aria-label={`${label} hex value`}
            value={text}
            disabled={disabled}
            className="w-28 font-mono"
            onChange={e => {
              setText(e.target.value);
              const hex = normalizeHex(e.target.value);
              if (hex) onChange(hex);
            }}
          />
        </div>
      </div>
    </div>
  );
}
