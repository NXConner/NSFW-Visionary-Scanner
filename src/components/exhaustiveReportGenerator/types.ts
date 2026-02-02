import type React from "react";

export interface ReportSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}
