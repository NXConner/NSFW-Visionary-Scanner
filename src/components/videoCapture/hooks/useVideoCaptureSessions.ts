import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { getMultiCameraSessions, type MultiCameraSession } from "@/lib/nsfwAdvancedFeatures";

export function useVideoCaptureSessions(): {
  sessions: MultiCameraSession[];
  currentSession: MultiCameraSession | null;
  setCurrentSession: (next: MultiCameraSession | null) => void;
  loadingSessions: boolean;
  refreshSessions: () => Promise<void>;
  addSession: (session: MultiCameraSession) => void;
} {
  const [sessions, setSessions] = useState<MultiCameraSession[]>([]);
  const [currentSession, setCurrentSession] = useState<MultiCameraSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const currentSessionRef = useRef<MultiCameraSession | null>(null);
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  const refreshSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const list = await getMultiCameraSessions();
      setSessions(list);

      const prevId = currentSessionRef.current?.id ?? null;
      if (prevId) {
        const updated = list.find(s => s.id === prevId) ?? null;
        if (updated) setCurrentSession(updated);
        return;
      }

      if (list[0]) setCurrentSession(list[0]);
    } catch (err) {
      logger.error("useVideoCaptureSessions: failed to load sessions", { error: err });
      toast.error("Failed to load recording sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const addSession = useCallback((session: MultiCameraSession) => {
    setSessions(prev => (prev.some(s => s.id === session.id) ? prev : [session, ...prev]));
  }, []);

  return {
    sessions,
    currentSession,
    setCurrentSession,
    loadingSessions,
    refreshSessions,
    addSession,
  };
}
