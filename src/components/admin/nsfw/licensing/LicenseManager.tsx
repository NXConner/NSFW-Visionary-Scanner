import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ContentLicensor, LicenseWithLicensor } from "@/lib/nsfwLicensing/types";
import { LICENSE_STATUSES, LICENSE_TYPES } from "@/lib/nsfwLicensing/constants";
import { createLicense, updateLicense } from "@/lib/nsfwLicensing/api";

type Props = {
  rows: LicenseWithLicensor[];
  licensors: ContentLicensor[];
  loading: boolean;
  onRefresh: () => void;
};

type LicenseFormState = {
  license_key: string;
  license_name: string;
  license_type: string;
  licensor_id: string;
  exclusive: boolean;
  start_date: string;
  end_date: string;
  territory: string;
  languages: string;
  allowed_content_types: string;
  allowed_platforms: string;
  distribution_channels: string;
  allows_educational: boolean;
  allows_demonstrative: boolean;
  allows_explicit: boolean;
  requires_attribution: boolean;
  attribution_text: string;
  edit_rights: boolean;
  derivative_rights: boolean;
  sublicensing_rights: boolean;
  marketing_rights: boolean;
  watermark_required: boolean;
  contract_storage_path: string;
  contract_sha256: string;
  requires_2257: boolean;
  status: string;
  is_active: boolean;
  notes: string;
};

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

const joinList = (value: string[] | null | undefined): string => (value || []).join(", ");

function buildFormState(row?: LicenseWithLicensor): LicenseFormState {
  return {
    license_key: row?.license_key ?? "",
    license_name: row?.license_name ?? "",
    license_type: row?.license_type ?? "non_exclusive",
    licensor_id: row?.licensor_id ?? "",
    exclusive: row?.exclusive ?? false,
    start_date: row?.start_date ?? "",
    end_date: row?.end_date ?? "",
    territory: row?.territory ?? "",
    languages: joinList(row?.languages),
    allowed_content_types: joinList(row?.allowed_content_types),
    allowed_platforms: joinList(row?.allowed_platforms),
    distribution_channels: joinList(row?.distribution_channels),
    allows_educational: row?.allows_educational ?? true,
    allows_demonstrative: row?.allows_demonstrative ?? true,
    allows_explicit: row?.allows_explicit ?? true,
    requires_attribution: row?.requires_attribution ?? false,
    attribution_text: row?.attribution_text ?? "",
    edit_rights: row?.edit_rights ?? false,
    derivative_rights: row?.derivative_rights ?? false,
    sublicensing_rights: row?.sublicensing_rights ?? false,
    marketing_rights: row?.marketing_rights ?? false,
    watermark_required: row?.watermark_required ?? false,
    contract_storage_path: row?.contract_storage_path ?? "",
    contract_sha256: row?.contract_sha256 ?? "",
    requires_2257: row?.requires_2257 ?? true,
    status: row?.status ?? "active",
    is_active: row?.is_active ?? true,
    notes: row?.notes ?? "",
  };
}

