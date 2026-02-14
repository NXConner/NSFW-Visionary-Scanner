import type { SignedUploadTarget } from "@/components/dlc/admin/signedUpload";
import type { ImportPayload, ImportType } from "./types";
import { sanitizeFilename, sanitizeName } from "./utils";

export type SignedUploadFns = {
  getSignedUploadTarget: (params: {
    packageId: string;
    assetPath: string;
  }) => Promise<SignedUploadTarget>;
  uploadViaSignedUrl: (params: { target: SignedUploadTarget; file: File }) => Promise<void>;
};

function buildAssetPath(args: {
  packageId: string;
  importType: ImportType;
  slugOrKey: string;
  fileName: string;
  nowMs?: number;
}): string {
  const key = sanitizeName(args.slugOrKey) || "item";
  const safeFile = sanitizeFilename(args.fileName);
  const nowMs = typeof args.nowMs === "number" ? args.nowMs : Date.now();
  return `${args.packageId}/${args.importType}/${key}/${nowMs}-${safeFile}`;
}

async function maybeUploadAsset(args: {
  signedUpload: SignedUploadFns;
  assetsByName: Map<string, File>;
  packageId: string;
  importType: ImportType;
  itemKey: string;
  fileName: string | null | undefined;
}): Promise<string | null> {
  const fileName = String(args.fileName || "").trim();
  if (!fileName) return null;

  const f = args.assetsByName.get(fileName);
  if (!f) return null;

  const assetPath = buildAssetPath({
    packageId: args.packageId,
    importType: args.importType,
    slugOrKey: args.itemKey,
    fileName: f.name,
  });

  const target = await args.signedUpload.getSignedUploadTarget({
    packageId: args.packageId,
    assetPath,
  });

  await args.signedUpload.uploadViaSignedUrl({ target, file: f });
  return assetPath;
}

export async function applyAssetUploadsToPayload(args: {
  payload: ImportPayload;
  assetsByName: Map<string, File>;
  packageIdForImport: (t: ImportType) => string;
  signedUpload: SignedUploadFns;
}): Promise<void> {
  const { payload, assetsByName, signedUpload } = args;
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) return;

  if (payload.importType === "positions") {
    const pkg = args.packageIdForImport("positions");
    for (const it of payload.items as any[]) {
      const key = String(it.position_slug || it.position_name || "").trim() || "position";
      const image = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "positions",
        itemKey: key,
        fileName: it.image_file,
      });
      if (image) it.image_url = image;

      const ill = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "positions",
        itemKey: key,
        fileName: it.image_illustrated_file,
      });
      if (ill) it.image_url_illustrated = ill;

      const thumb = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "positions",
        itemKey: key,
        fileName: it.thumbnail_file,
      });
      if (thumb) it.thumbnail_url = thumb;

      const vid = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "positions",
        itemKey: key,
        fileName: it.video_tutorial_file,
      });
      if (vid) it.video_tutorial_url = vid;

      const anim = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "positions",
        itemKey: key,
        fileName: it.animation_file,
      });
      if (anim) it.animation_url = anim;
    }
  }

  if (payload.importType === "videos") {
    const pkg = args.packageIdForImport("videos");
    for (const it of payload.items as any[]) {
      const key =
        String(it.source_import_key || it.content_slug || it.title || "").trim() || "video";

      const sd = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "videos",
        itemKey: key,
        fileName: it.video_sd_file,
      });
      if (sd) it.video_url_sd = sd;

      const hd = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "videos",
        itemKey: key,
        fileName: it.video_hd_file,
      });
      if (hd) it.video_url_hd = hd;

      const k4 = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "videos",
        itemKey: key,
        fileName: it.video_4k_file,
      });
      if (k4) it.video_url_4k = k4;

      const thumb = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "videos",
        itemKey: key,
        fileName: it.thumbnail_file,
      });
      if (thumb) it.thumbnail_url = thumb;

      const gif = await maybeUploadAsset({
        signedUpload,
        assetsByName,
        packageId: pkg,
        importType: "videos",
        itemKey: key,
        fileName: it.preview_gif_file,
      });
      if (gif) it.preview_gif_url = gif;
    }
  }
}
