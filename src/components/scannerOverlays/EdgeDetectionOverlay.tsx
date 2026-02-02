import { Badge } from "@/components/ui/badge";

export const EdgeDetectionOverlay = ({ intensity = 50 }: { intensity?: number }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <filter id="edgeDetect">
            <feConvolveMatrix
              order="3"
              kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
              preserveAlpha="true"
            />
          </filter>
        </defs>
        <g stroke="hsl(var(--accent))" strokeWidth="0.3" fill="none" opacity={intensity / 100}>
          <ellipse cx="50" cy="45" rx="12" ry="25" />
          <path d="M38 45 Q35 50 38 55" />
          <path d="M62 45 Q65 50 62 55" />
          <line x1="45" y1="30" x2="55" y2="30" strokeDasharray="2 2" />
          <line x1="45" y1="60" x2="55" y2="60" strokeDasharray="2 2" />
        </g>
      </svg>
      <Badge
        variant="outline"
        className="absolute bottom-2 right-2 text-[10px] bg-background/60 border-accent/30 text-accent"
      >
        Edge Detection Active
      </Badge>
    </div>
  );
};
