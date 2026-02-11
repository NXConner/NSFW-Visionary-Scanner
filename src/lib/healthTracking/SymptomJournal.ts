// Symptom Journal with Severity Scales
import { v4 as uuidv4 } from "uuid";

export type SeverityLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface SymptomEntry {
  id: string;
  symptomType: string;
  severity: SeverityLevel;
  location?: string;
  duration?: string;
  triggers?: string[];
  relievingFactors?: string[];
  notes?: string;
  mood?: "great" | "good" | "okay" | "poor" | "terrible";
  timestamp: string;
  attachments?: string[];
}

export interface SymptomType {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "physical" | "mental" | "digestive" | "respiratory" | "other";
}

export interface SymptomPattern {
  symptomType: string;
  frequency: number;
  averageSeverity: number;
  trend: "improving" | "worsening" | "stable";
  commonTriggers: string[];
  peakTimes: string[];
}

export interface JournalStats {
  totalEntries: number;
  entriesThisWeek: number;
  averageSeverity: number;
  mostFrequentSymptom?: string;
  patterns: SymptomPattern[];
}

const DEFAULT_SYMPTOM_TYPES: SymptomType[] = [
  { id: "pain", name: "Pain", icon: "🔴", color: "#ef4444", category: "physical" },
  { id: "fatigue", name: "Fatigue", icon: "😴", color: "#f59e0b", category: "physical" },
  { id: "nausea", name: "Nausea", icon: "🤢", color: "#22c55e", category: "digestive" },
  { id: "headache", name: "Headache", icon: "🤕", color: "#8b5cf6", category: "physical" },
  { id: "anxiety", name: "Anxiety", icon: "😰", color: "#6366f1", category: "mental" },
  {
    id: "shortness_of_breath",
    name: "Shortness of Breath",
    icon: "😮‍💨",
    color: "#0ea5e9",
    category: "respiratory",
  },
  { id: "dizziness", name: "Dizziness", icon: "😵", color: "#ec4899", category: "physical" },
  { id: "insomnia", name: "Insomnia", icon: "🌙", color: "#64748b", category: "mental" },
];

const STORAGE_KEY = "symptom_journal";
const TYPES_KEY = "symptom_types";

export class SymptomJournal {
  private entries: Map<string, SymptomEntry> = new Map();
  private customTypes: SymptomType[] = [];
  private listeners: Set<(entries: SymptomEntry[]) => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((entry: SymptomEntry) => this.entries.set(entry.id, entry));
      }
      const types = localStorage.getItem(TYPES_KEY);
      if (types) this.customTypes = JSON.parse(types);
    } catch (e) {
      console.error("Failed to load symptom journal:", e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.entries.values())));
      localStorage.setItem(TYPES_KEY, JSON.stringify(this.customTypes));
      this.notifyListeners();
    } catch (e) {
      console.error("Failed to save symptom journal:", e);
    }
  }

  private notifyListeners(): void {
    const entries = this.getAll();
    this.listeners.forEach(cb => cb(entries));
  }

  subscribe(callback: (entries: SymptomEntry[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  addEntry(entry: Omit<SymptomEntry, "id" | "timestamp">): SymptomEntry {
    const newEntry: SymptomEntry = {
      ...entry,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    this.entries.set(newEntry.id, newEntry);
    this.save();
    return newEntry;
  }

  updateEntry(id: string, updates: Partial<SymptomEntry>): SymptomEntry | null {
    const entry = this.entries.get(id);
    if (!entry) return null;
    const updated = { ...entry, ...updates };
    this.entries.set(id, updated);
    this.save();
    return updated;
  }

  deleteEntry(id: string): boolean {
    const result = this.entries.delete(id);
    if (result) this.save();
    return result;
  }

  getEntry(id: string): SymptomEntry | undefined {
    return this.entries.get(id);
  }

  getAll(): SymptomEntry[] {
    return Array.from(this.entries.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  getByDateRange(startDate: Date, endDate: Date): SymptomEntry[] {
    return this.getAll().filter(entry => {
      const d = new Date(entry.timestamp);
      return d >= startDate && d <= endDate;
    });
  }

  getBySymptomType(symptomType: string): SymptomEntry[] {
    return this.getAll().filter(entry => entry.symptomType === symptomType);
  }

  getSymptomTypes(): SymptomType[] {
    return [...DEFAULT_SYMPTOM_TYPES, ...this.customTypes];
  }

  addSymptomType(type: Omit<SymptomType, "id">): SymptomType {
    const newType = { ...type, id: uuidv4() };
    this.customTypes.push(newType);
    this.save();
    return newType;
  }

  analyzePatterns(days: number = 30): SymptomPattern[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recentEntries = this.getAll().filter(e => new Date(e.timestamp) >= cutoff);

    const byType = new Map<string, SymptomEntry[]>();
    recentEntries.forEach(entry => {
      const list = byType.get(entry.symptomType) || [];
      list.push(entry);
      byType.set(entry.symptomType, list);
    });

    const patterns: SymptomPattern[] = [];
    byType.forEach((entries, symptomType) => {
      const avgSeverity = entries.reduce((sum, e) => sum + e.severity, 0) / entries.length;
      const allTriggers = entries.flatMap(e => e.triggers || []);
      const triggerCounts = new Map<string, number>();
      allTriggers.forEach(t => triggerCounts.set(t, (triggerCounts.get(t) || 0) + 1));

      const hours = entries.map(e => new Date(e.timestamp).getHours());
      const peakHours = this.findPeakHours(hours);

      // Calculate trend
      const firstHalf = entries.slice(Math.floor(entries.length / 2));
      const secondHalf = entries.slice(0, Math.floor(entries.length / 2));
      const firstAvg = firstHalf.reduce((s, e) => s + e.severity, 0) / (firstHalf.length || 1);
      const secondAvg = secondHalf.reduce((s, e) => s + e.severity, 0) / (secondHalf.length || 1);
      let trend: "improving" | "worsening" | "stable" = "stable";
      if (secondAvg < firstAvg - 1) trend = "improving";
      else if (secondAvg > firstAvg + 1) trend = "worsening";

      patterns.push({
        symptomType,
        frequency: entries.length,
        averageSeverity: Math.round(avgSeverity * 10) / 10,
        trend,
        commonTriggers: Array.from(triggerCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([t]) => t),
        peakTimes: peakHours,
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  private findPeakHours(hours: number[]): string[] {
    const counts = new Map<number, number>();
    hours.forEach(h => counts.set(h, (counts.get(h) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([h]) => `${h}:00`);
  }

  getStats(): JournalStats {
    const all = this.getAll();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = all.filter(e => new Date(e.timestamp) >= weekAgo);

    const typeCounts = new Map<string, number>();
    all.forEach(e => typeCounts.set(e.symptomType, (typeCounts.get(e.symptomType) || 0) + 1));
    const mostFrequent = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      totalEntries: all.length,
      entriesThisWeek: thisWeek.length,
      averageSeverity:
        all.length > 0
          ? Math.round((all.reduce((s, e) => s + e.severity, 0) / all.length) * 10) / 10
          : 0,
      mostFrequentSymptom: mostFrequent?.[0],
      patterns: this.analyzePatterns(),
    };
  }

  exportData(): string {
    return JSON.stringify(
      {
        entries: this.getAll(),
        customTypes: this.customTypes,
        exportDate: new Date().toISOString(),
      },
      null,
      2,
    );
  }
}

let instance: SymptomJournal | null = null;
export function getSymptomJournal(): SymptomJournal {
  if (!instance) instance = new SymptomJournal();
  return instance;
}
