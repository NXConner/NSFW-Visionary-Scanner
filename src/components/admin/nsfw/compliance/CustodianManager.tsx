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
import type { Nsfw2257Custodian } from "@/lib/nsfwCompliance/types";
import { createCustodian, updateCustodian } from "@/lib/nsfwCompliance/api";

type Props = {
  rows: Nsfw2257Custodian[];
  loading: boolean;
  onRefresh: () => void;
};

type FormState = {
  custodian_name: string;
  custodian_company: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  record_location: string;
  is_active: boolean;
};

function buildFormState(row?: Nsfw2257Custodian): FormState {
  return {
    custodian_name: row?.custodian_name ?? "",
    custodian_company: row?.custodian_company ?? "",
    address_line1: row?.address_line1 ?? "",
    address_line2: row?.address_line2 ?? "",
    city: row?.city ?? "",
    state: row?.state ?? "",
    postal_code: row?.postal_code ?? "",
    country: row?.country ?? "",
    phone: row?.phone ?? "",
    email: row?.email ?? "",
    record_location: row?.record_location ?? "",
    is_active: row?.is_active ?? true,
  };
}

export function CustodianManager({ rows, loading, onRefresh }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Nsfw2257Custodian | null>(null);
  const [form, setForm] = useState<FormState>(buildFormState());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => row.custodian_name.toLowerCase().includes(q));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildFormState());
  };

  const openEdit = (row: Nsfw2257Custodian) => {
    setEditing(row);
    setForm(buildFormState(row));
  };

  const handleSave = async () => {
    if (!form.custodian_name.trim()) {
      toast.error("Custodian name required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        custodian_name: form.custodian_name.trim(),
        custodian_company: form.custodian_company || null,
        address_line1: form.address_line1 || null,
        address_line2: form.address_line2 || null,
        city: form.city || null,
        state: form.state || null,
        postal_code: form.postal_code || null,
        country: form.country || null,
        phone: form.phone || null,
        email: form.email || null,
        record_location: form.record_location || null,
        is_active: form.is_active,
      };
      if (editing) {
        const ok = await updateCustodian(editing.id, payload);
        if (!ok) throw new Error("Update failed");
      } else {
        const created = await createCustodian(payload);
        if (!created) throw new Error("Create failed");
      }
      onRefresh();
      toast.success(editing ? "Custodian updated" : "Custodian created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: Nsfw2257Custodian, next: boolean) => {
    const ok = await updateCustodian(row.id, { is_active: next });
    if (ok) {
      toast.success("Updated custodian");
      onRefresh();
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>2257 Custodians</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search custodians"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add Custodian</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Custodian" : "New Custodian"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Custodian Name</div>
                  <Input
                    value={form.custodian_name}
                    onChange={e => setForm(s => ({ ...s, custodian_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Company</div>
                  <Input
                    value={form.custodian_company}
                    onChange={e => setForm(s => ({ ...s, custodian_company: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Address Line 1</div>
                  <Input
                    value={form.address_line1}
                    onChange={e => setForm(s => ({ ...s, address_line1: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Address Line 2</div>
                  <Input
                    value={form.address_line2}
                    onChange={e => setForm(s => ({ ...s, address_line2: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">City</div>
                  <Input value={form.city} onChange={e => setForm(s => ({ ...s, city: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">State</div>
                  <Input value={form.state} onChange={e => setForm(s => ({ ...s, state: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Postal Code</div>
                  <Input
                    value={form.postal_code}
                    onChange={e => setForm(s => ({ ...s, postal_code: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Country</div>
                  <Input
                    value={form.country}
                    onChange={e => setForm(s => ({ ...s, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <Input value={form.phone} onChange={e => setForm(s => ({ ...s, phone: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <Input value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Record Location</div>
                  <Textarea
                    value={form.record_location}
                    onChange={e => setForm(s => ({ ...s, record_location: e.target.value }))}
                    rows={2}
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
          <div className="text-sm text-muted-foreground">No custodians found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Custodian</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Record Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.custodian_name}
                    <div className="text-xs text-muted-foreground">{row.custodian_company || "—"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">{row.email || "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.phone || ""}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.record_location || "—"}
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
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Edit Custodian</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Custodian Name</div>
                            <Input
                              value={form.custodian_name}
                              onChange={e => setForm(s => ({ ...s, custodian_name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Company</div>
                            <Input
                              value={form.custodian_company}
                              onChange={e => setForm(s => ({ ...s, custodian_company: e.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <div className="text-xs text-muted-foreground">Record Location</div>
                            <Textarea
                              value={form.record_location}
                              onChange={e => setForm(s => ({ ...s, record_location: e.target.value }))}
                              rows={2}
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
