import { CheckCircle2, Info, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { emitNavigateTab } from "@/lib/appEvents";

import { PillList } from "@/components/pelvicFloor/components/PillList";
import { PELVIC_FLOOR_QUICK_FAQ } from "@/components/pelvicFloor/data/kegelHubContent";

export function HowToTab(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        <PillList
          title="How to do a basic Kegel (strength)"
          tone="good"
          icon={<CheckCircle2 className="h-4 w-4 text-green-400" />}
          items={[
            "Get into a comfortable position (lying down is easiest to start).",
            "Exhale softly and perform a small internal “lift” (as if stopping gas).",
            "Hold 3–5 seconds while breathing normally (don’t brace your abs).",
            "Release completely for 5–7 seconds (feel soft/neutral).",
            "Repeat 8–12 reps. Stop before form degrades.",
          ]}
        />
        <PillList
          title="How to do a reverse Kegel (relaxation)"
          tone="neutral"
          icon={<Info className="h-4 w-4 text-primary" />}
          items={[
            "Inhale gently and let the pelvic floor soften/drop (no pushing).",
            "Think “expand” rather than “bear down.”",
            "Exhale and return to neutral without clenching.",
            "Use this between strength reps or as a cooldown.",
            "If you feel pelvic tightness, emphasize this more than squeezing.",
          ]}
        />
      </div>

      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick FAQ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {PELVIC_FLOOR_QUICK_FAQ.map((x, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger className="text-sm">{x.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{x.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => emitNavigateTab("guide")} className="gap-2">
          Back to PE Guide
        </Button>
        <Button
          variant="outline"
          onClick={() => emitNavigateTab("routines")}
          className="gap-2"
          title="Open the routine builder"
        >
          Open Routine Builder
        </Button>
      </div>
    </div>
  );
}
