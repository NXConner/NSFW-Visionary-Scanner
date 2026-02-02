import { supabase } from "@/integrations/supabase/client";

export type SignedUploadTarget = {
  bucket: string;
  path: string;
  signedUrl: string;
  token: string;
};

export async function getSignedUploadTarget(params: {
  packageId: string;
  assetPath: string;
}): Promise<SignedUploadTarget> {
  const { data, error } = await supabase.functions.invoke("get-dlc-signed-upload-url", {
    body: { packageId: params.packageId, assetPath: params.assetPath },
  });
  if (error) throw new Error(error.message);
  if (!data?.signedUrl || !data?.token || !data?.bucket || !data?.path) {
    throw new Error("Signed upload URL not returned");
  }
  return {
    bucket: String(data.bucket),
    path: String(data.path),
    signedUrl: String(data.signedUrl),
    token: String(data.token),
  };
}

export async function uploadViaSignedUrl(params: {
  target: SignedUploadTarget;
  file: File;
}): Promise<void> {
  // Prefer supabase-js helper if present
  const storageFrom = supabase.storage.from(params.target.bucket);
  if (storageFrom && typeof (storageFrom as any).uploadToSignedUrl === "function") {
    const { error } = await storageFrom.uploadToSignedUrl(
      params.target.path,
      params.target.token,
      params.file,
      {
        contentType: params.file.type || "application/octet-stream",
        upsert: true,
      },
    );
    if (error) throw new Error(error.message);
    return;
  }

  // Fallback: direct PUT to signed URL
  const res = await fetch(params.target.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": params.file.type || "application/octet-stream",
      "x-upsert": "true",
      // Some Supabase Storage setups accept the token in Authorization for signed upload
      Authorization: `Bearer ${params.target.token}`,
    },
    body: params.file,
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Signed upload failed: ${res.status} ${t}`);
  }
}
