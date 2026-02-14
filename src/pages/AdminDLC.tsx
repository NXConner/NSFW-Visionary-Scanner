import React, { useMemo } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAddonStates } from "@/addons";
import { evaluateAddonCompatibility, getAppRuntimeInfo } from "@/addons/compatibility";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { AdminDLCPanel } from "@/components/admin/AdminDLCPanel";

export default function AdminDLC(): React.ReactElement {
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const runtimeInfo = useMemo(() => getAppRuntimeInfo(), []);

  if (rolesLoading) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="Admin — DLC" badge="Admin" />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Card className="glass-card border-border/50">
            <CardContent className="py-10 text-center text-muted-foreground">Loading…</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <RouteTopNav title="Admin — DLC" />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Admin DLC</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">Admin access required.</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <RouteTopNav title="Admin — DLC" badge="Admin" />
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <AdminDLCPanel />

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Runtime Add-ons (local registry)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              These are add-ons detected at runtime via the add-on loader. Useful for diagnosing
              versioning and registration failures.
            </div>
            {listAddonStates().length === 0 ? (
              <div className="text-sm text-muted-foreground">No add-ons registered.</div>
            ) : (
              <div className="space-y-2">
                {listAddonStates().map(a => {
                  const compatibility = evaluateAddonCompatibility(a.manifest, runtimeInfo);
                  const compatibilityVariant =
                    compatibility.status === "compatible"
                      ? "secondary"
                      : compatibility.status === "warning"
                        ? "outline"
                        : "destructive";
                  return (
                    <div
                      key={a.manifest.id}
                      className="rounded-xl border border-border/50 p-4 bg-background/40"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {a.manifest.name}{" "}
                            <span className="text-muted-foreground">({a.manifest.id})</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            v{a.manifest.version}
                            {a.manifest.minAppVersion
                              ? ` • minApp ${a.manifest.minAppVersion}`
                              : ""}
                            {a.manifest.manifestVersion
                              ? ` • manifest ${a.manifest.manifestVersion}`
                              : ""}
                            {a.hasContributions ? " • contributes UI" : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              a.runtime.status === "ready"
                                ? "secondary"
                                : a.runtime.status === "failed" || a.runtime.status === "blocked"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {a.runtime.status}
                          </Badge>
                          <Badge variant={compatibilityVariant}>compat {compatibility.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {new Date(a.runtime.updatedAt).toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>app {runtimeInfo.appVersion}</span>
                        <span>
                          build {runtimeInfo.build.appVersion}/{runtimeInfo.build.distribution}
                        </span>
                        <span>
                          adult bundle {runtimeInfo.build.allowAdultBundle ? "enabled" : "off"}
                        </span>
                      </div>
                      {a.runtime.lastError ? (
                        <div className="mt-2 text-xs text-destructive">{a.runtime.lastError}</div>
                      ) : null}
                      {compatibility.reasons.length > 0 ? (
                        <div className="mt-2 text-xs text-muted-foreground space-y-1">
                          {compatibility.reasons.slice(0, 3).map((reason, idx) => (
                            <div key={`${a.manifest.id}-reason-${idx}`}>- {reason}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>
              - In production/live Stripe mode, checkout is blocked if a package is missing a real{" "}
              <code>price_*</code>.
            </div>
            <div>- Set these IDs from your Stripe Dashboard Product/Price entries.</div>
            <div>
              - Promo codes must have <code>applies_to_all</code> or an explicit list of package IDs
              (fail-closed).
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
