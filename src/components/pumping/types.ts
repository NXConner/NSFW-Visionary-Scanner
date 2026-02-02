import type React from "react";

export interface PumpingSession {
  id: string;
  date: string; // ISO string
  duration: number; // minutes
  pressure: number; // inHg
  lengthBefore: number;
  lengthAfter: number;
  girthBefore: number;
  girthAfter: number;
  notes: string;
}

export interface PumpingRoutine {
  name: string;
  duration: string;
  pressure: string;
  frequency: string;
  description: string;
  steps: string[];
}

export interface PumpingSafetyTip {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
}

export interface PumpingStats {
  avgLengthGain: number;
  avgGirthGain: number;
  totalSessions: number;
  totalTime: number;
}

export interface PumpingChartPoint {
  date: string;
  lengthGain: number;
  girthGain: number;
  length: number;
  girth: number;
}
