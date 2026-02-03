import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { ContentLicensor, ContentLicense, LicenseCoverageSummary, LicenseWithLicensor } from "./types";

type LicensorInsert = Omit<ContentLicensor, "id" | "created_at" | "updated_at">;
type LicensorUpdate = Partial<LicensorInsert>;
type LicenseInsert = Omit<ContentLicense, "id" | "created_at" | "updated_at">;
type LicenseUpdate = Partial<LicenseInsert>;

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(v => String(v || "").trim()).filter(Boolean);
}

export async function listLicensors(): Promise<ContentLicensor[]> {
  try {
    const { data, error } = await fromExtended("nsfw_content_licensors")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as ContentLicensor[];
  } catch (error) {
    logger.error("Failed to load licensors", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createLicensor(payload: LicensorInsert): Promise<ContentLicensor | null> {
  try {
    const { data, error } = await fromExtended("nsfw_content_licensors")
      .insert({
        name: String(payload.name).trim(),
        website_url: payload.website_url || null,
        contact_name: payload.contact_name || null,
        contact_email: payload.contact_email || null,
        jurisdiction: payload.jurisdiction || null,
        notes: payload.notes || null,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ContentLicensor;
  } catch (error) {
    logger.error("Failed to create licensor", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function updateLicensor(id: string, patch: LicensorUpdate): Promise<boolean> {
  try {
    const { error } = await fromExtended("nsfw_content_licensors")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error("Failed to update licensor", {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    return false;
  }
}

export async function listLicenses(): Promise<LicenseWithLicensor[]> {
  try {
    const [licensesRes, licensorsRes] = await Promise.all([
      fromExtended("nsfw_content_licenses").select("*").order("updated_at", { ascending: false }),
      fromExtended("nsfw_content_licensors").select("id,name"),
    ]);
    if (licensesRes.error) throw new Error(licensesRes.error.message);
    if (licensorsRes.error) throw new Error(licensorsRes.error.message);
    const licensors = new Map(
      (licensorsRes.data || []).map((row: any) => [String(row.id), String(row.name || "")]),
    );
    return (licensesRes.data || []).map((row: any) => ({
      ...(row as ContentLicense),
      licensor_name: row.licensor_id ? licensors.get(String(row.licensor_id)) || null : null,
      languages: safeArray(row.languages),
      allowed_content_types: safeArray(row.allowed_content_types),
      allowed_platforms: safeArray(row.allowed_platforms),
      distribution_channels: safeArray(row.distribution_channels),
    })) as LicenseWithLicensor[];
  } catch (error) {
    logger.error("Failed to load licenses", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createLicense(payload: LicenseInsert): Promise<ContentLicense | null> {
  try {
    const { data, error } = await fromExtended("nsfw_content_licenses")
      .insert({
        ...payload,
        license_key: String(payload.license_key || "").trim(),
        license_name: String(payload.license_name || "").trim(),
        territory: payload.territory || null,
        languages: safeArray(payload.languages),
        allowed_content_types: safeArray(payload.allowed_content_types),
        allowed_platforms: safeArray(payload.allowed_platforms),
        distribution_channels: safeArray(payload.distribution_channels),
        attribution_text: payload.attribution_text || null,
        contract_storage_path: payload.contract_storage_path || null,
        contract_sha256: payload.contract_sha256 || null,
        notes: payload.notes || null,
        terms: payload.terms ?? {},
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ContentLicense;
  } catch (error) {
    logger.error("Failed to create license", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function updateLicense(id: string, patch: LicenseUpdate): Promise<boolean> {
  try {
    const { error } = await fromExtended("nsfw_content_licenses")
      .update({
        ...patch,
        languages: patch.languages ? safeArray(patch.languages) : undefined,
        allowed_content_types: patch.allowed_content_types
          ? safeArray(patch.allowed_content_types)
          : undefined,
        allowed_platforms: patch.allowed_platforms ? safeArray(patch.allowed_platforms) : undefined,
        distribution_channels: patch.distribution_channels
          ? safeArray(patch.distribution_channels)
          : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error("Failed to update license", {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    return false;
  }
}

export async function getLicenseCoverageSummary(): Promise<LicenseCoverageSummary> {
  try {
    const [totalRes, missingRes, unverifiedRes] = await Promise.all([
      fromExtended("nsfw_video_content").select("id", { count: "exact", head: true }),
      fromExtended("nsfw_video_content").select("id", { count: "exact", head: true }).is("license_id", null),
      fromExtended("nsfw_video_content")
        .select("id", { count: "exact", head: true })
        .neq("license_status", "verified"),
    ]);

    const totalVideos = totalRes.count ?? 0;
    const missingLicense = missingRes.count ?? 0;
    const unverifiedLicense = unverifiedRes.count ?? 0;

    return { totalVideos, missingLicense, unverifiedLicense };
  } catch (error) {
    logger.error("Failed to load license coverage summary", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { totalVideos: 0, missingLicense: 0, unverifiedLicense: 0 };
  }
}
