import * as React from "react";

import { FeatureGate as DlcFeatureGate } from "@/dlc/components/FeatureGate";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import * as LazyTabs from "@/pages/indexLazyTabs";

import { SectionWrap, Suspended } from "./common";

export type AdultTabRenderer = ((activeTab: string) => JSX.Element | null) | null;

export const renderAdultTab: AdultTabRenderer = (() => {
  if (!BUILD_ALLOW_ADULT_BUNDLE) return null;

  const LazyNsfwSessionGate = React.lazy(() =>
    import("@/components/nsfw/NsfwSessionGate").then(m => ({ default: m.NsfwSessionGate })),
  );

  return (activeTab: string): JSX.Element | null => {
    switch (activeTab) {
      case "nsfw-videos":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="video_library"
                  fallbackTitle="NSFW Video Library"
                  fallbackDescription="Requires the Video Library DLC."
                >
                  <Suspended>
                    <LazyTabs.LazyNSFWVideoContent />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-cock-worshiping":
      case "nsfw-education-hub":
        return (
          <SectionWrap maxWidth="max-w-6xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="intimate_education"
                  fallbackTitle="Intimate Education Hub"
                  fallbackDescription="Requires the Intimate Education add-on."
                >
                  <Suspended>
                    <LazyTabs.LazyNSFWEducationHub />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-forum":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="private_forum"
                  fallbackTitle="NSFW Community"
                  fallbackDescription="Requires the Private Community DLC."
                >
                  <Suspended>
                    <LazyTabs.LazyNSFWCommunityForum />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-wellness-analytics":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="wellness_analytics"
                  fallbackTitle="NSFW Wellness Analytics"
                  fallbackDescription="Requires the Wellness Analytics DLC."
                >
                  <Suspended>
                    <LazyTabs.LazyNSFWSexualWellnessAnalytics />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      case "nsfw-advanced":
        return (
          <SectionWrap maxWidth="max-w-7xl">
            <Suspended>
              <LazyNsfwSessionGate>
                <DlcFeatureGate
                  featureId="multi_camera"
                  fallbackTitle="NSFW Advanced Features"
                  fallbackDescription="Requires the Advanced Features Pack."
                >
                  <Suspended>
                    <LazyTabs.LazyNSFWAdvancedFeatures />
                  </Suspended>
                </DlcFeatureGate>
              </LazyNsfwSessionGate>
            </Suspended>
          </SectionWrap>
        );
      default:
        return null;
    }
  };
})();
