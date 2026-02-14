import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { StripeCatalogItem } from "./types";

type Props = {
  title: string;
  functionName: string;
  itemLabel?: string;
};

type DraftRow = { stripePriceId: string; stripeProductId: string };

function safeMoney(amount: number): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

export function StripeCatalogMappingPanel({
  title,
  functionName,
  itemLabel = "items",
}: Props): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<StripeCatalogItem[]>([]);
  const [draft, setDraft] = useState<Record<string, DraftRow>>({});
  const [query, setQuery] = useState("");

  const missingCount = useMemo(() => {
    return items.filter(i => i.isActive && Number(i.priceValue ?? 0) > 0 && !i.stripePriceId)
      .length;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => {
      const name = String(i.displayName || "").toLowerCase();
      const id = String(i.id || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [items, query]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: "list" },
      });
      if (error) throw new Error(error.message);
      const nextItems = ((data?.items || []) as StripeCatalogItem[]).slice();
      setItems(nextItems);
      const nextDraft: Record<string, DraftRow> = {};
      for (const it of nextItems) {
        nextDraft[it.id] = {
          stripePriceId: it.stripePriceId || "",
          stripeProductId: it.stripeProductId || "",
        };
      }
      setDraft(nextDraft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to load ${itemLabel}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [functionName]);

  const saveRow = async (id: string) => {
    const d = draft[id];
    if (!d) return;
    setLoading(true);
    try {
      const stripePriceId = d.stripePriceId.trim() || null;
      const stripeProductId = d.stripeProductId.trim() || null;

      const { error } = await supabase.functions.invoke(functionName, {
        body: {
          action: "update",
          id,
          stripePriceId,
          stripeProductId,
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

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {missingCount > 0 ? (
            <Badge variant="destructive">
              {missingCount} active paid {itemLabel} missing price_*
            </Badge>
          ) : (
            <Badge className="bg-green-600">All active paid {itemLabel} mapped</Badge>
          )}
          <Button variant="outline" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Live mode uses <span className="font-mono">stripe_price_id</span> (no inline{" "}
            <span className="font-mono">price_data</span> fallbacks). For paid items, set{" "}
            <span className="font-mono">price_*</span>.
          </div>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${itemLabel}…`}
            className="md:max-w-xs"
          />
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">No {itemLabel} returned.</div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(it => {
              const d = draft[it.id] || { stripePriceId: "", stripeProductId: "" };
              const isPaid = Number(it.priceValue ?? 0) > 0;
              const isMissing = it.isActive && isPaid && !d.stripePriceId.trim();
              const approved = it.isApproved;
              return (
                <div
                  key={it.id}
                  className="rounded-xl border border-border/50 p-4 bg-background/40"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="font-semibold truncate">
                        {it.displayName}{" "}
                        <span className="text-muted-foreground font-normal">({it.id})</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {safeMoney(it.priceValue)} • {String(it.currency || "USD").toUpperCase()} •{" "}
                        {it.priceType}
                        {it.contentType ? ` • ${it.contentType}` : ""}
                        {it.itemType ? ` • ${it.itemType}` : ""}
                        {it.category ? ` • ${it.category}` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={it.isActive ? "secondary" : "outline"}>
                        {it.isActive ? "active" : "inactive"}
                      </Badge>
                      {approved !== undefined ? (
                        <Badge variant={approved ? "secondary" : "outline"}>
                          {approved ? "approved" : "unapproved"}
                        </Badge>
                      ) : null}
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
                            [it.id]: { ...d, stripePriceId: e.target.value },
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
                            [it.id]: { ...d, stripeProductId: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <Button disabled={loading} onClick={() => void saveRow(it.id)}>
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
