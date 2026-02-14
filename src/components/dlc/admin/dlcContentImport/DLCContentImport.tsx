import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useDlcContentImport } from "./hooks/useDlcContentImport";
import type { ImportType, TopicsPackageId } from "./types";

export function DLCContentImport(): React.ReactElement {
  const {
    tab,
    setTab,
    file,
    setFile,
    assetFiles,
    setAssetFiles,
    uploadAssets,
    toggleUploadAssets,
    dryRun,
    toggleDryRun,
    busy,
    lastResult,
    autoPositionsMeta,
    accept,
    topicsPackageId,
    setTopicsPackageId,
    runImport,
    runAutoPositionsImport,
  } = useDlcContentImport();

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
                  onValueChange={v => setTopicsPackageId(v as TopicsPackageId)}
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
            <Button variant={dryRun ? "default" : "outline"} disabled={busy} onClick={toggleDryRun}>
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
                onClick={toggleUploadAssets}
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
