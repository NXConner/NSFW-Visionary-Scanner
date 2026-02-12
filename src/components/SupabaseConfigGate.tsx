import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseConfig, supabaseConfigError } from "@/integrations/supabase/client";

type SupabaseConfigGateProps = {
  children: ReactNode;
};

const BUILD_STEPS = [
  "Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env",
  "Rebuild web assets (CAPACITOR_BUILD=1 for Android builds)",
  "Run npx cap sync android, then rebuild the APK",
];

export function SupabaseConfigGate({ children }: SupabaseConfigGateProps) {
  // E2E/unit tests should be able to render UI routes without a real backend.
  // The Supabase client is already "disabled" when unconfigured; this gate is a UX guard for humans.
  const bypassForTests =
    Boolean(import.meta.env.VITEST) ||
    import.meta.env.MODE === "test" ||
    String(import.meta.env.VITE_E2E || "") === "1";
  if (bypassForTests) return <>{children}</>;

  if (supabaseConfig.isConfigured) return <>{children}</>;

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
