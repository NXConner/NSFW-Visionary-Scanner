/**
 * SFW Version - App Component
 * App store compliant version without NSFW addon system
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/lib/i18n";
import { AppLock } from "@/components/AppLock";
import { OnboardingTutorial, useOnboarding } from "@/components/OnboardingTutorial";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import { AuthCallback } from "./pages/AuthCallback";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { DLCUnlock } from "@/components/DLCUnlock";

const queryClient = new QueryClient();

const AppContent = () => {
  const { showOnboarding, setShowOnboarding } = useOnboarding();

  return (
    <>
      {showOnboarding && <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />}
      <OfflineIndicator />
      <PerformanceMonitor />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <EmailVerificationGate requireVerification={true}>
              <Index />
            </EmailVerificationGate>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/dlc" element={<DLCUnlock />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <SettingsProvider>
            <DataProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppLock>
                  <AppContent />
                </AppLock>
              </TooltipProvider>
            </DataProvider>
          </SettingsProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
