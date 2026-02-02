import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import {
  acknowledgeSexualWellnessPattern,
  getLatestSexualWellnessEntry,
  getSexualWellnessEntries,
  getSexualWellnessGoals,
  getSexualWellnessPatterns,
  getSexualWellnessStatistics,
  upsertSexualWellnessEntry,
} from "@/lib/sexualWellness";
import type {
  SexualWellnessEntryDraft,
  SexualWellnessStatistics,
  SexualWellnessTab,
  SexualWellnessEntry,
  SexualWellnessGoal,
  SexualWellnessPattern,
} from "./types";
import { OverviewStats } from "./components/OverviewStats";
import { EntryTab } from "./tabs/EntryTab";
import { HistoryTab } from "./tabs/HistoryTab";
import { GoalsTab } from "./tabs/GoalsTab";
import { InsightsTab } from "./tabs/InsightsTab";

function defaultEntry(): SexualWellnessEntryDraft {
  return {
    entry_date: new Date().toISOString().split("T")[0],
    erectile_function_score: undefined,
    libido_level: undefined,
    overall_satisfaction: undefined,
    sexual_confidence: undefined,
    sexual_activity_count: 0,
    activity_type: "none",
  };
}

export const SexualWellnessTracking = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<SexualWellnessTab>("entry");
  const [loading, setLoading] = useState(false);

  const [entries, setEntries] = useState<SexualWellnessEntry[]>([]);
  const [goals, setGoals] = useState<SexualWellnessGoal[]>([]);
  const [patterns, setPatterns] = useState<SexualWellnessPattern[]>([]);
  const [statistics, setStatistics] = useState<SexualWellnessStatistics | null>(null);

  const [entry, setEntry] = useState<SexualWellnessEntryDraft>(defaultEntry());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesData, goalsData, patternsData, statsData] = await Promise.all([
        getSexualWellnessEntries(),
        getSexualWellnessGoals(),
        getSexualWellnessPatterns(true),
        getSexualWellnessStatistics(),
      ]);
      setEntries(entriesData);
      setGoals(goalsData);
      setPatterns(patternsData);
      setStatistics(statsData);

      const latest = await getLatestSexualWellnessEntry();
      if (latest) setEntry(prev => ({ ...prev, ...latest }));
    } catch (error) {
      toast.error("Failed to load sexual wellness data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitEntry = useCallback(async () => {
    if (!entry.entry_date) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      const payload: Omit<
        SexualWellnessEntry,
        "id" | "user_id" | "created_at" | "updated_at" | "wellness_score"
      > = {
        entry_date: entry.entry_date,
        erectile_function_score: entry.erectile_function_score,
        ejaculation_quality_score: entry.ejaculation_quality_score,
        orgasm_intensity_score: entry.orgasm_intensity_score,
        stamina_duration_minutes: entry.stamina_duration_minutes,
        libido_level: entry.libido_level,
        desire_frequency: entry.desire_frequency,
        morning_erections: entry.morning_erections,
        overall_satisfaction: entry.overall_satisfaction,
        partner_satisfaction: entry.partner_satisfaction,
        sexual_confidence: entry.sexual_confidence,
        sexual_activity_count: entry.sexual_activity_count ?? 0,
        masturbation_count: entry.masturbation_count,
        activity_type: entry.activity_type ?? "none",
        relationship_satisfaction: entry.relationship_satisfaction,
        communication_quality: entry.communication_quality,
        intimacy_level: entry.intimacy_level,
        stress_level: entry.stress_level,
        sleep_quality: entry.sleep_quality,
        exercise_level: entry.exercise_level,
        alcohol_consumption: entry.alcohol_consumption,
        notes: entry.notes,
      };

      await upsertSexualWellnessEntry(payload);
      toast.success("Sexual wellness entry saved");
      await loadData();
      setEntry(defaultEntry());
    } catch (error) {
      toast.error("Failed to save entry");
    } finally {
      setLoading(false);
    }
  }, [entry, loadData]);

  const handleCreateGoal = useCallback(() => {
    toast.info("Goal creation UI coming next");
  }, []);

  const handleAcknowledgePattern = useCallback(
    async (patternId: string) => {
      try {
        await acknowledgeSexualWellnessPattern(patternId);
        await loadData();
        toast.success("Pattern acknowledged");
      } catch {
        toast.error("Failed to acknowledge pattern");
      }
    },
    [loadData],
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Sexual Wellness</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="gradient-text">Sexual Wellness</span> Tracking
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Track your sexual function, libido, satisfaction, and overall wellness over time.
        </p>
      </div>

      <OverviewStats statistics={statistics} />

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as SexualWellnessTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entry">New Entry</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="entry">
          <EntryTab
            loading={loading}
            entry={entry}
            onChange={setEntry}
            onSubmit={handleSubmitEntry}
          />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab entries={entries} />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsTab goals={goals} onCreateGoal={handleCreateGoal} />
        </TabsContent>
        <TabsContent value="insights">
          <InsightsTab
            patterns={patterns}
            onAcknowledge={id => void handleAcknowledgePattern(id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
