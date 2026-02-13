import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createMeasurementTemplate,
  getMeasurementTemplates,
  type MeasurementTemplate,
} from "@/lib/advancedScannerFeatures";
import { Plus, Trash2 } from "lucide-react";

type TemplatePoint = {
  id: string;
  label: string;
  xNorm: number; // 0..1
  yNorm: number; // 0..1
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function newPoint(): TemplatePoint {
  return {
    id: `pt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label: "Point",
    xNorm: 0.5,
    yNorm: 0.5,
  };
}

export function TemplatesTab({ isActive }: { isActive: boolean }): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [points, setPoints] = useState<TemplatePoint[]>(() => [newPoint()]);

  const payload = useMemo(() => {
    return {
      version: 1,
      points: points.map(p => ({
        id: p.id,
        label: String(p.label || "").trim() || "Point",
        xNorm: clamp01(Number(p.xNorm)),
        yNorm: clamp01(Number(p.yNorm)),
      })),
    };
  }, [points]);

  const canCreate = name.trim().length > 0 && payload.points.length > 0 && !loading;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMeasurementTemplates(true);
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void refresh();
  }, [isActive, refresh]);

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setLoading(true);
    try {
      const created = await createMeasurementTemplate(
        name.trim(),
        payload,
        description.trim() || undefined,
        isDefault,
      );
      if (created) {
        toast.success("Template created");
        setTemplates(prev => [created, ...prev]);
        setName("");
        setDescription("");
        setIsDefault(false);
        setPoints([newPoint()]);
      }
    } catch {
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  }, [canCreate, description, isDefault, name, payload]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">New template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tmpl-name">Template name</Label>
            <Input
              id="tmpl-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Standard length + girth"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tmpl-desc">Description (optional)</Label>
            <Textarea
              id="tmpl-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What this template is for…"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Default</div>
              <div className="text-xs text-muted-foreground">
                Mark as default for new scans (best-effort).
              </div>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} disabled={loading} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Measurement points</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPoints(prev => [...prev, newPoint()])}
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {points.map((p, idx) => (
                <div key={p.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">Point {idx + 1}</Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPoints(prev => prev.filter(x => x.id !== p.id))}
                      disabled={loading || points.length <= 1}
                      aria-label="Remove point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    value={p.label}
                    onChange={e =>
                      setPoints(prev =>
                        prev.map(x => (x.id === p.id ? { ...x, label: e.target.value } : x)),
                      )
                    }
                    placeholder="Label"
                    disabled={loading}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground" htmlFor={`ptx-${p.id}`}>
                        X (0..1)
                      </Label>
                      <Input
                        id={`ptx-${p.id}`}
                        type="number"
                        value={p.xNorm}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={e =>
                          setPoints(prev =>
                            prev.map(x =>
                              x.id === p.id ? { ...x, xNorm: clamp01(Number(e.target.value)) } : x,
                            ),
                          )
                        }
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground" htmlFor={`pty-${p.id}`}>
                        Y (0..1)
                      </Label>
                      <Input
                        id={`pty-${p.id}`}
                        type="number"
                        value={p.yNorm}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={e =>
                          setPoints(prev =>
                            prev.map(x =>
                              x.id === p.id ? { ...x, yNorm: clamp01(Number(e.target.value)) } : x,
                            ),
                          )
                        }
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={() => void handleCreate()} disabled={!canCreate}>
            Create template
          </Button>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Payload preview (stored in DB)</div>
            <pre className="text-[11px] rounded-lg border bg-muted/20 p-3 overflow-x-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Templates</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates yet.</p>
          ) : (
            templates.map(t => (
              <Card key={t.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{t.template_name}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.is_default && <Badge variant="outline">Default</Badge>}
                        {t.is_shared && <Badge variant="outline">Shared</Badge>}
                        <Badge variant="secondary">Used {t.usage_count} times</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
