import * as React from "react";
import { useState, useCallback, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageSkeleton } from "@/components/ui/skeleton-loader";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Camera,
  Ruler,
  Box,
  Brain,
  History,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load sub-components for performance
const LazyScannerSection = React.lazy(() =>
  import("@/components/ScannerSection").then((m) => ({ default: m.ScannerSection }))
);

const LazyCurvatureScannerSection = React.lazy(() =>
  import("@/components/CurvatureScannerSection").then((m) => ({
    default: m.CurvatureScannerSection,
  }))
);

const LazyAdvancedScannerFeatures = React.lazy(() =>
  import("@/components/AdvancedScannerFeatures").then((m) => ({
    default: m.AdvancedScannerFeatures,
  }))
);

const LazyAIEnhancedScanning = React.lazy(() =>
  import("@/components/aiEnhancedScanning").then((m) => ({
    default: m.AIEnhancedScanning,
  }))
);

const LazyScanHistoryComparison = React.lazy(() =>
  import("@/components/ScanHistoryComparison").then((m) => ({
    default: m.ScanHistoryComparison,
  }))
);

const LazyModel3DViewer = React.lazy(() =>
  import("@/components/Model3DViewer").then((m) => ({
    default: m.Model3DViewer,
  }))
);

type ScannerTab = 
  | "main-scanner"
  | "curvature"
  | "advanced"
  | "ai-analysis"
  | "history"
  | "viewer";

interface UnifiedScannerPageProps {
  initialTab?: ScannerTab;
}

const tabConfig: { id: ScannerTab; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: "main-scanner",
    label: "Scanner",
    icon: Camera,
    description: "Main measurement scanner with calibration",
  },
  {
    id: "curvature",
    label: "Curvature",
    icon: Ruler,
    description: "Specialized curvature analysis",
  },
  {
    id: "advanced",
    label: "Advanced",
    icon: Box,
    description: "3D reconstruction, time-lapse, batch scanning",
  },
  {
    id: "ai-analysis",
    label: "AI Analysis",
    icon: Brain,
    description: "AI-powered scan analysis and suggestions",
  },
  {
    id: "history",
    label: "History",
    icon: History,
    description: "Compare past scans and track progress",
  },
  {
    id: "viewer",
    label: "3D Viewer",
    icon: Layers,
    description: "Inspect 3D models and exports",
  },
];

export function UnifiedScannerPage({ initialTab = "main-scanner" }: UnifiedScannerPageProps) {
  const [activeTab, setActiveTab] = useState<ScannerTab>(initialTab);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ScannerTab);
  }, []);

  return (
    <div className="min-h-screen">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Sticky tab navigation */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <div className="container mx-auto max-w-7xl">
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 bg-muted/30 p-1.5 rounded-lg">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-md transition-all",
                      "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                      "data-[state=active]:shadow-md",
                      "hover:bg-muted/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Current tab description */}
            <p className="text-sm text-muted-foreground mt-2 pl-1">
              {tabConfig.find((t) => t.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab content */}
        <TabsContent value="main-scanner" className="mt-0 focus-visible:outline-none">
          <ErrorBoundary section="Scanner">
            <Suspense fallback={<PageSkeleton />}>
              <LazyScannerSection />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="curvature" className="mt-0 focus-visible:outline-none">
          <ErrorBoundary section="Curvature Scanner">
            <Suspense fallback={<PageSkeleton />}>
              <LazyCurvatureScannerSection />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="advanced" className="mt-0 focus-visible:outline-none">
          <ErrorBoundary section="Advanced Scanner">
            <Suspense fallback={<PageSkeleton />}>
              <LazyAdvancedScannerFeatures />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="ai-analysis" className="mt-0 focus-visible:outline-none">
          <ErrorBoundary section="AI Analysis">
            <Suspense fallback={<PageSkeleton />}>
              <LazyAIEnhancedScanning />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:outline-none">
          <ErrorBoundary section="Scan History">
            <Suspense fallback={<PageSkeleton />}>
              <LazyScanHistoryComparison />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="viewer" className="mt-0 focus-visible:outline-none">
          <ErrorBoundary section="3D Viewer">
            <Suspense fallback={<PageSkeleton />}>
              <LazyModel3DViewer />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UnifiedScannerPage;
