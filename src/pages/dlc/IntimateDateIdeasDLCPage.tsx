import React from "react";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";
import { DatesTab } from "@/components/nsfwAdvancedFeatures/tabs/DatesTab";

export default function IntimateDateIdeasDLCPage(): React.ReactElement {
  return (
    <NsfwSessionGate>
      <DlcFeatureGate
        featureId="intimate_dates"
        fallbackTitle="Intimate Date Ideas"
        fallbackDescription="Requires the Intimate Date Ideas DLC (or a bundle/subscription that includes it)."
      >
        <DatesTab isActive={true} />
      </DlcFeatureGate>
    </NsfwSessionGate>
  );
}
