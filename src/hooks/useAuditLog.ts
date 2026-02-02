import { useState, useEffect, useCallback } from "react";
import {
  appendAuditLogEntry,
  clearAuditLogs,
  readAuditLogs,
  writeAuditLogs,
  type AuditLogEntry,
  type AuditLogCategory,
} from "@/lib/auditLogStorage";

export type { AuditLogEntry } from "@/lib/auditLogStorage";

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load logs from encrypted storage
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLogs(await readAuditLogs());
      } catch (error) {
        // Error silently handled
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  // Save logs to encrypted storage
  const saveLogs = useCallback(async (newLogs: AuditLogEntry[]) => writeAuditLogs(newLogs), []);

  // Add a new log entry
  const logActivity = useCallback(
    async (
      action: string,
      category: AuditLogCategory,
      details?: string,
      metadata?: Record<string, unknown>,
    ) => {
      const newEntry = await appendAuditLogEntry({ action, category, details, metadata });
      setLogs(prev => [newEntry, ...prev].slice(0, 500));
      return newEntry;
    },
    [],
  );

  // Clear all logs
  const clearLogs = useCallback(async () => {
    setLogs([]);
    await clearAuditLogs();
  }, []);

  // Clear logs older than specified days
  const clearOldLogs = useCallback(
    async (daysOld: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysOld);

      setLogs(prev => {
        const filtered = prev.filter(log => new Date(log.timestamp) > cutoff);
        saveLogs(filtered);
        return filtered;
      });
    },
    [saveLogs],
  );

  // Export logs as JSON
  const exportLogs = useCallback(() => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `growthtracker-audit-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    logActivity("Exported audit log", "export", `${logs.length} entries exported`);
  }, [logs, logActivity]);

  // Filter logs by category
  const filterByCategory = useCallback(
    (category: AuditLogEntry["category"]) => {
      return logs.filter(log => log.category === category);
    },
    [logs],
  );

  // Search logs
  const searchLogs = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return logs.filter(
        log =>
          log.action.toLowerCase().includes(lowerQuery) ||
          log.details?.toLowerCase().includes(lowerQuery),
      );
    },
    [logs],
  );

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
