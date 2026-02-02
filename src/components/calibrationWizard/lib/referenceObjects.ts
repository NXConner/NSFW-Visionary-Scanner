import type React from "react";

import { Circle, CreditCard, Ruler, Target } from "lucide-react";

import type { ReferenceType } from "@/components/calibrationWizard/types";

export type ReferenceObjectSpec = {
  name: string;
  width: number; // mm
  height: number; // mm
  icon: React.ComponentType<{ className?: string }>;
};

export const referenceObjects: Record<ReferenceType, ReferenceObjectSpec> = {
  "credit-card": { name: "Credit Card", width: 85.6, height: 53.98, icon: CreditCard },
  ruler: { name: "Ruler (cm)", width: 100, height: 30, icon: Ruler },
  quarter: { name: "US Quarter", width: 24.26, height: 24.26, icon: Circle },
  nickel: { name: "US Nickel", width: 21.21, height: 21.21, icon: Circle },
  dime: { name: "US Dime", width: 17.91, height: 17.91, icon: Circle },
  custom: { name: "Custom Object", width: 0, height: 0, icon: Target },
};

export function getReferenceDimensions({
  referenceType,
  customWidth,
  customHeight,
}: {
  referenceType: ReferenceType;
  customWidth: number;
  customHeight: number;
}) {
  if (referenceType === "custom") {
    return { width: customWidth, height: customHeight };
  }
  const spec = referenceObjects[referenceType];
  return { width: spec.width, height: spec.height };
}
