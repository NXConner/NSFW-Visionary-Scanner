import { useCallback, useMemo, useState } from "react";

import { toast } from "sonner";

import { getSignedUploadTarget, uploadViaSignedUrl } from "@/components/dlc/admin/signedUpload";
import { supabase } from "@/integrations/supabase/client";
import { buildPositionsImportCatalog } from "@/lib/positions/adminImport";

import { applyAssetUploadsToPayload } from "../assetUpload";
import { parseCsv } from "../csv";
import { buildImportPayloadFromCsvRows } from "../payloadBuilders";
import type { ImportPayload, ImportResult, ImportType, TopicsPackageId } from "../types";

export type AutoPositionsMeta = {
  sources: string[];
  itemCount: number;
  computedAtIso: string;
} | null;

function packageIdForImport(t: ImportType, topicsPackageId: TopicsPackageId): string {
  if (t === "videos") return "dlc-videos";
  if (t === "topics") return topicsPackageId;
  return "dlc-positions";
}

export function useDlcContentImport(): {
  tab: ImportType;
  setTab: (v: ImportType) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  assetFiles: File[];
  setAssetFiles: (files: File[]) => void;
  uploadAssets: boolean;
  toggleUploadAssets: () => void;
  dryRun: boolean;
  toggleDryRun: () => void;
  busy: boolean;
  lastResult: ImportResult | null;
  autoPositionsMeta: AutoPositionsMeta;
  accept: string;
  topicsPackageId: TopicsPackageId;
  setTopicsPackageId: (v: TopicsPackageId) => void;
  runImport: () => Promise<void>;
  runAutoPositionsImport: () => Promise<void>;
} {
  const [tab, setTab] = useState<ImportType>("positions");
  const [file, setFile] = useState<File | null>(null);
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  const [uploadAssets, setUploadAssets] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [autoPositionsMeta, setAutoPositionsMeta] = useState<AutoPositionsMeta>(null);
  const [topicsPackageId, setTopicsPackageId] = useState<TopicsPackageId>(
    "dlc-topic-power-dynamics",
  );

  const accept = useMemo(() => ".json,.csv", []);

  const assetsByName = useMemo(() => {
    const map = new Map<string, File>();
    for (const f of assetFiles) map.set(f.name, f);
    return map;
  }, [assetFiles]);

  const packageIdForTab = useCallback(
    (t: ImportType) => packageIdForImport(t, topicsPackageId),
    [topicsPackageId],
  );

  const toggleUploadAssets = useCallback(() => setUploadAssets(v => !v), []);
  const toggleDryRun = useCallback(() => setDryRun(v => !v), []);

  const runImport = useCallback(async () => {
    if (!file) {
      toast.error("Select a .json or .csv file");
      return;
    }

    setBusy(true);
    setLastResult(null);

    try {
      const text = await file.text();
      let payload: ImportPayload | any;

      if (file.name.toLowerCase().endsWith(".json")) {
        payload = JSON.parse(text);
        // Allow either raw {items:[...]} or full shape.
        if (!payload.importType) payload.importType = tab;
      } else {
        const rows = parseCsv(text);
        payload = buildImportPayloadFromCsvRows(tab, rows);
      }

      // Optional asset upload pass (converts *_file fields into storage paths)
      if (!dryRun && uploadAssets && assetFiles.length > 0) {
        await applyAssetUploadsToPayload({
          payload,
          assetsByName,
          packageIdForImport: packageIdForTab,
          signedUpload: { getSignedUploadTarget, uploadViaSignedUrl },
        });
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
  }, [assetFiles.length, assetsByName, dryRun, file, packageIdForTab, tab, uploadAssets]);

  const runAutoPositionsImport = useCallback(async () => {
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

      const payload: ImportPayload = {
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
  }, [dryRun]);

  return {
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
  };
}
