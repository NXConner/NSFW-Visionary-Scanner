import React, { Suspense, useMemo, lazy } from "react";
import { MessageSquare, Share2, Users, Headphones } from "lucide-react";
import { HubTabs, type HubTabConfig } from "./HubTabs";
import { PageSkeleton } from "@/components/ui/skeleton-loader";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";

const LazyCommunityForum = lazy(() =>
  import("@/components/CommunityForum").then(m => ({ default: m.CommunityForum })),
);
const LazyProgressSharingChallenges = lazy(() =>
  import("@/components/ProgressSharingChallenges").then(m => ({
    default: m.ProgressSharingChallenges,
  })),
);
const LazyInAppMessaging = lazy(() =>
  import("@/components/InAppMessaging").then(m => ({ default: m.InAppMessaging })),
);
const LazyLiveSupportChat = lazy(() =>
  import("@/components/LiveSupportChat").then(m => ({ default: m.LiveSupportChat })),
);
const LazyNsfwSessionGate = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/nsfw/NsfwSessionGate").then(m => ({ default: m.NsfwSessionGate })))
  : null;
const LazyNSFWCommunityForum = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("@/components/NSFWCommunityForum").then(m => ({ default: m.NSFWCommunityForum })))
  : null;

const LazyWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

export function CommunityHub({ initialTab }: { initialTab?: string }): JSX.Element {
  const tabs: HubTabConfig[] = useMemo(() => {
    const base: HubTabConfig[] = [
      {
        id: "forum",
        label: "Forum",
        icon: MessageSquare,
        description: "Community discussions and peer support.",
        content: (
          <LazyWrap>
            <LazyCommunityForum />
          </LazyWrap>
        ),
      },
      {
        id: "sharing",
        label: "Progress",
        icon: Share2,
        description: "Share milestones and participate in challenges.",
        content: (
          <LazyWrap>
            <LazyProgressSharingChallenges />
          </LazyWrap>
        ),
      },
      {
        id: "messaging",
        label: "Messaging",
        icon: Users,
        description: "Private messaging and partner sync.",
        content: (
          <LazyWrap>
            <LazyInAppMessaging />
          </LazyWrap>
        ),
      },
      {
        id: "support",
        label: "Support",
        icon: Headphones,
        description: "Live support and troubleshooting.",
        content: (
          <LazyWrap>
            <LazyLiveSupportChat />
          </LazyWrap>
        ),
      },
    ];

    if (!BUILD_ALLOW_ADULT_BUNDLE || !LazyNsfwSessionGate || !LazyNSFWCommunityForum) return base;

    return [
      ...base,
      {
        id: "nsfw-forum",
        label: "NSFW Forum",
        icon: MessageSquare,
        description: "Adult community forum (requires DLC and verification).",
        content: (
          <LazyWrap>
            <LazyNsfwSessionGate>
              <DlcFeatureGate
                featureId="private_forum"
                fallbackTitle="NSFW Community"
                fallbackDescription="Requires the Private Community DLC."
              >
                <LazyWrap>
                  <LazyNSFWCommunityForum />
                </LazyWrap>
              </DlcFeatureGate>
            </LazyNsfwSessionGate>
          </LazyWrap>
        ),
      },
    ];
  }, []);

  return (
    <HubTabs
      title="Community"
      description="Connect, share progress, and get support."
      tabs={tabs}
      initialTab={initialTab}
    />
  );
}
