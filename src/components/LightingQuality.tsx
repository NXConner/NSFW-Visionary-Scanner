import { SunMedium, Sun } from "lucide-react";

interface LightingQualityProps {
  brightness: number;
  contrast: number;
  isVisible?: boolean;
}

const getLightingState = (brightness: number, contrast: number) => {
  if (brightness < 75) return { label: "Increase light", tone: "warning" };
  if (brightness > 130) return { label: "Reduce glare", tone: "warning" };
  if (contrast < 70) return { label: "Boost contrast", tone: "secondary" };
  return { label: "Lighting optimal", tone: "success" };
};

export const LightingQuality = ({
  brightness,
  contrast,
  isVisible = true,
}: LightingQualityProps) => {
  if (!isVisible) return null;
  const { label, tone } = getLightingState(brightness, contrast);

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-xs shadow-lg">
      {tone === "success" ? (
        <Sun className="h-3.5 w-3.5 text-success" />
      ) : (
        <SunMedium className="h-3.5 w-3.5 text-warning" />
      )}
      <span className={tone === "success" ? "text-success" : "text-warning"}>{label}</span>
    </div>
  );
};
