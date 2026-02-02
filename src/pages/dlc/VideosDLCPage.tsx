import React from "react";
import { NSFWVideoContent } from "@/components/nsfwVideoContent";
import { NsfwSessionGate } from "@/components/nsfw/NsfwSessionGate";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

export default function VideosDLCPage({
  initialTab,
  initialVideoId,
}: {
  initialTab?: "browse" | "playlists" | "downloads";
  initialVideoId?: string;
}): React.ReactElement {
  return (
    <NsfwSessionGate>
      <DlcFeatureGate
        featureId="video_library"
        fallbackTitle="Video Library"
        fallbackDescription="Requires the Video Library DLC."
      >
        <NSFWVideoContent initialTab={initialTab} initialVideoId={initialVideoId} />
      </DlcFeatureGate>
    </NsfwSessionGate>
  );
}
