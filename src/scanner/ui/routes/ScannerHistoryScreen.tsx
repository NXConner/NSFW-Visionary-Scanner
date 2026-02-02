import * as React from "react";
import { ScanHistoryComparison } from "@/components/ScanHistoryComparison";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { Card, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export function ScannerHistoryScreen(): React.ReactElement {
  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav title="Scanner History" backTo="/scanner" backLabel="Scanner" />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-semibold">History & Trends</h1>
        </div>
        <Card variant="glass" className="border-border/50">
          <CardContent className="p-6">
            <ScanHistoryComparison />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
