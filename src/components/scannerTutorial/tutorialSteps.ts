import {
  Sun,
  Smartphone,
  Move,
  Hand,
  Grid3X3,
  Camera,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import type { TutorialStep } from "./types";

export const tutorialSteps: TutorialStep[] = [
  {
    id: "intro",
    title: "Welcome to Scanner Tutorial",
    description:
      "Learn how to get accurate measurements with our AI-powered scanner. This tutorial will guide you through best practices.",
    icon: GraduationCap,
    animation: "position",
    tips: [
      "Complete this tutorial once to master scanning",
      "You can revisit anytime from settings",
    ],
    doList: ["Follow each step carefully", "Practice with the interactive demos"],
    dontList: ["Skip steps if you're new", "Rush through the tutorial"],
  },
  {
    id: "lighting",
    title: "Proper Lighting",
    description:
      "Good lighting is crucial for accurate measurements. The scanner needs clear visibility to detect edges and measure properly.",
    icon: Sun,
    animation: "lighting",
    tips: [
      "Natural daylight works best",
      "Avoid direct sunlight causing harsh shadows",
      "Use diffused artificial light if needed",
    ],
    doList: [
      "Use bright, even lighting",
      "Position light source in front",
      "Check the quality indicator",
    ],
    dontList: ["Scan in dim conditions", "Have light behind the subject", "Create harsh shadows"],
  },
  {
    id: "positioning",
    title: "Device Positioning",
    description:
      "Hold your device correctly for the best scanning results. Position and angle matter for measurement accuracy.",
    icon: Smartphone,
    animation: "position",
    tips: [
      "Use a tripod or stable surface when possible",
      "The positioning guide shows optimal placement",
    ],
    doList: [
      "Hold device parallel to subject",
      "Keep camera perpendicular (90°)",
      "Center subject in frame",
    ],
    dontList: [
      "Tilt the device at angles",
      "Hold too close or too far",
      "Obstruct the camera lens",
    ],
  },
  {
    id: "distance",
    title: "Optimal Distance",
    description:
      "Maintain the correct distance for accurate measurements. Too close or too far will affect precision.",
    icon: Move,
    animation: "distance",
    tips: [
      "12-18 inches (30-45cm) is optimal",
      "Watch the distance indicator",
      "The subject should fill about 60% of frame",
    ],
    doList: ["Stay within the green zone", "Adjust based on feedback", "Keep consistent distance"],
    dontList: [
      "Get too close (distortion)",
      "Stand too far (loss of detail)",
      "Move during capture",
    ],
  },
  {
    id: "stability",
    title: "Keeping Steady",
    description:
      "A stable device ensures sharp images and accurate measurements. Movement causes blur and measurement errors.",
    icon: Hand,
    animation: "stability",
    tips: [
      "Use both hands for stability",
      "Brace against your body",
      "Use the timer for hands-free capture",
    ],
    doList: ["Hold device firmly", 'Wait for "Stable" indicator', "Use timer delay feature"],
    dontList: ["Move while capturing", "Hold with one hand", "Rush the capture"],
  },
  {
    id: "guides",
    title: "Using Visual Guides",
    description:
      "The scanner provides visual overlays to help you position correctly. Learn to use them effectively.",
    icon: Grid3X3,
    animation: "grid",
    tips: [
      "Toggle guides from the control panel",
      "Different guides for different needs",
      "Quality meter shows readiness",
    ],
    doList: ["Align with positioning frame", "Use grid for centering", "Check quality indicators"],
    dontList: [
      "Ignore the visual guides",
      "Proceed with poor quality score",
      "Skip the calibration",
    ],
  },
  {
    id: "capture",
    title: "Capturing the Scan",
    description:
      "When all conditions are right, capture your scan. The AI will process and provide measurements.",
    icon: Camera,
    animation: "capture",
    tips: [
      "Wait for green quality indicators",
      "Auto-capture triggers when ready",
      "You can retake if needed",
    ],
    doList: [
      "Ensure all indicators are green",
      "Stay still during processing",
      "Review results carefully",
    ],
    dontList: [
      "Capture with warnings shown",
      "Move before completion",
      "Accept poor quality scans",
    ],
  },
  {
    id: "complete",
    title: "Tutorial Complete!",
    description:
      "You're now ready to use the scanner effectively. Remember these tips for accurate measurements.",
    icon: CheckCircle2,
    animation: "results",
    tips: [
      "Practice makes perfect",
      "Calibrate with a reference object",
      "Save scans to track progress",
    ],
    doList: [
      "Start with a calibration",
      "Take multiple scans for accuracy",
      "Review and compare over time",
    ],
    dontList: [
      "Expect perfect results immediately",
      "Skip the calibration step",
      "Forget to save your data",
    ],
  },
];
