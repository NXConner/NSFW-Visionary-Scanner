import React from "react";
import { NSFWAdvancedFeatures } from "@/components/nsfwAdvancedFeatures";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

export default function AdvancedDLCPage({
  initialTab,
}: {
  initialTab?: "pornmd" | "recording" | "studio" | "dates" | "ai-chat" | "positions";
}): React.ReactElement {
  return (
    <NsfwSessionGate>
      <DlcFeatureGate
        featureId="multi_camera"
        fallbackTitle="Advanced Features"
        fallbackDescription="Requires the Advanced Features Pack."
      >
        <NSFWAdvancedFeatures initialTab={initialTab} />
      </DlcFeatureGate>
    </NsfwSessionGate>
  );
}
