import { format } from "date-fns";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilteredImage } from "@/components/media/FilteredImage";

import type { PEProgressEntry } from "./types";

export function TimelineView(props: {
  entries: PEProgressEntry[];
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {props.entries.map(entry => (
        <Card key={entry.id} className="glass-card border-border/50 overflow-hidden group">
          <div className="aspect-square relative">
            <FilteredImage
              src={entry.imageData}
              alt="Progress"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 left-2 right-2 text-xs">
                <p className="font-semibold">{format(new Date(entry.date), "MMM d, yyyy")}</p>
                <p className="text-muted-foreground">BPEL: {entry.lengthBPEL}cm</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
              onClick={() => props.onDelete(entry.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
