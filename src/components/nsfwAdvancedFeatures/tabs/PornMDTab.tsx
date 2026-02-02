import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  enablePornMDIntegration,
  getPornMDIntegration,
  type PornMDIntegration,
} from "@/lib/nsfwAdvancedFeatures";

export function PornMDTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [integration, setIntegration] = useState<PornMDIntegration | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const next = await getPornMDIntegration();
      setIntegration(next);
    } catch {
      toast.error("Failed to load PornMD integration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void load();
  }, [isActive, load]);

  const handleEnable = useCallback(async () => {
    if (!apiKey || !apiSecret) {
      toast.error("Please enter API credentials");
      return;
    }

    setLoading(true);
    try {
      const next = await enablePornMDIntegration(apiKey, apiSecret, {});
      if (next) {
        setIntegration(next);
        setApiKey("");
        setApiSecret("");
      }
    } catch {
      toast.error("Failed to enable integration");
    } finally {
      setLoading(false);
    }
  }, [apiKey, apiSecret]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>PornMD.com Integration</CardTitle>
        <CardDescription>
          Connect with PornMD for enhanced content discovery and potential partnership opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : integration?.is_enabled ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">PornMD Integration</p>
                <p className="text-sm text-muted-foreground">Status: Active</p>
                {integration.is_partner && (
                  <Badge variant="default" className="mt-2">
                    Partner: {integration.partner_tier}
                  </Badge>
                )}
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pornmd-api-key">API Key</Label>
              <Input
                id="pornmd-api-key"
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter PornMD API Key"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="pornmd-api-secret">API Secret</Label>
              <Input
                id="pornmd-api-secret"
                type="password"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                placeholder="Enter PornMD API Secret"
                autoComplete="off"
              />
            </div>
            <Button onClick={handleEnable} className="w-full" disabled={loading}>
              Enable PornMD Integration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
