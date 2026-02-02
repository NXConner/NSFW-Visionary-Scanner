import { AlertTriangle, CheckCircle2, Info, Shield } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { PillList } from "@/components/pelvicFloor/components/PillList";
import { PELVIC_FLOOR_SAFETY } from "@/components/pelvicFloor/data/kegelHubContent";

export function BenefitsTab(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <PillList
          title="Potential benefits"
          tone="good"
          icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
          items={[
            "Improved pelvic floor coordination and awareness",
            "Better urinary control and reduced leakage (often over weeks)",
            "Support for erection quality and ejaculation control (in men)",
            "Core/pelvic stability and posture support",
            "Can complement rehab and clinician-led pelvic floor programs",
          ]}
        />
        <PillList
          title="Pros & cons (reality check)"
          tone="warn"
          icon={<AlertTriangle className="h-4 w-4 text-orange-300" />}
          items={[
            "Pros: discreet, no equipment, scalable, evidence-backed for specific conditions",
            "Cons: easy to do incorrectly; results take time; overtraining can cause tension/pain",
            "Not everyone needs “more strength”—some need better relaxation first",
          ]}
        />
      </div>

      <Separator />

      <div className="grid lg:grid-cols-3 gap-4">
        <PillList
          title="Do"
          tone="good"
          icon={<Shield className="h-4 w-4 text-green-400" />}
          items={PELVIC_FLOOR_SAFETY.do}
        />
        <PillList
          title="Avoid"
          tone="warn"
          icon={<AlertTriangle className="h-4 w-4 text-orange-300" />}
          items={PELVIC_FLOOR_SAFETY.avoid}
        />
        <PillList
          title="Consider a clinician if"
          tone="neutral"
          icon={<Info className="h-4 w-4 text-primary" />}
          items={PELVIC_FLOOR_SAFETY.considerClinicianIf}
        />
      </div>
    </div>
  );
}
