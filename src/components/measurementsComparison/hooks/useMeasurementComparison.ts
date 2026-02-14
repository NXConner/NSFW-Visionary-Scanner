import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { fetchCommunityAverages, getEmptyCommunityAverages } from "@/lib/measurementsComparison";
import type {
  CommunityAverages,
  MeasurementPoint,
  MeasurementSummary,
} from "@/lib/measurementsComparison";
import { summarize } from "@/lib/measurementsComparison";

type UseMeasurementComparisonOptions = {
  communityWindowDays?: number;
  communityMinSample?: number;
};

export function useMeasurementComparison(options: UseMeasurementComparisonOptions = {}) {
  const { communityWindowDays = 3650, communityMinSample = 25 } = options;
  const { user } = useAuth();
  const { scans, isLoading: isLocalLoading } = useData();

  const points: MeasurementPoint[] = useMemo(() => {
    return (scans || [])
      .filter(s => Number.isFinite(s.length) && Number.isFinite(s.circumference))
      .map(s => ({
        lengthCm: s.length,
        girthCm: s.circumference,
        capturedAtIso: s.created_at,
      }));
  }, [scans]);

  const latest: MeasurementPoint | null = useMemo(() => points[0] ?? null, [points]);
  const personal: MeasurementSummary = useMemo(() => summarize(points), [points]);

  const [community, setCommunity] = useState<CommunityAverages>(() =>
    getEmptyCommunityAverages({ days: communityWindowDays }),
  );
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        setCommunity(getEmptyCommunityAverages({ days: communityWindowDays }));
        return;
      }
      setIsCommunityLoading(true);
      const data = await fetchCommunityAverages(communityWindowDays, communityMinSample);
      if (cancelled) return;
      setCommunity(data);
      setIsCommunityLoading(false);
    };

    run().catch(() => {
      if (cancelled) return;
      setCommunity(getEmptyCommunityAverages({ days: communityWindowDays }));
      setIsCommunityLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, communityWindowDays, communityMinSample]);

  return {
    isLocalLoading,
    isCommunityLoading,
    isSignedIn: Boolean(user),
    latest,
    personal,
    community,
  };
}
