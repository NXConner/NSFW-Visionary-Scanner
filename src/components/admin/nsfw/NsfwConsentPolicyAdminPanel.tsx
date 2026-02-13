import { useCallback, useEffect, useState } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type PolicyRow = {
  policy_key: string;
  version: string;
  title: string;
  summary: string | null;
  is_active: boolean;
  required_for_features: string[];
};

export function NsfwConsentPolicyAdminPanel(): JSX.Element {
  const [rows, setRows] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await fromExtended("nsfw_consent_policies")
        .select("policy_key,version,title,summary,is_active,required_for_features")
        .order("policy_key", { ascending: true });
      if (error) throw new Error(error.message);
      setRows((data || []) as PolicyRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load consent policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updatePolicy = async (policyKey: string, patch: Partial<PolicyRow>) => {
    try {
      const { error } = await fromExtended("nsfw_consent_policies")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("policy_key", policyKey);
      if (error) throw new Error(error.message);
      setRows(prev => prev.map(p => (p.policy_key === policyKey ? { ...p, ...patch } : p)));
      toast.success("Updated consent policy");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>Consent Policies</CardTitle>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No policies found.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.policy_key}>
                  <TableCell>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">{row.policy_key}</div>
                    {row.summary ? (
                      <div className="text-xs text-muted-foreground mt-1">{row.summary}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.version}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.required_for_features.map(feature => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={v => void updatePolicy(row.policy_key, { is_active: v })}
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
