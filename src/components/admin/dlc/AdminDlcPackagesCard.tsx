import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import type { AdminDlcPackageRow } from "./types";
import { adminListDlcPackages, adminSetDlcPackageActive, adminUpdateDlcStripeMapping } from "./api";

type DraftMap = Record<string, { stripePriceId: string; stripeProductId: string }>;

export function AdminDlcPackagesCard(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminDlcPackageRow[]>([]);
  const [draft, setDraft] = useState<DraftMap>({});
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await adminListDlcPackages();
      setRows(pkgs);
      const nextDraft: DraftMap = {};
      for (const p of pkgs) {
        nextDraft[p.packageId] = {
          stripePriceId: p.stripePriceId || "",
          stripeProductId: p.stripeProductId || "",
        };
      }
      setDraft(nextDraft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load DLC packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(r => r.isActive).length;
    const mapped = rows.filter(r => r.isActive && Boolean(r.stripePriceId)).length;
    const missing = rows.filter(r => r.isActive && !r.stripePriceId).length;
    return { total, active, mapped, missing };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      const id = r.packageId.toLowerCase();
      const name = r.displayName.toLowerCase();
      return id.includes(q) || name.includes(q);
    });
  }, [rows, query]);

  const setActive = useCallback(async (packageId: string, isActive: boolean) => {
    setLoading(true);
    try {
      await adminSetDlcPackageActive({ packageId, isActive });
      setRows(prev => prev.map(r => (r.packageId === packageId ? { ...r, isActive } : r)));
      toast.success(isActive ? "Package activated" : "Package deactivated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update package status");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveStripe = useCallback(
    async (packageId: string) => {
      const d = draft[packageId];
      if (!d) return;
      setLoading(true);
      try {
        await adminUpdateDlcStripeMapping({
          packageId,
          stripePriceId: d.stripePriceId.trim() || null,
          stripeProductId: d.stripeProductId.trim() || null,
        });
        toast.success("Saved Stripe mapping");
        await load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      } finally {
        setLoading(false);
      }
    },
    [draft, load],
  );

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>DLC Packages</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">total: {totals.total}</Badge>
            <Badge variant="secondary">active: {totals.active}</Badge>
            {totals.missing > 0 ? (
              <Badge variant="destructive">missing stripe_price_id: {totals.missing}</Badge>
            ) : (
              <Badge className="bg-green-600">Stripe mapping OK</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by package id or name..."
            className="w-full md:w-[320px]"
            disabled={loading}
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No packages returned.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => {
              const d = draft[p.packageId] || { stripePriceId: "", stripeProductId: "" };
              const missingStripe = p.isActive && !d.stripePriceId.trim();
              return (
                <div
                  key={p.packageId}
                  className="rounded-xl border border-border/50 p-4 bg-background/40 space-y-3"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        {p.displayName}{" "}
                        <span className="text-muted-foreground">({p.packageId})</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${Number(p.priceUsd || 0).toFixed(2)} • {p.priceType}
                        {p.packageType ? ` • ${p.packageType}` : ""}
                        {p.contentRating ? ` • rating ${p.contentRating}` : ""}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {missingStripe ? <Badge variant="destructive">missing price_*</Badge> : null}
                      <Badge variant={p.isActive ? "secondary" : "outline"}>
                        {p.isActive ? "active" : "inactive"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.isActive}
                          disabled={loading}
                          onCheckedChange={v => void setActive(p.packageId, Boolean(v))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Stripe Price ID</div>
                      <Input
                        value={d.stripePriceId}
                        placeholder="price_…"
                        disabled={loading}
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
                        disabled={loading}
                        onChange={e =>
                          setDraft(prev => ({
                            ...prev,
                            [p.packageId]: { ...d, stripeProductId: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button disabled={loading} onClick={() => void saveStripe(p.packageId)}>
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
  );
}

export default AdminDlcPackagesCard;
