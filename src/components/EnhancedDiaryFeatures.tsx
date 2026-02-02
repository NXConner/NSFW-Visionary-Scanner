import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  createEnhancedDiaryEntry,
  getEnhancedDiaryEntries,
  searchDiaryEntries,
  getDiaryTemplates,
  createMedicationSchedule,
  logMedicationTaken,
  generateDiaryAnalytics,
  type EnhancedDiaryEntry,
  type DiaryTemplate,
  type MedicationSchedule,
  type DiaryAnalytics,
} from "@/lib/enhancedDiaryFeatures";
import {
  BookOpen,
  Search,
  Pill,
  Moon,
  Utensils,
  Activity,
  Camera,
  Mic,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const EnhancedDiaryFeatures = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("entries");
  const [loading, setLoading] = useState(false);

  // Diary Entries
  const [entries, setEntries] = useState<EnhancedDiaryEntry[]>([]);
  const [templates, setTemplates] = useState<DiaryTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newEntry, setNewEntry] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    mood_score: 5,
    energy_level: 5,
    sleep_hours: 8,
    notes: "",
  });

  // Medications
  const [medicationSchedules, setMedicationSchedules] = useState<MedicationSchedule[]>([]);

  // Analytics
  const [analytics, setAnalytics] = useState<DiaryAnalytics | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "entries": {
          const entriesData = await getEnhancedDiaryEntries();
          setEntries(entriesData);
          break;
        }
        case "templates": {
          const templatesData = await getDiaryTemplates();
          setTemplates(templatesData);
          break;
        }
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;
    void loadData();
  }, [user, loadData]);

  const handleCreateEntry = async () => {
    if (!newEntry.entry_date) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      const entry = await createEnhancedDiaryEntry(newEntry.entry_date, {
        mood_score: newEntry.mood_score,
        energy_level: newEntry.energy_level,
        sleep_hours: newEntry.sleep_hours,
        notes: newEntry.notes,
      });
      if (entry) {
        setEntries([entry, ...entries]);
        setNewEntry({
          entry_date: new Date().toISOString().split("T")[0],
          mood_score: 5,
          energy_level: 5,
          sleep_hours: 8,
          notes: "",
        });
      }
    } catch (error) {
      toast.error("Failed to create entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadData();
      return;
    }

    setLoading(true);
    try {
      const results = await searchDiaryEntries(searchQuery);
      setEntries(results);
    } catch (error) {
      toast.error("Failed to search");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAnalytics = async () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    setLoading(true);
    try {
      const analyticsData = await generateDiaryAnalytics(startDate, endDate);
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (error) {
      toast.error("Failed to generate analytics");
    } finally {
      setLoading(false);
    }
  };

  const getMoodLabel = (score: number | null) => {
    if (score === null) return "Not set";
    if (score >= 9) return "Excellent";
    if (score >= 7) return "Good";
    if (score >= 5) return "Okay";
    if (score >= 3) return "Poor";
    return "Terrible";
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Enhanced Diary Features</h1>
        <p className="text-muted-foreground">
          Symptom tracking, medication tracking, mood, energy, sleep, diet, exercise, photos, and
          voice notes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="entries">
            <BookOpen className="w-4 h-4 mr-2" />
            Entries
          </TabsTrigger>
          <TabsTrigger value="templates">
            <BookOpen className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="w-4 h-4 mr-2" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Search
          </TabsTrigger>
        </TabsList>

        {/* Diary Entries */}
        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Diary Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 border rounded-lg space-y-3">
                <Input
                  type="date"
                  value={newEntry.entry_date}
                  onChange={e => setNewEntry({ ...newEntry, entry_date: e.target.value })}
                />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="diary-mood-score">
                      Mood (1-10)
                    </label>
                    <Input
                      id="diary-mood-score"
                      type="number"
                      min="1"
                      max="10"
                      value={newEntry.mood_score}
                      onChange={e =>
                        setNewEntry({ ...newEntry, mood_score: parseInt(e.target.value) || 5 })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getMoodLabel(newEntry.mood_score)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="diary-energy-level">
                      Energy (1-10)
                    </label>
                    <Input
                      id="diary-energy-level"
                      type="number"
                      min="1"
                      max="10"
                      value={newEntry.energy_level}
                      onChange={e =>
                        setNewEntry({ ...newEntry, energy_level: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block" htmlFor="diary-sleep-hours">
                      Sleep (hours)
                    </label>
                    <Input
                      id="diary-sleep-hours"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={newEntry.sleep_hours}
                      onChange={e =>
                        setNewEntry({ ...newEntry, sleep_hours: parseFloat(e.target.value) || 8 })
                      }
                    />
                  </div>
                </div>
                <Textarea
                  placeholder="Notes..."
                  value={newEntry.notes}
                  onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
                  rows={3}
                />
                <Button onClick={handleCreateEntry} className="w-full" disabled={loading}>
                  Create Entry
                </Button>
              </div>

              <div className="space-y-2">
                {entries.map(entry => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {new Date(entry.entry_date).toLocaleDateString()}
                            </h4>
                            {entry.mood_score && (
                              <Badge variant="outline">
                                Mood: {entry.mood_score}/10 ({getMoodLabel(entry.mood_score)})
                              </Badge>
                            )}
                            {entry.energy_level && (
                              <Badge variant="outline">Energy: {entry.energy_level}/10</Badge>
                            )}
                            {entry.sleep_hours && (
                              <Badge variant="outline">
                                <Moon className="w-3 h-3 mr-1" />
                                {entry.sleep_hours}h
                              </Badge>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground">{entry.notes}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {entry.symptom_count > 0 && (
                              <Badge variant="secondary">{entry.symptom_count} symptoms</Badge>
                            )}
                            {entry.medication_count > 0 && (
                              <Badge variant="secondary">
                                {entry.medication_count} medications
                              </Badge>
                            )}
                            {entry.photo_count > 0 && (
                              <Badge variant="secondary">
                                <Camera className="w-3 h-3 mr-1" />
                                {entry.photo_count} photos
                              </Badge>
                            )}
                            {entry.voice_note_count > 0 && (
                              <Badge variant="secondary">
                                <Mic className="w-3 h-3 mr-1" />
                                {entry.voice_note_count} voice notes
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Diary Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {templates.map(template => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">{template.template_name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <Badge variant="secondary" className="mt-2">
                        Used {template.usage_count} times
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications */}
        <TabsContent value="medications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Medication Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Track your medications and set up reminders.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Diary Analytics</CardTitle>
                <Button onClick={handleGenerateAnalytics} disabled={loading}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Analytics
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Entries</p>
                      <p className="text-2xl font-bold">{analytics.total_entries}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg Mood</p>
                      <p className="text-2xl font-bold">
                        {analytics.average_mood_score
                          ? analytics.average_mood_score.toFixed(1)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg Energy</p>
                      <p className="text-2xl font-bold">
                        {analytics.average_energy_level
                          ? analytics.average_energy_level.toFixed(1)
                          : "N/A"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Avg Sleep</p>
                      <p className="text-2xl font-bold">
                        {analytics.average_sleep_hours
                          ? `${analytics.average_sleep_hours.toFixed(1)}h`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {analytics.insights && analytics.insights.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Insights:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {analytics.insights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate Analytics" to analyze your diary entries
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search */}
        <TabsContent value="search" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Diary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {entries.map(entry => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold">
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </h4>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
