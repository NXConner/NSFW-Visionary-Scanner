import React from "react";
import { NSFWTopicsLibrary } from "@/components/nsfwTopics/NSFWTopicsLibrary";
import { useDLC, useNSFWAvailable } from "@/dlc/context/DLCContext";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";

export default function NSFWTopicsPage(): React.ReactElement {
  const { isInitialized, isLoading } = useDLC();
  const nsfw = useNSFWAvailable();

  if (!isInitialized || isLoading || nsfw.isLoading) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="NSFW Topics" />
        <div className="flex items-center justify-center px-4 py-10">
          <Card className="glass-card border-border/50 w-full max-w-md">
            <CardContent className="py-12 flex flex-col items-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-3" />
              <div className="text-muted-foreground">Loading Topics Library…</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RouteTopNav title="NSFW Topics" />
      <div className="min-h-[calc(100vh-56px)]">
        <NsfwSessionGate>
          <DlcFeatureGate
            featureId="topics_library"
            fallbackTitle="Topics Library"
            fallbackDescription="Requires Topics Library DLC (or any Topic Pack)."
          >
            <NSFWTopicsLibrary />
          </DlcFeatureGate>
        </NsfwSessionGate>
      </div>
    </div>
  );
}
