import { supabase } from "@/integrations/supabase/client";

import type { AdminGenerateLicenseInput, AdminLicenseDto } from "./types";

function edgeErrorMessage(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  return String(e);
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function asNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function mapRow(row: Record<string, unknown>): AdminLicenseDto {
  const userEmailRaw = row.userEmail ?? row.user_email ?? null;
  const userEmail =
    typeof userEmailRaw === "string" && userEmailRaw.trim() ? userEmailRaw.trim() : null;

  const packageIdRaw = row.packageId ?? row.package_id ?? null;
  const packageId =
    typeof packageIdRaw === "string" && packageIdRaw.trim() ? packageIdRaw.trim() : null;

  const packageNameRaw = row.packageName ?? row.package_name ?? null;
  const packageName =
    typeof packageNameRaw === "string" && packageNameRaw.trim() ? packageNameRaw.trim() : null;

  return {
    id: asString(row.id),
    key: asString(row.key ?? row.license_key ?? row.licenseKey),
    userId: asString(row.userId ?? row.user_id ?? row.user),
    userEmail,
    packageId,
    packageName,
    licenseType: row.licenseType
      ? asString(row.licenseType)
      : row.license_type
        ? asString(row.license_type)
        : null,
    status: asString(row.status) as any,
    devices: asNumber(row.devices, 0),
    maxDevices: asNumber(row.maxDevices ?? row.max_devices, 3),
    createdAtIso: row.createdAtIso
      ? asString(row.createdAtIso)
      : row.created_at
        ? asString(row.created_at)
        : null,
    expiresAtIso: row.expiresAtIso
      ? asString(row.expiresAtIso)
      : row.expires_at
        ? asString(row.expires_at)
        : row.expiration_date
          ? asString(row.expiration_date)
          : null,
  };
}

export async function adminListLicenses(params?: {
  limit?: number;
  includeInactive?: boolean;
}): Promise<AdminLicenseDto[]> {
  const { data, error } = await supabase.functions.invoke("admin-licenses", {
    body: {
      action: "list",
      limit: params?.limit ?? 500,
      includeInactive: params?.includeInactive ?? true,
    },
  });
  if (error) throw new Error(error.message);
  const rows = ((data?.licenses || []) as Array<Record<string, unknown>>) ?? [];
  return rows.map(mapRow);
}

export async function adminGenerateLicense(input: AdminGenerateLicenseInput): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("admin-licenses", {
      body: {
        action: "generate",
        userEmail: input.userEmail,
        packageId: input.packageId,
        licenseType: input.licenseType,
        maxDevices: input.maxDevices,
        expiresAtIso: input.expiresAtIso,
        note: input.note ?? null,
      },
    });
    if (error) throw new Error(error.message);
  } catch (e) {
    throw new Error(edgeErrorMessage(e));
  }
}

export async function adminRevokeLicense(licenseId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-licenses", {
    body: { action: "revoke", licenseId },
  });
  if (error) throw new Error(error.message);
}

export async function adminRotateLicenseKey(licenseId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-licenses", {
    body: { action: "rotate_key", licenseId },
  });
  if (error) throw new Error(error.message);
}

export async function adminResetLicenseDevices(licenseId: string): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-licenses", {
    body: { action: "reset_devices", licenseId },
  });
  if (error) throw new Error(error.message);
}
