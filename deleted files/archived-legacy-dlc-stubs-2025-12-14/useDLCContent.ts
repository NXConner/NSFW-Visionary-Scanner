/**
 * DLC Content Hook
 * React hook for managing DLC content state
 */

import { useState, useEffect, useCallback } from "react";
import { hasDLCLicense, getDLCStatus } from "@/lib/dlcManager";
import { getDLCPacks, getDLCPurchases, DLCPack, DLCPurchase } from "@/lib/enhancedDLCSystem";
import {
  getAvailableDLCPacks,
  getOwnedDLCPacks,
  loadDLCPackContent,
  getDLCContentByType,
  getDLCContentCount,
  DLCContentItem,
} from "@/lib/dlcContentLoader";

export interface DLCStatus {
  hasLicense: boolean;
  isActive: boolean;
  version?: string;
  expirationDate?: Date;
  hasUpdate: boolean;
}

export interface UseDLCContentReturn {
  // Status
  status: DLCStatus | null;
  isLoading: boolean;
  error: string | null;

  // Packs
  availablePacks: Array<DLCPack & { isOwned: boolean }>;
  ownedPacks: DLCPack[];
  purchases: DLCPurchase[];

  // Content
  loadedContent: DLCContentItem[];
  contentCount: { total: number; byType: Record<string, number> };

  // Actions
  refreshStatus: () => Promise<void>;
  refreshPacks: () => Promise<void>;
  loadPackContent: (packId: string) => Promise<DLCContentItem[]>;
  getContentByType: (type: DLCContentItem["type"]) => Promise<DLCContentItem[]>;

  // Utilities
  hasAccess: (packId: string) => boolean;
  isPremiumContent: (contentId: string) => boolean;
}

export function useDLCContent(): UseDLCContentReturn {
  const [status, setStatus] = useState<DLCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availablePacks, setAvailablePacks] = useState<Array<DLCPack & { isOwned: boolean }>>([]);
  const [ownedPacks, setOwnedPacks] = useState<DLCPack[]>([]);
  const [purchases, setPurchases] = useState<DLCPurchase[]>([]);

  const [loadedContent, setLoadedContent] = useState<DLCContentItem[]>([]);
  const [contentCount, setContentCount] = useState<{
    total: number;
    byType: Record<string, number>;
  }>({
    total: 0,
    byType: {},
  });

  const refreshStatus = useCallback(async () => {
    try {
      const dlcStatus = await getDLCStatus();
      setStatus(dlcStatus);
    } catch (err) {
      setError("Failed to load DLC status");
    }
  }, []);

  const refreshPacks = useCallback(async () => {
    try {
      setIsLoading(true);
      const [available, owned, userPurchases, count] = await Promise.all([
        getAvailableDLCPacks(),
        getOwnedDLCPacks(),
        getDLCPurchases(),
        getDLCContentCount(),
      ]);

      setAvailablePacks(available);
      setOwnedPacks(owned);
      setPurchases(userPurchases);
      setContentCount(count);
      setError(null);
    } catch (err) {
      setError("Failed to load DLC packs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPackContent = useCallback(async (packId: string): Promise<DLCContentItem[]> => {
    try {
      const content = await loadDLCPackContent(packId);
      setLoadedContent(prev => [...prev, ...content]);
      return content;
    } catch {
      return [];
    }
  }, []);

  const getContentByType = useCallback(
    async (type: DLCContentItem["type"]): Promise<DLCContentItem[]> => {
      return getDLCContentByType(type);
    },
    [],
  );

  const hasAccess = useCallback(
    (packId: string): boolean => {
      return purchases.some(p => p.pack_id === packId && p.is_active);
    },
    [purchases],
  );

  const isPremiumContent = useCallback(
    (contentId: string): boolean => {
      // Check if content requires DLC access
      return loadedContent.some(c => c.id === contentId);
    },
    [loadedContent],
  );

  // Initial load
  useEffect(() => {
    Promise.all([refreshStatus(), refreshPacks()]);
  }, [refreshStatus, refreshPacks]);

  return {
    status,
    isLoading,
    error,
    availablePacks,
    ownedPacks,
    purchases,
    loadedContent,
    contentCount,
    refreshStatus,
    refreshPacks,
    loadPackContent,
    getContentByType,
    hasAccess,
    isPremiumContent,
  };
}

export default useDLCContent;
