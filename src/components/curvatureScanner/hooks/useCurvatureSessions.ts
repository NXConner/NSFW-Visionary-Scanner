import * as React from "react";

import type { CurvatureScanSession } from "@/scanner/curvature/types";
import { loadCurvatureSessions, saveCurvatureSessions } from "@/scanner/curvature/storage";

export function useCurvatureSessions() {
  const [sessions, setSessions] = React.useState<CurvatureScanSession[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadCurvatureSessions();
      setSessions(next);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const addSession = React.useCallback(
    async (session: CurvatureScanSession) => {
      const next = [session, ...sessions];
      setSessions(next);
      await saveCurvatureSessions(next);
    },
    [sessions],
  );

  const deleteSession = React.useCallback(
    async (id: string) => {
      const next = sessions.filter(s => s.id !== id);
      setSessions(next);
      await saveCurvatureSessions(next);
    },
    [sessions],
  );

  return { sessions, loading, refresh, addSession, deleteSession };
}
