/**
 * SFW Version - Settings Panel
 * App store compliant version (store-safe settings)
 */

import {
  AccessibilitySettingsCard,
  AppearanceSettingsCard,
  ContentPolicyOverrideCard,
  FeedbackHubCard,
  FeatureTogglesCard,
  NsfwPrivacyControlsCard,
  PerformanceModeCard,
  PrivacySecurityCard,
  RemindersSettingsCard,
  SubscriptionCard,
  VisualEffectsCard,
} from "@/components/settings/panels";
import { useAddonContributions } from "@/addons";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Reveal } from "@/components/premium";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";

export const SettingsPanel = () => {
  const addonContribs = useAddonContributions();
  const addonCards = addonContribs.map(c => c.settingsCards).filter(Boolean);

  return (
    <div className="space-y-6">
      <Reveal variant="fade-up" delay={0}>
        <PerformanceModeCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.05}>
        <AppearanceSettingsCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.1}>
        <AccessibilitySettingsCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.1}>
        <RemindersSettingsCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.15}>
        <PrivacySecurityCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.165}>
        <ContentPolicyOverrideCard />
      </Reveal>
      {BUILD_ALLOW_ADULT_BUNDLE ? (
        <Reveal variant="fade-up" delay={0.18}>
          <NsfwPrivacyControlsCard />
        </Reveal>
      ) : null}
      <Reveal variant="fade-up" delay={0.2}>
        <SubscriptionCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.25}>
        <FeatureTogglesCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.28}>
        <VisualEffectsCard />
      </Reveal>
      <Reveal variant="fade-up" delay={0.3}>
        <FeedbackHubCard />
      </Reveal>

      {addonCards.map((CardComp, idx) => (
        <Reveal key={`addon-settings-${idx}`} variant="fade-up" delay={0.32 + idx * 0.03}>
          <CardComp />
        </Reveal>
      ))}

      {/* Push Notifications */}
      <Reveal variant="fade-up" delay={0.35}>
        <NotificationSettings />
      </Reveal>

      {/* Medical Disclaimer */}
      <Reveal variant="fade-up" delay={0.4}>
        <MedicalDisclaimer mode="inline" />
      </Reveal>
    </div>
  );
};
