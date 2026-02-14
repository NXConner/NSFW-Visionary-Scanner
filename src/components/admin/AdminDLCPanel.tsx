/**
 * Admin DLC Panel (Dashboard Embed)
 *
 * IMPORTANT:
 * This panel intentionally uses **real Supabase data** only (no demo/sample arrays).
 * It provides a quick overview + navigation to the full DLC admin screen.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AdminDlcPackage = {
  packageId: string;
  displayName: string;
  priceUsd: number;
  priceType: string;
  isActive: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
};

export function AdminDLCPanel(): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AdminDlcPackage[]>([]);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-dlc-catalog", {
        body: { action: "list" },
      });
      if (error) throw new Error(error.message);
      setRows(((data?.packages || []) as AdminDlcPackage[]).slice());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load DLC catalog");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => {
      const name = String(r.displayName || "").toLowerCase();
      const id = String(r.packageId || "").toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [rows, query]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(r => r.isActive).length;
    const missingStripe = rows.filter(r => r.isActive && !r.stripePriceId).length;
    const avgPrice =
      total > 0
        ? rows.reduce((sum, r) => sum + Number(r.priceUsd ?? 0), 0) / Math.max(1, total)
        : 0;
    return { total, active, missingStripe, avgPrice };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Packages</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Packages</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Missing Stripe Mapping</p>
              <p className="text-2xl font-bold">{stats.missingStripe}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg. Price</p>
              <p className="text-2xl font-bold">${Number(stats.avgPrice || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle>DLC Packages</CardTitle>
            <CardDescription>
              Quick overview. For Stripe mapping + content import, open the full admin screen.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or package_id…"
              className="md:w-72"
            />
            <Button variant="outline" disabled={loading} onClick={() => void load()}>
              Refresh
            </Button>
            <Button asChild>
              <Link to="/admin/dlc">Open DLC Admin</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      No packages returned.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => {
                    const missingStripe = p.isActive && !p.stripePriceId;
                    return (
                      <TableRow key={p.packageId}>
                        <TableCell className="font-medium">
                          <div className="min-w-0">
                            <div className="truncate">{p.displayName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {p.packageId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          ${Number(p.priceUsd || 0).toFixed(2)}{" "}
                          <span className="text-xs text-muted-foreground">• {p.priceType}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.isActive ? "secondary" : "outline"}>
                            {p.isActive ? "active" : "inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {missingStripe ? (
                            <Badge variant="destructive">Missing price_*</Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
