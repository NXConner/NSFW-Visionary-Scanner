import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type {
  Nsfw2257Custodian,
  Nsfw2257Record,
  NsfwContentPerformer,
  NsfwPerformerRecord,
  NsfwVideoOption,
} from "./types";

type CustodianInsert = Omit<Nsfw2257Custodian, "id" | "created_at" | "updated_at">;
type CustodianUpdate = Partial<CustodianInsert>;
type PerformerInsert = Omit<NsfwPerformerRecord, "id" | "created_at" | "updated_at">;
type PerformerUpdate = Partial<PerformerInsert>;
type RecordInsert = Omit<Nsfw2257Record, "id" | "created_at" | "updated_at">;
type RecordUpdate = Partial<RecordInsert>;
type ContentPerformerInsert = Omit<NsfwContentPerformer, "id" | "created_at" | "updated_at">;
type ContentPerformerUpdate = Partial<ContentPerformerInsert>;

export async function listCustodians(): Promise<Nsfw2257Custodian[]> {
  try {
    const { data, error } = await fromExtended("nsfw_2257_custodians")
      .select("*")
      .order("custodian_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Nsfw2257Custodian[];
  } catch (error) {
    logger.error("Failed to load custodians", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createCustodian(payload: CustodianInsert): Promise<Nsfw2257Custodian | null> {
  try {
    const { data, error } = await fromExtended("nsfw_2257_custodians")
      .insert({
        ...payload,
        custodian_name: String(payload.custodian_name).trim(),
        custodian_company: payload.custodian_company || null,
        address_line1: payload.address_line1 || null,
        address_line2: payload.address_line2 || null,
        city: payload.city || null,
        state: payload.state || null,
        postal_code: payload.postal_code || null,
        country: payload.country || null,
        phone: payload.phone || null,
        email: payload.email || null,
        record_location: payload.record_location || null,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Nsfw2257Custodian;
  } catch (error) {
    logger.error("Failed to create custodian", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function updateCustodian(id: string, patch: CustodianUpdate): Promise<boolean> {
  try {
    const { error } = await fromExtended("nsfw_2257_custodians")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error("Failed to update custodian", {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    return false;
  }
}

export async function listPerformers(): Promise<NsfwPerformerRecord[]> {
  try {
    const { data, error } = await fromExtended("nsfw_performer_records")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data || []) as NsfwPerformerRecord[];
  } catch (error) {
    logger.error("Failed to load performers", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createPerformer(payload: PerformerInsert): Promise<NsfwPerformerRecord | null> {
  try {
    const { data, error } = await fromExtended("nsfw_performer_records")
      .insert({
        ...payload,
        stage_name: String(payload.stage_name).trim(),
        legal_name: String(payload.legal_name).trim(),
        document_type: payload.document_type || null,
        document_last4: payload.document_last4 || null,
        document_issuer: payload.document_issuer || null,
        document_expiration: payload.document_expiration || null,
        document_storage_path: payload.document_storage_path || null,
        document_sha256: payload.document_sha256 || null,
        consent_form_path: payload.consent_form_path || null,
        consent_signed_at: payload.consent_signed_at || null,
        verified_at: payload.verified_at || null,
        notes: payload.notes || null,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as NsfwPerformerRecord;
  } catch (error) {
    logger.error("Failed to create performer", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function updatePerformer(id: string, patch: PerformerUpdate): Promise<boolean> {
  try {
    const { error } = await fromExtended("nsfw_performer_records")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error("Failed to update performer", {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    return false;
  }
}

export async function listRecords(): Promise<Nsfw2257Record[]> {
  try {
    const { data, error } = await fromExtended("nsfw_2257_records")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data || []) as Nsfw2257Record[];
  } catch (error) {
    logger.error("Failed to load 2257 records", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createRecord(payload: RecordInsert): Promise<Nsfw2257Record | null> {
  try {
    const { data, error } = await fromExtended("nsfw_2257_records")
      .insert({
        ...payload,
        record_key: String(payload.record_key).trim(),
        record_location: payload.record_location || null,
        record_storage_path: payload.record_storage_path || null,
        record_sha256: payload.record_sha256 || null,
        verification_notes: payload.verification_notes || null,
        last_verified_at: payload.last_verified_at || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Nsfw2257Record;
  } catch (error) {
    logger.error("Failed to create 2257 record", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function updateRecord(id: string, patch: RecordUpdate): Promise<boolean> {
  try {
    const { error } = await fromExtended("nsfw_2257_records")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error("Failed to update 2257 record", {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    return false;
  }
}

export async function listContentPerformers(): Promise<NsfwContentPerformer[]> {
  try {
    const { data, error } = await fromExtended("nsfw_content_performers")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data || []) as NsfwContentPerformer[];
  } catch (error) {
    logger.error("Failed to load content performer links", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function createContentPerformer(
  payload: ContentPerformerInsert,
): Promise<NsfwContentPerformer | null> {
  try {
    const { data, error } = await fromExtended("nsfw_content_performers")
      .insert({
        ...payload,
        role: payload.role || "performer",
        consent_status: payload.consent_status || "pending",
        consent_signed_at: payload.consent_signed_at || null,
        age_verified_at: payload.age_verified_at || null,
        release_form_path: payload.release_form_path || null,
        notes: payload.notes || null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as NsfwContentPerformer;
  } catch (error) {
    logger.error("Failed to create content performer link", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function updateContentPerformer(
  id: string,
  patch: ContentPerformerUpdate,
): Promise<boolean> {
  try {
    const { error } = await fromExtended("nsfw_content_performers")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    logger.error("Failed to update content performer link", {
      error: error instanceof Error ? error.message : String(error),
      id,
    });
    return false;
  }
}

export async function listVideoOptions(limit: number = 250): Promise<NsfwVideoOption[]> {
  try {
    const { data, error } = await fromExtended("nsfw_video_content")
      .select("id,title,content_slug")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []) as NsfwVideoOption[];
  } catch (error) {
    logger.error("Failed to load NSFW videos", {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
