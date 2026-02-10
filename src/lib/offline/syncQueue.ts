/**
 * Offline Sync Queue
 * Background sync queue for offline mode with retry logic and conflict resolution
 */

import { v4 as uuidv4 } from 'uuid';

export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
export type SyncPriority = 'low' | 'normal' | 'high' | 'critical';

export interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  metadata: {
    createdAt: string;
    updatedAt: string;
    attempts: number;
    maxRetries: number;
    priority: SyncPriority;
    lastError?: string;
    nextRetryAt?: string;
    conflictData?: Record<string, unknown>;
  };
  status: SyncStatus;
}

export interface SyncQueueStats {
  pending: number;
  syncing: number;
  synced: number;
  failed: number;
  conflict: number;
  total: number;
  oldestPending: string | null;
  newestPending: string | null;
}

export interface SyncQueueConfig {
  maxRetries: number;
  baseRetryDelay: number; // ms
  maxRetryDelay: number; // ms
  batchSize: number;
  conflictResolution: 'local' | 'remote' | 'manual';
  persistKey: string;
}

const DEFAULT_CONFIG: SyncQueueConfig = {
  maxRetries: 5,
  baseRetryDelay: 1000,
  maxRetryDelay: 60000,
  batchSize: 10,
  conflictResolution: 'local',
  persistKey: 'morphoscan_sync_queue',
};

export type SyncHandler = (item: SyncQueueItem) => Promise<{
  success: boolean;
  error?: string;
  conflict?: boolean;
  remoteData?: Record<string, unknown>;
}>;

export class SyncQueue {
  private queue: Map<string, SyncQueueItem> = new Map();
  private config: SyncQueueConfig;
  private handlers: Map<string, SyncHandler> = new Map();
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(stats: SyncQueueStats) => void> = new Set();

