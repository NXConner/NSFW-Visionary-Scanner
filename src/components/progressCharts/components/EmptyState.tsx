import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function ProgressChartsEmptyState() {
  return (
    <Card className="glass-card border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted/30 mb-4">
          <BarChart3 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Not Enough Data</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          You need at least 2 measurements to see progress charts. Keep tracking to visualize your
          trends!
        </p>
      </CardContent>
    </Card>
  );
}
