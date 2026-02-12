import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCopy, RefreshCw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isNative } from "@/lib/capacitor";
import { markAppInteractiveAndHideStaticLoader } from "@/lib/boot/staticLoader";
import { checkSupabaseApiKeyValid, type SupabaseApiKeyCheckResult } from "@/integrations/supabase/apiKeyCheck";
import {
  clearSupabaseRuntimeOverride,
  readSupabaseRuntimeOverride,
  redactSupabaseKey,
  sanitizeSupabasePublishableKey,
  sanitizeSupabaseUrl,
  writeSupabaseRuntimeOverride,
} from "@/integrations/supabase/runtimeOverride";
import { supabaseConfig, supabasePublicConfig } from "@/integrations/supabase/client";
import { SUPABASE_INVALID_API_KEY_EVENT } from "@/integrations/supabase/events";

type CheckState = "idle" | "checking" | SupabaseApiKeyCheckResult;

const KEYCHECK_CACHE_KEY = "morphoscan_supabase_keycheck_cache_v1";

function getCachedKeycheck(): SupabaseApiKeyCheckResult | null {
  try {
    const raw = sessionStorage.getItem(KEYCHECK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; result: SupabaseApiKeyCheckResult };
    if (!parsed?.result || typeof parsed.at !== "number") return null;
    // Cache for 10 minutes.
    if (Date.now() - parsed.at > 10 * 60 * 1000) return null;
    return parsed.result;
  } catch {
    return null;
  }
}

function setCachedKeycheck(result: SupabaseApiKeyCheckResult): void {
  try {
    sessionStorage.setItem(KEYCHECK_CACHE_KEY, JSON.stringify({ at: Date.now(), result }));
  } catch {
    // ignore
  }
}

export function SupabaseApiKeyFixer(): React.ReactElement | null {
  const bypassForTests =
    Boolean(import.meta.env.VITEST) ||
    import.meta.env.MODE === "test" ||
    String(import.meta.env.VITE_E2E || "") === "1";
  if (bypassForTests) return null;

  const nativeRuntime = useMemo(() => {
    try {
      return isNative();
    } catch {
      return false;
    }
  }, []);

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [check, setCheck] = useState<CheckState>("idle");

  useEffect(() => {
    const onInvalid = () => setOpen(true);
    window.addEventListener(SUPABASE_INVALID_API_KEY_EVENT, onInvalid);
    return () => window.removeEventListener(SUPABASE_INVALID_API_KEY_EVENT, onInvalid);
  }, []);

  useEffect(() => {
    if (!open) return;
    markAppInteractiveAndHideStaticLoader();

    const override = readSupabaseRuntimeOverride();
    setUrl(override.url || supabasePublicConfig.url || "");
    setKey(override.publishableKey || supabasePublicConfig.publishableKey || "");
    setCheck("idle");
  }, [open]);

  useEffect(() => {
    // Only auto-check on native (Android/iOS). Web environments can fix via .env.
    if (!nativeRuntime) return;

    // If Supabase isn't configured at all, open the fixer so the user can paste keys.
    if (!supabaseConfig.isConfigured) {
      setOpen(true);
      return;
    }

    const cached = getCachedKeycheck();
    if (cached === "valid") return;
    if (cached === "invalid") {
      setOpen(true);
      return;
    }

    // Best-effort background key health check (fast, short timeout).
    checkSupabaseApiKeyValid({
      url: supabasePublicConfig.url,
      publishableKey: supabasePublicConfig.publishableKey,
      timeoutMs: 2500,
    })
      .then(result => {
        setCachedKeycheck(result);
        if (result === "invalid") setOpen(true);
      })
      .catch(() => {
        // ignore
      });
  }, [nativeRuntime]);

  if (!open) return null;

  const currentUrl = sanitizeSupabaseUrl(url);
  const currentKey = sanitizeSupabasePublishableKey(key);
  const invalidKeyEntered = Boolean(key) && !currentKey;

  const handleTest = async () => {
    const normalizedUrl = sanitizeSupabaseUrl(url);
    const normalizedKey = sanitizeSupabasePublishableKey(key);
    if (!normalizedUrl) {
      toast.error("Enter a valid Supabase Project URL");
      return;
    }
    if (!normalizedKey) {
      toast.error("Enter a valid Supabase Publishable key (sb_publishable_…)");
      return;
    }
    setCheck("checking");
    const result = await checkSupabaseApiKeyValid({
      url: normalizedUrl,
      publishableKey: normalizedKey,
      timeoutMs: 3500,
    });
    setCheck(result);
    if (result === "valid") toast.success("Supabase key looks valid");
    else if (result === "invalid") toast.error("Supabase rejected this API key");
    else toast.message("Could not verify (offline/CORS/timeout). You can still try saving.");
  };

  const handleSaveAndReload = () => {
    const normalizedUrl = sanitizeSupabaseUrl(url);
    const normalizedKey = sanitizeSupabasePublishableKey(key);
    if (!normalizedUrl || !normalizedKey) {
      toast.error("Enter a valid Supabase URL + Publishable key first");
      return;
    }

    writeSupabaseRuntimeOverride({ url: normalizedUrl, publishableKey: normalizedKey });
    setCachedKeycheck("unknown"); // force re-check after reload
    window.location.reload();
  };

  const handleClearAndReload = () => {
    clearSupabaseRuntimeOverride();
    setCachedKeycheck("unknown");
    window.location.reload();
  };

  const handleCopy = async () => {
    try {
      const text =
        `VITE_SUPABASE_URL=${currentUrl}\n` +
        `VITE_SUPABASE_PUBLISHABLE_KEY=${currentKey}\n`;
      await navigator.clipboard.writeText(text);
      toast.success("Copied Supabase config");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Supabase configuration"
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card variant="glass" className="w-full max-w-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10 w-fit">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">Supabase key required</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Sign-in requires a valid Supabase <span className="font-medium">Publishable</span> key.
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Invalid or missing API key</AlertTitle>
            <AlertDescription>
              Open Supabase Dashboard → Project Settings → API Keys → copy the{" "}
              <span className="font-medium">Publishable</span> key (starts with{" "}
              <span className="font-mono">sb_publishable_</span>). Do not use the secret key.
            </AlertDescription>
          </Alert>

          {invalidKeyEntered ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Secret key detected</AlertTitle>
              <AlertDescription>
                You pasted a <span className="font-mono">sb_secret_</span> key. That must never be used
                in the app. Paste the publishable key instead.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="supabase-url">Supabase Project URL</Label>
              <Input
                id="supabase-url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://<project-ref>.supabase.co"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {currentUrl ? (
                <div className="text-xs text-muted-foreground">Normalized: {currentUrl}</div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supabase-key">Supabase Publishable key</Label>
              <Input
                id="supabase-key"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="sb_publishable_…"
                autoCapitalize="none"
                autoCorrect="off"
              />
              {currentKey ? (
                <div className="text-xs text-muted-foreground">Current: {redactSupabaseKey(currentKey)}</div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="gap-2" onClick={handleCopy} disabled={!currentUrl || !currentKey}>
              <ClipboardCopy className="w-4 h-4" />
              Copy
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleTest} disabled={check === "checking"}>
              {check === "valid" ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              {check === "checking" ? "Testing…" : check === "valid" ? "Valid" : "Test key"}
            </Button>
            <Button className="gap-2" onClick={handleSaveAndReload}>
              <Save className="w-4 h-4" />
              Save + Reload
            </Button>
            <Button variant="destructive" className="gap-2" onClick={handleClearAndReload}>
              <Trash2 className="w-4 h-4" />
              Clear override
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

