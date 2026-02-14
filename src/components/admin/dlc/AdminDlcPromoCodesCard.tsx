import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

import type {
  AdminDlcPromoDiscountType,
  AdminDlcPromoDto,
  AdminDlcPromoUpsertInput,
} from "./types";
import { adminListDlcPromoCodes, adminSetDlcPromoActive, adminUpsertDlcPromoCode } from "./api";

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localInputToIso(v: string): string | null {
  const s = String(v || "").trim();
  if (!s) return null;
  const t = new Date(s).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function normalizeCode(v: string): string {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function parseAppliesTo(v: string): string[] {
  return String(v || "")
    .split(",")
    .map(x => normalizeCode(x))
    .filter(Boolean)
    .slice(0, 200);
}

type FormState = {
  code: string;
  description: string;
  campaignName: string;
  discountType: AdminDlcPromoDiscountType;
  discountValue: string;
  appliesToAll: boolean;
  appliesToCsv: string;
  minPurchaseAmountUsd: string;
  maxRedemptions: string;
  maxPerUser: string;
  validFromLocal: string;
  validUntilLocal: string;
  isActive: boolean;
};

function promoToForm(p: AdminDlcPromoDto | null): FormState {
  return {
    code: p?.code ?? "",
    description: p?.description ?? "",
    campaignName: p?.campaignName ?? "",
    discountType: (p?.discountType ?? "percentage") as AdminDlcPromoDiscountType,
    discountValue: String(p?.discountValue ?? 0),
    appliesToAll: Boolean(p?.appliesToAll ?? true),
    appliesToCsv: (p?.appliesTo || []).filter(x => x !== "ALL").join(", "),
    minPurchaseAmountUsd: p?.minPurchaseAmountUsd != null ? String(p.minPurchaseAmountUsd) : "",
    maxRedemptions: p?.maxRedemptions != null ? String(p.maxRedemptions) : "",
    maxPerUser: p?.maxPerUser != null ? String(p.maxPerUser) : "",
    validFromLocal: isoToLocalInput(p?.validFromIso ?? null),
    validUntilLocal: isoToLocalInput(p?.validUntilIso ?? null),
    isActive: p?.isActive ?? true,
  };
}

function toUpsertInput(form: FormState): AdminDlcPromoUpsertInput {
  const discountValue = Number(form.discountValue);
  const minPurchaseAmountUsd = form.minPurchaseAmountUsd.trim()
    ? Number(form.minPurchaseAmountUsd)
    : null;
  const maxRedemptions = form.maxRedemptions.trim() ? Number(form.maxRedemptions) : null;
  const maxPerUser = form.maxPerUser.trim() ? Number(form.maxPerUser) : null;
  return {
    code: normalizeCode(form.code),
    description: form.description.trim() || null,
    campaignName: form.campaignName.trim() || null,
    discountType: form.discountType,
    discountValue: Number.isFinite(discountValue) ? discountValue : 0,
    appliesToAll: Boolean(form.appliesToAll),
    appliesTo: parseAppliesTo(form.appliesToCsv),
    minPurchaseAmountUsd: Number.isFinite(minPurchaseAmountUsd as any)
      ? (minPurchaseAmountUsd as number)
      : null,
    maxRedemptions: Number.isFinite(maxRedemptions as any) ? (maxRedemptions as number) : null,
    maxPerUser: Number.isFinite(maxPerUser as any) ? (maxPerUser as number) : null,
    validFromIso: localInputToIso(form.validFromLocal),
    validUntilIso: localInputToIso(form.validUntilLocal),
    isActive: Boolean(form.isActive),
  };
}

export function AdminDlcPromoCodesCard(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminDlcPromoDto[]>([]);
  const [query, setQuery] = useState("");
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(() => promoToForm(null));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const promos = await adminListDlcPromoCodes({ includeInactive: true });
      setRows(promos);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load promo codes");
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
    const inactive = total - active;
    return { total, active, inactive };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      return (
        r.code.toLowerCase().includes(q) ||
        (r.campaignName || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const startCreate = () => {
    setCreating(true);
    setEditingCode(null);
    setForm(promoToForm(null));
  };

  const startEdit = (code: string) => {
    const row = rows.find(r => r.code === code) ?? null;
    setCreating(false);
    setEditingCode(code);
    setForm(promoToForm(row));
  };

  const cancelEdit = () => {
    setCreating(false);
    setEditingCode(null);
    setForm(promoToForm(null));
  };

  const setActive = useCallback(async (code: string, isActive: boolean) => {
    setLoading(true);
    try {
      const updated = await adminSetDlcPromoActive({ code, isActive });
      if (updated) setRows(prev => prev.map(r => (r.code === updated.code ? updated : r)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update promo status");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = async () => {
    setLoading(true);
    try {
      const input = toUpsertInput(form);
      const saved = await adminUpsertDlcPromoCode(input);
      toast.success(creating ? "Promo created" : "Promo updated");
      setRows(prev => {
        const next = prev.filter(r => r.code !== saved.code);
        return [saved, ...next];
      });
      cancelEdit();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>DLC Promo Codes</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">total: {totals.total}</Badge>
            <Badge variant="secondary">active: {totals.active}</Badge>
            {totals.inactive > 0 ? (
              <Badge variant="outline">inactive: {totals.inactive}</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search codes / campaign / description..."
            className="w-full md:w-[320px]"
            disabled={loading}
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={startCreate} disabled={loading}>
            New
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(creating || editingCode) && (
          <div className="rounded-xl border border-border/50 p-4 bg-background/40 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="font-semibold">
                {creating ? "Create promo" : `Edit ${editingCode}`}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={() => void save()} disabled={loading}>
                  Save
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Code</div>
                <Input
                  value={form.code}
                  disabled={loading || Boolean(editingCode)}
                  placeholder="WELCOME20"
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Campaign (optional)</div>
                <Input
                  value={form.campaignName}
                  disabled={loading}
                  placeholder="Spring Launch"
                  onChange={e => setForm(prev => ({ ...prev, campaignName: e.target.value }))}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-muted-foreground">Description (optional)</div>
                <Input
                  value={form.description}
                  disabled={loading}
                  placeholder="20% off for first-time purchase"
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Discount type</div>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.discountType}
                  disabled={loading}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      discountType: e.target.value as AdminDlcPromoDiscountType,
                    }))
                  }
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed (USD)</option>
                  <option value="free_trial">Free (100%)</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Discount value</div>
                <Input
                  value={form.discountValue}
                  disabled={loading}
                  inputMode="decimal"
                  placeholder={form.discountType === "percentage" ? "20" : "5.00"}
                  onChange={e => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Active</div>
                <div className="h-10 flex items-center gap-2">
                  <Switch
                    checked={form.isActive}
                    disabled={loading}
                    onCheckedChange={v => setForm(prev => ({ ...prev, isActive: Boolean(v) }))}
                  />
                  <Badge variant={form.isActive ? "secondary" : "outline"}>
                    {form.isActive ? "ON" : "OFF"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Applies to ALL</div>
                <div className="h-10 flex items-center gap-2">
                  <Switch
                    checked={form.appliesToAll}
                    disabled={loading}
                    onCheckedChange={v => setForm(prev => ({ ...prev, appliesToAll: Boolean(v) }))}
                  />
                  <Badge variant={form.appliesToAll ? "secondary" : "outline"}>
                    {form.appliesToAll ? "ALL" : "LIST"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <div className="text-xs text-muted-foreground">
                  Applies to package IDs (comma-separated)
                </div>
                <Input
                  value={form.appliesToCsv}
                  disabled={loading || form.appliesToAll}
                  placeholder="dlc-positions, dlc-videos"
                  onChange={e => setForm(prev => ({ ...prev, appliesToCsv: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Min purchase (USD, optional)</div>
                <Input
                  value={form.minPurchaseAmountUsd}
                  disabled={loading}
                  inputMode="decimal"
                  placeholder="0"
                  onChange={e =>
                    setForm(prev => ({ ...prev, minPurchaseAmountUsd: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Max redemptions (optional)</div>
                <Input
                  value={form.maxRedemptions}
                  disabled={loading}
                  inputMode="numeric"
                  placeholder="500"
                  onChange={e => setForm(prev => ({ ...prev, maxRedemptions: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Max per user (optional)</div>
                <Input
                  value={form.maxPerUser}
                  disabled={loading}
                  inputMode="numeric"
                  placeholder="1"
                  onChange={e => setForm(prev => ({ ...prev, maxPerUser: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Valid from (optional)</div>
                <Input
                  type="datetime-local"
                  value={form.validFromLocal}
                  disabled={loading}
                  onChange={e => setForm(prev => ({ ...prev, validFromLocal: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Valid until (optional)</div>
                <Input
                  type="datetime-local"
                  value={form.validUntilLocal}
                  disabled={loading}
                  onChange={e => setForm(prev => ({ ...prev, validUntilLocal: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No promo codes returned.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <div
                key={p.code}
                className="rounded-xl border border-border/50 p-4 bg-background/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-semibold">
                    <code className="px-2 py-1 rounded bg-muted font-mono text-sm">{p.code}</code>{" "}
                    {p.campaignName ? (
                      <span className="text-muted-foreground">({p.campaignName})</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {p.discountType === "percentage"
                      ? `${p.discountValue}% off`
                      : p.discountType === "fixed_amount"
                        ? `$${p.discountValue.toFixed(2)} off`
                        : "Free (100%)"}
                    {" • "}
                    {p.appliesToAll ? "all packages" : `packages: ${p.appliesTo.join(", ")}`}
                    {" • "}
                    used {p.currentRedemptions}
                    {p.maxRedemptions != null ? `/${p.maxRedemptions}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Switch
                    checked={p.isActive}
                    disabled={loading}
                    onCheckedChange={v => void setActive(p.code, Boolean(v))}
                  />
                  <Badge variant={p.isActive ? "secondary" : "outline"}>
                    {p.isActive ? "ON" : "OFF"}
                  </Badge>
                  <Button variant="outline" disabled={loading} onClick={() => startEdit(p.code)}>
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminDlcPromoCodesCard;
