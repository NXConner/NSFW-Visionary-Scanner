import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useDLC } from "@/dlc/context/DLCContext";

type ToggleRow = {
  packageId: string;
  packageName: string;
  contentRating: string;
  enabled: boolean;
};

type ToggleState = {
  masterEnabled: boolean;
  rows: ToggleRow[];
};

const MASTER_ID = "__nsfw_master__";

export function AdminNsfwDlcToggles(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<ToggleState>({ masterEnabled: false, rows: [] });
  const { refresh } = useDLC();

  const enabledCount = useMemo(() => state.rows.filter(r => r.enabled).length, [state.rows]);

  const notifyChanged = () => {
    // Let any listeners know admin DLC toggles changed (useful for UI that caches entitlements).
    window.dispatchEvent(new CustomEvent("dlc-admin-toggles-changed"));
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-dlc-toggles", {
        body: { action: "list" },
      });
      if (error) throw new Error(error.message);
      const masterEnabled = Boolean(data?.master?.enabled);
      const rows = ((data?.packages || []) as any[]).map(p => ({
        packageId: String(p.packageId),
        packageName: String(p.packageName),
        contentRating: String(p.contentRating ?? "18+"),
        enabled: Boolean(p.enabled),
      }));
      setState({ masterEnabled, rows });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load NSFW DLC toggles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const setMaster = async (enabled: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("admin-dlc-toggles", {
        body: { action: "set", packageId: MASTER_ID, enabled },
      });
      if (error) throw new Error(error.message);
      setState(prev => ({ ...prev, masterEnabled: enabled }));
      notifyChanged();
      await refresh();
      toast.success(enabled ? "NSFW master enabled" : "NSFW master disabled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update master toggle");
    } finally {
      setLoading(false);
    }
  };

  const setAll = async (enabled: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("admin-dlc-toggles", {
        body: { action: "set_all", enabled },
      });
      if (error) throw new Error(error.message);
      setState(prev => ({ ...prev, rows: prev.rows.map(r => ({ ...r, enabled })) }));
      notifyChanged();
      await refresh();
      toast.success(enabled ? "Enabled all NSFW DLC add-ons" : "Disabled all NSFW DLC add-ons");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update all toggles");
    } finally {
      setLoading(false);
    }
  };

  const setOne = async (packageId: string, enabled: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("admin-dlc-toggles", {
        body: { action: "set", packageId, enabled },
      });
      if (error) throw new Error(error.message);
      setState(prev => ({
        ...prev,
        rows: prev.rows.map(r => (r.packageId === packageId ? { ...r, enabled } : r)),
      }));
      notifyChanged();
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update toggle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Admin DLC — Enable/Disable NSFW Add-ons</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {state.masterEnabled ? "master: ON" : "master: OFF"} • enabled: {enabledCount}/
            {state.rows.length}
          </Badge>
          <Button variant="outline" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/50 p-4 bg-background/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold">NSFW Master Switch</div>
            <div className="text-sm text-muted-foreground">
              When OFF, all NSFW DLC features behave as locked even if individual packages are ON.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={state.masterEnabled}
              disabled={loading}
              onCheckedChange={v => void setMaster(Boolean(v))}
            />
            <Badge variant={state.masterEnabled ? "secondary" : "outline"}>
              {state.masterEnabled ? "ON" : "OFF"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" disabled={loading} onClick={() => void setAll(true)}>
            Enable all
          </Button>
          <Button variant="outline" disabled={loading} onClick={() => void setAll(false)}>
            Disable all
          </Button>
        </div>

        {state.rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No NSFW packages returned.</div>
        ) : (
          <div className="space-y-3">
            {state.rows.map(r => (
              <div
                key={r.packageId}
                className="rounded-xl border border-border/50 p-4 bg-background/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-semibold">
                    {r.packageName} <span className="text-muted-foreground">({r.packageId})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">rating: {r.contentRating}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={r.enabled}
                    disabled={loading}
                    onCheckedChange={v => void setOne(r.packageId, Boolean(v))}
                  />
                  <Badge variant={r.enabled ? "secondary" : "outline"}>
                    {r.enabled ? "ON" : "OFF"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Default is OFF. These toggles only affect the privileged admin account view (used for
          testing/packaging).
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminNsfwDlcToggles;
