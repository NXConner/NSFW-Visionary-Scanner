// Medication Tracking System with Reminders
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: "daily" | "twice_daily" | "weekly" | "as_needed" | "custom";
  customSchedule?: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  reminders: MedicationReminder[];
  logs: MedicationLog[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationReminder {
  id: string;
  time: string; // HH:mm format
  days: number[]; // 0-6 for Sun-Sat
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  timestamp: string;
  status: "taken" | "skipped" | "late";
  notes?: string;
  dosageAdjustment?: string;
}

export interface MedicationStats {
  totalMedications: number;
  activeMedications: number;
  adherenceRate: number;
  streakDays: number;
  missedDoses: number;
  lastLogDate?: string;
}

const STORAGE_KEY = "medication_tracker";

export class MedicationTracker {
  private medications: Map<string, Medication> = new Map();
  private listeners: Set<(meds: Medication[]) => void> = new Set();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.forEach((med: Medication) => this.medications.set(med.id, med));
      }
    } catch (e) {
      logger.error("[medications] failed to load", { error: e });
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.medications.values())));
      this.notifyListeners();
    } catch (e) {
      logger.error("[medications] failed to save", { error: e });
    }
  }

  private notifyListeners(): void {
    const meds = this.getAll();
    this.listeners.forEach(cb => cb(meds));
  }

  subscribe(callback: (meds: Medication[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  add(medication: Omit<Medication, "id" | "logs" | "createdAt" | "updatedAt">): Medication {
    const now = new Date().toISOString();
    const med: Medication = {
      ...medication,
      id: uuidv4(),
      logs: [],
      createdAt: now,
      updatedAt: now,
    };
    this.medications.set(med.id, med);
    this.save();
    return med;
  }

  update(id: string, updates: Partial<Medication>): Medication | null {
    const med = this.medications.get(id);
    if (!med) return null;
    const updated = { ...med, ...updates, updatedAt: new Date().toISOString() };
    this.medications.set(id, updated);
    this.save();
    return updated;
  }

  delete(id: string): boolean {
    const result = this.medications.delete(id);
    if (result) this.save();
    return result;
  }

  get(id: string): Medication | undefined {
    return this.medications.get(id);
  }

  getAll(): Medication[] {
    return Array.from(this.medications.values());
  }

  getActive(): Medication[] {
    return this.getAll().filter(m => m.isActive);
  }

  logDose(
    medicationId: string,
    status: MedicationLog["status"],
    notes?: string,
  ): MedicationLog | null {
    const med = this.medications.get(medicationId);
    if (!med) return null;

    const log: MedicationLog = {
      id: uuidv4(),
      medicationId,
      timestamp: new Date().toISOString(),
      status,
      notes,
    };

    med.logs.push(log);
    med.updatedAt = new Date().toISOString();
    this.medications.set(medicationId, med);
    this.save();
    return log;
  }

  getLogs(medicationId: string, days: number = 30): MedicationLog[] {
    const med = this.medications.get(medicationId);
    if (!med) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return med.logs.filter(log => new Date(log.timestamp) >= cutoff);
  }

  getStats(): MedicationStats {
    const all = this.getAll();
    const active = all.filter(m => m.isActive);
    const allLogs = all.flatMap(m => m.logs);
    const recentLogs = allLogs.filter(log => {
      const d = new Date(log.timestamp);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return d >= cutoff;
    });

    const taken = recentLogs.filter(l => l.status === "taken").length;
    const adherenceRate = recentLogs.length > 0 ? (taken / recentLogs.length) * 100 : 100;

    return {
      totalMedications: all.length,
      activeMedications: active.length,
      adherenceRate: Math.round(adherenceRate),
      streakDays: this.calculateStreak(),
      missedDoses: recentLogs.filter(l => l.status === "skipped").length,
      lastLogDate: allLogs.length > 0 ? allLogs[allLogs.length - 1]?.timestamp : undefined,
    };
  }

  private calculateStreak(): number {
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const logsForDay = this.getAll()
        .flatMap(m => m.logs)
        .filter(l => l.timestamp.startsWith(dateStr) && l.status === "taken");
      if (logsForDay.length > 0) streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  getDueReminders(): { medication: Medication; reminder: MedicationReminder }[] {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const currentDay = now.getDay();
    const due: { medication: Medication; reminder: MedicationReminder }[] = [];

    this.getActive().forEach(med => {
      med.reminders.forEach(reminder => {
        if (
          reminder.enabled &&
          reminder.days.includes(currentDay) &&
          reminder.time === currentTime
        ) {
          due.push({ medication: med, reminder });
        }
      });
    });

    return due;
  }
}

let instance: MedicationTracker | null = null;
export function getMedicationTracker(): MedicationTracker {
  if (!instance) instance = new MedicationTracker();
  return instance;
}
