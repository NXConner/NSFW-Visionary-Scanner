import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Box, Clock, FileDown, Layers, Settings } from "lucide-react";
import { ReconstructionTab } from "@/components/advancedScannerFeatures/tabs/ReconstructionTab";
import { TimeLapseTab } from "@/components/advancedScannerFeatures/tabs/TimeLapseTab";
import { TemplatesTab } from "@/components/advancedScannerFeatures/tabs/TemplatesTab";
import { BatchTab } from "@/components/advancedScannerFeatures/tabs/BatchTab";
import { ExportsTab } from "@/components/advancedScannerFeatures/tabs/ExportsTab";

export function AdvancedScannerFeatures(): JSX.Element {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "3d-reconstruction" | "time-lapse" | "templates" | "batch" | "exports"
  >("3d-reconstruction");

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Advanced Scanner Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sign in to use advanced scanning features (3D reconstruction, time-lapse comparisons,
            templates, batch scans, and exports).
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Scanner Features</h1>
        <p className="text-muted-foreground">
          Multi-angle 3D reconstruction, time-lapse comparisons, measurement templates, batch
          scanning, and export workflows.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="3d-reconstruction">
            <Box className="w-4 h-4 mr-2" />
            3D
          </TabsTrigger>
          <TabsTrigger value="time-lapse">
            <Clock className="w-4 h-4 mr-2" />
            Time-lapse
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="batch">
            <Layers className="w-4 h-4 mr-2" />
            Batch
          </TabsTrigger>
          <TabsTrigger value="exports">
            <FileDown className="w-4 h-4 mr-2" />
            Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="3d-reconstruction" className="mt-4">
          <ReconstructionTab isActive={activeTab === "3d-reconstruction"} />
        </TabsContent>

        <TabsContent value="time-lapse" className="mt-4">
          <TimeLapseTab isActive={activeTab === "time-lapse"} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <TemplatesTab isActive={activeTab === "templates"} />
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <BatchTab isActive={activeTab === "batch"} />
        </TabsContent>

        <TabsContent value="exports" className="mt-4">
          <ExportsTab isActive={activeTab === "exports"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
