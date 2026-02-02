import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Hand, Info } from "lucide-react";

import type { TesticularHealthGuide } from "@/components/mensHealthGuide/types";

export function TesticularHealthCard({ guide }: { guide: TesticularHealthGuide }) {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {guide.icon}
          {guide.title}
        </CardTitle>
        <CardDescription>
          Regular self-exams can save your life. Testicular cancer has 95%+ survival rate when
          caught early.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <AlertTitle className="text-green-400">Why It Matters</AlertTitle>
          <AlertDescription className="text-sm">{guide.content.importance}</AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="how-to">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <Hand className="h-4 w-4 text-blue-400" /> How to Perform Self-Exam
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-3">
                {guide.content.howToExam.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="normal">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" /> What's Normal
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2">
                {guide.content.normalFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-green-400 mt-1 shrink-0" />
                    {finding}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="warning">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" /> Warning Signs - See a Doctor
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Seek Medical Attention</AlertTitle>
                <AlertDescription className="text-xs">
                  If you notice any of these, schedule an appointment with your doctor promptly.
                </AlertDescription>
              </Alert>
              <ul className="space-y-2">
                {guide.content.warningSignsRequireDoctor.map((sign, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-300">
                    <AlertTriangle className="h-3 w-3 text-red-400 mt-1 shrink-0" />
                    {sign}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="conditions">
            <AccordionTrigger className="font-medium">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-purple-400" /> Common Conditions
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {guide.content.commonConditions.map((condition, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <h5 className="font-semibold text-foreground mb-1">{condition.name}</h5>
                    <p className="text-sm text-muted-foreground">{condition.description}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
