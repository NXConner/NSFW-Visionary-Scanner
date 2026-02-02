import { AlertTriangle, CheckCircle2, Clock, Lightbulb, Shield, Target } from "lucide-react";

import type { PumpingRoutine, PumpingSafetyTip } from "@/components/pumping/types";

export const pumpingRoutines: PumpingRoutine[] = [
  {
    name: "Beginner Routine",
    duration: "10-15 min",
    pressure: "2-3 inHg (6.8-10.2 kPa)",
    frequency: "3x/week",
    description: "Start slow, focus on comfort. Warm up thoroughly before each session.",
    steps: [
      "5 min warm-up with warm towel",
      "Start at 2 inHg for 5 minutes",
      "Rest 1 minute",
      "Increase to 3 inHg for 5 minutes",
      "Cool down and massage",
    ],
  },
  {
    name: "Intermediate Routine",
    duration: "15-20 min",
    pressure: "3-5 inHg (10.2-16.9 kPa)",
    frequency: "4x/week",
    description: "For users with 1-3 months experience. Gradually increase intensity.",
    steps: [
      "5 min warm-up",
      "Start at 3 inHg for 5 minutes",
      "Increase to 4 inHg for 5 minutes",
      "Peak at 5 inHg for 5 minutes",
      "Gradual release and massage",
    ],
  },
  {
    name: "Advanced Routine",
    duration: "20-30 min",
    pressure: "5-7 inHg (16.9-23.7 kPa)",
    frequency: "5x/week",
    description: "For experienced users only. Listen to your body and never exceed comfort.",
    steps: [
      "10 min warm-up with heat pad",
      "Multiple sets at 5-7 inHg",
      "3x5 min sets with 2 min rest",
      "Jelqing between sets (optional)",
      "Extended cool down and massage",
    ],
  },
];

export const pumpingSafetyTips: PumpingSafetyTip[] = [
  {
    icon: AlertTriangle,
    title: "Start Low, Go Slow",
    content:
      "Begin with lower pressure (2-3 inHg / 6.8-10.2 kPa) and shorter sessions. Increase gradually over weeks.",
  },
  {
    icon: Clock,
    title: "Time Your Sessions",
    content:
      "Never exceed 20 minutes initially. Take breaks every 5-10 minutes to restore circulation.",
  },
  {
    icon: Shield,
    title: "Watch for Warning Signs",
    content: "Stop immediately if you experience pain, numbness, discoloration, or cold sensation.",
  },
  {
    icon: CheckCircle2,
    title: "Warm Up Properly",
    content: "Always warm up with a hot towel or warm water for 5 minutes before pumping.",
  },
  {
    icon: Target,
    title: "Use Water-Based Lube",
    content: "Apply water-based lubricant to create a proper seal and prevent skin irritation.",
  },
  {
    icon: Lightbulb,
    title: "Rest Days Matter",
    content: "Take at least 2 rest days per week. Recovery is when growth actually happens.",
  },
];

export const pumpingStopSignsLeft = [
  "Sharp or severe pain",
  "Numbness or tingling",
  "Blue or purple discoloration",
];
export const pumpingStopSignsRight = ["Cold sensation", "Blistering or bruising", "Any bleeding"];
