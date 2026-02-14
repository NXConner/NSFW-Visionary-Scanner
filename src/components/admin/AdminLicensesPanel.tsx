/**
 * Admin Licenses Panel
 * Manage license keys and activations
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Key, Smartphone } from "lucide-react";
import { AdminLicensesTableCard, adminListLicenses, type AdminLicenseDto } from "./licenses";

export function AdminLicensesPanel(): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<AdminLicenseDto[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminListLicenses({ limit: 800, includeInactive: true });
      setLicenses(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load licenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 45000);
    return () => clearInterval(interval);
  }, [refresh]);

  const stats = useMemo(() => {
    const active = licenses.filter(l => l.status === "active").length;
    const expired = licenses.filter(l => l.status === "expired").length;
    const totalDevices = licenses.reduce((sum, l) => sum + (l.devices || 0), 0);
    return { total: licenses.length, active, expired, totalDevices };
  }, [licenses]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Licenses</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Key className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-warning">{stats.expired}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Devices</p>
                <p className="text-2xl font-bold">{stats.totalDevices}</p>
              </div>
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminLicensesTableCard licenses={licenses} loading={loading} onRefresh={refresh} />
    </div>
  );
}
