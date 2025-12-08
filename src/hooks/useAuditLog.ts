import { useState, useEffect, useCallback } from 'react';
import { encryptData, decryptData } from '@/lib/encryption';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'scan' | 'export' | 'settings' | 'auth' | 'data' | 'report';
  details?: string;
  metadata?: Record<string, any>;
}

const AUDIT_LOG_KEY = 'morphoscan_audit_log';
const MAX_LOG_ENTRIES = 500;

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load logs from encrypted storage
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const encrypted = localStorage.getItem(AUDIT_LOG_KEY);
        if (encrypted) {
          const decrypted = await decryptData(encrypted);
          if (decrypted) {
            setLogs(JSON.parse(decrypted));
          }
        }
      } catch (error) {
        console.error('Failed to load audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  // Save logs to encrypted storage
  const saveLogs = useCallback(async (newLogs: AuditLogEntry[]) => {
    try {
      const encrypted = await encryptData(JSON.stringify(newLogs));
      localStorage.setItem(AUDIT_LOG_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save audit logs:', error);
    }
  }, []);

  // Add a new log entry
  const logActivity = useCallback(async (
    action: string,
    category: AuditLogEntry['category'],
    details?: string,
    metadata?: Record<string, any>
  ) => {
    const newEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      category,
      details,
      metadata,
    };

    setLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_LOG_ENTRIES);
      saveLogs(updated);
      return updated;
    });

    return newEntry;
  }, [saveLogs]);

  // Clear all logs
  const clearLogs = useCallback(async () => {
    setLogs([]);
    localStorage.removeItem(AUDIT_LOG_KEY);
  }, []);

  // Clear logs older than specified days
  const clearOldLogs = useCallback(async (daysOld: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    
    setLogs(prev => {
      const filtered = prev.filter(log => new Date(log.timestamp) > cutoff);
      saveLogs(filtered);
      return filtered;
    });
  }, [saveLogs]);

  // Export logs as JSON
  const exportLogs = useCallback(() => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `growthtracker-audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logActivity('Exported audit log', 'export', `${logs.length} entries exported`);
  }, [logs, logActivity]);

  // Filter logs by category
  const filterByCategory = useCallback((category: AuditLogEntry['category']) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  // Search logs
  const searchLogs = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return logs.filter(log => 
      log.action.toLowerCase().includes(lowerQuery) ||
      log.details?.toLowerCase().includes(lowerQuery)
    );
  }, [logs]);

  return {
    logs,
    isLoading,
    logActivity,
    clearLogs,
    clearOldLogs,
    exportLogs,
    filterByCategory,
    searchLogs,
  };
};
