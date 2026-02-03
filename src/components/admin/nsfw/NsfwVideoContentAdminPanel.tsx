import { useCallback, useEffect, useMemo, useState } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type VideoRow = {
  id: string;
  title: string;
  category: string;
  difficulty_level: string | null;
  is_approved: boolean;
  is_active: boolean;
  is_featured: boolean;
  is_premium: boolean;
  view_count: number;
  license_status: string | null;
  compliance_status: string | null;
  license_id: string | null;
  updated_at: string | null;
};

export function NsfwVideoContentAdminPanel(): JSX.Element {
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await fromExtended("nsfw_video_content")
        .select(
          "id,title,category,difficulty_level,is_approved,is_active,is_featured,is_premium,view_count,license_status,compliance_status,license_id,updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw new Error(error.message);
      setRows((data || []) as VideoRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(row => row.title.toLowerCase().includes(q));
  }, [query, rows]);

  const updateRow = async (id: string, patch: Partial<VideoRow>) => {
    try {
      const { error } = await fromExtended("nsfw_video_content")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
      toast.success("Updated video");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>NSFW Video Library</CardTitle>
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input
            placeholder="Search by title"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No videos found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Premium</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.title}
                    <div className="text-xs text-muted-foreground">{row.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.category}</Badge>
                  </TableCell>
                  <TableCell>{row.difficulty_level ?? "n/a"}</TableCell>
                  <TableCell>{row.view_count ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={row.license_status === "verified" ? "secondary" : "outline"}>
                      {row.license_status || "unknown"}
                    </Badge>
                    {row.license_id ? (
                      <div className="text-xs text-muted-foreground">{row.license_id}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.compliance_status === "verified" ? "secondary" : "outline"}>
                      {row.compliance_status || "n/a"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_approved}
                      onCheckedChange={v => void updateRow(row.id, { is_approved: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={v => void updateRow(row.id, { is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_featured}
                      onCheckedChange={v => void updateRow(row.id, { is_featured: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_premium}
                      onCheckedChange={v => void updateRow(row.id, { is_premium: v })}
                    />
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
