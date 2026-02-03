import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Nsfw2257Custodian, Nsfw2257Record, NsfwVideoOption } from "@/lib/nsfwCompliance/types";
import { RECORD_STATUSES } from "@/lib/nsfwCompliance/constants";
import { createRecord, updateRecord } from "@/lib/nsfwCompliance/api";

type Props = {
  rows: Nsfw2257Record[];
  custodians: Nsfw2257Custodian[];
  videos: NsfwVideoOption[];
  loading: boolean;
  onRefresh: () => void;
};

type FormState = {
  record_key: string;
  content_id: string;
  custodian_id: string;
  production_date: string;
  release_date: string;
  record_location: string;
  record_storage_path: string;
  record_sha256: string;
  verification_status: string;
  verification_notes: string;
  last_verified_at: string;
};

function buildFormState(row?: Nsfw2257Record): FormState {
  return {
    record_key: row?.record_key ?? "",
    content_id: row?.content_id ?? "",
    custodian_id: row?.custodian_id ?? "",
    production_date: row?.production_date ?? "",
    release_date: row?.release_date ?? "",
    record_location: row?.record_location ?? "",
    record_storage_path: row?.record_storage_path ?? "",
    record_sha256: row?.record_sha256 ?? "",
    verification_status: row?.verification_status ?? "pending",
    verification_notes: row?.verification_notes ?? "",
    last_verified_at: row?.last_verified_at ?? "",
  };
}

export function RecordsManager({ rows, custodians, videos, loading, onRefresh }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Nsfw2257Record | null>(null);
  const [form, setForm] = useState<FormState>(buildFormState());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => row.record_key.toLowerCase().includes(q));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildFormState());
  };

  const openEdit = (row: Nsfw2257Record) => {
    setEditing(row);
    setForm(buildFormState(row));
  };

  const handleSave = async () => {
    if (!form.record_key.trim()) {
      toast.error("Record key required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        record_key: form.record_key.trim(),
        content_id: form.content_id || null,
        custodian_id: form.custodian_id || null,
        production_date: form.production_date || null,
        release_date: form.release_date || null,
        record_location: form.record_location || null,
        record_storage_path: form.record_storage_path || null,
        record_sha256: form.record_sha256 || null,
        verification_status: form.verification_status,
        verification_notes: form.verification_notes || null,
        last_verified_at: form.last_verified_at || null,
      };
      if (editing) {
        const ok = await updateRecord(editing.id, payload);
        if (!ok) throw new Error("Update failed");
      } else {
        const created = await createRecord(payload);
        if (!created) throw new Error("Create failed");
      }
      onRefresh();
      toast.success(editing ? "Record updated" : "Record created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const custodianMap = useMemo(() => {
    return new Map(custodians.map(c => [c.id, c.custodian_name]));
  }, [custodians]);

  const videoMap = useMemo(() => {
    return new Map(videos.map(v => [v.id, v.title]));
  }, [videos]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>2257 Records</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input placeholder="Search records" value={query} onChange={e => setQuery(e.target.value)} />
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add Record</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Record" : "New Record"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Record Key</div>
                  <Input
                    value={form.record_key}
                    onChange={e => setForm(s => ({ ...s, record_key: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Content</div>
                  <Select
                    value={form.content_id || "none"}
                    onValueChange={v => setForm(s => ({ ...s, content_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No content</SelectItem>
                      {videos.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Custodian</div>
                  <Select
                    value={form.custodian_id || "none"}
                    onValueChange={v => setForm(s => ({ ...s, custodian_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select custodian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No custodian</SelectItem>
                      {custodians.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.custodian_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Select
                    value={form.verification_status}
                    onValueChange={v => setForm(s => ({ ...s, verification_status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECORD_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Production Date</div>
                  <Input
                    type="date"
                    value={form.production_date}
                    onChange={e => setForm(s => ({ ...s, production_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Release Date</div>
                  <Input
                    type="date"
                    value={form.release_date}
                    onChange={e => setForm(s => ({ ...s, release_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Record Location</div>
                  <Textarea
                    value={form.record_location}
                    onChange={e => setForm(s => ({ ...s, record_location: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Record Storage Path</div>
                  <Input
                    value={form.record_storage_path}
                    onChange={e => setForm(s => ({ ...s, record_storage_path: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Record SHA256</div>
                  <Input
                    value={form.record_sha256}
                    onChange={e => setForm(s => ({ ...s, record_sha256: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Verification Notes</div>
                  <Textarea
                    value={form.verification_notes}
                    onChange={e => setForm(s => ({ ...s, verification_notes: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Last Verified At</div>
                  <Input
                    type="datetime-local"
                    value={form.last_verified_at}
                    onChange={e => setForm(s => ({ ...s, last_verified_at: e.target.value }))}
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
          <div className="text-sm text-muted-foreground">No records found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Custodian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.record_key}
                    <div className="text-xs text-muted-foreground">{row.id}</div>
                  </TableCell>
                  <TableCell>{row.content_id ? videoMap.get(row.content_id) || row.content_id : "—"}</TableCell>
                  <TableCell>
                    {row.custodian_id ? custodianMap.get(row.custodian_id) || row.custodian_id : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.verification_status === "verified" ? "secondary" : "outline"}>
                      {row.verification_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.production_date || "—"} → {row.release_date || "—"}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Edit Record</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Record Key</div>
                            <Input
                              value={form.record_key}
                              onChange={e => setForm(s => ({ ...s, record_key: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Status</div>
                            <Select
                              value={form.verification_status}
                              onValueChange={v => setForm(s => ({ ...s, verification_status: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {RECORD_STATUSES.map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <div className="text-xs text-muted-foreground">Verification Notes</div>
                            <Textarea
                              value={form.verification_notes}
                              onChange={e => setForm(s => ({ ...s, verification_notes: e.target.value }))}
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
