export interface ContentPackageManifest {
  version: string;
  files: ContentFile[];
  checksum: string;
  size: number;
  releaseDate: string;
  changelog: string[];
}

export interface ContentFile {
  path: string;
  /**
   * Either a direct URL (http/https) OR an `assetPath` that will be signed via `get-dlc-signed-url`.
   * For private DLC storage, prefer `assetPath`.
   */
  url?: string;
  assetPath?: string;
  /**
   * If true, the fetched asset is expected to be stored as an encrypted JSON blob (AES-GCM)
   * and will be decrypted locally after entitlement checks (key fetched via `get-dlc-key`).
   *
   * Note: even if this is omitted, we will also treat `Content-Type: application/dlc-encrypted`
   * as encrypted.
   */
  encrypted?: boolean;
  /**
   * MIME type of the decrypted payload (used when decrypting `application/dlc-encrypted` assets).
   * If omitted, we infer from file extension and type.
   */
  mimeType?: string;
  checksum: string;
  size: number;
  type: "image" | "gif" | "video" | "data" | "component";
}
