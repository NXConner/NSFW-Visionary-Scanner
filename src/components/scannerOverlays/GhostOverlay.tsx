import { Badge } from "@/components/ui/badge";
import { Ghost } from "lucide-react";

interface GhostOverlayProps {
  previousImage?: string | null;
  opacity?: number;
}

export const GhostOverlay = ({ previousImage, opacity = 30 }: GhostOverlayProps) => {
  if (!previousImage) {
    return (
      <div className="absolute inset-0 pointer-events-none z-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <ellipse
            cx="50"
            cy="50"
            rx="15"
            ry="30"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeDasharray="3 3"
            opacity={opacity / 100}
          />
          <text
            x="50"
            y="90"
            fontSize="3"
            fill="hsl(var(--muted-foreground))"
            textAnchor="middle"
            opacity="0.5"
          >
            Position to match previous scan
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-5">
      <img
        src={previousImage}
        alt="Previous scan position"
        className="w-full h-full object-cover"
        style={{ opacity: opacity / 100, mixBlendMode: "multiply" }}
      />
      <Badge variant="outline" className="absolute top-2 left-2 text-[10px] bg-background/60">
        <Ghost className="w-3 h-3 mr-1" />
        Ghost: {opacity}%
      </Badge>
    </div>
  );
};
