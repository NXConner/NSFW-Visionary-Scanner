import { Badge } from "@/components/ui/badge";

export const VirtualRulerOverlay = ({ unitSystem = "cm" }: { unitSystem?: "cm" | "in" }) => {
  const marks =
    unitSystem === "cm" ? [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20] : [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute left-1 top-[10%] bottom-[10%] w-6 flex flex-col justify-between">
        {marks.map((mark, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <span className="text-[7px] font-mono text-primary/60 w-3 text-right">{mark}</span>
            <div className={`h-px bg-primary/40 ${i % 2 === 0 ? "w-2" : "w-1"}`} />
          </div>
        ))}
      </div>

      <div className="absolute bottom-1 left-[10%] right-[10%] h-6 flex justify-between">
        {marks.map((mark, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className={`w-px bg-primary/40 ${i % 2 === 0 ? "h-2" : "h-1"}`} />
            <span className="text-[7px] font-mono text-primary/60">{mark}</span>
          </div>
        ))}
      </div>

      <Badge
        variant="outline"
        className="absolute bottom-1 left-1 text-[8px] px-1 py-0 bg-background/60"
      >
        {unitSystem}
      </Badge>
    </div>
  );
};
