import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Columns, Scan, Square } from "lucide-react";

export function ScannerViewHeader({
  scanType,
  setScanType,
  isFullWidthScanner,
  toggleFullWidth,
}: {
  scanType: "3d" | "2d";
  setScanType: (v: "3d" | "2d") => void;
  isFullWidthScanner: boolean;
  toggleFullWidth: () => void;
}) {
  return (
    <CardHeader className="border-b border-border/50 pb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg gradient-primary">
            <Scan className="w-4 h-4 text-primary-foreground" />
          </div>
          Scanner View
        </CardTitle>

        <div className="flex items-center gap-2">
          <Tabs
            value={scanType}
            onValueChange={v => setScanType(v as "3d" | "2d")}
            className="w-auto"
          >
            <TabsList className="h-9 bg-secondary/50">
              <TabsTrigger value="3d" className="text-xs px-3 data-[state=active]:gradient-primary">
                3D Scan
              </TabsTrigger>
              <TabsTrigger value="2d" className="text-xs px-3 data-[state=active]:gradient-primary">
                2D Scan
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="icon"
            className="hidden lg:flex h-9 w-9"
            onClick={toggleFullWidth}
            title={isFullWidthScanner ? "Split view" : "Full width"}
          >
            {isFullWidthScanner ? <Columns className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
