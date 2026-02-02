import { memo } from "react";

export const DetectionConfidenceRing = memo(function DetectionConfidenceRing(props: {
  confidence: number; // 0..1
  className?: string;
}) {
  const c = props.confidence;
  const color =
    c > 0.85 ? "hsl(var(--primary))" : c > 0.72 ? "hsl(45, 100%, 50%)" : "hsl(var(--destructive))";
  const style =
    c > 0.85
      ? { border: `2px solid ${color}`, boxShadow: `0 0 16px ${color}35` }
      : c > 0.72
        ? { border: `2px dashed ${color}`, boxShadow: `0 0 10px ${color}25` }
        : { border: `1.5px solid ${color}`, boxShadow: `0 0 8px ${color}25` };

  return <div className={props.className} style={{ ...style, borderRadius: 14 }} />;
});
