import type { LucideIcon } from "lucide-react";

export type TimeRange = "7d" | "30d" | "90d" | "6m" | "1y" | "all";
export type CompareMode = "side-by-side" | "overlay" | "difference";

export interface ScanEntry {
  id: string;
  date: Date;
  dateLabel: string;
  fullDate: string;
  length: number | null;
  circumference: number | null;
  curvatureAngle: number | null;
  source: "scan" | "diary";
}

export type StatCardColor = "primary" | "accent" | "success";

export type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  unit?: string;
  change: number;
  formatValue?: (value: number) => string;
  formatChange?: (change: number) => string;
  inverse?: boolean;
  color?: StatCardColor;
};