export function LicenseManager({ rows, licensors, loading, onRefresh }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<LicenseWithLicensor | null>(null);
  const [form, setForm] = useState<LicenseFormState>(buildFormState());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => row.license_name.toLowerCase().includes(q));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildFormState());
  };

  const openEdit = (row: LicenseWithLicensor) => {
    setEditing(row);
    setForm(buildFormState(row));
  };

  const handleSave = async () => {
    if (!form.license_key.trim() || !form.license_name.trim()) {
      toast.error("License key and name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        license_key: form.license_key.trim(),
        license_name: form.license_name.trim(),
        license_type: form.license_type,
        licensor_id: form.licensor_id || null,
        exclusive: form.exclusive,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        territory: form.territory || null,
        languages: splitList(form.languages),
        allowed_content_types: splitList(form.allowed_content_types),
        allowed_platforms: splitList(form.allowed_platforms),
        distribution_channels: splitList(form.distribution_channels),
        allows_educational: form.allows_educational,
        allows_demonstrative: form.allows_demonstrative,
        allows_explicit: form.allows_explicit,
        requires_attribution: form.requires_attribution,
        attribution_text: form.attribution_text || null,
        edit_rights: form.edit_rights,
        derivative_rights: form.derivative_rights,
        sublicensing_rights: form.sublicensing_rights,
        marketing_rights: form.marketing_rights,
        watermark_required: form.watermark_required,
        contract_storage_path: form.contract_storage_path || null,
        contract_sha256: form.contract_sha256 || null,
        requires_2257: form.requires_2257,
        status: form.status,
        is_active: form.is_active,
        notes: form.notes || null,
      };

      if (editing) {
        const ok = await updateLicense(editing.id, payload);
        if (!ok) throw new Error("Update failed");
      } else {
        const created = await createLicense(payload as any);
        if (!created) throw new Error("Create failed");
      }
      onRefresh();
      toast.success(editing ? "License updated" : "License created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: LicenseWithLicensor, next: boolean) => {
    const ok = await updateLicense(row.id, { is_active: next });
    if (ok) {
      toast.success("Updated license");
      onRefresh();
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Content Licenses</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search licenses"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add License</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit License" : "New License"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">License Key</div>
                  <Input
                    value={form.license_key}
                    onChange={e => setForm(s => ({ ...s, license_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">License Name</div>
                  <Input
                    value={form.license_name}
                    onChange={e => setForm(s => ({ ...s, license_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Licensor</div>
                  <Select
                    value={form.licensor_id || "none"}
                    onValueChange={v => setForm(s => ({ ...s, licensor_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select licensor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No licensor</SelectItem>
                      {licensors.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">License Type</div>
                  <Select
                    value={form.license_type}
                    onValueChange={v => setForm(s => ({ ...s, license_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map(t => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Select value={form.status} onValueChange={v => setForm(s => ({ ...s, status: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_STATUSES.map(s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Start Date</div>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(s => ({ ...s, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">End Date</div>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm(s => ({ ...s, end_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Territory</div>
                  <Input
                    value={form.territory}
                    onChange={e => setForm(s => ({ ...s, territory: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Languages (comma)</div>
                  <Input
                    value={form.languages}
                    onChange={e => setForm(s => ({ ...s, languages: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Allowed Content Types</div>
                  <Input
                    value={form.allowed_content_types}
                    onChange={e => setForm(s => ({ ...s, allowed_content_types: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Allowed Platforms</div>
                  <Input
                    value={form.allowed_platforms}
                    onChange={e => setForm(s => ({ ...s, allowed_platforms: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Distribution Channels</div>
                  <Input
                    value={form.distribution_channels}
                    onChange={e => setForm(s => ({ ...s, distribution_channels: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Contract Storage Path</div>
                  <Input
                    value={form.contract_storage_path}
                    onChange={e => setForm(s => ({ ...s, contract_storage_path: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Contract SHA256</div>
                  <Input
                    value={form.contract_sha256}
                    onChange={e => setForm(s => ({ ...s, contract_sha256: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Rights & Limits</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.exclusive}
                          onCheckedChange={v => setForm(s => ({ ...s, exclusive: v }))}
                        />
                        Exclusive
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.edit_rights}
                          onCheckedChange={v => setForm(s => ({ ...s, edit_rights: v }))}
                        />
                        Edit rights
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.derivative_rights}
                          onCheckedChange={v => setForm(s => ({ ...s, derivative_rights: v }))}
                        />
                        Derivative rights
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.sublicensing_rights}
                          onCheckedChange={v => setForm(s => ({ ...s, sublicensing_rights: v }))}
                        />
                        Sublicensing
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.marketing_rights}
                          onCheckedChange={v => setForm(s => ({ ...s, marketing_rights: v }))}
                        />
                        Marketing rights
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.watermark_required}
                          onCheckedChange={v => setForm(s => ({ ...s, watermark_required: v }))}
                        />
                        Watermark required
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Content Scope</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.allows_educational}
                          onCheckedChange={v => setForm(s => ({ ...s, allows_educational: v }))}
                        />
                        Educational
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.allows_demonstrative}
                          onCheckedChange={v => setForm(s => ({ ...s, allows_demonstrative: v }))}
                        />
                        Demonstrative
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.allows_explicit}
                          onCheckedChange={v => setForm(s => ({ ...s, allows_explicit: v }))}
                        />
                        Explicit
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={form.requires_2257}
                          onCheckedChange={v => setForm(s => ({ ...s, requires_2257: v }))}
                        />
                        Requires 2257
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Attribution Required</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.requires_attribution}
                      onCheckedChange={v => setForm(s => ({ ...s, requires_attribution: v }))}
                    />
                    <span className="text-xs text-muted-foreground">
                      {form.requires_attribution ? "Required" : "Not required"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Attribution Text</div>
                  <Input
                    value={form.attribution_text}
                    onChange={e => setForm(s => ({ ...s, attribution_text: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Active</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={v => setForm(s => ({ ...s, is_active: v }))}
                    />
                    <span className="text-xs text-muted-foreground">
                      {form.is_active ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No licenses found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License</TableHead>
                <TableHead>Licensor</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.license_name}
                    <div className="text-xs text-muted-foreground">{row.license_key}</div>
                  </TableCell>
                  <TableCell>{row.licensor_name || "—"}</TableCell>
                  <TableCell>{row.license_type}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "active" ? "secondary" : "outline"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {row.start_date || "—"} → {row.end_date || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch checked={row.is_active} onCheckedChange={v => void toggleActive(row, v)} />
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Edit License</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">License Key</div>
                            <Input
                              value={form.license_key}
                              onChange={e => setForm(s => ({ ...s, license_key: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">License Name</div>
                            <Input
                              value={form.license_name}
                              onChange={e => setForm(s => ({ ...s, license_name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Licensor</div>
                            <Select
                              value={form.licensor_id || "none"}
                              onValueChange={v =>
                                setForm(s => ({ ...s, licensor_id: v === "none" ? "" : v }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select licensor" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No licensor</SelectItem>
                                {licensors.map(l => (
                                  <SelectItem key={l.id} value={l.id}>
                                    {l.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">License Type</div>
                            <Select
                              value={form.license_type}
                              onValueChange={v => setForm(s => ({ ...s, license_type: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LICENSE_TYPES.map(t => (
                                  <SelectItem key={t} value={t}>
                                    {t.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Status</div>
                            <Select
                              value={form.status}
                              onValueChange={v => setForm(s => ({ ...s, status: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LICENSE_STATUSES.map(s => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Start Date</div>
                            <Input
                              type="date"
                              value={form.start_date}
                              onChange={e => setForm(s => ({ ...s, start_date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">End Date</div>
                            <Input
                              type="date"
                              value={form.end_date}
                              onChange={e => setForm(s => ({ ...s, end_date: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <div className="text-xs text-muted-foreground">Notes</div>
                            <Textarea
                              value={form.notes}
                              onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
