import React from "react";
import { NSFWSexualWellnessAnalytics } from "@/components/NSFWSexualWellnessAnalytics";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

export default function AnalyticsDLCPage({
  initialTab,
}: {
  initialTab?: "function" | "libido" | "satisfaction" | "frequency" | "wellness";
}): React.ReactElement {
  return (
    <NsfwSessionGate>
      <DlcFeatureGate
        featureId="wellness_analytics"
        fallbackTitle="Wellness Analytics"
        fallbackDescription="Requires the Wellness Analytics DLC."
      >
        <NSFWSexualWellnessAnalytics initialTab={initialTab} />
      </DlcFeatureGate>
    </NsfwSessionGate>
  );
}
