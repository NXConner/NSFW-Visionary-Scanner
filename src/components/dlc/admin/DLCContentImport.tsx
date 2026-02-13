import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getSignedUploadTarget, uploadViaSignedUrl } from "@/components/dlc/admin/signedUpload";
import { buildPositionsImportCatalog } from "@/lib/positions/adminImport";

type ImportType = "positions" | "videos" | "topics";

type ImportResult = {
  jobId: string;
  dryRun: boolean;
  summary: { completed: number; failed: number; skipped: number; itemCount: number };
  results: Array<{ key: string; status: string; error?: string }>;
};

function parseCsv(text: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field);
        field = "";
      } else if (ch === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        field += ch;
      }
    }
  }
  cur.push(field);
  rows.push(cur);

  const header = (rows.shift() || []).map(h => h.trim());
  const out: Array<Record<string, string>> = [];
  for (const r of rows) {
    if (r.every(c => !String(c || "").trim())) continue;
    const obj: Record<string, string> = {};
    for (let i = 0; i < header.length; i++) {
      const key = header[i] || "";
      if (!key) continue;
      obj[key] = String(r[i] ?? "").trim();
    }
    out.push(obj);
  }
  return out;
}

function splitPipeList(v: string): string[] {
  return String(v || "")
    .split("|")
    .map(x => x.trim())
    .filter(Boolean);
}

