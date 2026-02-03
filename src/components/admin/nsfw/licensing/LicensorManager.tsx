import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ContentLicensor } from "@/lib/nsfwLicensing/types";
import { createLicensor, updateLicensor } from "@/lib/nsfwLicensing/api";

type Props = {
  rows: ContentLicensor[];
  loading: boolean;
  onRefresh: () => void;
};

type LicensorFormState = {
  name: string;
  website_url: string;
  contact_name: string;
  contact_email: string;
  jurisdiction: string;
  notes: string;
  is_active: boolean;
};

function buildFormState(row?: ContentLicensor): LicensorFormState {
  return {
    name: row?.name ?? "",
    website_url: row?.website_url ?? "",
    contact_name: row?.contact_name ?? "",
    contact_email: row?.contact_email ?? "",
    jurisdiction: row?.jurisdiction ?? "",
    notes: row?.notes ?? "",
    is_active: row?.is_active ?? true,
  };
}

export function LicensorManager({ rows, loading, onRefresh }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ContentLicensor | null>(null);
  const [form, setForm] = useState<LicensorFormState>(buildFormState());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => row.name.toLowerCase().includes(q));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildFormState());
  };

  const openEdit = (row: ContentLicensor) => {
    setEditing(row);
    setForm(buildFormState(row));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Licensor name required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const ok = await updateLicensor(editing.id, {
          name: form.name.trim(),
          website_url: form.website_url || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          jurisdiction: form.jurisdiction || null,
          notes: form.notes || null,
          is_active: form.is_active,
        });
        if (!ok) throw new Error("Update failed");
      } else {
        const created = await createLicensor({
          name: form.name.trim(),
          website_url: form.website_url || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          jurisdiction: form.jurisdiction || null,
          notes: form.notes || null,
          is_active: form.is_active,
        });
        if (!created) throw new Error("Create failed");
      }
      onRefresh();
      toast.success(editing ? "Licensor updated" : "Licensor created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: ContentLicensor, next: boolean) => {
    const ok = await updateLicensor(row.id, { is_active: next });
    if (ok) {
      toast.success("Updated licensor");
      onRefresh();
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Content Licensors</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search licensors"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add Licensor</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Licensor" : "New Licensor"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Name</div>
                  <Input
                    value={form.name}
                    onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Website</div>
                  <Input
                    value={form.website_url}
                    onChange={e => setForm(s => ({ ...s, website_url: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Contact Name</div>
                  <Input
                    value={form.contact_name}
                    onChange={e => setForm(s => ({ ...s, contact_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Contact Email</div>
                  <Input
                    value={form.contact_email}
                    onChange={e => setForm(s => ({ ...s, contact_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Jurisdiction</div>
                  <Input
                    value={form.jurisdiction}
                    onChange={e => setForm(s => ({ ...s, jurisdiction: e.target.value }))}
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
                <div className="sm:col-span-2 space-y-1">
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
          <div className="text-sm text-muted-foreground">No licensors found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Licensor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Jurisdiction</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.name}
                    {row.website_url ? (
                      <div className="text-xs text-muted-foreground">{row.website_url}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div>{row.contact_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.contact_email || ""}</div>
                  </TableCell>
                  <TableCell>{row.jurisdiction || "—"}</TableCell>
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
                      <DialogContent className="sm:max-w-[640px]">
                        <DialogHeader>
                          <DialogTitle>Edit Licensor</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Name</div>
                            <Input
                              value={form.name}
                              onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Website</div>
                            <Input
                              value={form.website_url}
                              onChange={e => setForm(s => ({ ...s, website_url: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Contact Name</div>
                            <Input
                              value={form.contact_name}
                              onChange={e => setForm(s => ({ ...s, contact_name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Contact Email</div>
                            <Input
                              value={form.contact_email}
                              onChange={e => setForm(s => ({ ...s, contact_email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Jurisdiction</div>
                            <Input
                              value={form.jurisdiction}
                              onChange={e => setForm(s => ({ ...s, jurisdiction: e.target.value }))}
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
                          <div className="sm:col-span-2 space-y-1">
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
