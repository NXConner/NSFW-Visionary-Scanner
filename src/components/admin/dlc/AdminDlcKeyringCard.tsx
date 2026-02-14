import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";

import type { AdminDlcKeyringEntry, AdminDlcPackageRow } from "./types";
import { adminListDlcKeyring, adminListDlcPackages, adminRotateDlcKey } from "./api";

function formatIso(iso: string | null): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString();
}

export function AdminDlcKeyringCard(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<AdminDlcPackageRow[]>([]);
  const [packageId, setPackageId] = useState<string>("");
  const [keys, setKeys] = useState<AdminDlcKeyringEntry[]>([]);
  const [confirm, setConfirm] = useState("");

  const loadPackages = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await adminListDlcPackages();
      setPackages(pkgs);
      const preferred = pkgs.find(p => p.isActive)?.packageId ?? pkgs[0]?.packageId ?? "";
      setPackageId(prev => prev || preferred);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKeys = useCallback(async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const rows = await adminListDlcKeyring({ packageId: pid, limit: 25 });
      setKeys(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load keyring");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    void loadKeys(packageId);
  }, [packageId, loadKeys]);

  const activeKey = useMemo(() => keys.find(k => k.isActive) ?? null, [keys]);

  const canRotate = useMemo(
    () => confirm.trim().toUpperCase() === "ROTATE" && Boolean(packageId),
    [confirm, packageId],
  );

  const rotate = useCallback(async () => {
    if (!packageId) return;
    const ok = window.confirm(
      `Rotate the active key for ${packageId}?\n\n` +
        `This only changes the ACTIVE key. You must also re-encrypt and republish the package contents, ` +
        `otherwise downloads will fail to decrypt.`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await adminRotateDlcKey({ packageId });
      toast.success(`Rotated key → v${res.keyVersion}`);
      setConfirm("");
      await loadKeys(packageId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Key rotation failed");
    } finally {
      setLoading(false);
    }
  }, [loadKeys, packageId]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>DLC Keyring</CardTitle>
          <div className="text-sm text-muted-foreground">
            Rotating keys is destructive unless you also re-encrypt and republish the package
            content.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={packageId}
            disabled={loading}
            onChange={e => setPackageId(e.target.value)}
          >
            <option value="" disabled>
              Select package…
            </option>
            {packages.map(p => (
              <option key={p.packageId} value={p.packageId}>
                {p.displayName} ({p.packageId})
              </option>
            ))}
          </select>
          <Button variant="outline" disabled={loading} onClick={() => void loadKeys(packageId)}>
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/50 p-4 bg-background/40 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <div className="font-semibold">Active key</div>
              <div className="text-sm text-muted-foreground">
                {activeKey ? (
                  <>
                    v{activeKey.keyVersion} • created {formatIso(activeKey.createdAtIso)}
                  </>
                ) : (
                  "No active key found for this package."
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                value={confirm}
                disabled={loading}
                placeholder='Type "ROTATE" to enable'
                onChange={e => setConfirm(e.target.value)}
                className="w-full sm:w-[220px]"
              />
              <Button disabled={loading || !canRotate} onClick={() => void rotate()}>
                Rotate active key
              </Button>
            </div>
          </div>
        </div>

        {keys.length === 0 ? (
          <div className="text-sm text-muted-foreground">No keyring entries returned.</div>
        ) : (
          <div className="space-y-2">
            {keys.map(k => (
              <div
                key={k.id}
                className="rounded-xl border border-border/50 p-4 bg-background/40 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold">
                    v{k.keyVersion}{" "}
                    {k.isActive ? (
                      <Badge variant="secondary">active</Badge>
                    ) : (
                      <Badge variant="outline">inactive</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    created {formatIso(k.createdAtIso)}
                    {k.rotatedAtIso ? ` • rotated ${formatIso(k.rotatedAtIso)}` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground truncate">id {k.id}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminDlcKeyringCard;
