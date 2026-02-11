import * as React from "react";

import type { CurvatureScanSession } from "@/scanner/curvature/types";
import { CurvatureHistoryList } from "../history/CurvatureHistoryList";
import { CurvatureHistoryDetail } from "../history/CurvatureHistoryDetail";
import { CurvatureTrends } from "../history/CurvatureTrends";

export function HistoryTab({
  sessions,
  selectedSessionId,
  selectedSession,
  onSelect,
  onDelete,
}: {
  sessions: CurvatureScanSession[];
  selectedSessionId: string | null;
  selectedSession: CurvatureScanSession | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div className="grid gap-8 grid-cols-1 lg:grid-cols-[2fr_3fr]">
      <div>
        <CurvatureHistoryList
          sessions={sessions}
          selectedId={selectedSessionId}
          onSelect={onSelect}
          onDelete={id => void onDelete(id)}
        />
      </div>
      <div>
        <div className="space-y-6">
          <CurvatureTrends sessions={sessions} />
          <CurvatureHistoryDetail session={selectedSession} />
        </div>
      </div>
    </div>
  );
}
