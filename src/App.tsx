/**
 * SFW Version - App Component
 * App store compliant version with DLC addon system
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/lib/i18n";
import { AppLock } from "@/components/AppLock";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { useOnboarding } from "@/hooks/useOnboarding";
import ErrorBoundary from "@/components/ErrorBoundary";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";
import { SkipLink, ColorBlindFilters } from "@/components/accessibility";
import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { DLCUnlock } from "@/components/DLCUnlock";
import { DLCProvider } from "@/dlc/context/DLCContext";
import { useScrollCssVars } from "@/hooks/useScrollCssVars";
import { useAnalytics } from "@/lib/analytics";
import { BootWatchdog } from "@/components/BootWatchdog";
import { SupabaseConfigGate } from "@/components/SupabaseConfigGate";
import { markAppInteractiveAndHideStaticLoader } from "@/lib/boot/staticLoader";
import { SupabaseApiKeyFixer } from "@/components/SupabaseApiKeyFixer";
import { bootstrapAddons } from "@/addons";
import { RouteLoadingFallback } from "@/components/LoadingFallback";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AppCommandPalette } from "@/components/commandPalette";
import { KeyboardShortcutsDialog } from "@/components/keyboardShortcuts";
import TabDeepLinkRedirect from "@/routes/TabDeepLinkRedirect";
import LegacyAdminRedirect from "@/routes/LegacyAdminRedirect";
import { isAdultContentEnabled } from "@/lib/featureFlags";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";
import { logger } from "@/lib/logger";
import NotFound from "./pages/NotFound";

// Lazy load all pages for better code splitting
const Index = lazy(() => import("./pages/Index"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const DLCStorePage = lazy(() => import("./pages/DLCStorePage"));
const LazyNotFoundFallback = lazy(() => Promise.resolve({ default: NotFound }));
const LazyScrollToTopButton = lazy(() =>
  import("@/components/navigation/ScrollToTopButton").then(m => ({
    default: m.ScrollToTopButton,
  })),
);

// Build-time flag: only ship direct-download deep-link routes outside stores.
// Store builds should not include optional DLC deep-link pages that may reference adult gating.
const BUILD_ALLOW_DIRECT_ROUTES = import.meta.env.VITE_DISTRIBUTION_CHANNEL === "direct";

const queryClient = new QueryClient();

// Register addon contributions as early as possible so the DLC manager can see
// fallback packages/manifests/modules during initialization.
try {
  bootstrapAddons();
} catch (error) {
  // Never let addon bootstrap failures block first render on mobile.
  logger.warn("[App] addon bootstrap failed (continuing without addon contributions)", { error });
}

const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() =>
  import("./pages/AuthCallback").then(m => ({ default: m.AuthCallback })),
);
const Pricing = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/Pricing"))
  : LazyNotFoundFallback;
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CreditsResources = lazy(() => import("./pages/CreditsResources"));
const PelvicFloorPage = lazy(() => import("./pages/PelvicFloorPage"));
const AdminDLC = lazy(() => import("./pages/AdminDLC"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminNsfwContent = lazy(() => import("./pages/AdminNsfwContent"));
const ScannerCaptureScreen = lazy(() =>
  import("@/scanner/ui/routes/ScannerCaptureScreen").then(m => ({
    default: m.ScannerCaptureScreen,
  })),
);
const ScannerHistoryScreen = lazy(() =>
  import("@/scanner/ui/routes/ScannerHistoryScreen").then(m => ({
    default: m.ScannerHistoryScreen,
  })),
);
const ScannerResultsScreen = lazy(() =>
  import("@/scanner/ui/routes/ScannerResultsScreen").then(m => ({
    default: m.ScannerResultsScreen,
  })),
);
const ScannerSettingsScreen = lazy(() =>
  import("@/scanner/ui/routes/ScannerSettingsScreen").then(m => ({
    default: m.ScannerSettingsScreen,
  })),
);
const NSFWDashboardPage = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("./pages/NSFWDashboardPage"))
  : LazyNotFoundFallback;
const NSFWTopicsPage = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("./pages/NSFWTopicsPage"))
  : LazyNotFoundFallback;
const NSFWAddOnsLandingPage = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("./pages/NSFWAddOnsLandingPage"))
  : LazyNotFoundFallback;
const PositionsDLCPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/PositionsDLCPage"))
  : LazyNotFoundFallback;
const VideosDLCPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/VideosDLCPage"))
  : LazyNotFoundFallback;
const PositionsDLCDetailPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/PositionsDLCDetailPage"))
  : LazyNotFoundFallback;
const VideosDLCDetailPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/VideosDLCDetailPage"))
  : LazyNotFoundFallback;
const AnalyticsDLCPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/AnalyticsDLCPage"))
  : LazyNotFoundFallback;
const CommunityDLCPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/CommunityDLCPage"))
  : LazyNotFoundFallback;
const AdvancedDLCPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/AdvancedDLCPage"))
  : LazyNotFoundFallback;
const AIIntimacyCoachDLCPage = BUILD_ALLOW_ADULT_BUNDLE
  ? lazy(() => import("./pages/dlc/AIIntimacyCoachDLCPage"))
  : LazyNotFoundFallback;
const IntimateDateIdeasDLCPage = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/dlc/IntimateDateIdeasDLCPage"))
  : LazyNotFoundFallback;
const NewDLCShowcase = BUILD_ALLOW_DIRECT_ROUTES
  ? lazy(() => import("./pages/NewDLCShowcase"))
  : LazyNotFoundFallback;
const GrowersVsShowersPage = lazy(() => import("./pages/growersVsShowers"));
const MeasurementsVsAverageMenPage = lazy(() => import("./pages/measurementsVsAverageMen"));

// Removed - using RouteLoadingFallback from LoadingFallback component

const RouteAnalytics = () => {
  const location = useLocation();
  const { trackPageView, trackUserAction } = useAnalytics();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(path);
    trackUserAction("route_change", "navigation", { path });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  return null;
};

const AppContent = () => {
  const { showOnboarding, setShowOnboarding } = useOnboarding();
  useScrollCssVars();
  useKeyboardShortcuts(); // Enable global keyboard shortcuts - now safe because Router is wrapping this component
  const allowAdult = isAdultContentEnabled();
  const allowAdultRoutes = BUILD_ALLOW_ADULT_BUNDLE && allowAdult;

  useEffect(() => {
    // Used by boot diagnostics + watchdog logic to detect that React has mounted.
    // Also hides the static HTML loader once React is ready to paint UI.
    markAppInteractiveAndHideStaticLoader();
  }, []);

  return (
    <>
      <ColorBlindFilters />
      <SkipLink href="#main-content" />
      {showOnboarding && <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />}
      <OfflineIndicator />
      <PerformanceMonitor />
      <AppCommandPalette />
      <KeyboardShortcutsDialog />
      <Suspense fallback={null}>
        <LazyScrollToTopButton />
      </Suspense>
      <RouteAnalytics />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Landing page at root */}
          <Route path="/" element={<LandingPage />} />

          {/* Main app at /app */}
          <Route
            path="/app"
            element={
              <EmailVerificationGate requireVerification={true}>
                <Index />
              </EmailVerificationGate>
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {BUILD_ALLOW_DIRECT_ROUTES ? (
            <Route path="/pricing" element={<Pricing />} />
          ) : (
            <Route path="/pricing" element={<Navigate to="/store" replace />} />
          )}
          <Route path="/dlc" element={<DLCUnlock />} />
          {BUILD_ALLOW_DIRECT_ROUTES ? (
            <Route path="/dlc/new" element={<NewDLCShowcase />} />
          ) : null}
          {/* Deep-links into tabbed app experience */}
          <Route path="/3dviewer" element={<Navigate to="/app?tab=3dviewer" replace />} />
          <Route path="/3d-viewer" element={<Navigate to="/app?tab=3dviewer" replace />} />
          <Route path="/pe-progress" element={<Navigate to="/app?tab=pe-progress" replace />} />
          <Route path="/pe-progress/*" element={<Navigate to="/app?tab=pe-progress" replace />} />
          {/* Backward-compatible aliases (older deep-links / case variants) */}
          {BUILD_ALLOW_DIRECT_ROUTES ? (
            <>
              <Route path="/NewDLCShowcase" element={<Navigate to="/dlc/new" replace />} />
              <Route path="/NewDLCShowcase/*" element={<Navigate to="/dlc/new" replace />} />
              <Route path="/newdlcshowcase" element={<Navigate to="/dlc/new" replace />} />
              <Route path="/newdlcshowcase/*" element={<Navigate to="/dlc/new" replace />} />
            </>
          ) : null}
          <Route path="/store" element={<DLCStorePage />} />
          {/* Optional direct routes for DLC modules (deep-links) */}
          {BUILD_ALLOW_DIRECT_ROUTES ? (
            <>
              <Route path="/positions" element={<PositionsDLCPage />} />
              <Route path="/positions/:id" element={<PositionsDLCDetailPage />} />
              <Route path="/videos" element={<VideosDLCPage />} />
              <Route path="/videos/:id" element={<VideosDLCDetailPage />} />
              <Route path="/videos/playlists" element={<VideosDLCPage initialTab="playlists" />} />
              <Route path="/analytics" element={<AnalyticsDLCPage />} />
              <Route
                path="/analytics/reports"
                element={<AnalyticsDLCPage initialTab="wellness" />}
              />
              <Route
                path="/analytics/partner"
                element={<AnalyticsDLCPage initialTab="wellness" />}
              />
              <Route path="/community" element={<CommunityDLCPage />} />
              <Route path="/community/forum" element={<CommunityDLCPage initialTab="threads" />} />
              <Route
                path="/community/forum/:topicId"
                element={<CommunityDLCPage initialTab="threads" />}
              />
              <Route path="/community/groups" element={<CommunityDLCPage initialTab="support" />} />
              <Route
                path="/community/experts"
                element={<CommunityDLCPage initialTab="threads" />}
              />
              <Route
                path="/community/marketplace"
                element={<CommunityDLCPage initialTab="threads" />}
              />
              <Route path="/advanced" element={<AdvancedDLCPage />} />
              <Route
                path="/advanced/recording"
                element={<AdvancedDLCPage initialTab="recording" />}
              />
              <Route
                path="/advanced/date-planner"
                element={<AdvancedDLCPage initialTab="dates" />}
              />
            </>
          ) : null}
          {allowAdultRoutes ? (
            <Route
              path="/advanced/ai-companion"
              element={<AdvancedDLCPage initialTab="ai-chat" />}
            />
          ) : null}
          {/* Standalone package deep-links (do not require multi_camera) */}
          {allowAdultRoutes ? (
            <Route path="/ai-intimacy-coach" element={<AIIntimacyCoachDLCPage />} />
          ) : null}
          {BUILD_ALLOW_DIRECT_ROUTES ? (
            <Route path="/intimate-date-ideas" element={<IntimateDateIdeasDLCPage />} />
          ) : null}
          <Route
            path="/advanced/partner-sync"
            element={<AdvancedDLCPage initialTab="recording" />}
          />
          {allowAdultRoutes ? (
            <>
              <Route path="/nsfw" element={<NSFWDashboardPage />} />
              <Route path="/nsfw/landing" element={<NSFWAddOnsLandingPage />} />
              <Route path="/nsfw/topics" element={<NSFWTopicsPage />} />
            </>
          ) : null}
          {/* Backward-compatible typo alias: /afmin/* -> /admin/* */}
          <Route path="/afmin/*" element={<LegacyAdminRedirect />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/dlc" element={<AdminDLC />} />
          <Route path="/admin/nsfw" element={<AdminNsfwContent />} />
          {/* Admin deep-links (prevent falling into generic tab redirect) */}
          <Route path="/admin/users" element={<AdminDashboard initialSection="users" />} />
          <Route path="/admin/users/add" element={<AdminDashboard initialSection="users" />} />
          <Route path="/admin/content" element={<AdminDashboard initialSection="content" />} />
          <Route path="/admin/analytics" element={<AdminDashboard initialSection="analytics" />} />
          <Route path="/admin/settings" element={<AdminDashboard initialSection="settings" />} />
          <Route path="/admin/database" element={<AdminDashboard initialSection="database" />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/credits" element={<CreditsResources />} />
          <Route path="/resources" element={<CreditsResources />} />
          <Route path="/pelvic-floor" element={<PelvicFloorPage />} />
          <Route path="/growers-vs-showers" element={<GrowersVsShowersPage />} />
          <Route path="/measurements-vs-average-men" element={<MeasurementsVsAverageMenPage />} />
          {/* Explicit scanner routes (avoid falling into generic tab redirect) */}
          <Route path="/scanner/capture" element={<ScannerCaptureScreen />} />
          <Route path="/scanner/history" element={<ScannerHistoryScreen />} />
          <Route path="/scanner/results" element={<ScannerResultsScreen />} />
          <Route path="/scanner/settings" element={<ScannerSettingsScreen />} />
          {/* Generic deep-links into the tabbed home experience (e.g. /settings, /scanner, /pe-progress) */}
          <Route path="/:tab" element={<TabDeepLinkRedirect />} />
          <Route path="/:tab/*" element={<TabDeepLinkRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <BootWatchdog timeoutMs={7000} />
    <SupabaseApiKeyFixer />
    <SupabaseConfigGate>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nProvider>
            <SettingsProvider>
              <DataProvider>
                <DLCProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <AppLock>
                        <AppContent />
                      </AppLock>
                    </BrowserRouter>
                  </TooltipProvider>
                </DLCProvider>
              </DataProvider>
            </SettingsProvider>
          </I18nProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SupabaseConfigGate>
  </ErrorBoundary>
);

export default App;
