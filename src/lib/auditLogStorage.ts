import { encryptData, decryptData } from "@/lib/encryption";

export type AuditLogCategory = "scan" | "export" | "settings" | "auth" | "data" | "report";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: AuditLogCategory;
  details?: string;
  metadata?: Record<string, unknown>;
}

const AUDIT_LOG_KEY = "morphoscan_audit_log";
const MAX_LOG_ENTRIES = 500;

function safeJsonParse(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function readAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    if (typeof localStorage === "undefined") return [];
    const encrypted = localStorage.getItem(AUDIT_LOG_KEY);
    if (!encrypted) return [];
    const decrypted = await decryptData(encrypted);
    if (!decrypted) return [];
    const parsed = safeJsonParse(decrypted);
    return Array.isArray(parsed) ? (parsed as AuditLogEntry[]) : [];
  } catch {
    return [];
  }
}

export async function writeAuditLogs(next: AuditLogEntry[]): Promise<void> {
  try {
    if (typeof localStorage === "undefined") return;
    const encrypted = await encryptData(JSON.stringify(next));
    localStorage.setItem(AUDIT_LOG_KEY, encrypted);
  } catch {
    // ignore
  }
}

export async function appendAuditLogEntry(params: {
  action: string;
  category: AuditLogCategory;
  details?: string;
  metadata?: Record<string, unknown>;
}): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action: params.action,
    category: params.category,
    details: params.details,
    metadata: params.metadata,
  };

  const prev = await readAuditLogs();
  const next = [entry, ...prev].slice(0, MAX_LOG_ENTRIES);
  await writeAuditLogs(next);
  return entry;
}

export async function clearAuditLogs(): Promise<void> {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(AUDIT_LOG_KEY);
  } catch {
    // ignore
  }
}

