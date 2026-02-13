import React, { useEffect, useMemo, useState } from "react";
import { useUserRoles } from "@/hooks/useUserRoles";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DLCContentImport } from "@/components/dlc/admin/DLCContentImport";
import { listAddonStates } from "@/addons";
import { RouteTopNav } from "@/components/navigation/RouteTopNav";
import { BUILD_ALLOW_ADULT_BUNDLE } from "@/lib/buildFlags";

type AdminDlcPackage = {
  packageId: string;
  displayName: string;
  priceUsd: number;
  priceType: string;
  isActive: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
};

export default function AdminDLC(): React.ReactElement {
  const { isAdmin, isLoading: rolesLoading } = useUserRoles();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminDlcPackage[]>([]);
  const [draft, setDraft] = useState<
    Record<string, { stripePriceId: string; stripeProductId: string }>
  >({});

  const missingCount = useMemo(
    () => rows.filter(r => r.isActive && !r.stripePriceId).length,
    [rows],
  );

  const AdminAdultToggles = useMemo(() => {
    if (!BUILD_ALLOW_ADULT_BUNDLE) return null;
    return React.lazy(() =>
      import("@/components/dlc/admin/AdminNsfwDlcToggles").then(m => ({
        default: m.AdminNsfwDlcToggles,
      })),
    );
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-dlc-catalog", {
        body: { action: "list" },
      });
      if (error) throw new Error(error.message);
      const pkgs = (data?.packages || []) as AdminDlcPackage[];
      setRows(pkgs);
      const nextDraft: Record<string, { stripePriceId: string; stripeProductId: string }> = {};
      for (const p of pkgs) {
        nextDraft[p.packageId] = {
          stripePriceId: p.stripePriceId || "",
          stripeProductId: p.stripeProductId || "",
        };
      }
      setDraft(nextDraft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load DLC catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rolesLoading && isAdmin) void load();
  }, [rolesLoading, isAdmin]);

  const saveRow = async (packageId: string) => {
    const d = draft[packageId];
    if (!d) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("admin-dlc-catalog", {
        body: {
          action: "update",
          packageId,
          stripePriceId: d.stripePriceId.trim() || null,
          stripeProductId: d.stripeProductId.trim() || null,
        },
      });
      if (error) throw new Error(error.message);
      toast.success("Saved Stripe mapping");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

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
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Admin DLC — Stripe Catalog Mapping</CardTitle>
            <div className="flex items-center gap-2">
              {missingCount > 0 ? (
                <Badge variant="destructive">{missingCount} active packages missing price_*</Badge>
              ) : (
                <Badge className="bg-green-600">All active packages mapped</Badge>
              )}
              <Button variant="outline" disabled={loading} onClick={() => void load()}>
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No packages returned.</div>
            ) : (
              <div className="space-y-3">
                {rows.map(p => {
                  const d = draft[p.packageId] || { stripePriceId: "", stripeProductId: "" };
                  const isMissing = p.isActive && !d.stripePriceId.trim();
                  return (
                    <div
                      key={p.packageId}
                      className="rounded-xl border border-border/50 p-4 bg-background/40"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {p.displayName}{" "}
                            <span className="text-muted-foreground">({p.packageId})</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${p.priceUsd.toFixed(2)} • {p.priceType} •{" "}
                            {p.isActive ? "active" : "inactive"}
                          </div>
                        </div>
                        <div>
                          {isMissing ? (
                            <Badge variant="destructive">Missing stripe_price_id</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Stripe Price ID</div>
                          <Input
                            value={d.stripePriceId}
                            placeholder="price_…"
                            onChange={e =>
                              setDraft(prev => ({
                                ...prev,
                                [p.packageId]: { ...d, stripePriceId: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Stripe Product ID (optional)
                          </div>
                          <Input
                            value={d.stripeProductId}
                            placeholder="prod_…"
                            onChange={e =>
                              setDraft(prev => ({
                                ...prev,
                                [p.packageId]: { ...d, stripeProductId: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end">
                        <Button disabled={loading} onClick={() => void saveRow(p.packageId)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <DLCContentImport />

        {AdminAdultToggles ? (
          <React.Suspense fallback={null}>
            <AdminAdultToggles />
          </React.Suspense>
        ) : null}

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
                {listAddonStates().map(a => (
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
                          {a.manifest.minAppVersion ? ` • minApp ${a.manifest.minAppVersion}` : ""}
                          {a.hasContributions ? " • contributes UI" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            a.runtime.status === "ready"
                              ? "secondary"
                              : a.runtime.status === "failed"
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {a.runtime.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {new Date(a.runtime.updatedAt).toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    {a.runtime.lastError ? (
                      <div className="mt-2 text-xs text-destructive">{a.runtime.lastError}</div>
                    ) : null}
                  </div>
                ))}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
