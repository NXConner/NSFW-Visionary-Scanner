/**
 * API & Webhooks (Supabase-backed)
 *
 * - API keys are generated client-side, hashed, and stored in `api_keys`.
 * - Webhooks are stored in `webhooks` and verified/test-delivered via Edge Functions
 *   to avoid browser CORS and to enforce SSRF protections server-side.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Key,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  ShieldX,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createAPIKey,
  deleteWebhook,
  deliverTestWebhook,
  getAPIKeys,
  getWebhookDeliveries,
  getWebhooks,
  revokeAPIKey,
  rotateAPIKey,
  verifyWebhook,
  type APIKey as ApiKeyRow,
  type Webhook as WebhookRow,
  type WebhookDelivery,
} from "@/lib/apiWebhooks";
import { validateWebhookUrl } from "@/lib/urlValidation";

type ApiTier = "basic" | "pro" | "enterprise";

const WEBHOOK_EVENT_OPTIONS: Array<{ value: string; label: string; hint?: string }> = [
  { value: "scan.created", label: "Scan created" },
  { value: "scan.completed", label: "Scan completed" },
  { value: "measurement.created", label: "Measurement created" },
  { value: "health.updated", label: "Health updated" },
  { value: "achievement.unlocked", label: "Achievement unlocked" },
  { value: "medication.reminder", label: "Medication reminder" },
];

function timeAgo(iso: string | null | undefined): string {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return "";
  const delta = Date.now() - t;
  const mins = Math.floor(delta / 60000);
  if (mins <= 0) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function deliveryBadgeVariant(
  status: WebhookDelivery["delivery_status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "delivered") return "default";
  if (status === "failed") return "destructive";
  if (status === "retrying") return "secondary";
  return "outline";
}

export function APIWebhooks(): JSX.Element {
  const [activeTab, setActiveTab] = useState<"api-keys" | "webhooks">("api-keys");
  const [loading, setLoading] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);

  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyTier, setNewKeyTier] = useState<ApiTier>("basic");

  const [issuedKey, setIssuedKey] = useState<{
    title: string;
    apiKey: string;
    keyName: string;
    tier: ApiTier;
  } | null>(null);
  const [issuedKeyCopied, setIssuedKeyCopied] = useState(false);

  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);
  const [webhookUrlError, setWebhookUrlError] = useState<string | null>(null);

  const [expandedWebhookIds, setExpandedWebhookIds] = useState<Set<string>>(new Set());
  const [deliveriesByWebhook, setDeliveriesByWebhook] = useState<Record<string, WebhookDelivery[]>>(
    {},
  );
  const [loadingDeliveries, setLoadingDeliveries] = useState<Set<string>>(new Set());
  const [verifyingWebhookId, setVerifyingWebhookId] = useState<string | null>(null);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    const keys = await getAPIKeys();
    setApiKeys(keys);
  }, []);

  const loadWebhooks = useCallback(async () => {
    const hooks = await getWebhooks();
    setWebhooks(hooks);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "api-keys") {
        await loadKeys();
      } else {
        await loadWebhooks();
      }
    } catch (e) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadKeys, loadWebhooks]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleWebhookEvent = useCallback((event: string) => {
    setNewWebhookEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event],
    );
  }, []);

  const handleCreateAPIKey = useCallback(async () => {
    const name = newKeyName.trim();
    if (!name) {
      toast.error("Please enter a key name");
      return;
    }
    setLoading(true);
    try {
      const result = await createAPIKey(name, newKeyTier);
      if (!result) {
        toast.error("Failed to create API key");
        return;
      }
      setIssuedKey({
        title: "New API Key",
        apiKey: result.api_key,
        keyName: name,
        tier: newKeyTier,
      });
      setIssuedKeyCopied(false);
      setNewKeyName("");
      setShowNewKeyForm(false);
      await loadKeys();
    } catch (e) {
      toast.error("Failed to create API key");
    } finally {
      setLoading(false);
    }
  }, [loadKeys, newKeyName, newKeyTier]);

  const handleRotateKey = useCallback(
    async (keyId: string, label: string, tier: ApiTier) => {
      if (!confirm("Rotate this API key? The old key will stop working immediately.")) return;
      setRotatingKeyId(keyId);
      try {
        const result = await rotateAPIKey(keyId);
        if (!result) {
          toast.error("Failed to rotate API key");
          return;
        }
        setIssuedKey({
          title: "Rotated API Key",
          apiKey: result.api_key,
          keyName: label,
          tier,
        });
        setIssuedKeyCopied(false);
        await loadKeys();
        toast.success("API key rotated");
      } catch (e) {
        toast.error("Failed to rotate API key");
      } finally {
        setRotatingKeyId(null);
      }
    },
    [loadKeys],
  );

  const handleRevokeKey = useCallback(
    async (keyId: string) => {
      if (!confirm("Revoke this API key? This cannot be undone.")) return;
      setRevokingKeyId(keyId);
      try {
        await revokeAPIKey(keyId);
        await loadKeys();
        toast.success("API key revoked");
      } catch (e) {
        toast.error("Failed to revoke key");
      } finally {
        setRevokingKeyId(null);
      }
    },
    [loadKeys],
  );

  const handleWebhookUrlChange = useCallback((url: string) => {
    setNewWebhookUrl(url);
    if (!url.trim()) {
      setWebhookUrlError(null);
      return;
    }
    const validation = validateWebhookUrl(url);
    setWebhookUrlError(validation.isValid ? null : validation.error || "Invalid URL");
  }, []);

  const handleCreateWebhook = useCallback(async () => {
    const name = newWebhookName.trim();
    const url = newWebhookUrl.trim();
    if (!name || !url) {
      toast.error("Please fill in all fields");
      return;
    }

    const validation = validateWebhookUrl(url);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid webhook URL");
      setWebhookUrlError(validation.error || "Invalid webhook URL");
      return;
    }

    if (newWebhookEvents.length === 0) {
      toast.error("Select at least one event");
      return;
    }

    setLoading(true);
    try {
      const webhook = await createWebhook(name, url, newWebhookEvents);
      if (!webhook) {
        toast.error("Failed to create webhook");
        return;
      }
      setNewWebhookName("");
      setNewWebhookUrl("");
      setNewWebhookEvents([]);
      setWebhookUrlError(null);
      setShowNewWebhookForm(false);
      await loadWebhooks();
      toast.success("Webhook created");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create webhook";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [loadWebhooks, newWebhookEvents, newWebhookName, newWebhookUrl]);

  const loadDeliveries = useCallback(async (webhookId: string) => {
    setLoadingDeliveries(prev => new Set(prev).add(webhookId));
    try {
      const deliveries = await getWebhookDeliveries({ webhookId, limit: 10 });
      setDeliveriesByWebhook(prev => ({ ...prev, [webhookId]: deliveries }));
    } catch (e) {
      toast.error("Failed to load deliveries");
    } finally {
      setLoadingDeliveries(prev => {
        const next = new Set(prev);
        next.delete(webhookId);
        return next;
      });
    }
  }, []);

  const toggleExpanded = useCallback(
    async (webhookId: string) => {
      setExpandedWebhookIds(prev => {
        const next = new Set(prev);
        if (next.has(webhookId)) next.delete(webhookId);
        else next.add(webhookId);
        return next;
      });
      // Best-effort: load deliveries the first time expanding.
      const already = deliveriesByWebhook[webhookId];
      if (!already) await loadDeliveries(webhookId);
    },
    [deliveriesByWebhook, loadDeliveries],
  );

  const handleVerifyWebhook = useCallback(
    async (webhookId: string) => {
      setVerifyingWebhookId(webhookId);
      try {
        await verifyWebhook(webhookId);
        toast.success("Verification request sent");
        await loadWebhooks();
        await loadDeliveries(webhookId);
      } catch (e) {
        toast.error("Webhook verification failed");
      } finally {
        setVerifyingWebhookId(null);
      }
    },
    [loadDeliveries, loadWebhooks],
  );

  const handleTestWebhook = useCallback(
    async (webhookId: string) => {
      setTestingWebhookId(webhookId);
      try {
        const ok = await deliverTestWebhook(webhookId);
        if (ok) toast.success("Test webhook delivered");
        else toast.error("Test webhook failed");
        await loadWebhooks();
        await loadDeliveries(webhookId);
      } catch (e) {
        toast.error("Test webhook failed");
      } finally {
        setTestingWebhookId(null);
      }
    },
    [loadDeliveries, loadWebhooks],
  );

  const handleDeleteWebhook = useCallback(
    async (webhookId: string) => {
      if (!confirm("Delete this webhook?")) return;
      setDeletingWebhookId(webhookId);
      try {
        await deleteWebhook(webhookId);
        toast.success("Webhook deleted");
        await loadWebhooks();
      } catch (e) {
        toast.error("Failed to delete webhook");
      } finally {
        setDeletingWebhookId(null);
      }
    },
    [loadWebhooks],
  );

  const issuedKeyLabel = useMemo(() => {
    if (!issuedKey) return "";
    return `${issuedKey.keyName} (${issuedKey.tier})`;
  }, [issuedKey]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-6 h-6" />
            API & Webhooks
          </CardTitle>
          <CardDescription>Manage API keys, webhooks, and delivery verification</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
            <div className="flex items-center justify-between gap-2">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="api-keys">API Keys</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <TabsContent value="api-keys" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">API Keys</h3>
                <Button size="sm" onClick={() => setShowNewKeyForm(v => !v)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </div>

              {showNewKeyForm && (
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Key Name</Label>
                      <Input
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="My API Key"
                      />
                    </div>
                    <div>
                      <Label>Access Tier</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md bg-background"
                        value={newKeyTier}
                        onChange={e => setNewKeyTier(e.target.value as ApiTier)}
                      >
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void handleCreateAPIKey()}
                        className="flex-1"
                        disabled={loading}
                      >
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewKeyForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {apiKeys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No API keys yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map(k => (
                    <Card key={k.id} className="glass-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <h4 className="font-semibold">{k.key_name}</h4>
                              <Badge variant="secondary">{k.access_tier}</Badge>
                              {k.is_active ? (
                                <Badge>Active</Badge>
                              ) : (
                                <Badge variant="outline">Revoked</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Prefix: <span className="font-mono">{k.api_key_prefix}</span>… • Rate:{" "}
                              {k.rate_limit_per_minute}/min
                              {k.last_used_at ? ` • last used ${timeAgo(k.last_used_at)}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {k.is_active && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    void handleRotateKey(k.id, k.key_name, k.access_tier as ApiTier)
                                  }
                                  disabled={rotatingKeyId === k.id}
                                >
                                  {rotatingKeyId === k.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RefreshCw className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void handleRevokeKey(k.id)}
                                  disabled={revokingKeyId === k.id}
                                >
                                  {revokingKeyId === k.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Webhooks</h3>
                <Button size="sm" onClick={() => setShowNewWebhookForm(v => !v)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Webhook
                </Button>
              </div>

              {showNewWebhookForm && (
                <Card className="glass-card border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Webhook Name</Label>
                      <Input
                        value={newWebhookName}
                        onChange={e => setNewWebhookName(e.target.value)}
                        placeholder="My Webhook"
                      />
                    </div>
                    <div>
                      <Label>Webhook URL</Label>
                      <Input
                        value={newWebhookUrl}
                        onChange={e => handleWebhookUrlChange(e.target.value)}
                        placeholder="https://your-domain.tld/webhooks/morphoscan"
                        className={webhookUrlError ? "border-destructive" : ""}
                      />
                      {webhookUrlError && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {webhookUrlError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Events</Label>
                      <div className="flex flex-wrap gap-2">
                        {WEBHOOK_EVENT_OPTIONS.map(opt => {
                          const selected = newWebhookEvents.includes(opt.value);
                          return (
                            <Button
                              key={opt.value}
                              type="button"
                              size="sm"
                              variant={selected ? "default" : "outline"}
                              onClick={() => toggleWebhookEvent(opt.value)}
                            >
                              {opt.label}
                            </Button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Webhooks must be verified before you rely on them in production.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => void handleCreateWebhook()}
                        className="flex-1"
                        disabled={loading}
                      >
                        Create
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewWebhookForm(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {webhooks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No webhooks yet. Create one to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {webhooks.map(w => {
                    const expanded = expandedWebhookIds.has(w.id);
                    const deliveries = deliveriesByWebhook[w.id] ?? null;
                    const deliveriesLoading = loadingDeliveries.has(w.id);
                    const verified = Boolean(w.is_verified);

                    return (
                      <Card key={w.id} className="glass-card border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <h4 className="font-semibold">{w.webhook_name}</h4>
                                {w.is_active ? (
                                  <Badge>Active</Badge>
                                ) : (
                                  <Badge variant="outline">Inactive</Badge>
                                )}
                                {verified ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="gap-1">
                                    <ShieldX className="w-3.5 h-3.5" />
                                    Not verified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {w.webhook_url}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Events:{" "}
                                {w.subscribed_events?.length ? w.subscribed_events.join(", ") : "—"}
                              </p>
                              {(w.total_deliveries ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Deliveries: {w.successful_deliveries ?? 0} ok •{" "}
                                  {w.failed_deliveries ?? 0} failed • last{" "}
                                  {timeAgo(w.last_delivery_at)}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleVerifyWebhook(w.id)}
                                disabled={verifyingWebhookId === w.id}
                                title="Verify webhook"
                              >
                                {verifyingWebhookId === w.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleTestWebhook(w.id)}
                                disabled={testingWebhookId === w.id}
                                title="Send test event"
                              >
                                {testingWebhookId === w.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void toggleExpanded(w.id)}
                                title={expanded ? "Hide deliveries" : "Show deliveries"}
                              >
                                {expanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => void handleDeleteWebhook(w.id)}
                                disabled={deletingWebhookId === w.id}
                                title="Delete webhook"
                              >
                                {deletingWebhookId === w.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {expanded && (
                            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-sm font-medium">Recent deliveries</div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => void loadDeliveries(w.id)}
                                  disabled={deliveriesLoading}
                                >
                                  <RefreshCw
                                    className={`w-4 h-4 ${deliveriesLoading ? "animate-spin" : ""}`}
                                  />
                                </Button>
                              </div>

                              {deliveriesLoading && !deliveries ? (
                                <div className="text-sm text-muted-foreground">Loading…</div>
                              ) : !deliveries || deliveries.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                  No deliveries yet.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {deliveries.map(d => (
                                    <div
                                      key={d.id}
                                      className="flex items-start justify-between gap-3 rounded-md bg-background/40 p-2"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <Badge variant={deliveryBadgeVariant(d.delivery_status)}>
                                            {d.delivery_status}
                                          </Badge>
                                          <span className="text-sm font-medium truncate">
                                            {d.event_type}
                                          </span>
                                        </div>
                                        {d.response_body ? (
                                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {d.response_body}
                                          </p>
                                        ) : null}
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="text-xs text-muted-foreground">
                                          {typeof d.http_status_code === "number"
                                            ? `HTTP ${d.http_status_code}`
                                            : "—"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {timeAgo(d.attempted_at)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={Boolean(issuedKey)} onOpenChange={open => (!open ? setIssuedKey(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{issuedKey?.title ?? "API Key"}</DialogTitle>
            <DialogDescription>
              Copy and store this API key securely. For security, it will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Key</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={issuedKey?.apiKey ?? ""} className="font-mono" />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!issuedKey?.apiKey) return;
                  await navigator.clipboard.writeText(issuedKey.apiKey);
                  setIssuedKeyCopied(true);
                  setTimeout(() => setIssuedKeyCopied(false), 1500);
                  toast.success("Copied");
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {issuedKeyCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Label: {issuedKeyLabel}</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setIssuedKey(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
