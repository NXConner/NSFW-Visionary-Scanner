import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type {
  ScanAnalyzeRequest,
  ScanAnalyzeResponse,
  ScanHistoryResponse,
  ScanUploadRequest,
  ScanUploadResponse,
} from "./types";

export async function scanUpload(req: ScanUploadRequest): Promise<ScanUploadResponse> {
  const { data, error } = await supabase.functions.invoke("scan-upload", {
    body: req,
  });
  if (error) {
    logger.error("scanUpload failed", { error: error.message });
    throw new Error(error.message);
  }
  return data as ScanUploadResponse;
}

export async function scanAnalyze(req: ScanAnalyzeRequest): Promise<ScanAnalyzeResponse> {
  const { data, error } = await supabase.functions.invoke("scan-analyze", {
    body: req,
  });
  if (error) {
    logger.error("scanAnalyze failed", { error: error.message });
    throw new Error(error.message);
  }
  return data as ScanAnalyzeResponse;
}

export async function scanHistory(limit: number = 25): Promise<ScanHistoryResponse> {
  const { data, error } = await supabase.functions.invoke("scan-history", {
    body: { limit },
  });
  if (error) {
    logger.error("scanHistory failed", { error: error.message });
    throw new Error(error.message);
  }
  return data as ScanHistoryResponse;
}
