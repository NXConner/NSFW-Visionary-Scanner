import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { PELVIC_FLOOR_COMMON_MISTAKES } from "@/components/pelvicFloor/data/kegelHubContent";

export function TroubleshootTab(): JSX.Element {
  return (
    <div className="space-y-4">
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-300" />
            Common mistakes & fixes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {PELVIC_FLOOR_COMMON_MISTAKES.map((m, idx) => (
              <AccordionItem key={idx} value={`mistake-${idx}`}>
                <AccordionTrigger className="text-sm">{m.title}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {m.fix}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Alert className="border-orange-500/30 bg-orange-500/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>“Tight” pelvic floor?</AlertTitle>
        <AlertDescription className="text-sm">
          If you get pelvic pain, urgency, or difficulty relaxing, prioritize reverse Kegels,
          diaphragmatic breathing, and reduce strengthening volume. Consider a pelvic floor PT.
        </AlertDescription>
      </Alert>
    </div>
  );
}
