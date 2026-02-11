// Symptom Journal Panel Component
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  X,
} from "lucide-react";
import {
  getSymptomJournal,
  SymptomEntry,
  SymptomType,
  SeverityLevel,
  JournalStats,
} from "@/lib/healthTracking/SymptomJournal";
import { cn } from "@/lib/utils";

interface SymptomJournalPanelProps {
  className?: string;
}

const MOOD_OPTIONS = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "😊", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "poor", emoji: "😟", label: "Poor" },
  { value: "terrible", emoji: "😣", label: "Terrible" },
] as const;

export const SymptomJournalPanel: React.FC<SymptomJournalPanelProps> = ({ className }) => {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [symptomTypes, setSymptomTypes] = useState<SymptomType[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "stats">("list");
  const journal = getSymptomJournal();

  useEffect(() => {
    setEntries(journal.getAll());
    setSymptomTypes(journal.getSymptomTypes());
    setStats(journal.getStats());
    return journal.subscribe(e => {
      setEntries(e);
      setStats(journal.getStats());
    });
  }, []);

  const [formData, setFormData] = useState({
    symptomType: "",
    severity: 5 as SeverityLevel,
    location: "",
    triggers: "",
    mood: "okay" as SymptomEntry["mood"],
    notes: "",
  });

  const handleAdd = () => {
    if (!formData.symptomType) return;
    journal.addEntry({
      symptomType: formData.symptomType,
      severity: formData.severity,
      location: formData.location || undefined,
      triggers: formData.triggers ? formData.triggers.split(",").map(t => t.trim()) : undefined,
      mood: formData.mood,
      notes: formData.notes || undefined,
    });
    setFormData({
      symptomType: "",
      severity: 5,
      location: "",
      triggers: "",
      mood: "okay",
      notes: "",
    });
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this entry?")) journal.deleteEntry(id);
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return "text-green-400 bg-green-500/20";
    if (severity <= 6) return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return <TrendingDown className="w-4 h-4 text-green-400" />;
    if (trend === "worsening") return <TrendingUp className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTypeInfo = (typeId: string) => symptomTypes.find(t => t.id === typeId);

  return (
    <div className={cn("p-4 space-y-6", className)}>
      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
            <div className="text-2xl font-bold text-purple-400">{stats.totalEntries}</div>
            <div className="text-xs text-gray-400">Total Entries</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{stats.entriesThisWeek}</div>
            <div className="text-xs text-gray-400">This Week</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/30">
            <div className="text-2xl font-bold text-amber-400">{stats.averageSeverity}</div>
            <div className="text-xs text-gray-400">Avg Severity</div>
          </div>
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">
              {getTypeInfo(stats.mostFrequentSymptom || "")?.icon || "-"}
            </div>
            <div className="text-xs text-gray-400">Most Common</div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" /> Symptom Journal
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "list" ? "stats" : "list")}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400"
          >
            {viewMode === "list" ? (
              <BarChart3 className="w-4 h-4" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Log
          </button>
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4"
          >
            {/* Symptom Type Selection */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Symptom Type</label>
              <div className="flex flex-wrap gap-2">
                {symptomTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, symptomType: type.id })}
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-all text-sm",
                      formData.symptomType === type.id
                        ? "bg-purple-500/30 border-purple-500"
                        : "bg-gray-700 border-gray-600 hover:border-gray-500",
                    )}
                  >
                    {type.icon} {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Slider */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Severity: {formData.severity}/10
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={formData.severity}
                onChange={e =>
                  setFormData({ ...formData, severity: parseInt(e.target.value) as SeverityLevel })
                }
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            {/* Mood Selection */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">Current Mood</label>
              <div className="flex gap-2">
                {MOOD_OPTIONS.map(mood => (
                  <button
                    key={mood.value}
                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                    className={cn(
                      "flex-1 py-2 rounded-lg border transition-all text-center",
                      formData.mood === mood.value
                        ? "bg-purple-500/30 border-purple-500"
                        : "bg-gray-700 border-gray-600 hover:border-gray-500",
                    )}
                  >
                    <div className="text-xl">{mood.emoji}</div>
                    <div className="text-xs mt-1">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Fields */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Location (e.g., head, back)"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Triggers (comma-separated)"
                value={formData.triggers}
                onChange={e => setFormData({ ...formData, triggers: e.target.value })}
                className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none text-sm"
              />
            </div>

            <textarea
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none resize-none h-16 text-sm"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm"
              >
                Save Entry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No symptoms logged yet</p>
            </div>
          ) : (
            entries.slice(0, 20).map(entry => {
              const typeInfo = getTypeInfo(entry.symptomType);
              const moodInfo = MOOD_OPTIONS.find(m => m.value === entry.mood);
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{typeInfo?.icon || "❓"}</div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {typeInfo?.name || entry.symptomType}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              getSeverityColor(entry.severity),
                            )}
                          >
                            Severity: {entry.severity}/10
                          </span>
                          {moodInfo && <span className="text-sm">{moodInfo.emoji}</span>}
                          {entry.location && (
                            <span className="text-xs text-gray-500">{entry.location}</span>
                          )}
                        </div>
                        {entry.triggers && entry.triggers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.triggers.map((t, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {entry.notes && <p className="text-xs text-gray-500 mt-2">{entry.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 hover:bg-gray-700 rounded text-gray-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* Pattern Analysis View */
        <div className="space-y-4">
          <h4 className="font-medium text-gray-300">Symptom Patterns (30 days)</h4>
          {stats?.patterns.map(pattern => {
            const typeInfo = getTypeInfo(pattern.symptomType);
            return (
              <div
                key={pattern.symptomType}
                className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeInfo?.icon}</span>
                    <span className="font-medium">{typeInfo?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(pattern.trend)}
                    <span className="text-sm text-gray-400 capitalize">{pattern.trend}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500">Occurrences</div>
                    <div className="font-semibold">{pattern.frequency}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Avg Severity</div>
                    <div className="font-semibold">{pattern.averageSeverity}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Peak Times</div>
                    <div className="font-semibold">{pattern.peakTimes.join(", ") || "-"}</div>
                  </div>
                </div>
                {pattern.commonTriggers.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="text-xs text-gray-500 mb-1">Common Triggers</div>
                    <div className="flex flex-wrap gap-1">
                      {pattern.commonTriggers.map((t, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SymptomJournalPanel;