function toBool(v: string): boolean {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

export function DLCContentImport(): React.ReactElement {
  const [tab, setTab] = useState<ImportType>("positions");
  const [file, setFile] = useState<File | null>(null);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [uploadAssets, setUploadAssets] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [autoPositionsMeta, setAutoPositionsMeta] = useState<{
    sources: string[];
    itemCount: number;
    computedAtIso: string;
  } | null>(null);
  const [topicsPackageId, setTopicsPackageId] = useState<
    | "dlc-topic-power-dynamics"
    | "dlc-topic-tantric"
    | "dlc-topic-kama-sutra"
    | "dlc-topic-roleplay"
    | "dlc-topic-male-pleasure"
  >("dlc-topic-power-dynamics");

  const accept = useMemo(() => ".json,.csv", []);

  const assetsByName = useMemo(() => {
    const map = new Map<string, File>();
    for (const f of assetFiles) map.set(f.name, f);
    return map;
  }, [assetFiles]);

  const packageIdForImport = (t: ImportType): string => {
    if (t === "videos") return "dlc-videos";
    if (t === "topics") return topicsPackageId;
    return "dlc-positions";
  };

  const sanitizeName = (value: string): string =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80);

  const buildAssetPath = (importType: ImportType, slugOrKey: string, fileName: string): string => {
    const pkg = packageIdForImport(importType);
    const key = sanitizeName(slugOrKey) || "item";
    const safeFile = String(fileName || "asset.bin")
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .slice(0, 128);
    return `${pkg}/${importType}/${key}/${Date.now()}-${safeFile}`;
  };

  const maybeUploadAsset = async (params: {
    importType: ImportType;
    key: string;
    fileName: string | null | undefined;
  }): Promise<string | null> => {
    const fileName = String(params.fileName || "").trim();
    if (!fileName) return null;
    const f = assetsByName.get(fileName);
    if (!f) return null;
    const assetPath = buildAssetPath(params.importType, params.key, f.name);
    const pkg = packageIdForImport(params.importType);
    const target = await getSignedUploadTarget({ packageId: pkg, assetPath });
    await uploadViaSignedUrl({ target, file: f });
    return assetPath;
  };

  const runImport = async () => {
    if (!file) {
      toast.error("Select a .json or .csv file");
      return;
    }

    setBusy(true);
    setLastResult(null);

    try {
      const text = await file.text();
      let payload: any;

      if (file.name.toLowerCase().endsWith(".json")) {
        payload = JSON.parse(text);
        // Allow either raw {items:[...]} or full shape.
        if (!payload.importType) payload.importType = tab;
      } else {
        const rows = parseCsv(text);
        if (tab === "positions") {
          const items = rows.map(r => ({
            position_slug: r.position_slug,
            position_name: r.position_name,
            description: r.description,
            detailed_instructions: r.detailed_instructions || null,
            category: r.category,
            difficulty_level: (r.difficulty_level as any) || null,
            intimacy_level: (r.intimacy_level as any) || null,
            required_flexibility: (r.required_flexibility as any) || null,
            tags: splitPipeList(r.tags),
            benefits: splitPipeList(r.benefits),
            tips: splitPipeList(r.tips),
            image_url: r.image_url || null,
            image_url_illustrated: r.image_url_illustrated || null,
            thumbnail_url: r.thumbnail_url || null,
            video_tutorial_url: r.video_tutorial_url || null,
            animation_url: r.animation_url || null,
            // optional local file references (uploaded before import when enabled)
            image_file: r.image_file || null,
            image_illustrated_file: r.image_illustrated_file || null,
            thumbnail_file: r.thumbnail_file || null,
            video_tutorial_file: r.video_tutorial_file || null,
            animation_file: r.animation_file || null,
            sort_order: r.sort_order ? Number(r.sort_order) : 0,
            is_premium: toBool(r.is_premium),
            requires_dlc: toBool(r.requires_dlc),
            is_active: r.is_active ? toBool(r.is_active) : true,
          }));
          payload = { importType: "positions", items };
        } else if (tab === "videos") {
          const items = rows.map(r => ({
            content_slug: r.content_slug || null,
            source_import_key: r.source_import_key || null,
            title: r.title,
            description: r.description,
            category: r.category,
            video_url_sd: r.video_url_sd || null,
            video_url_hd: r.video_url_hd || null,
            video_url_4k: r.video_url_4k || null,
            thumbnail_url: r.thumbnail_url || null,
            preview_gif_url: r.preview_gif_url || null,
            // optional local file references
            video_sd_file: r.video_sd_file || null,
            video_hd_file: r.video_hd_file || null,
            video_4k_file: r.video_4k_file || null,
            thumbnail_file: r.thumbnail_file || null,
            preview_gif_file: r.preview_gif_file || null,
            tags: splitPipeList(r.tags),
            difficulty_level: (r.difficulty_level as any) || null,
            content_rating: (r.content_rating as any) || null,
            expert_name: r.expert_name || null,
            expert_credentials: r.expert_credentials || null,
            key_points: splitPipeList(r.key_points),
            warnings: splitPipeList(r.warnings),
            prerequisites: splitPipeList(r.prerequisites),
            is_premium: toBool(r.is_premium),
            is_featured: toBool(r.is_featured),
            requires_dlc: toBool(r.requires_dlc),
            dlc_pack_id: r.dlc_pack_id || null,
            is_approved: toBool(r.is_approved),
            is_active: r.is_active ? toBool(r.is_active) : true,
          }));
          payload = { importType: "videos", items };
        } else {
          const items = rows.map(r => ({
            topic_id: r.topic_id,
            title: r.title,
            summary: r.summary || null,
            body: r.body || null,
            resources: (() => {
              const raw = String(r.resources || "").trim();
              if (!raw) return [];
              try {
                return JSON.parse(raw);
              } catch {
                return [];
              }
            })(),
            tags: splitPipeList(r.tags),
            content_rating: (r.content_rating as any) || "educational",
            source_import_key: r.source_import_key || null,
            requires_feature_id: r.requires_feature_id || null,
            requires_dlc: r.requires_dlc ? toBool(r.requires_dlc) : true,
            is_active: r.is_active ? toBool(r.is_active) : true,
          }));
          payload = { importType: "topics", items };
        }
      }

      // Optional asset upload pass (converts *_file fields into storage paths)
      if (
        !dryRun &&
        uploadAssets &&
        assetFiles.length > 0 &&
        payload?.items &&
        Array.isArray(payload.items)
      ) {
        if (payload.importType === "positions") {
          for (const it of payload.items) {
            const key = String(it.position_slug || it.position_name || "").trim() || "position";
            const image = await maybeUploadAsset({
              importType: "positions",
              key,
              fileName: it.image_file,
            });
            if (image) it.image_url = image;
            const ill = await maybeUploadAsset({
              importType: "positions",
              key,
              fileName: it.image_illustrated_file,
            });
            if (ill) it.image_url_illustrated = ill;
            const thumb = await maybeUploadAsset({
              importType: "positions",
              key,
              fileName: it.thumbnail_file,
            });
            if (thumb) it.thumbnail_url = thumb;
            const vid = await maybeUploadAsset({
              importType: "positions",
              key,
              fileName: it.video_tutorial_file,
            });
            if (vid) it.video_tutorial_url = vid;
            const anim = await maybeUploadAsset({
              importType: "positions",
              key,
              fileName: it.animation_file,
            });
            if (anim) it.animation_url = anim;
          }
        }
        if (payload.importType === "videos") {
          for (const it of payload.items) {
            const key =
              String(it.source_import_key || it.content_slug || it.title || "").trim() || "video";
            const sd = await maybeUploadAsset({
              importType: "videos",
              key,
              fileName: it.video_sd_file,
            });
            if (sd) it.video_url_sd = sd;
            const hd = await maybeUploadAsset({
              importType: "videos",
              key,
              fileName: it.video_hd_file,
            });
            if (hd) it.video_url_hd = hd;
            const k4 = await maybeUploadAsset({
              importType: "videos",
              key,
              fileName: it.video_4k_file,
            });
            if (k4) it.video_url_4k = k4;
            const thumb = await maybeUploadAsset({
              importType: "videos",
              key,
              fileName: it.thumbnail_file,
            });
            if (thumb) it.thumbnail_url = thumb;
            const gif = await maybeUploadAsset({
              importType: "videos",
              key,
              fileName: it.preview_gif_file,
            });
            if (gif) it.preview_gif_url = gif;
          }
        }
      }

      payload.sourceFileName = file.name;
      payload.dryRun = dryRun;

      const { data, error } = await supabase.functions.invoke("admin-import-dlc-content", {
        body: payload,
      });
      if (error) throw new Error(error.message);

      setLastResult(data as ImportResult);
      toast.success(dryRun ? "Dry-run complete" : "Import complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const runAutoPositionsImport = async () => {
    setBusy(true);
    setLastResult(null);
    setAutoPositionsMeta(null);
    try {
      const built = await buildPositionsImportCatalog({
        includeGitHub: true,
        includeBuiltInGuides: true,
        maxItems: 2000,
      });

      setAutoPositionsMeta({
        sources: built.sources,
        itemCount: built.items.length,
        computedAtIso: new Date().toISOString(),
      });

      const payload = {
        importType: "positions",
        items: built.items,
        sourceFileName: "auto:positions-catalog",
        dryRun,
      };

      const { data, error } = await supabase.functions.invoke("admin-import-dlc-content", {
        body: payload,
      });
      if (error) throw new Error(error.message);
      setLastResult(data as ImportResult);
      toast.success(dryRun ? "Dry-run complete" : "Import complete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Auto-import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>Admin DLC — Content Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={tab} onValueChange={v => setTab(v as ImportType)}>
          <TabsList>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
          </TabsList>
          <TabsContent value="positions" className="space-y-2">
            <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">Auto-generate positions catalog</div>
                  <div className="text-xs text-muted-foreground">
                    Builds a real import payload from the configured GitHub sources and the built-in
                    guide library, then upserts into <code>nsfw_positions_gallery</code>.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void runAutoPositionsImport()}
                  >
                    {busy ? "Working…" : dryRun ? "Dry-run auto import" : "Auto import now"}
                  </Button>
                </div>
              </div>
              {autoPositionsMeta ? (
                <div className="text-xs text-muted-foreground">
                  Built {autoPositionsMeta.itemCount} item(s) •{" "}
                  {new Date(autoPositionsMeta.computedAtIso).toLocaleString()}
                  <div className="mt-1">
                    Sources:{" "}
                    {autoPositionsMeta.sources.slice(0, 4).map((s, i) => (
                      <span key={`${s}-${i}`}>
                        <code>{s}</code>
                        {i < Math.min(3, autoPositionsMeta.sources.length - 1) ? ", " : ""}
                      </span>
                    ))}
                    {autoPositionsMeta.sources.length > 4 ? " …" : ""}
                  </div>
                </div>
              ) : null}
              <div className="text-[11px] text-muted-foreground">
                Tip: turn <strong>Dry-run ON</strong> first to validate category mappings and catch
                schema errors without modifying content.
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Upload a <code>.json</code> manifest or <code>.csv</code> with headers like:{" "}
              <code>position_slug</code>, <code>position_name</code>, <code>description</code>,{" "}
              <code>category</code>, <code>image_url</code>. Use <code>|</code> to separate list
              fields (tags/benefits/tips).
            </div>
            <div className="text-xs text-muted-foreground">
              Optional: include <code>image_file</code>, <code>image_illustrated_file</code>,{" "}
              <code>thumbnail_file</code>, <code>video_tutorial_file</code>,{" "}
              <code>animation_file</code> and select matching asset files below to upload into
              private storage automatically.
            </div>
          </TabsContent>
          <TabsContent value="videos" className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Upload a <code>.json</code> manifest or <code>.csv</code> with headers like:{" "}
              <code>content_slug</code>, <code>title</code>, <code>description</code>,{" "}
              <code>category</code>, <code>video_url_hd</code>, <code>thumbnail_url</code>. Use{" "}
              <code>|</code> to separate list fields (tags/key_points/warnings/prerequisites).
            </div>
            <div className="text-xs text-muted-foreground">
              Optional: include <code>video_hd_file</code> / <code>video_sd_file</code> /{" "}
              <code>video_4k_file</code> / <code>thumbnail_file</code> /{" "}
              <code>preview_gif_file</code> and select matching asset files below to upload into
              private storage automatically.
            </div>
          </TabsContent>
          <TabsContent value="topics" className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Upload a <code>.json</code> manifest or <code>.csv</code> with headers like:{" "}
              <code>topic_id</code>, <code>title</code>, <code>summary</code>, <code>body</code>,{" "}
              <code>tags</code>, <code>content_rating</code>.
            </div>
            <div className="text-xs text-muted-foreground">
              Optional: include <code>source_import_key</code> for strict idempotency; and{" "}
              <code>resources</code> as JSON text (e.g.{" "}
              <code>
                [{"{"}"label":"…","url":"…"{"}"}]
              </code>
              ).
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end pt-2">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Topic pack (used for asset paths)
                </div>
                <Select
                  value={topicsPackageId}
                  onValueChange={v =>
                    setTopicsPackageId(
                      v as
                        | "dlc-topic-power-dynamics"
                        | "dlc-topic-tantric"
                        | "dlc-topic-kama-sutra"
                        | "dlc-topic-roleplay"
                        | "dlc-topic-male-pleasure",
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic pack" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dlc-topic-power-dynamics">Power Dynamics Pack</SelectItem>
                    <SelectItem value="dlc-topic-tantric">Tantric Pack</SelectItem>
                    <SelectItem value="dlc-topic-kama-sutra">
                      Classic Texts & Positions Pack
                    </SelectItem>
                    <SelectItem value="dlc-topic-roleplay">Roleplay Pack</SelectItem>
                    <SelectItem value="dlc-topic-male-pleasure">
                      Male Pleasure & Pelvic Health Pack
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">
                Note: the DB determines access by each item’s <code>requires_feature_id</code>{" "}
                (typically sourced from <code>nsfw_topics.requires_feature_id</code>). This
                selection primarily affects where uploaded attachments would be stored if you add
                them later.
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="md:col-span-2 space-y-1">
            <div className="text-xs text-muted-foreground">Import file</div>
            <Input
              type="file"
              accept={accept}
              disabled={busy}
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant={dryRun ? "default" : "outline"}
              disabled={busy}
              onClick={() => setDryRun(v => !v)}
            >
              {dryRun ? "Dry-run: ON" : "Dry-run: OFF"}
            </Button>
            <Button disabled={busy || !file} onClick={() => void runImport()}>
              {busy ? "Running…" : "Run Import"}
            </Button>
          </div>
        </div>

        {tab !== "topics" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2 space-y-1">
              <div className="text-xs text-muted-foreground">Asset files (optional)</div>
              <Input
                type="file"
                multiple
                disabled={busy}
                onChange={e => setAssetFiles(Array.from(e.target.files || []))}
              />
              <div className="text-xs text-muted-foreground">
                Selected: {assetFiles.length} file(s). Filenames must match *_file fields in the
                manifest/CSV.
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant={uploadAssets ? "default" : "outline"}
                disabled={busy || assetFiles.length === 0}
                onClick={() => setUploadAssets(v => !v)}
              >
                {uploadAssets ? "Upload assets: ON" : "Upload assets: OFF"}
              </Button>
            </div>
          </div>
        ) : null}

        {lastResult && (
          <div className="rounded-xl border border-border/50 p-4 bg-background/40 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">job: {lastResult.jobId}</Badge>
              <Badge className={lastResult.summary.failed > 0 ? "bg-destructive" : "bg-green-600"}>
                {lastResult.summary.failed > 0 ? "has failures" : "ok"}
              </Badge>
              <Badge variant="outline">completed: {lastResult.summary.completed}</Badge>
              <Badge variant="outline">failed: {lastResult.summary.failed}</Badge>
              <Badge variant="outline">items: {lastResult.summary.itemCount}</Badge>
            </div>
            {lastResult.summary.failed > 0 && (
              <div className="text-sm text-muted-foreground">
                First failures:
                <ul className="list-disc ml-5">
                  {lastResult.results
                    .filter(r => r.status === "failed")
                    .slice(0, 5)
                    .map(r => (
                      <li key={r.key}>
                        <code>{r.key}</code>: {r.error}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
