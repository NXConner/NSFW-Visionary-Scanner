/**
 * Profile Manager
 * Utility functions for profile data management and sync
 */

import type { UserProfile } from "@/contexts/ProfileContext";

// ======= Types =======

export interface ProfileExport {
  version: string;
  exportedAt: string;
  profile: Omit<UserProfile, "pin">;
  data?: {
    measurements?: unknown[];
    settings?: Record<string, unknown>;
    achievements?: string[];
  };
}

export interface ProfileImportResult {
  success: boolean;
  profile?: UserProfile;
  error?: string;
  warnings?: string[];
}

export interface ProfileMergeStrategy {
  measurements: "replace" | "merge" | "skip";
  settings: "replace" | "merge" | "skip";
  achievements: "replace" | "merge" | "skip";
}

// ======= Export Functions =======

/**
 * Export a profile to JSON format
 */
export function exportProfile(
  profile: UserProfile,
  includeData: boolean = true,
  data?: ProfileExport["data"],
): string {
  const exportData: ProfileExport = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      color: profile.color,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      isDefault: false, // Never export as default
      settings: profile.settings,
      metadata: profile.metadata,
    },
    data: includeData ? data : undefined,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export profile to a downloadable file
 */
export function downloadProfileExport(profile: UserProfile, data?: ProfileExport["data"]): void {
  const json = exportProfile(profile, true, data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `profile-${profile.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ======= Import Functions =======

/**
 * Parse and validate a profile import
 */
export function parseProfileImport(jsonString: string): ProfileImportResult {
  const warnings: string[] = [];

  try {
    const data: ProfileExport = JSON.parse(jsonString);

    // Validate version
    if (!data.version) {
      return { success: false, error: "Invalid export format: missing version" };
    }

    // Validate profile
    if (!data.profile || !data.profile.name) {
      return { success: false, error: "Invalid export format: missing profile data" };
    }

    // Check version compatibility
    const [major] = data.version.split(".").map(Number);
    if (major > 1) {
      warnings.push("Export is from a newer version. Some features may not be imported correctly.");
    }

    // Create profile with new ID
    const profile: UserProfile = {
      id: generateProfileId(),
      name: data.profile.name,
      avatar: data.profile.avatar,
      color: data.profile.color || "#3b82f6",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      settings: data.profile.settings,
      metadata: data.profile.metadata,
    };

    return {
      success: true,
      profile,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse import: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Import profile from file
 */
export async function importProfileFromFile(file: File): Promise<ProfileImportResult> {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = e => {
      const content = e.target?.result as string;
      resolve(parseProfileImport(content));
    };

    reader.onerror = () => {
      resolve({ success: false, error: "Failed to read file" });
    };

    reader.readAsText(file);
  });
}

// ======= Profile Utilities =======

/**
 * Generate a unique profile ID
 */
export function generateProfileId(): string {
  return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate profile name
 */
export function validateProfileName(
  name: string,
  existingNames: string[],
): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Profile name is required" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Profile name must be at least 2 characters" };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: "Profile name must be 30 characters or less" };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Profile name can only contain letters, numbers, spaces, hyphens, and underscores",
    };
  }

  if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
    return { valid: false, error: "A profile with this name already exists" };
  }

  return { valid: true };
}

/**
 * Generate initials from profile name
 */
export function getProfileInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Get profile avatar URL or generate one
 */
export function getProfileAvatar(profile: UserProfile): string {
  if (profile.avatar) {
    return profile.avatar;
  }
  // Generate a UI Avatars URL
  const initials = getProfileInitials(profile.name);
  const bgColor = profile.color.replace("#", "");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&bold=true&size=128`;
}

// ======= Data Merge Functions =======

/**
 * Merge profile data based on strategy
 */
export function mergeProfileData<T extends Record<string, unknown>>(
  existing: T | undefined,
  incoming: T | undefined,
  strategy: "replace" | "merge" | "skip",
): T | undefined {
  if (strategy === "skip") {
    return existing;
  }

  if (strategy === "replace") {
    return incoming ?? existing;
  }

  // Merge strategy
  if (!existing) return incoming;
  if (!incoming) return existing;

  return { ...existing, ...incoming };
}

/**
 * Merge array data (like measurements, achievements)
 */
export function mergeArrayData<T>(
  existing: T[] | undefined,
  incoming: T[] | undefined,
  strategy: "replace" | "merge" | "skip",
  getId: (item: T) => string,
): T[] | undefined {
  if (strategy === "skip") {
    return existing;
  }

  if (strategy === "replace") {
    return incoming ?? existing;
  }

  // Merge strategy - combine and dedupe
  if (!existing) return incoming;
  if (!incoming) return existing;

  const existingIds = new Set(existing.map(getId));
  const merged = [...existing];

  for (const item of incoming) {
    if (!existingIds.has(getId(item))) {
      merged.push(item);
    }
  }

  return merged;
}

// ======= Profile Stats =======

export interface ProfileStats {
  measurementCount: number;
  daysSinceCreation: number;
  daysSinceLastActive: number;
  achievementCount: number;
  dataSize: number; // bytes
}

/**
 * Calculate profile statistics
 */
export function calculateProfileStats(
  profile: UserProfile,
  data?: { measurements?: unknown[]; achievements?: string[] },
): ProfileStats {
  const now = new Date();
  const created = new Date(profile.createdAt);
  const lastActive = profile.metadata?.lastActive ? new Date(profile.metadata.lastActive) : now;

  return {
    measurementCount: profile.metadata?.measurementCount ?? data?.measurements?.length ?? 0,
    daysSinceCreation: Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)),
    daysSinceLastActive: Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)),
    achievementCount: data?.achievements?.length ?? 0,
    dataSize: JSON.stringify({ profile, data }).length,
  };
}

/**
 * Format data size for display
 */
export function formatDataSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
