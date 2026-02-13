import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { Position } from "@/components/positionsGallery/model";

export function InstructionsTab(props: { position: Position }): JSX.Element {
  const { position } = props;

  return (
    <div className="space-y-4 mt-4">
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> Step-by-Step Instructions
        </h4>
        <ol className="space-y-3">
          {position.instructions.map((inst, i) => (
            <li key={i} className="flex gap-3">
              <span className="bg-primary/20 text-primary rounded-full w-8 h-8 flex items-center justify-center text-sm shrink-0 font-semibold">
                {i + 1}
              </span>
              <div className="flex-1 pt-1">
                <p className="text-sm">{inst}</p>
                {position.images?.[i] ? (
                  <Card className="mt-2 rounded overflow-hidden max-w-xs">
                    <img src={position.images[i]} alt={`Step ${i + 1}`} className="w-full h-auto" />
                  </Card>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
