import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getDevicePlatform } from "@/dlc/core/device";
import { fetchDlcKey } from "@/lib/dlcKeys";
import { contentEncryption } from "@/dlc/security";

import type { ContentFile } from "./types";
import { guessMimeType, inferPackageIdFromAssetPath, isHttpUrl } from "./utils";

export async function maybeDecryptFile(params: {
  packageId: string;
  file: ContentFile;
  response: Response;
  bytes: ArrayBuffer;
}): Promise<ArrayBuffer> {
  const contentType = (params.response.headers.get("content-type") || "").toLowerCase();
  const encrypted =
    Boolean(params.file.encrypted) || contentType.includes("application/dlc-encrypted");
  if (!encrypted) return params.bytes;

  const key = await fetchDlcKey({ packageId: params.packageId });
  if (!key) throw new Error("Unable to fetch DLC decryption key");

  const cryptoKey = await contentEncryption.getContentKey(
    params.packageId,
    key.keyId,
    async () => key.keyB64,
  );
  // Stored encrypted assets are JSON-encoded payloads produced by `contentEncryption.encrypt(...)`.
  // We parse then decrypt to raw bytes.
  let encryptedPayload: unknown;
  try {
    const json = await new Response(params.bytes).text();
    encryptedPayload = JSON.parse(json);
  } catch {
    throw new Error("Invalid encrypted asset payload");
  }

  const decrypted = await (
    contentEncryption as unknown as { decrypt: (e: any, k: CryptoKey) => Promise<ArrayBuffer> }
  ).decrypt(encryptedPayload as any, cryptoKey);

  // If callers need a Blob with a specific mimeType they can wrap it later; we store bytes.
  void (
    params.file.mimeType ||
    guessMimeType({ path: params.file.path, declaredType: params.file.type })
  );
  return decrypted;
}

export async function resolveContentFileUrl(params: {
  packageId: string;
  file: ContentFile;
  expiresInSeconds?: number;
}): Promise<{ url: string; assetRef: string }> {
  const direct = params.file.url ? String(params.file.url) : "";
  if (direct && isHttpUrl(direct)) return { url: direct, assetRef: direct };

  const assetPath = params.file.assetPath ? String(params.file.assetPath) : "";
  if (!assetPath) {
    throw new Error("Content file missing url/assetPath");
  }

  const inferredPackageId = inferPackageIdFromAssetPath(assetPath);
  // The packageId passed into the installer should match the asset namespace, but we keep this
  // tolerant: use inferred packageId for signing if the file is namespaced differently.
  const signingPackageId = inferredPackageId || params.packageId;

  const deviceId = getDeviceId();
  const devicePlatform = getDevicePlatform();

  const { data, error } = await supabase.functions.invoke("get-dlc-signed-url", {
    body: {
      packageId: signingPackageId,
      assetPath,
      expiresInSeconds: Math.max(60, Math.min(60 * 60, Number(params.expiresInSeconds ?? 900))),
      deviceId,
      devicePlatform,
    },
  });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Failed to sign DLC asset URL");
  }

  return { url: String(data.signedUrl), assetRef: assetPath };
}
