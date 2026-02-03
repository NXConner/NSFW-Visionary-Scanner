import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { NsfwPerformerRecord } from "@/lib/nsfwCompliance/types";
import { createPerformer, updatePerformer } from "@/lib/nsfwCompliance/api";

type Props = {
  rows: NsfwPerformerRecord[];
  loading: boolean;
  onRefresh: () => void;
};

type FormState = {
  stage_name: string;
  legal_name: string;
  date_of_birth: string;
  document_type: string;
  document_last4: string;
  document_issuer: string;
  document_expiration: string;
  document_storage_path: string;
  document_sha256: string;
  consent_form_path: string;
  consent_signed_at: string;
  verified_at: string;
  is_active: boolean;
  notes: string;
};

function buildFormState(row?: NsfwPerformerRecord): FormState {
  return {
    stage_name: row?.stage_name ?? "",
    legal_name: row?.legal_name ?? "",
    date_of_birth: row?.date_of_birth ?? "",
    document_type: row?.document_type ?? "",
    document_last4: row?.document_last4 ?? "",
    document_issuer: row?.document_issuer ?? "",
    document_expiration: row?.document_expiration ?? "",
    document_storage_path: row?.document_storage_path ?? "",
    document_sha256: row?.document_sha256 ?? "",
    consent_form_path: row?.consent_form_path ?? "",
    consent_signed_at: row?.consent_signed_at ?? "",
    verified_at: row?.verified_at ?? "",
    is_active: row?.is_active ?? true,
    notes: row?.notes ?? "",
  };
}

export function PerformerManager({ rows, loading, onRefresh }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<NsfwPerformerRecord | null>(null);
  const [form, setForm] = useState<FormState>(buildFormState());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      row =>
        row.stage_name.toLowerCase().includes(q) || row.legal_name.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildFormState());
  };

  const openEdit = (row: NsfwPerformerRecord) => {
    setEditing(row);
    setForm(buildFormState(row));
  };

  const handleSave = async () => {
    if (!form.stage_name.trim() || !form.legal_name.trim() || !form.date_of_birth) {
      toast.error("Stage name, legal name, and date of birth required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        stage_name: form.stage_name.trim(),
        legal_name: form.legal_name.trim(),
        date_of_birth: form.date_of_birth,
        document_type: form.document_type || null,
        document_last4: form.document_last4 || null,
        document_issuer: form.document_issuer || null,
        document_expiration: form.document_expiration || null,
        document_storage_path: form.document_storage_path || null,
        document_sha256: form.document_sha256 || null,
        consent_form_path: form.consent_form_path || null,
        consent_signed_at: form.consent_signed_at || null,
        verified_at: form.verified_at || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };
      if (editing) {
        const ok = await updatePerformer(editing.id, payload);
        if (!ok) throw new Error("Update failed");
      } else {
        const created = await createPerformer(payload);
        if (!created) throw new Error("Create failed");
      }
      onRefresh();
      toast.success(editing ? "Performer updated" : "Performer created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: NsfwPerformerRecord, next: boolean) => {
    const ok = await updatePerformer(row.id, { is_active: next });
    if (ok) {
      toast.success("Updated performer");
      onRefresh();
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Performer Records</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search performers"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add Performer</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Performer" : "New Performer"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Stage Name</div>
                  <Input
                    value={form.stage_name}
                    onChange={e => setForm(s => ({ ...s, stage_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Legal Name</div>
                  <Input
                    value={form.legal_name}
                    onChange={e => setForm(s => ({ ...s, legal_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Date of Birth</div>
                  <Input
                    type="date"
                    value={form.date_of_birth}
                    onChange={e => setForm(s => ({ ...s, date_of_birth: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Document Type</div>
                  <Input
                    value={form.document_type}
                    onChange={e => setForm(s => ({ ...s, document_type: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Document Last 4</div>
                  <Input
                    value={form.document_last4}
                    onChange={e => setForm(s => ({ ...s, document_last4: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Document Issuer</div>
                  <Input
                    value={form.document_issuer}
                    onChange={e => setForm(s => ({ ...s, document_issuer: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Document Expiration</div>
                  <Input
                    type="date"
                    value={form.document_expiration}
                    onChange={e => setForm(s => ({ ...s, document_expiration: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Document Storage Path</div>
                  <Input
                    value={form.document_storage_path}
                    onChange={e => setForm(s => ({ ...s, document_storage_path: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Document SHA256</div>
                  <Input
                    value={form.document_sha256}
                    onChange={e => setForm(s => ({ ...s, document_sha256: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Consent Form Path</div>
                  <Input
                    value={form.consent_form_path}
                    onChange={e => setForm(s => ({ ...s, consent_form_path: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Consent Signed At</div>
                  <Input
                    type="datetime-local"
                    value={form.consent_signed_at}
                    onChange={e => setForm(s => ({ ...s, consent_signed_at: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Verified At</div>
                  <Input
                    type="datetime-local"
                    value={form.verified_at}
                    onChange={e => setForm(s => ({ ...s, verified_at: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
                    rows={3}
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
          <div className="text-sm text-muted-foreground">No performers found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Performer</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.stage_name}
                    <div className="text-xs text-muted-foreground">{row.legal_name}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.document_type || "—"} {row.document_last4 ? `• ****${row.document_last4}` : ""}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.verified_at ? new Date(row.verified_at).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.is_active ? "secondary" : "outline"}>
                      {row.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Switch checked={row.is_active} onCheckedChange={v => void toggleActive(row, v)} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Edit Performer</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Stage Name</div>
                            <Input
                              value={form.stage_name}
                              onChange={e => setForm(s => ({ ...s, stage_name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Legal Name</div>
                            <Input
                              value={form.legal_name}
                              onChange={e => setForm(s => ({ ...s, legal_name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Date of Birth</div>
                            <Input
                              type="date"
                              value={form.date_of_birth}
                              onChange={e => setForm(s => ({ ...s, date_of_birth: e.target.value }))}
                            />
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