  constructor(config: Partial<SyncQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  // ======= Queue Management =======

  /**
   * Add an item to the sync queue
   */
  add(
    entityType: string,
    entityId: string,
    operation: SyncOperation,
    data: Record<string, unknown>,
    priority: SyncPriority = 'normal'
  ): string {
    const id = uuidv4();
    const now = new Date().toISOString();

    const item: SyncQueueItem = {
      id,
      entityType,
      entityId,
      operation,
      data,
      metadata: {
        createdAt: now,
        updatedAt: now,
        attempts: 0,
        maxRetries: this.config.maxRetries,
        priority,
      },
      status: 'pending',
    };

    // Check for existing item with same entity
    const existingKey = this.findExistingItem(entityType, entityId);
    if (existingKey) {
      // Merge or replace based on operation
      const existing = this.queue.get(existingKey)!;
      if (operation === 'delete') {
        // Delete takes precedence
        this.queue.delete(existingKey);
        if (existing.operation === 'create') {
          // If we created then deleted, just remove both
          this.persistToStorage();
          this.notifyListeners();
          return id;
        }
      } else if (operation === 'update' && existing.operation === 'create') {
        // Keep as create with updated data
        existing.data = { ...existing.data, ...data };
        existing.metadata.updatedAt = now;
        this.persistToStorage();
        this.notifyListeners();
        return existing.id;
      }
    }

    this.queue.set(id, item);
    this.persistToStorage();
    this.notifyListeners();
    return id;
  }

  /**
   * Remove an item from the queue
   */
  remove(id: string): boolean {
    const deleted = this.queue.delete(id);
    if (deleted) {
      this.persistToStorage();
      this.notifyListeners();
    }
    return deleted;
  }

  /**
   * Get an item by ID
   */
  get(id: string): SyncQueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all pending items sorted by priority and creation time
   */
  getPending(): SyncQueueItem[] {
    const priorityOrder: Record<SyncPriority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    return Array.from(this.queue.values())
      .filter(item => item.status === 'pending')
      .filter(item => {
        if (!item.metadata.nextRetryAt) return true;
        return new Date(item.metadata.nextRetryAt) <= new Date();
      })
      .sort((a, b) => {
        const priorityDiff = priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime();
      });
  }

  /**
   * Get all failed items
   */
  getFailed(): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === 'failed');
  }

  /**
   * Get all items with conflicts
   */
  getConflicts(): SyncQueueItem[] {
    return Array.from(this.queue.values()).filter(item => item.status === 'conflict');
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.queue.clear();
    this.persistToStorage();
    this.notifyListeners();
  }

  /**
   * Clear synced items
   */
  clearSynced(): void {
    for (const [id, item] of this.queue) {
      if (item.status === 'synced') {
        this.queue.delete(id);
      }
    }
    this.persistToStorage();
    this.notifyListeners();
  }

  // ======= Sync Operations =======

  /**
   * Register a sync handler for an entity type
   */
  registerHandler(entityType: string, handler: SyncHandler): void {
    this.handlers.set(entityType, handler);
  }

  /**
   * Start background sync
   */
  startBackgroundSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      this.stopBackgroundSync();
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, intervalMs);

    // Listen for online event
    window.addEventListener('online', this.handleOnline);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
  }

  private handleOnline = (): void => {
    if (!this.isSyncing) {
      this.sync();
    }
  };

  /**
   * Sync pending items
   */
  async sync(): Promise<{ synced: number; failed: number; conflicts: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      const pending = this.getPending().slice(0, this.config.batchSize);

      for (const item of pending) {
        const handler = this.handlers.get(item.entityType);
        if (!handler) {
          console.warn(`No handler registered for entity type: ${item.entityType}`);
          continue;
        }

        item.status = 'syncing';
        item.metadata.attempts++;
        item.metadata.updatedAt = new Date().toISOString();
        this.notifyListeners();

        try {
          const result = await handler(item);

          if (result.success) {
            item.status = 'synced';
            synced++;
          } else if (result.conflict) {
            item.status = 'conflict';
            item.metadata.conflictData = result.remoteData;
            conflicts++;
          } else {
            if (item.metadata.attempts >= item.metadata.maxRetries) {
              item.status = 'failed';
              item.metadata.lastError = result.error || 'Max retries exceeded';
              failed++;
            } else {
              item.status = 'pending';
              item.metadata.lastError = result.error;
              item.metadata.nextRetryAt = this.calculateNextRetry(item.metadata.attempts);
            }
          }
        } catch (error) {
          if (item.metadata.attempts >= item.metadata.maxRetries) {
            item.status = 'failed';
            item.metadata.lastError = error instanceof Error ? error.message : 'Unknown error';
            failed++;
          } else {
            item.status = 'pending';
            item.metadata.lastError = error instanceof Error ? error.message : 'Unknown error';
            item.metadata.nextRetryAt = this.calculateNextRetry(item.metadata.attempts);
          }
        }

        item.metadata.updatedAt = new Date().toISOString();
      }

      this.persistToStorage();
      this.notifyListeners();
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed, conflicts };
  }

  /**
   * Retry a specific failed item
   */
  async retry(id: string): Promise<boolean> {
    const item = this.queue.get(id);
    if (!item || item.status !== 'failed') {
      return false;
    }

    item.status = 'pending';
    item.metadata.attempts = 0;
    item.metadata.nextRetryAt = undefined;
    this.persistToStorage();
    this.notifyListeners();

    await this.sync();
    return this.queue.get(id)?.status === 'synced';
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(id: string, useLocal: boolean): void {
    const item = this.queue.get(id);
    if (!item || item.status !== 'conflict') {
      return;
    }

    if (useLocal) {
      // Keep local data, reset for sync
      item.status = 'pending';
      item.metadata.attempts = 0;
      item.metadata.conflictData = undefined;
    } else {
      // Use remote data, mark as synced
      item.status = 'synced';
      if (item.metadata.conflictData) {
        item.data = item.metadata.conflictData;
      }
    }

    item.metadata.updatedAt = new Date().toISOString();
    this.persistToStorage();
    this.notifyListeners();
  }

  // ======= Stats and Listeners =======

  /**
   * Get queue statistics
   */
  getStats(): SyncQueueStats {
    const items = Array.from(this.queue.values());
    const pending = items.filter(i => i.status === 'pending');

    return {
      pending: pending.length,
      syncing: items.filter(i => i.status === 'syncing').length,
      synced: items.filter(i => i.status === 'synced').length,
      failed: items.filter(i => i.status === 'failed').length,
      conflict: items.filter(i => i.status === 'conflict').length,
      total: items.length,
      oldestPending: pending.length > 0
        ? pending.sort((a, b) => 
            new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime()
          )[0].metadata.createdAt
        : null,
      newestPending: pending.length > 0
        ? pending.sort((a, b) => 
            new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
          )[0].metadata.createdAt
        : null,
    };
  }

  /**
   * Subscribe to stats updates
   */
  subscribe(listener: (stats: SyncQueueStats) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ======= Private Helpers =======

  private findExistingItem(entityType: string, entityId: string): string | undefined {
    for (const [id, item] of this.queue) {
      if (item.entityType === entityType && item.entityId === entityId && item.status === 'pending') {
        return id;
      }
    }
    return undefined;
  }

  private calculateNextRetry(attempts: number): string {
    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(2, attempts),
      this.config.maxRetryDelay
    );
    return new Date(Date.now() + delay).toISOString();
  }

  private persistToStorage(): void {
    try {
      const data = Array.from(this.queue.entries());
      localStorage.setItem(this.config.persistKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.persistKey);
      if (stored) {
        const data: [string, SyncQueueItem][] = JSON.parse(stored);
        this.queue = new Map(data);
        
        // Reset any items that were syncing when we last closed
        for (const item of this.queue.values()) {
          if (item.status === 'syncing') {
            item.status = 'pending';
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      listener(stats);
    }
  }
}

// Singleton instance
let syncQueueInstance: SyncQueue | null = null;

export function getSyncQueue(config?: Partial<SyncQueueConfig>): SyncQueue {
  if (!syncQueueInstance) {
    syncQueueInstance = new SyncQueue(config);
  }
  return syncQueueInstance;
}

export function resetSyncQueue(): void {
  if (syncQueueInstance) {
    syncQueueInstance.stopBackgroundSync();
    syncQueueInstance = null;
  }
}
