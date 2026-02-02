import React from "react";
import { NSFWCommunityForum } from "@/components/NSFWCommunityForum";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

export default function CommunityDLCPage({
  initialTab,
}: {
  initialTab?: "threads" | "challenges" | "support";
}): React.ReactElement {
  return (
    <NsfwSessionGate>
      <DlcFeatureGate
        featureId="private_forum"
        fallbackTitle="Private Community"
        fallbackDescription="Requires the Private Community DLC."
      >
        <NSFWCommunityForum initialTab={initialTab} />
      </DlcFeatureGate>
    </NsfwSessionGate>
  );
}
