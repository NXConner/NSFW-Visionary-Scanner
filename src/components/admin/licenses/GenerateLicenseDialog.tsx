import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

import { adminListDlcPackages } from "@/components/admin/dlc/api";
import type { AdminDlcPackageRow } from "@/components/admin/dlc/types";
import type { AdminGenerateLicenseInput } from "./types";
import { adminGenerateLicense } from "./api";

function localDateTimeToIso(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function GenerateLicenseDialog(props: { onGenerated: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packages, setPackages] = useState<AdminDlcPackageRow[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [packageId, setPackageId] = useState<string>("");
  const [licenseType, setLicenseType] =
    useState<AdminGenerateLicenseInput["licenseType"]>("one_time");
  const [maxDevices, setMaxDevices] = useState(3);
  const [expiresLocal, setExpiresLocal] = useState<string>("");
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingPackages(true);
    void adminListDlcPackages()
      .then(rows => {
        if (cancelled) return;
        setPackages(rows.filter(r => r.isActive));
      })
      .catch(() => {
        toast.error("Failed to load DLC packages");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingPackages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedPkg = useMemo(
    () => packages.find(p => p.packageId === packageId) ?? null,
    [packageId, packages],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate License
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate DLC License</DialogTitle>
          <DialogDescription>
            Creates a new license key for a user (real DB-backed license row).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lic-email">User email</Label>
            <Input
              id="lic-email"
              placeholder="user@example.com"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <Label>Package</Label>
            <Select value={packageId} onValueChange={setPackageId} disabled={loadingPackages}>
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingPackages ? "Loading packages..." : "Select a package"}
                />
              </SelectTrigger>
              <SelectContent>
                {packages.map(p => (
                  <SelectItem key={p.packageId} value={p.packageId}>
                    {p.displayName} <span className="text-muted-foreground">({p.packageId})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPkg ? (
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{selectedPkg.priceType}</Badge>
                <Badge variant="outline">${selectedPkg.priceUsd.toFixed(2)}</Badge>
                {selectedPkg.contentRating ? (
                  <Badge variant="secondary">{selectedPkg.contentRating}</Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>License type</Label>
              <Select value={licenseType} onValueChange={v => setLicenseType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">one_time</SelectItem>
                  <SelectItem value="subscription">subscription</SelectItem>
                  <SelectItem value="gift">gift</SelectItem>
                  <SelectItem value="promo">promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lic-max-devices">Max devices</Label>
              <Input
                id="lic-max-devices"
                type="number"
                min={1}
                max={50}
                value={String(maxDevices)}
                onChange={e => setMaxDevices(Number(e.target.value || 3))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lic-expires">Expires (optional)</Label>
            <Input
              id="lic-expires"
              type="datetime-local"
              value={expiresLocal}
              onChange={e => setExpiresLocal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lic-note">Internal note (optional)</Label>
            <Textarea
              id="lic-note"
              placeholder="Why was this license issued?"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const email = userEmail.trim().toLowerCase();
              if (!email) {
                toast.error("User email is required");
                return;
              }
              if (!packageId) {
                toast.error("Select a package");
                return;
              }
              const expiresAtIso = localDateTimeToIso(expiresLocal);
              if (expiresLocal.trim() && !expiresAtIso) {
                toast.error("Invalid expiration date/time");
                return;
              }
              setSubmitting(true);
              try {
                await adminGenerateLicense({
                  userEmail: email,
                  packageId,
                  licenseType,
                  maxDevices: Number.isFinite(maxDevices)
                    ? Math.max(1, Math.min(50, maxDevices))
                    : 3,
                  expiresAtIso,
                  note: note.trim() ? note.trim() : null,
                });
                toast.success("License generated");
                setOpen(false);
                setUserEmail("");
                setPackageId("");
                setLicenseType("one_time");
                setMaxDevices(3);
                setExpiresLocal("");
                setNote("");
                props.onGenerated();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to generate license");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting || loadingPackages}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
