import type React from "react";
import type { LucideIcon } from "lucide-react";

export type TutorialAnimation =
  | "position"
  | "lighting"
  | "distance"
  | "stability"
  | "capture"
  | "grid"
  | "results";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon | React.ElementType;
  animation: TutorialAnimation;
  tips: string[];
  doList: string[];
  dontList: string[];
}

export interface ScannerTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}
