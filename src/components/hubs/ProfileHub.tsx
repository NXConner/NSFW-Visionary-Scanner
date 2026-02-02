import React, { Suspense, useMemo, lazy } from "react";
import { Briefcase, CreditCard, Lock, Settings, Shield, User } from "lucide-react";
import { HubTabs, type HubTabConfig } from "./HubTabs";
import { PageSkeleton } from "@/components/ui/skeleton-loader";

const LazyProfileSection = lazy(() =>
  import("@/components/ProfileSection").then(m => ({ default: m.ProfileSection })),
);
const LazySettingsPanel = lazy(() =>
  import("@/components/SettingsPanel").then(m => ({ default: m.SettingsPanel })),
);
const LazySecurityPrivacyEnhancements = lazy(() =>
  import("@/components/SecurityPrivacyEnhancements").then(m => ({
    default: m.SecurityPrivacyEnhancements,
  })),
);
const LazyPrivacyDashboard = lazy(() =>
  import("@/components/PrivacyDashboard").then(m => ({ default: m.PrivacyDashboard })),
);
const LazyAuditTrail = lazy(() =>
  import("@/components/AuditTrail").then(m => ({ default: m.AuditTrail })),
);
const LazyHealthAppIntegrations = lazy(() =>
  import("@/components/HealthAppIntegrations").then(m => ({ default: m.HealthAppIntegrations })),
);
const LazyMobileWearableFeatures = lazy(() =>
  import("@/components/MobileWearableFeatures").then(m => ({
    default: m.MobileWearableFeatures,
  })),
);
const LazyAPIWebhooks = lazy(() =>
  import("@/components/APIWebhooks").then(m => ({ default: m.APIWebhooks })),
);
const LazyExportImportSystem = lazy(() =>
  import("@/components/ExportImportSystem").then(m => ({ default: m.ExportImportSystem })),
);
const LazyHealthcareProviderPortal = lazy(() =>
  import("@/components/HealthcareProviderPortal").then(m => ({
    default: m.HealthcareProviderPortal,
  })),
);
const LazySubscriptionTiers = lazy(() =>
  import("@/components/SubscriptionTiers").then(m => ({ default: m.SubscriptionTiers })),
);
const LazyPremiumAddOns = lazy(() =>
  import("@/components/PremiumAddOns").then(m => ({ default: m.PremiumAddOns })),
);
const LazyMarketplaceSystem = lazy(() =>
  import("@/components/MarketplaceSystem").then(m => ({ default: m.MarketplaceSystem })),
);
const LazyPremiumContentMarketplace = lazy(() =>
  import("@/components/PremiumContentMarketplace").then(m => ({
    default: m.PremiumContentMarketplace,
  })),
);
const LazyDLCStorePage = lazy(() => import("@/pages/DLCStorePage"));

const LazyWrap = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

export function ProfileHub({ initialTab }: { initialTab?: string }): JSX.Element {
  const tabs: HubTabConfig[] = useMemo(
    () => [
      {
        id: "account",
        label: "Account",
        icon: User,
        description: "Profile, achievements, and account overview.",
        content: (
          <LazyWrap>
            <LazyProfileSection />
          </LazyWrap>
        ),
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        description: "App preferences and device settings.",
        content: (
          <LazyWrap>
            <LazySettingsPanel />
          </LazyWrap>
        ),
      },
      {
        id: "privacy",
        label: "Privacy",
        icon: Lock,
        description: "Security controls, audit trail, and privacy dashboard.",
        content: (
          <div className="space-y-8">
            <LazyWrap>
              <LazySecurityPrivacyEnhancements />
            </LazyWrap>
            <LazyWrap>
              <LazyPrivacyDashboard />
            </LazyWrap>
            <LazyWrap>
              <LazyAuditTrail />
            </LazyWrap>
          </div>
        ),
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: Shield,
        description: "Health apps, wearables, API, and export tools.",
        content: (
          <div className="space-y-8">
            <LazyWrap>
              <LazyHealthAppIntegrations />
            </LazyWrap>
            <LazyWrap>
              <LazyMobileWearableFeatures />
            </LazyWrap>
            <LazyWrap>
              <LazyAPIWebhooks />
            </LazyWrap>
            <LazyWrap>
              <LazyExportImportSystem />
            </LazyWrap>
          </div>
        ),
      },
      {
        id: "provider",
        label: "Provider Portal",
        icon: Briefcase,
        description: "Clinician portal and provider tools.",
        content: (
          <LazyWrap>
            <LazyHealthcareProviderPortal />
          </LazyWrap>
        ),
      },
      {
        id: "billing",
        label: "Billing",
        icon: CreditCard,
        description: "Subscriptions, DLC, add-ons, and purchases.",
        content: (
          <div className="space-y-8">
            <LazyWrap>
              <LazySubscriptionTiers />
            </LazyWrap>
            <LazyWrap>
              <LazyDLCStorePage />
            </LazyWrap>
            <LazyWrap>
              <LazyPremiumAddOns />
            </LazyWrap>
            <LazyWrap>
              <LazyMarketplaceSystem />
            </LazyWrap>
            <LazyWrap>
              <LazyPremiumContentMarketplace />
            </LazyWrap>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <HubTabs title="Profile" description="Account, settings, and billing." tabs={tabs} initialTab={initialTab} />
  );
}
