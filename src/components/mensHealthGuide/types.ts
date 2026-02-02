import type React from "react";

export type ExperienceLevel = "all" | "beginner" | "intermediate" | "advanced";

export interface VisualStep {
  step: number;
  title: string;
  description: string;
  duration?: string;
  caution?: string;
}

export interface GuideSection {
  title: string;
  icon: React.ReactNode;
  whatIsIt: string;
  howToUse: string[];
  benefits: string[];
  cons: string[];
  warnings: string[];
  dangers: string[];
  safetyTips: string[];
  whatToLookFor: string[];
  experienceLevel: ExperienceLevel[];
  visualSteps?: VisualStep[];
}

export type RiskLevel = "low" | "medium" | "high" | "extreme";

export interface TesticularHealthGuide {
  title: string;
  icon: React.ReactNode;
  content: {
    importance: string;
    howToExam: string[];
    normalFindings: string[];
    warningSignsRequireDoctor: string[];
    commonConditions: Array<{ name: string; description: string }>;
  };
}

export interface ProstateHealthGuide {
  title: string;
  icon: React.ReactNode;
  content: {
    whatIsProstate: string;
    benefits: string[];
    howToSafely: string[];
    warnings: string[];
    signsOfProstateProblems: string[];
    screeningRecommendations: string[];
  };
}
