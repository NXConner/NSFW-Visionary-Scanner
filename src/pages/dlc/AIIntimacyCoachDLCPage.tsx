import React from "react";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";
import AIIntimacyChat from "@/dlc/modules/AIIntimacyChat";

export default function AIIntimacyCoachDLCPage(): React.ReactElement {
  return (
    <NsfwSessionGate>
      <DlcFeatureGate
        featureId="ai_companion"
        fallbackTitle="AI Intimacy Coach"
        fallbackDescription="Requires the AI Intimacy Coach DLC (or a bundle/subscription that includes it)."
      >
        <AIIntimacyChat />
      </DlcFeatureGate>
    </NsfwSessionGate>
  );
}
