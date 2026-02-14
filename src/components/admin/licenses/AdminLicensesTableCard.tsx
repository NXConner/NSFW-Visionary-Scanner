import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Ban, Copy, RefreshCw, RotateCcw, Search, Smartphone } from "lucide-react";

import type { AdminLicenseDto, AdminLicenseStatus } from "./types";
import { adminResetLicenseDevices, adminRevokeLicense, adminRotateLicenseKey } from "./api";
import { GenerateLicenseDialog } from "./GenerateLicenseDialog";

function statusBadgeVariant(status: AdminLicenseStatus): "default" | "secondary" | "destructive" {
  if (status === "active") return "default";
  if (status === "expired") return "secondary";
  return "destructive";
}

function formatMaybeDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function AdminLicensesTableCard(props: {
  licenses: AdminLicenseDto[];
  loading: boolean;
  onRefresh: () => void;
}): JSX.Element {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | AdminLicenseStatus>("all");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return props.licenses.filter(l => {
      const matchesTab = activeTab === "all" ? true : l.status === activeTab;
      if (!matchesTab) return false;
      if (!q) return true;
      const email = (l.userEmail ?? "").toLowerCase();
      const packagePart = `${l.packageName ?? ""} ${l.packageId ?? ""}`.toLowerCase();
      return (
        l.key.toLowerCase().includes(q) ||
        email.includes(q) ||
        packagePart.includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    });
  }, [activeTab, props.licenses, searchQuery]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>License Management</CardTitle>
            <CardDescription>View and manage DLC license keys (real data)</CardDescription>
          </div>
          <GenerateLicenseDialog onGenerated={props.onRefresh} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by key, email, package…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
                <TabsTrigger value="revoked">Revoked</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" onClick={props.onRefresh} disabled={props.loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[520px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Devices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No licenses found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <code className="text-sm font-mono">{l.key}</code>
                    </TableCell>
                    <TableCell className="truncate max-w-[220px]">
                      {l.userEmail ?? (
                        <span className="text-muted-foreground text-xs font-mono">{l.userId}</span>
                      )}
                    </TableCell>
                    <TableCell className="truncate max-w-[220px]">
                      {l.packageName ?? l.packageId ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {l.devices}/{l.maxDevices}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(l.status)}>{l.status}</Badge>
                    </TableCell>
                    <TableCell>{formatMaybeDate(l.expiresAtIso)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            void navigator.clipboard.writeText(l.key);
                            toast.success("License key copied");
                          }}
                          aria-label="Copy key"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            try {
                              await adminRotateLicenseKey(l.id);
                              toast.success("License key rotated");
                              props.onRefresh();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to rotate key");
                            }
                          }}
                          aria-label="Rotate key"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (
                              !window.confirm(
                                "Reset devices for this license? This deactivates existing device bindings.",
                              )
                            ) {
                              return;
                            }
                            try {
                              await adminResetLicenseDevices(l.id);
                              toast.success("Devices reset");
                              props.onRefresh();
                            } catch (e) {
                              toast.error(
                                e instanceof Error ? e.message : "Failed to reset devices",
                              );
                            }
                          }}
                          aria-label="Reset devices"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={async () => {
                            if (!window.confirm("Revoke this license? This cannot be undone."))
                              return;
                            try {
                              await adminRevokeLicense(l.id);
                              toast.success("License revoked");
                              props.onRefresh();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to revoke");
                            }
                          }}
                          aria-label="Revoke license"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
