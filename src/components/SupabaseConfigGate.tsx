import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseConfig, supabaseConfigError } from "@/integrations/supabase/client";
import { isNative } from "@/lib/capacitor";
import { markAppInteractiveAndHideStaticLoader } from "@/lib/boot/staticLoader";

type SupabaseConfigGateProps = {
  children: ReactNode;
};

const BUILD_STEPS = [
  "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env",
  "Rebuild web assets (CAPACITOR_BUILD=1 for Android builds)",
  "Run npx cap sync android, then rebuild the APK",
];

const NATIVE_WARNING_DISMISSED_KEY = "morphoscan_supabase_warning_dismissed";

export function SupabaseConfigGate({ children }: SupabaseConfigGateProps) {
  // E2E/unit tests should be able to render UI routes without a real backend.
  // The Supabase client is already "disabled" when unconfigured; this gate is a UX guard for humans.
  const bypassForTests =
    Boolean(import.meta.env.VITEST) ||
    import.meta.env.MODE === "test" ||
    String(import.meta.env.VITE_E2E || "") === "1";
  const nativeRuntime = useMemo(() => {
    try {
      return isNative();
    } catch {
      return false;
    }
  }, []);

  const [nativeWarningDismissed, setNativeWarningDismissed] = useState(() => {
    try {
      return localStorage.getItem(NATIVE_WARNING_DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  const shouldShowBlockingGate =
    !bypassForTests && !supabaseConfig.isConfigured && !nativeRuntime;

  useEffect(() => {
    if (!shouldShowBlockingGate) return;
    // If we are *blocking* the main app UI, ensure the static HTML loader cannot obscure this screen.
    markAppInteractiveAndHideStaticLoader();
  }, [shouldShowBlockingGate]);

  if (bypassForTests) return <>{children}</>;
  if (supabaseConfig.isConfigured) return <>{children}</>;

  // Capacitor/native builds cannot easily be "fixed" by setting .env values after install.
  // Allow the app to run offline (Supabase client is disabled), but surface a persistent warning.
  if (nativeRuntime) {
    const missingText = supabaseConfig.missingKeys.join(", ");
    return (
      <>
        {children}
        {!nativeWarningDismissed ? (
          <div className="fixed left-3 right-3 bottom-3 z-[100000]">
            <Alert
              variant="destructive"
              className="bg-background/90 backdrop-blur border-destructive/40 shadow-lg"
            >
              <AlertTriangle className="h-4 w-4" />
              <div className="space-y-2">
                <div>
                  <AlertTitle>Cloud features disabled (offline mode)</AlertTitle>
                  <AlertDescription>
                    Supabase is not configured for this build. Sign-in, sync, and cloud features are
                    unavailable until a rebuild includes the required environment keys.
                  </AlertDescription>
                </div>
                {missingText ? (
                  <div className="text-xs text-muted-foreground">Missing: {missingText}</div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      try {
                        if (!missingText) return;
                        void navigator.clipboard?.writeText(missingText);
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    Copy missing keys
                  </Button>
                  <Button size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      try {
                        localStorage.setItem(NATIVE_WARNING_DISMISSED_KEY, "1");
                      } catch {
                        // ignore
                      }
                      setNativeWarningDismissed(true);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Backend configuration required</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Supabase not configured</AlertTitle>
            <AlertDescription>
              {supabaseConfigError || "Missing Supabase environment configuration."}
            </AlertDescription>
          </Alert>

          {supabaseConfig.missingKeys.length > 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Missing environment keys:</p>
              <ul className="list-disc pl-5 space-y-1">
                {supabaseConfig.missingKeys.map(key => (
                  <li key={key}>{key}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Fix and rebuild:</p>
            <ol className="list-decimal pl-5 space-y-1">
              {BUILD_STEPS.map(step => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button className="gap-2" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Reload App
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const text = supabaseConfig.missingKeys.join(", ");
                  if (text) void navigator.clipboard?.writeText(text);
                } catch {
                  // ignore
                }
              }}
            >
              Copy missing keys
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
