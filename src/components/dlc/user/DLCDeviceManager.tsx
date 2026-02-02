import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Laptop, Smartphone, Tablet, RefreshCcw, Star, Trash2 } from "lucide-react";

type DeviceRow = {
  id: string;
  license_id: string;
  device_id: string;
  device_name: string | null;
  device_type: string | null;
  device_platform?: string | null;
  platform?: string | null;
  is_active: boolean | null;
  is_primary?: boolean | null;
  last_seen_at?: string | null;
  last_used_at?: string | null;
  last_validation_at?: string | null;
  activated_at?: string | null;
};

type LicenseRow = {
  id: string;
  package_id?: string | null;
  license_type?: string | null;
  is_active?: boolean | null;
  max_devices?: number | null;
};

function iconFor(row: DeviceRow): React.ReactNode {
  const p = String(row.device_platform || row.platform || "").toLowerCase();
  if (p.includes("android") || p.includes("ios")) return <Smartphone className="w-4 h-4" />;
  if (p.includes("tablet")) return <Tablet className="w-4 h-4" />;
  return <Laptop className="w-4 h-4" />;
}

function fmt(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function DLCDeviceManager(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [authRequired, setAuthRequired] = useState(false);

  const devicesByLicense = useMemo(() => {
    const map = new Map<string, DeviceRow[]>();
    for (const d of devices) {
      const arr = map.get(d.license_id) || [];
      arr.push(d);
      map.set(d.license_id, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)));
      map.set(k, arr);
    }
    return map;
  }, [devices]);

  const load = useCallback(async () => {
    setLoading(true);
    setAuthRequired(false);
    try {
      let userId: string | null = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        userId = data.user?.id ?? null;
      } catch {
        userId = null;
      }

      if (!userId) {
        setAuthRequired(true);
        setLicenses([]);
        setDevices([]);
        return;
      }
      const { data, error } = await supabase.functions.invoke("dlc-device-management", {
        body: { action: "list" },
      });
      if (error) throw new Error(error.message);
      setLicenses((data?.licenses || []) as LicenseRow[]);
      setDevices((data?.devices || []) as DeviceRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  const deactivate = async (deviceRowId: string) => {
    setLoading(true);
    try {
      let userId: string | null = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        userId = data.user?.id ?? null;
      } catch {
        userId = null;
      }

      if (!userId) {
        setAuthRequired(true);
        toast.error("Sign in to manage devices");
        return;
      }
      const { error } = await supabase.functions.invoke("dlc-device-management", {
        body: { action: "deactivate", deviceRowId },
      });
      if (error) throw new Error(error.message);
      toast.success("Device deactivated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to deactivate");
    } finally {
      setLoading(false);
    }
  };

  const setPrimary = async (licenseId: string, deviceId: string) => {
    setLoading(true);
    try {
      let userId: string | null = null;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        userId = data.user?.id ?? null;
      } catch {
        userId = null;
      }

      if (!userId) {
        setAuthRequired(true);
        toast.error("Sign in to manage devices");
        return;
      }
      const { error } = await supabase.functions.invoke("dlc-device-management", {
        body: { action: "setPrimary", licenseId, deviceId },
      });
      if (error) throw new Error(error.message);
      toast.success("Primary device updated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set primary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (props.open) void load();
  }, [load, props.open]);

  return (
    <Dialog
      open={props.open}
      onOpenChange={o => {
        props.onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>DLC Device Management</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Manage device slots per license. Deactivate old devices to free slots.
          </div>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => void load()}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        <div className="space-y-4 max-h-[65vh] overflow-auto pr-1">
          {authRequired ? (
            <Card className="border-border/50">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Sign in to view and manage your DLC devices.
              </CardContent>
            </Card>
          ) : null}
          {licenses.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No active licenses found.
              </CardContent>
            </Card>
          ) : (
            licenses.map(lic => {
              const devs = devicesByLicense.get(lic.id) || [];
              const active = devs.filter(d => d.is_active !== false);
              const max = Number(lic.max_devices ?? 3);
              return (
                <Card key={lic.id} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          {lic.package_id ? `Package: ${lic.package_id}` : "License"}
                          <span className="text-muted-foreground">
                            {" "}
                            • {lic.license_type || "one_time"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Slots used: {active.length}/{max}
                        </div>
                      </div>
                      <Badge variant={active.length >= max ? "destructive" : "secondary"}>
                        {active.length >= max ? "At limit" : "OK"}
                      </Badge>
                    </div>

                    {devs.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No device bindings yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {devs.map(d => {
                          const isActive = d.is_active !== false;
                          const isPrimary = Boolean(d.is_primary);
                          const label = d.device_name || d.device_type || d.device_id;
                          return (
                            <div
                              key={d.id}
                              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border border-border/50 p-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 text-muted-foreground">{iconFor(d)}</div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {label}
                                    {!isActive && <Badge variant="outline">Inactive</Badge>}
                                    {isPrimary && (
                                      <Badge className="bg-amber-500 text-black">Primary</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    device_id: <code>{d.device_id}</code>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    last used: {fmt(d.last_used_at || d.last_seen_at)}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant={isPrimary ? "secondary" : "outline"}
                                  disabled={loading || !isActive}
                                  onClick={() => void setPrimary(d.license_id, d.device_id)}
                                  className="gap-2"
                                >
                                  <Star className="w-4 h-4" /> Primary
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={loading || !isActive}
                                  onClick={() => void deactivate(d.id)}
                                  className="gap-2"
                                >
                                  <Trash2 className="w-4 h-4" /> Deactivate
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
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
