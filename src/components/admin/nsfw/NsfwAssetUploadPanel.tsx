import { useCallback, useEffect, useMemo, useState } from "react";
import { fromExtended } from "@/lib/supabaseExtensions";
import { getSignedUploadTarget, uploadViaSignedUrl } from "@/components/dlc/admin/signedUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type PackageOption = {
  packageId: string;
  name: string;
  contentRating: string;
  displayOrder: number;
};

type UploadResult = {
  fileName: string;
  assetPath: string;
  status: "uploaded" | "failed";
  error?: string;
};

function sanitizeSegment(value: string): string {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function buildAssetPath(params: {
  packageId: string;
  folder: string;
  fileName: string;
}): string {
  const folder = sanitizeSegment(params.folder);
  const safeName = sanitizeSegment(params.fileName) || "asset.bin";
  const stamp = Date.now();
  return folder
    ? `${params.packageId}/${folder}/${stamp}-${safeName}`
    : `${params.packageId}/${stamp}-${safeName}`;
}

export function NsfwAssetUploadPanel(): JSX.Element {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [packageId, setPackageId] = useState<string>("");
  const [folder, setFolder] = useState<string>("uploads");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult[]>([]);

  const loadPackages = useCallback(async () => {
    const { data, error } = await fromExtended("dlc_packages")
      .select("package_id,package_name,content_rating,display_order,is_active")
      .eq("is_active", true)
      .limit(500);
    if (error) {
      toast.error(error.message);
      return;
    }
    const rows = (data || []) as Array<Record<string, unknown>>;
    const next = rows
      .map(row => ({
        packageId: String(row.package_id || ""),
        name: String(row.package_name || row.package_id || "Package"),
        contentRating: String(row.content_rating || "18+"),
        displayOrder: Number(row.display_order || 0),
      }))
      .filter(p => p.packageId && (p.contentRating === "18+" || p.contentRating === "adult"))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    setPackages(next);
    if (!packageId && next[0]?.packageId) setPackageId(next[0].packageId);
  }, [packageId]);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  const canUpload = useMemo(() => packageId && files.length > 0 && !uploading, [packageId, files, uploading]);

  const runUpload = useCallback(async () => {
    if (!packageId) {
      toast.error("Select a package");
      return;
    }
    if (files.length === 0) {
      toast.error("Select files to upload");
      return;
    }

    setUploading(true);
    setProgress(0);
    setResults([]);

    const nextResults: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const assetPath = buildAssetPath({ packageId, folder, fileName: file.name });
      try {
        const target = await getSignedUploadTarget({ packageId, assetPath });
        await uploadViaSignedUrl({ target, file });
        nextResults.push({ fileName: file.name, assetPath, status: "uploaded" });
      } catch (error) {
        nextResults.push({
          fileName: file.name,
          assetPath,
          status: "failed",
          error: error instanceof Error ? error.message : "Upload failed",
        });
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(nextResults);
    setUploading(false);
  }, [files, folder, packageId]);

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle>NSFW Asset Uploads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Package</div>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map(pkg => (
                  <SelectItem key={pkg.packageId} value={pkg.packageId}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Folder (optional)</div>
            <Input value={folder} onChange={e => setFolder(e.target.value)} placeholder="uploads" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Files</div>
            <Input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button disabled={!canUpload} onClick={() => void runUpload()}>
            {uploading ? "Uploading..." : "Upload Assets"}
          </Button>
          {uploading ? <Progress value={progress} className="flex-1" /> : null}
        </div>

        {results.length > 0 ? (
          <div className="space-y-2 text-sm">
            {results.map(r => (
              <div key={`${r.fileName}-${r.assetPath}`} className="flex items-center gap-2">
                <Badge variant={r.status === "uploaded" ? "secondary" : "destructive"}>
                  {r.status}
                </Badge>
                <div className="min-w-0">
                  <div className="truncate">{r.fileName}</div>
                  <div className="text-xs text-muted-foreground truncate">{r.assetPath}</div>
                  {r.error ? <div className="text-xs text-destructive">{r.error}</div> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
