import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { formatBytes, getStorageUsage } from "@/lib/storageUtils";
import { HardDrive, Loader2 } from "lucide-react";

const STORAGE_LIMITS = {
  free: 1 * 1024 * 1024 * 1024,
  pro: 10 * 1024 * 1024 * 1024,
  premium: 50 * 1024 * 1024 * 1024,
} as const;

type Tier = keyof typeof STORAGE_LIMITS;

function resolveTier(role: unknown): Tier {
  const r = String(role || "").toLowerCase();
  // ADMIN BYPASS: Admin and super_admin get premium tier
  if (r.includes("super_admin") || r.includes("admin")) return "premium";
  if (r.includes("premium")) return "premium";
  if (r.includes("pro")) return "pro";
  return "free";
}

export const StorageUsage = (): JSX.Element => {
  const [usage, setUsage] = useState(0);
  const [tier, setTier] = useState<Tier>("free");
  const [loading, setLoading] = useState(true);

  const limit = STORAGE_LIMITS[tier];

  const usagePercent = useMemo(() => {
    if (!limit) return 0;
    return Math.max(0, Math.min(200, (usage / limit) * 100));
  }, [usage, limit]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: roleRow } = await fromExtended("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        setTier(resolveTier(roleRow?.role));

        const total = await getStorageUsage(user.id);
        setUsage(total);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const remaining = Math.max(0, limit - usage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5" />
          Storage Usage
          <Badge variant="secondary" className="ml-auto">
            {tier.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {formatBytes(usage)} / {formatBytes(limit)}
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{usagePercent.toFixed(1)}% used</span>
            <span>{formatBytes(remaining)} remaining</span>
          </div>
        </div>

        {usagePercent > 80 && usagePercent <= 100 && (
          <Badge variant="destructive" className="w-full justify-center">
            Storage almost full — consider upgrading
          </Badge>
        )}

        {usagePercent > 100 && (
          <Badge variant="destructive" className="w-full justify-center">
            Storage limit exceeded — please free up space
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
