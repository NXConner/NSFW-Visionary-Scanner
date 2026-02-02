import type { PartnerConnection } from "./types";

export function generateInviteCode(prefix = "PSC", length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const code = Array.from(bytes)
    .map(b => alphabet[b % alphabet.length])
    .join("");
  return `${prefix}-${code}`;
}

export function getPartnerUserId(
  connection: PartnerConnection | null,
  currentUserId: string | null,
): string | null {
  if (!connection || !currentUserId) return null;
  return connection.user_id === currentUserId ? connection.partner_id : connection.user_id;
}

export function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.map(v => v.trim()).filter(Boolean)));
}

export function createItineraryId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
