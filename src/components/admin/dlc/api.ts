import { supabase } from "@/integrations/supabase/client";

import type { AdminDlcPackageRow, AdminDlcPromoDto, AdminDlcPromoUpsertInput } from "./types";

function edgeErrorMessage(e: unknown): string {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function adminListDlcPackages(): Promise<AdminDlcPackageRow[]> {
  const { data, error } = await supabase.functions.invoke("admin-dlc-catalog", {
    body: { action: "list" },
  });
  if (error) throw new Error(error.message);
  return ((data?.packages || []) as AdminDlcPackageRow[]) ?? [];
}

export async function adminUpdateDlcStripeMapping(params: {
  packageId: string;
  stripePriceId: string | null;
  stripeProductId: string | null;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-dlc-catalog", {
    body: {
      action: "update",
      packageId: params.packageId,
      stripePriceId: params.stripePriceId,
      stripeProductId: params.stripeProductId,
    },
  });
  if (error) throw new Error(error.message);
}

export async function adminSetDlcPackageActive(params: {
  packageId: string;
  isActive: boolean;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("admin-dlc-catalog", {
    body: { action: "set_active", packageId: params.packageId, isActive: params.isActive },
  });
  if (error) throw new Error(error.message);
}

export async function adminListDlcPromoCodes(params?: {
  includeInactive?: boolean;
}): Promise<AdminDlcPromoDto[]> {
  const { data, error } = await supabase.functions.invoke("admin-dlc-promos", {
    body: { action: "list", includeInactive: params?.includeInactive ?? true },
  });
  if (error) throw new Error(error.message);
  return ((data?.promos || []) as AdminDlcPromoDto[]) ?? [];
}

export async function adminUpsertDlcPromoCode(
  input: AdminDlcPromoUpsertInput,
): Promise<AdminDlcPromoDto> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-dlc-promos", {
      body: { action: "upsert", promo: input },
    });
    if (error) throw new Error(error.message);
    return data?.promo as AdminDlcPromoDto;
  } catch (e) {
    throw new Error(edgeErrorMessage(e));
  }
}

export async function adminSetDlcPromoActive(params: {
  code: string;
  isActive: boolean;
}): Promise<AdminDlcPromoDto | null> {
  const { data, error } = await supabase.functions.invoke("admin-dlc-promos", {
    body: { action: "set_active", code: params.code, isActive: params.isActive },
  });
  if (error) throw new Error(error.message);
  return (data?.promo as AdminDlcPromoDto) ?? null;
}
