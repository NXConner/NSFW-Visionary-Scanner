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
import type {
  NsfwContentPerformer,
  NsfwPerformerRecord,
  NsfwVideoOption,
} from "@/lib/nsfwCompliance/types";
import { CONSENT_STATUSES, PERFORMER_ROLES } from "@/lib/nsfwCompliance/constants";
import { createContentPerformer, updateContentPerformer } from "@/lib/nsfwCompliance/api";

type Props = {
  rows: NsfwContentPerformer[];
  performers: NsfwPerformerRecord[];
  videos: NsfwVideoOption[];
  loading: boolean;
  onRefresh: () => void;
};

type FormState = {
  content_id: string;
  performer_id: string;
  role: string;
  consent_status: string;
  consent_signed_at: string;
  age_verified_at: string;
  release_form_path: string;
  notes: string;
};

function buildFormState(row?: NsfwContentPerformer): FormState {
  return {
    content_id: row?.content_id ?? "",
    performer_id: row?.performer_id ?? "",
    role: row?.role ?? "performer",
    consent_status: row?.consent_status ?? "pending",
    consent_signed_at: row?.consent_signed_at ?? "",
    age_verified_at: row?.age_verified_at ?? "",
    release_form_path: row?.release_form_path ?? "",
    notes: row?.notes ?? "",
  };
}

export function ContentPerformersManager({
  rows,
  performers,
  videos,
  loading,
  onRefresh,
}: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<NsfwContentPerformer | null>(null);
  const [form, setForm] = useState<FormState>(buildFormState());
  const [saving, setSaving] = useState(false);

  const performerMap = useMemo(() => {
    return new Map(performers.map(p => [p.id, p.stage_name]));
  }, [performers]);

  const videoMap = useMemo(() => {
    return new Map(videos.map(v => [v.id, v.title]));
  }, [videos]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => {
      const performer = performerMap.get(row.performer_id) || "";
      const video = videoMap.get(row.content_id) || "";
      return performer.toLowerCase().includes(q) || video.toLowerCase().includes(q);
    });
  }, [rows, query, performerMap, videoMap]);

  const openCreate = () => {
    setEditing(null);
    setForm(buildFormState());
  };

  const openEdit = (row: NsfwContentPerformer) => {
    setEditing(row);
    setForm(buildFormState(row));
  };

  const handleSave = async () => {
    if (!form.content_id || !form.performer_id) {
      toast.error("Content and performer required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        content_id: form.content_id,
        performer_id: form.performer_id,
        role: form.role,
        consent_status: form.consent_status,
        consent_signed_at: form.consent_signed_at || null,
        age_verified_at: form.age_verified_at || null,
        release_form_path: form.release_form_path || null,
        notes: form.notes || null,
      };
      if (editing) {
        const ok = await updateContentPerformer(editing.id, payload);
        if (!ok) throw new Error("Update failed");
      } else {
        const created = await createContentPerformer(payload);
        if (!created) throw new Error("Create failed");
      }
      onRefresh();
      toast.success(editing ? "Link updated" : "Link created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Content Performers</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input placeholder="Search links" value={query} onChange={e => setQuery(e.target.value)} />
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>Add Link</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Link" : "New Link"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
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
                      <SelectItem value="none">Select content</SelectItem>
                      {videos.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Performer</div>
                  <Select
                    value={form.performer_id || "none"}
                    onValueChange={v => setForm(s => ({ ...s, performer_id: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select performer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select performer</SelectItem>
                      {performers.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.stage_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Role</div>
                  <Select value={form.role} onValueChange={v => setForm(s => ({ ...s, role: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERFORMER_ROLES.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Consent Status</div>
                  <Select
                    value={form.consent_status}
                    onValueChange={v => setForm(s => ({ ...s, consent_status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONSENT_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <div className="text-xs text-muted-foreground">Age Verified At</div>
                  <Input
                    type="datetime-local"
                    value={form.age_verified_at}
                    onChange={e => setForm(s => ({ ...s, age_verified_at: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Release Form Path</div>
                  <Input
                    value={form.release_form_path}
                    onChange={e => setForm(s => ({ ...s, release_form_path: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
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
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No content performers found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Performer</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {videoMap.get(row.content_id) || row.content_id}
                  </TableCell>
                  <TableCell>{performerMap.get(row.performer_id) || row.performer_id}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    <Badge variant={row.consent_status === "verified" ? "secondary" : "outline"}>
                      {row.consent_status}
                    </Badge>
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
                          <DialogTitle>Edit Link</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Role</div>
                            <Select
                              value={form.role}
                              onValueChange={v => setForm(s => ({ ...s, role: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PERFORMER_ROLES.map(r => (
                                  <SelectItem key={r} value={r}>
                                    {r}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Consent Status</div>
                            <Select
                              value={form.consent_status}
                              onValueChange={v => setForm(s => ({ ...s, consent_status: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CONSENT_STATUSES.map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <div className="text-xs text-muted-foreground">Notes</div>
                            <Textarea
                              value={form.notes}
                              onChange={e => setForm(s => ({ ...s, notes: e.target.value }))}
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
